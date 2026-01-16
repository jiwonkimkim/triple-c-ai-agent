/**
 * Product Detector Agent
 * 사용자 메시지에서 제품 정보를 자동으로 감지하고 분류
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AgentType } from '@prisma/client';
import { ChatAgentState } from '../graph';
import {
  ChatMessage,
  ProjectCollectedData,
  BeautySubCategory,
  detectBeautySubCategory,
  isBeautyKeyword,
  BEAUTY_SPECIALIST_DATA,
  generateMessageId,
  validateGoogleAIApiKey,
} from '../types';

// Lazy initialization
let _model: ChatGoogleGenerativeAI | null = null;
function getModel() {
  if (!_model) {
    const apiKey = validateGoogleAIApiKey();
    _model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash-exp',
      temperature: 0.1,
      apiKey,
    });
  }
  return _model;
}

export interface DetectedProduct {
  category: 'BEAUTY' | 'FASHION' | 'FOOD' | 'ELECTRONICS' | 'HOME_LIVING' | 'OTHER' | null;
  subCategory: BeautySubCategory | null;
  productType: string | null;    // 예: "글로시 틴트", "비타민C 세럼"
  productName: string | null;    // 브랜드명 포함된 제품명
  detectedKeywords: string[];    // 감지된 키워드
  confidence: number;
}

const PRODUCT_DETECTOR_PROMPT = `당신은 제품 정보 추출 전문가입니다.
사용자 메시지에서 제품 관련 정보를 추출합니다.

## 추출할 정보:
- category: 대카테고리 (BEAUTY, FASHION, FOOD, ELECTRONICS, HOME_LIVING, OTHER)
- subCategory: 뷰티 서브카테고리 (lip, skincare, suncare, mascara, maskpack, cushion, eyeshadow, cleanser, other_beauty)
- productType: 제품 유형 (예: "글로시 틴트", "비타민C 세럼")
- productName: 브랜드명이 포함된 제품명 (있는 경우)

## 뷰티 서브카테고리 키워드:
- lip: 립, 립스틱, 틴트, 립밤, 립글로스
- skincare: 세럼, 크림, 토너, 에센스, 앰플
- suncare: 선크림, 선스틱, 자외선차단
- mascara: 마스카라, 아이라이너
- maskpack: 마스크팩, 시트마스크, 슬리핑팩
- cushion: 쿠션, 파운데이션, BB크림
- eyeshadow: 아이섀도우, 팔레트
- cleanser: 클렌저, 클렌징, 폼클렌저

## 응답 형식 (JSON):
{
  "category": "카테고리 또는 null",
  "subCategory": "서브카테고리 또는 null",
  "productType": "제품 유형 또는 null",
  "productName": "제품명 또는 null",
  "confidence": 0.0~1.0
}`;

// 빠른 키워드 기반 감지
function quickDetect(text: string): Partial<DetectedProduct> {
  const lowerText = text.toLowerCase();
  const detectedKeywords: string[] = [];

  // 뷰티 카테고리 감지
  const beautySubCategory = detectBeautySubCategory(text);
  if (beautySubCategory) {
    const data = BEAUTY_SPECIALIST_DATA[beautySubCategory];
    const matchedKeywords = data.keywords.filter(k => lowerText.includes(k));
    detectedKeywords.push(...matchedKeywords);

    return {
      category: 'BEAUTY',
      subCategory: beautySubCategory,
      detectedKeywords,
      confidence: 0.9,
    };
  }

  // 패션 키워드
  const fashionKeywords = ['옷', '의류', '티셔츠', '바지', '원피스', '자켓', '코트', '신발', '가방'];
  if (fashionKeywords.some(k => lowerText.includes(k))) {
    return {
      category: 'FASHION',
      subCategory: null,
      detectedKeywords: fashionKeywords.filter(k => lowerText.includes(k)),
      confidence: 0.85,
    };
  }

  // 식품 키워드
  const foodKeywords = ['음식', '식품', '건강식품', '음료', '간식', '영양제'];
  if (foodKeywords.some(k => lowerText.includes(k))) {
    return {
      category: 'FOOD',
      subCategory: null,
      detectedKeywords: foodKeywords.filter(k => lowerText.includes(k)),
      confidence: 0.85,
    };
  }

  return {
    category: null,
    subCategory: null,
    detectedKeywords: [],
    confidence: 0,
  };
}

export async function detectProduct(
  message: string,
  useQuickOnly = false
): Promise<DetectedProduct> {
  // 1. 빠른 키워드 기반 감지
  const quickResult = quickDetect(message);

  if (quickResult.confidence && quickResult.confidence >= 0.85) {
    return {
      category: quickResult.category || null,
      subCategory: quickResult.subCategory || null,
      productType: null,
      productName: null,
      detectedKeywords: quickResult.detectedKeywords || [],
      confidence: quickResult.confidence,
    };
  }

  if (useQuickOnly) {
    return {
      category: null,
      subCategory: null,
      productType: null,
      productName: null,
      detectedKeywords: [],
      confidence: 0,
    };
  }

  // 2. LLM을 사용한 상세 분석
  try {
    const response = await getModel().invoke([
      { role: 'system', content: PRODUCT_DETECTOR_PROMPT },
      { role: 'user', content: `분석할 메시지: "${message}"` },
    ]);

    const responseText = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        category: parsed.category || quickResult.category || null,
        subCategory: parsed.subCategory || quickResult.subCategory || null,
        productType: parsed.productType || null,
        productName: parsed.productName || null,
        detectedKeywords: quickResult.detectedKeywords || [],
        confidence: parsed.confidence || 0.7,
      };
    }
  } catch (error) {
    console.error('[ProductDetector] LLM error:', error);
  }

  // 빠른 감지 결과라도 반환
  return {
    category: quickResult.category || null,
    subCategory: quickResult.subCategory || null,
    productType: null,
    productName: null,
    detectedKeywords: quickResult.detectedKeywords || [],
    confidence: quickResult.confidence || 0,
  };
}

// LangGraph Agent 함수
export async function productDetectorAgent(
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

  // 제품 감지
  const detected = await detectProduct(lastUserMessage.content);

  console.log('[ProductDetector] Detected:', detected);

  // 감지된 정보로 collectedData 업데이트
  const newCollectedData: Partial<ProjectCollectedData> = {};

  if (detected.category) {
    newCollectedData.category = detected.category as any;
  }
  if (detected.subCategory) {
    newCollectedData.subCategory = detected.subCategory;
  }
  if (detected.productType) {
    newCollectedData.productName = detected.productType;
  }
  if (detected.productName) {
    newCollectedData.productName = detected.productName;
  }

  // 뷰티 카테고리가 감지되면 Beauty Specialist로 라우팅
  if (detected.category === 'BEAUTY' && detected.subCategory) {
    const specialistData = BEAUTY_SPECIALIST_DATA[detected.subCategory];

    const confirmMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: `${specialistData.emoji} ${specialistData.name} 제품이시군요!\n\n` +
        `요즘 인기 있는 ${specialistData.name} 트렌드:\n` +
        specialistData.trends.map(t => `• ${t}`).join('\n') +
        `\n\n제품의 특징을 좀 더 알려주시겠어요?` +
        `\n(${specialistData.keyPoints.slice(0, 3).join(', ')} 등)`,
      agentType: 'COORDINATOR',
      metadata: {
        uiType: 'text',
        detectedProduct: detected,
      },
      createdAt: new Date(),
    };

    return {
      messages: [confirmMessage],
      collectedData: newCollectedData,
      currentAgent: 'COORDINATOR',
      nextAction: { type: 'continue', targetAgent: 'INTAKE' as AgentType },
    };
  }

  // 뷰티 키워드만 감지된 경우 (서브카테고리 불명확)
  if (detected.category === 'BEAUTY' && !detected.subCategory) {
    const clarifyMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: `뷰티 제품이시군요! 💄\n\n어떤 종류의 뷰티 제품인지 알려주시겠어요?`,
      agentType: 'COORDINATOR',
      metadata: {
        uiType: 'options',
        options: Object.entries(BEAUTY_SPECIALIST_DATA).map(([key, data]) => ({
          id: key,
          label: `${data.emoji} ${data.name}`,
          value: key,
          description: data.trends.slice(0, 2).join(', '),
        })),
        askingField: 'subCategory',
      },
      createdAt: new Date(),
    };

    return {
      messages: [clarifyMessage],
      collectedData: newCollectedData,
      currentAgent: 'COORDINATOR',
      nextAction: { type: 'await_input' },
    };
  }

  // 제품이 감지되지 않은 경우
  if (!detected.category || detected.confidence < 0.5) {
    return {
      collectedData: newCollectedData,
      currentAgent: 'COORDINATOR',
      nextAction: { type: 'continue', targetAgent: 'INTAKE' as AgentType },
    };
  }

  // 기타 카테고리
  return {
    collectedData: newCollectedData,
    currentAgent: 'COORDINATOR',
    nextAction: { type: 'continue', targetAgent: 'SUGGESTER' as AgentType },
  };
}
