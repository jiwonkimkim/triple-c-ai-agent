/**
 * Intent Parser Agent
 * 사용자 메시지의 의도를 분석하고 분류
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
  ParsedIntent,
  UserIntent,
  USER_INTENTS,
  ProjectCollectedData,
} from '../types';

// Lazy initialization to avoid build-time API key requirement
let _model: ChatGoogleGenerativeAI | null = null;
function getModel() {
  if (!_model) {
    _model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash-exp',
      temperature: 0.1, // 낮은 temperature로 일관된 분류
      apiKey: process.env.GOOGLE_AI_API_KEY,
    });
  }
  return _model;
}

const INTENT_PARSER_SYSTEM_PROMPT = `당신은 사용자 메시지의 의도를 분석하는 전문가입니다.
마케팅 콘텐츠 생성 서비스에서 사용자의 메시지를 분석하여 의도를 분류합니다.

## 의도 분류:
- CREATE: 새로운 콘텐츠 생성 요청
  예: "상세페이지 만들어줘", "생성해줘", "만들고 싶어"

- PROVIDE_INFO: 제품/서비스 정보 제공
  예: "제품명은 비타민C 세럼이야", "립스틱이야", "특징은 보습력이 좋아"

- SELECT_OPTION: 선택지 중 하나를 선택
  예: "[선택] beauty", "뷰티", "패션으로 할게"

- CONFIRM: 확인, 승인, 동의
  예: "네", "좋아", "그래", "ok", "진행해", "맞아"

- MODIFY: 수정, 변경 요청
  예: "수정해줘", "바꿔줘", "다시 해줘", "카테고리 변경"

- CANCEL: 취소, 중단
  예: "취소", "그만", "처음부터", "다시 시작"

- QUESTION: 질문
  예: "어떻게 해?", "뭐가 좋아?", "차이가 뭐야?"

- GREETING: 인사
  예: "안녕", "하이", "반가워"

- UNCLEAR: 의도 파악 불가

## 키워드 힌트:
- "립", "립스틱", "립틴트" → PROVIDE_INFO (뷰티/립 제품 정보)
- "스킨케어", "세럼", "크림" → PROVIDE_INFO (뷰티/스킨케어 정보)
- "선크림", "자외선" → PROVIDE_INFO (뷰티/선케어 정보)
- "[선택]" 포함 → SELECT_OPTION

## 응답 형식 (JSON):
{
  "intent": "의도 타입",
  "confidence": 0.0~1.0,
  "extractedInfo": {
    "productName": "추출된 제품명 또는 null",
    "category": "추출된 카테고리 또는 null",
    "features": ["추출된 특징들"] 또는 null,
    "action": "요청된 액션 또는 null"
  },
  "reasoning": "판단 이유"
}`;

// 빠른 키워드 기반 의도 감지 (LLM 호출 전 필터링)
function quickIntentDetection(message: string): ParsedIntent | null {
  const lowerMessage = message.toLowerCase().trim();

  // 선택 옵션 감지
  if (lowerMessage.startsWith('[선택]')) {
    return {
      intent: 'SELECT_OPTION',
      confidence: 1.0,
      reasoning: '선택 옵션 형식 감지',
    };
  }

  // 인사 감지
  const greetings = ['안녕', '하이', 'hi', 'hello', '반가워'];
  if (greetings.some(g => lowerMessage === g || lowerMessage.startsWith(g + ' '))) {
    return {
      intent: 'GREETING',
      confidence: 0.95,
      reasoning: '인사말 감지',
    };
  }

  // 확인 감지 (짧은 긍정 응답)
  const confirmations = ['네', '예', '응', '좋아', '좋아요', 'ok', '오케이', '확인', '진행', '그래', '맞아'];
  if (confirmations.includes(lowerMessage)) {
    return {
      intent: 'CONFIRM',
      confidence: 0.9,
      reasoning: '짧은 긍정 응답 감지',
    };
  }

  // 취소 감지
  const cancellations = ['취소', '그만', '중단', '처음부터', '다시 시작'];
  if (cancellations.some(c => lowerMessage.includes(c))) {
    return {
      intent: 'CANCEL',
      confidence: 0.9,
      reasoning: '취소 키워드 감지',
    };
  }

  // 수정 감지
  const modifications = ['수정', '바꿔', '변경', '다시 해'];
  if (modifications.some(m => lowerMessage.includes(m))) {
    return {
      intent: 'MODIFY',
      confidence: 0.85,
      reasoning: '수정 키워드 감지',
    };
  }

  // 생성 요청 감지
  const createKeywords = ['만들어', '생성해', '만들고 싶', '생성하고'];
  if (createKeywords.some(k => lowerMessage.includes(k))) {
    return {
      intent: 'CREATE',
      confidence: 0.85,
      reasoning: '생성 키워드 감지',
    };
  }

  // 질문 감지
  if (lowerMessage.includes('?') ||
      lowerMessage.startsWith('어떻게') ||
      lowerMessage.startsWith('뭐가') ||
      lowerMessage.startsWith('왜')) {
    return {
      intent: 'QUESTION',
      confidence: 0.8,
      reasoning: '질문 형식 감지',
    };
  }

  // 뷰티 제품 정보 제공 감지
  const beautyKeywords = [
    'lip', '립', '립스틱', '립틴트', '립밤',
    '스킨케어', '세럼', '크림', '토너', '에센스',
    '선크림', '선스틱', '자외선',
    '마스카라', '아이라이너',
    '마스크팩', '시트마스크',
    '쿠션', '파운데이션', 'bb크림',
    '아이섀도우', '팔레트',
    '클렌저', '클렌징',
  ];
  if (beautyKeywords.some(k => lowerMessage.includes(k))) {
    return {
      intent: 'PROVIDE_INFO',
      confidence: 0.85,
      extractedInfo: {
        category: 'BEAUTY',
      },
      reasoning: '뷰티 제품 키워드 감지',
    };
  }

  // 패션 제품 정보 제공 감지
  const fashionKeywords = ['옷', '의류', '티셔츠', '바지', '원피스', '자켓', '코트'];
  if (fashionKeywords.some(k => lowerMessage.includes(k))) {
    return {
      intent: 'PROVIDE_INFO',
      confidence: 0.85,
      extractedInfo: {
        category: 'FASHION',
      },
      reasoning: '패션 제품 키워드 감지',
    };
  }

  return null; // LLM 분석 필요
}

export async function parseIntent(
  message: string,
  collectedData: ProjectCollectedData,
  conversationContext?: string[]
): Promise<ParsedIntent> {
  // 1. 빠른 키워드 기반 감지 시도
  const quickResult = quickIntentDetection(message);
  if (quickResult && quickResult.confidence >= 0.85) {
    console.log('[IntentParser] Quick detection:', quickResult);
    return quickResult;
  }

  // 2. LLM을 사용한 상세 분석
  try {
    const contextPrompt = `
현재 수집된 정보:
${JSON.stringify(collectedData, null, 2)}

${conversationContext ? `최근 대화:\n${conversationContext.slice(-3).join('\n')}` : ''}

분석할 사용자 메시지: "${message}"

위 메시지의 의도를 분석하세요.
`;

    const response = await getModel().invoke([
      { role: 'system', content: INTENT_PARSER_SYSTEM_PROMPT },
      { role: 'user', content: contextPrompt },
    ]);

    const responseText = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as ParsedIntent;

      // 유효한 intent인지 확인
      if (USER_INTENTS.includes(parsed.intent as any)) {
        console.log('[IntentParser] LLM analysis:', parsed);
        return parsed;
      }
    }
  } catch (error) {
    console.error('[IntentParser] LLM error:', error);
  }

  // 3. 빠른 감지 결과가 있으면 반환 (신뢰도 낮아도)
  if (quickResult) {
    return quickResult;
  }

  // 4. 기본값: PROVIDE_INFO로 추정 (정보를 제공하려는 것으로 가정)
  return {
    intent: 'PROVIDE_INFO',
    confidence: 0.5,
    reasoning: '기본 추정 - 정보 제공으로 처리',
  };
}

// 의도에 따른 다음 Agent 추천
export function getRecommendedAgent(
  intent: ParsedIntent,
  collectedData: ProjectCollectedData
): string {
  switch (intent.intent) {
    case 'CREATE':
      // 정보가 충분하면 PLANNER, 아니면 INTAKE
      if (collectedData.productName && collectedData.category) {
        return 'PLANNER';
      }
      return 'INTAKE';

    case 'PROVIDE_INFO':
      return 'INTAKE';

    case 'SELECT_OPTION':
      // 선택 후 다음 필드가 있으면 SUGGESTER, 완료되면 PLANNER
      return 'SUGGESTER';

    case 'CONFIRM':
      // 기획이 있으면 GENERATOR, 없으면 PLANNER
      if (collectedData.plannedSections && collectedData.plannedSections.length > 0) {
        return 'GENERATOR';
      }
      return 'PLANNER';

    case 'MODIFY':
      return 'FEEDBACK';

    case 'CANCEL':
      return 'COORDINATOR';

    case 'QUESTION':
      return 'CLARIFIER';

    case 'GREETING':
      return 'COORDINATOR';

    case 'UNCLEAR':
    default:
      return 'CLARIFIER';
  }
}
