/**
 * Intake Agent
 * 사용자 메시지에서 프로젝트 정보 추출 및 수집
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AgentType } from '@prisma/client';
import { ChatAgentState } from '../graph';
import {
  ChatMessage,
  ProjectCollectedData,
  getMissingFields,
  PRODUCT_CATEGORIES,
  BEAUTY_SUBCATEGORIES,
  COPY_LENGTHS,
  generateMessageId,
  validateGoogleAIApiKey,
  BEAUTY_SPECIALIST_DATA,
  BeautySubCategory,
} from '../types';

// Lazy initialization to avoid build-time API key requirement
let _model: ChatGoogleGenerativeAI | null = null;
function getModel() {
  if (!_model) {
    const apiKey = validateGoogleAIApiKey();
    _model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash-exp',
      temperature: 0.2,
      apiKey,
    });
  }
  return _model;
}

const INTAKE_SYSTEM_PROMPT = `당신은 마케팅 콘텐츠 생성을 위한 정보 수집 전문가입니다.
사용자의 메시지에서 제품/서비스 정보를 추출하고, 부족한 정보를 자연스럽게 요청합니다.

## 추출할 정보:
- productName: 제품/서비스명
- category: 카테고리 (FASHION, FOOD, BEAUTY, ELECTRONICS, HOME_LIVING, SPORTS_FITNESS, OTHER)
- subCategory: 뷰티 서브카테고리 (skincare, suncare, lip, mascara, maskpack, cushion, eyeshadow, cleanser, other_beauty)
- keyFeatures: 주요 특징/장점 (배열)
- targetAudience: 타겟 고객
- copyLength: 카피 길이 (short, medium, long)
- productUrl: 상품 URL

## 키워드 → 카테고리 자동 매핑 (중요!):
- 립, 립스틱, 립틴트, 립밤, 립글로스 → category: "BEAUTY", subCategory: "lip"
- 스킨케어, 세럼, 크림, 토너, 에센스 → category: "BEAUTY", subCategory: "skincare"
- 선크림, 선스틱, 자외선차단 → category: "BEAUTY", subCategory: "suncare"
- 마스카라, 아이라이너 → category: "BEAUTY", subCategory: "mascara"
- 마스크팩, 시트마스크, 슬리핑팩 → category: "BEAUTY", subCategory: "maskpack"
- 쿠션, 파운데이션, BB크림, 베이스 → category: "BEAUTY", subCategory: "cushion"
- 아이섀도우, 팔레트 → category: "BEAUTY", subCategory: "eyeshadow"
- 클렌저, 폼클렌저, 클렌징 → category: "BEAUTY", subCategory: "cleanser"
- 화장품, 뷰티, 코스메틱 → category: "BEAUTY"
- 옷, 의류, 티셔츠, 바지, 원피스 → category: "FASHION"
- 음식, 식품, 건강식품, 음료 → category: "FOOD"
- 가전, 전자기기, 핸드폰 케이스 → category: "ELECTRONICS"
- 가구, 인테리어, 생활용품 → category: "HOME_LIVING"
- 운동, 피트니스, 헬스 → category: "SPORTS_FITNESS"

## 응답 형식 (JSON):
{
  "extracted": {
    "productName": "추출된 제품명 또는 null",
    "category": "추출된 카테고리 또는 null",
    "subCategory": "추출된 서브카테고리 또는 null",
    ...
  },
  "message": "사용자에게 보낼 친근한 응답 메시지",
  "askingFor": "다음으로 물어볼 정보 필드명"
}

## 규칙:
1. 자연스럽고 친근한 톤으로 대화하세요
2. 한 번에 너무 많은 정보를 요청하지 마세요
3. 사용자가 제공한 정보를 먼저 확인하고 칭찬하세요
4. 다음 질문은 문맥에 맞게 자연스럽게 연결하세요
5. **중요**: 사용자가 제품 종류를 언급하면 반드시 해당 카테고리와 서브카테고리를 추출하세요!`;

interface IntakeResponse {
  extracted: Partial<ProjectCollectedData>;
  message: string;
  askingFor: string;
}

// "모르겠어" 등 불확실 응답 감지
function isUncertainResponse(text: string): boolean {
  const uncertainPatterns = [
    '모르겠', '모르', '잘 모르', '뭐가 좋', '추천', '알려줘', '뭐 있', '어떤 게', '뭐가 있',
    '고민', '선택 못', '결정 못', '아무거나', '상관없', '몰라'
  ];
  const lowerText = text.toLowerCase();
  return uncertainPatterns.some(pattern => lowerText.includes(pattern));
}

// 카테고리별 인기 제품 추천 생성
function createProductRecommendationMessage(
  subCategory: BeautySubCategory,
  collectedData: Partial<ProjectCollectedData>
): { message: ChatMessage; nextAction: any } {
  const specialistData = BEAUTY_SPECIALIST_DATA[subCategory];

  if (!specialistData) {
    return {
      message: {
        id: generateMessageId(),
        role: 'assistant',
        content: '어떤 제품인지 조금 더 알려주시겠어요?',
        agentType: 'INTAKE',
        metadata: { uiType: 'text' },
        createdAt: new Date(),
      },
      nextAction: { type: 'await_input' as const },
    };
  }

  // 트렌드를 제품 추천으로 변환
  const trendOptions = specialistData.trends.slice(0, 5).map((trend, idx) => ({
    id: `trend_${idx}`,
    label: trend,
    value: trend,
    description: `인기 ${specialistData.name} 제품`,
  }));

  const message: ChatMessage = {
    id: generateMessageId(),
    role: 'assistant',
    content: `${specialistData.emoji} 괜찮아요! 요즘 인기있는 ${specialistData.name} 제품들을 추천해드릴게요!\n\n` +
      `아래 중에서 관심있는 제품 유형을 선택하시거나, 직접 제품명을 알려주셔도 돼요.`,
    agentType: 'INTAKE',
    metadata: {
      uiType: 'options',
      options: trendOptions,
      askingField: 'productName',
    },
    createdAt: new Date(),
  };

  return {
    message,
    nextAction: { type: 'await_input' as const },
  };
}

export async function intakeAgent(
  state: ChatAgentState
): Promise<Partial<ChatAgentState>> {
  const { messages, collectedData } = state;

  // 마지막 사용자 메시지 찾기
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

  if (!lastUserMessage) {
    return {
      nextAction: { type: 'await_input' },
    };
  }

  const userContent = lastUserMessage.content;

  // ★ "모르겠어" 응답 처리 - 이미 서브카테고리가 있으면 제품 추천
  if (isUncertainResponse(userContent) && collectedData.subCategory && !collectedData.productName) {
    console.log('[Intake] Uncertain response detected, providing product recommendations for:', collectedData.subCategory);

    const { message, nextAction } = createProductRecommendationMessage(
      collectedData.subCategory as BeautySubCategory,
      collectedData
    );

    return {
      messages: [message],
      currentAgent: 'INTAKE',
      nextAction,
    };
  }

  // 현재 수집된 데이터와 부족한 필드 정보
  const missingFields = getMissingFields(collectedData);

  const contextPrompt = `
현재 수집된 정보:
${JSON.stringify(collectedData, null, 2)}

부족한 필수 필드: ${missingFields.join(', ')}

대화 히스토리 (최근 5개):
${messages.slice(-5).map(m => `[${m.role}]: ${m.content}`).join('\n')}

마지막 사용자 메시지: "${lastUserMessage.content}"

위 사용자 메시지에서 정보를 추출하고, 다음으로 물어볼 질문을 포함한 응답을 생성하세요.
`;

  try {
    const response = await getModel().invoke([
      { role: 'system', content: INTAKE_SYSTEM_PROMPT },
      { role: 'user', content: contextPrompt },
    ]);

    const responseText = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    // JSON 파싱 (안전한 처리)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let intakeResponse: IntakeResponse;

      try {
        intakeResponse = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('[Intake] JSON parse error:', parseError);
        console.error('[Intake] Raw response:', responseText);
        throw new Error('LLM 응답 파싱 실패');
      }

      // 응답 구조 유효성 검증
      if (!intakeResponse.message || typeof intakeResponse.message !== 'string') {
        console.error('[Intake] Invalid response structure - missing message');
        throw new Error('유효하지 않은 응답 구조');
      }

      // extracted가 없으면 빈 객체로 초기화
      if (!intakeResponse.extracted) {
        intakeResponse.extracted = {};
      }

      // 추출된 데이터 정리
      const newCollectedData: Partial<ProjectCollectedData> = {};

      if (intakeResponse.extracted.productName) {
        newCollectedData.productName = intakeResponse.extracted.productName;
      }
      if (intakeResponse.extracted.category &&
          PRODUCT_CATEGORIES.includes(intakeResponse.extracted.category as any)) {
        newCollectedData.category = intakeResponse.extracted.category as any;
      }
      if (intakeResponse.extracted.subCategory &&
          BEAUTY_SUBCATEGORIES.includes(intakeResponse.extracted.subCategory as any)) {
        newCollectedData.subCategory = intakeResponse.extracted.subCategory as any;
      }
      if (intakeResponse.extracted.keyFeatures &&
          Array.isArray(intakeResponse.extracted.keyFeatures)) {
        newCollectedData.keyFeatures = [
          ...(collectedData.keyFeatures || []),
          ...intakeResponse.extracted.keyFeatures,
        ];
      }
      if (intakeResponse.extracted.targetAudience) {
        newCollectedData.targetAudience = intakeResponse.extracted.targetAudience;
      }
      if (intakeResponse.extracted.copyLength &&
          COPY_LENGTHS.includes(intakeResponse.extracted.copyLength as any)) {
        newCollectedData.copyLength = intakeResponse.extracted.copyLength as any;
      }
      if (intakeResponse.extracted.productUrl) {
        newCollectedData.productUrl = intakeResponse.extracted.productUrl;
      }

      // 응답 메시지 생성
      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: intakeResponse.message,
        agentType: 'INTAKE',
        metadata: {
          uiType: 'text',
          collectedFields: Object.keys(newCollectedData),
        },
        createdAt: new Date(),
      };

      // 다음 액션 결정
      const updatedData = { ...collectedData, ...newCollectedData };
      const updatedMissingFields = getMissingFields(updatedData);

      let nextAction;
      if (updatedMissingFields.length === 0) {
        // 모든 필수 정보 수집 완료 → Planner로
        nextAction = { type: 'continue' as const, targetAgent: 'PLANNER' as AgentType };
      } else if (intakeResponse.askingFor === 'category' ||
                 intakeResponse.askingFor === 'copyLength' ||
                 intakeResponse.askingFor === 'subCategory') {
        // 선택지가 필요한 필드 → Suggester로
        nextAction = { type: 'continue' as const, targetAgent: 'SUGGESTER' as AgentType };
      } else {
        // 사용자 입력 대기
        nextAction = { type: 'await_input' as const };
      }

      return {
        messages: [assistantMessage],
        collectedData: newCollectedData,
        currentAgent: 'INTAKE',
        nextAction,
      };
    }
  } catch (error) {
    console.error('[Intake] Error:', error);
  }

  // 에러 시 기본 응답
  const fallbackMessage: ChatMessage = {
    id: generateMessageId(),
    role: 'assistant',
    content: '죄송해요, 잠시 문제가 있었어요. 다시 한번 말씀해 주시겠어요?',
    agentType: 'INTAKE',
    createdAt: new Date(),
  };

  return {
    messages: [fallbackMessage],
    nextAction: { type: 'await_input' },
  };
}
