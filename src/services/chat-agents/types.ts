/**
 * Chat Agent System Types
 * 대화형 프로젝트 생성을 위한 Multi-Agent 시스템 타입 정의
 */

import { AgentType, ConversationStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

// ============================================
// 메시지 ID 생성 유틸리티
// ============================================

/**
 * 고유한 메시지 ID를 생성합니다.
 * Date.now() 대신 UUID를 사용하여 레이스 컨디션을 방지합니다.
 */
export function generateMessageId(): string {
  return `msg_${randomUUID()}`;
}

/**
 * Google AI API Key가 설정되어 있는지 확인합니다.
 * 설정되지 않은 경우 명확한 에러를 던집니다.
 */
export function validateGoogleAIApiKey(): string {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    console.error('[API Key] GOOGLE_AI_API_KEY is not configured');
    throw new Error(
      'AI 서비스가 설정되지 않았습니다. 관리자에게 문의해주세요. (GOOGLE_AI_API_KEY 누락)'
    );
  }

  if (apiKey.length < 10) {
    console.error('[API Key] GOOGLE_AI_API_KEY appears to be invalid');
    throw new Error(
      'AI 서비스 설정이 올바르지 않습니다. 관리자에게 문의해주세요. (유효하지 않은 API Key)'
    );
  }

  return apiKey;
}

// ============================================
// 카테고리 및 옵션 타입
// ============================================

export const PRODUCT_CATEGORIES = [
  'FASHION',
  'FOOD',
  'BEAUTY',
  'ELECTRONICS',
  'HOME_LIVING',
  'SPORTS_FITNESS',
  'OTHER',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const BEAUTY_SUBCATEGORIES = [
  'skincare',
  'suncare',
  'lip',
  'mascara',
  'maskpack',
  'cushion',
  'eyeshadow',
  'cleanser',
  'other_beauty',
] as const;

export type BeautySubCategory = (typeof BEAUTY_SUBCATEGORIES)[number];

// ============================================
// 뷰티 서브카테고리별 전문가 데이터
// ============================================

export interface BeautySpecialistData {
  name: string;
  emoji: string;
  trends: string[];           // 요즘 인기 트렌드
  keywords: string[];         // 자동 감지용 키워드
  keyPoints: string[];        // 물어볼 핵심 포인트
  recommendedSections: string[];  // 추천 섹션 구성
  tipsForCopy: string[];      // 카피 작성 팁
}

export const BEAUTY_SPECIALIST_DATA: Record<BeautySubCategory, BeautySpecialistData> = {
  lip: {
    name: '립 메이크업',
    emoji: '💄',
    trends: ['워터 틴트', '글로시 립', '매트 립스틱', '립 플럼퍼', '멀티밤'],
    keywords: ['립', '립스틱', '립틴트', '틴트', '립밤', '립글로스', '립플럼퍼', '립라이너'],
    keyPoints: ['발색력', '지속력', '보습력', '텍스처(매트/글로시/벨벳)', '향'],
    recommendedSections: ['HERO', 'KEY_MESSAGE', 'COLOR_SHOWCASE', 'TEXTURE', 'HOW_TO_USE', 'SOCIAL_PROOF'],
    tipsForCopy: ['발색 표현은 구체적으로', '지속력은 시간으로 표현', '입술 타입별 추천 언급'],
  },
  skincare: {
    name: '스킨케어',
    emoji: '✨',
    trends: ['비타민C 세럼', '레티놀', '시카 크림', '나이아신아마이드', '펩타이드'],
    keywords: ['세럼', '크림', '토너', '에센스', '앰플', '로션', '스킨', '모이스처라이저'],
    keyPoints: ['주요 성분', '피부 고민(주름/미백/보습/진정)', '피부 타입', '사용 순서'],
    recommendedSections: ['HERO', 'KEY_MESSAGE', 'INGREDIENTS', 'BEFORE_AFTER', 'HOW_TO_USE', 'ROUTINE', 'SOCIAL_PROOF'],
    tipsForCopy: ['성분 효능을 쉽게 설명', '피부 고민 공감 메시지', '과학적 근거 언급'],
  },
  suncare: {
    name: '선케어',
    emoji: '☀️',
    trends: ['톤업 선크림', '무기자차', '선스틱', '선쿠션', '비건 선크림'],
    keywords: ['선크림', '선스틱', '선블록', '자외선', 'spf', 'pa', '썬크림', '썬스틱'],
    keyPoints: ['SPF/PA 지수', '백탁 여부', '지속력', '촉촉/산뜻 타입', '톤업 효과'],
    recommendedSections: ['HERO', 'KEY_MESSAGE', 'UV_PROTECTION', 'TEXTURE', 'DAILY_USE', 'HOW_TO_USE'],
    tipsForCopy: ['자외선 차단 수치 강조', '백탁 없음/톤업 효과 어필', '데일리 사용 편의성'],
  },
  mascara: {
    name: '아이 메이크업',
    emoji: '👁️',
    trends: ['롱래쉬 마스카라', '볼륨 마스카라', '컬링 마스카라', '브로우 마스카라'],
    keywords: ['마스카라', '아이라이너', '아이브로우', '속눈썹', '눈썹'],
    keyPoints: ['효과(롱래쉬/볼륨/컬링)', '지속력', '번짐 방지', '클렌징 용이성'],
    recommendedSections: ['HERO', 'KEY_MESSAGE', 'EFFECT_SHOWCASE', 'BEFORE_AFTER', 'HOW_TO_USE', 'SOCIAL_PROOF'],
    tipsForCopy: ['눈매 변화 강조', '번짐 없는 지속력', '다양한 연출법 제안'],
  },
  maskpack: {
    name: '마스크팩',
    emoji: '🧖',
    trends: ['시트마스크', '슬리핑팩', '워시오프팩', '모델링팩', '패드마스크'],
    keywords: ['마스크팩', '시트마스크', '슬리핑팩', '팩', '패드', '필오프'],
    keyPoints: ['주요 성분', '효과(보습/진정/미백/탄력)', '사용 시간', '사용 빈도'],
    recommendedSections: ['HERO', 'KEY_MESSAGE', 'INGREDIENTS', 'HOW_TO_USE', 'BEFORE_AFTER', 'SOCIAL_PROOF'],
    tipsForCopy: ['즉각적인 효과 강조', '사용 후 피부 느낌 묘사', '꿀팁 제공'],
  },
  cushion: {
    name: '베이스 메이크업',
    emoji: '🪞',
    trends: ['글로우 쿠션', '커버 쿠션', '톤업 쿠션', '비건 파운데이션', '스킨케어 쿠션'],
    keywords: ['쿠션', '파운데이션', 'bb크림', 'cc크림', '베이스', '프라이머'],
    keyPoints: ['커버력', '지속력', '피부 표현(글로우/세미매트)', '호수(색상)', 'SPF'],
    recommendedSections: ['HERO', 'KEY_MESSAGE', 'COVERAGE', 'SHADE_GUIDE', 'HOW_TO_USE', 'BEFORE_AFTER'],
    tipsForCopy: ['자연스러운 피부 표현 강조', '다양한 피부톤 대응', '지속력 시간 표기'],
  },
  eyeshadow: {
    name: '아이섀도우',
    emoji: '🎨',
    trends: ['글리터 섀도우', '매트 팔레트', '멀티 팔레트', '리퀴드 섀도우', '스틱 섀도우'],
    keywords: ['아이섀도우', '섀도우', '팔레트', '글리터', '아이섀도'],
    keyPoints: ['발색력', '지속력', '펄감/매트감', '색상 구성', '가루날림'],
    recommendedSections: ['HERO', 'KEY_MESSAGE', 'COLOR_PALETTE', 'TEXTURE', 'LOOK_TUTORIAL', 'HOW_TO_USE'],
    tipsForCopy: ['다양한 연출 룩 제안', '색상별 특징 설명', '데일리/파티 구분'],
  },
  cleanser: {
    name: '클렌징',
    emoji: '🫧',
    trends: ['오일 클렌저', '폼 클렌저', '클렌징 밤', '미셀라 워터', '저자극 클렌저'],
    keywords: ['클렌저', '클렌징', '폼클렌저', '오일클렌저', '세안', '세안제', '클렌징폼'],
    keyPoints: ['세정력', '자극도', '이중세안 필요 여부', '피부 타입', '주요 성분'],
    recommendedSections: ['HERO', 'KEY_MESSAGE', 'CLEANSING_POWER', 'INGREDIENTS', 'HOW_TO_USE', 'SOCIAL_PROOF'],
    tipsForCopy: ['깔끔한 세정력 강조', '순한 성분 어필', '촉촉한 세안 후 느낌'],
  },
  other_beauty: {
    name: '기타 뷰티',
    emoji: '💅',
    trends: ['바디케어', '핸드크림', '헤어케어', '네일', '향수'],
    keywords: ['바디', '핸드크림', '헤어', '샴푸', '트리트먼트', '향수', '네일'],
    keyPoints: ['주요 효과', '향', '사용 부위', '지속력'],
    recommendedSections: ['HERO', 'KEY_MESSAGE', 'FEATURES', 'HOW_TO_USE', 'SOCIAL_PROOF'],
    tipsForCopy: ['일상 속 편리함 강조', '향 묘사 구체적으로', '선물용 어필'],
  },
};

// 키워드로 서브카테고리 자동 감지
export function detectBeautySubCategory(text: string): BeautySubCategory | null {
  const lowerText = text.toLowerCase();

  for (const [subCategory, data] of Object.entries(BEAUTY_SPECIALIST_DATA)) {
    if (data.keywords.some(keyword => lowerText.includes(keyword))) {
      return subCategory as BeautySubCategory;
    }
  }

  return null;
}

// 뷰티 키워드인지 확인
export function isBeautyKeyword(text: string): boolean {
  const lowerText = text.toLowerCase();
  const allKeywords = Object.values(BEAUTY_SPECIALIST_DATA).flatMap(d => d.keywords);
  return allKeywords.some(keyword => lowerText.includes(keyword));
}

export const COPY_LENGTHS = ['short', 'medium', 'long'] as const;
export type CopyLength = (typeof COPY_LENGTHS)[number];

export const IMAGE_MODELS = [
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview',
] as const;
export type ImageModel = (typeof IMAGE_MODELS)[number];

// ============================================
// 사용자 의도 타입
// ============================================

export const USER_INTENTS = [
  'CREATE',         // 새로 생성 요청 (상세페이지 만들어줘, 생성해줘)
  'PROVIDE_INFO',   // 정보 제공 (제품명은 XX야, 특징은 YY)
  'SELECT_OPTION',  // 옵션 선택 (뷰티, 패션 등 버튼 클릭)
  'CONFIRM',        // 확인/승인 (네, 좋아, 진행해)
  'MODIFY',         // 수정 요청 (바꿔줘, 다시 해줘)
  'CANCEL',         // 취소 (취소, 그만, 처음부터)
  'QUESTION',       // 질문 (어떻게 해?, 뭐가 좋아?)
  'GREETING',       // 인사 (안녕, 하이)
  'UNCLEAR',        // 의도 불분명
] as const;

export type UserIntent = (typeof USER_INTENTS)[number];

export interface ParsedIntent {
  intent: UserIntent;
  confidence: number;        // 0-1 신뢰도
  extractedInfo?: {          // 추출된 정보 (있는 경우)
    productName?: string;
    category?: string;
    features?: string[];
    action?: string;
  };
  reasoning?: string;        // 판단 이유
}

// ============================================
// 수집 데이터 타입
// ============================================

export interface ProjectCollectedData {
  // Step 1: 프로젝트 기본 정보
  title?: string;
  description?: string;
  brandProfileId?: string;

  // Step 2: 제품 정보
  productName?: string;
  category?: ProductCategory;
  subCategory?: BeautySubCategory;
  keyFeatures?: string[];
  targetAudience?: string;
  copyLength?: CopyLength;

  // 이미지
  productImages?: string[];
  imageModel?: ImageModel;
  generateImages?: boolean;  // true: AI 이미지 생성, false: 업로드 이미지 직접 사용

  // URL
  productUrl?: string;

  // Planner가 생성한 기획 정보
  plannedSections?: PlannedSection[];
  visualTheme?: string;
  toneAndManner?: string;
  colorPalette?: string[];

  // 생성/수정 플래그
  readyToGenerate?: boolean;
  modifyRequest?: 'sections' | 'style';

  // 섹션 수정 요청 컨텍스트 (Feedback → Planner 전달용)
  sectionModificationRequest?: string;
  styleModificationRequest?: string;
}

export interface PlannedSection {
  type: string;
  name: string;
  description: string;
}

// ============================================
// 메시지 타입
// ============================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentType?: AgentType;
  metadata?: MessageMetadata;
  attachments?: string[];
  createdAt: Date;
}

export interface MessageMetadata {
  // UI 힌트
  uiType?: 'text' | 'options' | 'image_upload' | 'confirmation' | 'progress' | 'redirect';

  // 선택지 (Suggester Agent용)
  options?: SuggestionOption[];

  // 다중 선택 허용 여부
  multiSelect?: boolean;

  // 어떤 필드를 묻는지 (선택 결과 처리용)
  askingField?: string;

  // 진행 상태 (Generator Agent용)
  progress?: {
    step: string;
    percentage: number;
    message: string;
  };

  // 리다이렉트 정보
  redirect?: {
    url: string;
    projectId?: string;
  };

  // 수집된 필드
  collectedFields?: string[];

  // 기획 미리보기 (Planner Agent용)
  planPreview?: {
    sections: PlannedSection[];
    theme: string;
    tone: string;
  };

  // 자동 감지 정보 (Product Detector용)
  autoDetected?: {
    category: string;
    subCategory: string;
  };

  // 감지된 제품 정보
  detectedProduct?: {
    category: string | null;
    subCategory: string | null;
    productType: string | null;
    confidence: number;
  };

  // Discovery 모드
  discoveryMode?: 'trending' | 'seasonal' | 'beginner' | 'category_explore';

  // 전문가 서브카테고리
  specialist?: string;
}

export interface SuggestionOption {
  id: string;
  label: string;
  value: string;
  description?: string;
  icon?: string;
}

// ============================================
// Agent 상태 타입 (LangGraph State)
// ============================================

export interface AgentState {
  // 대화 식별
  conversationId: string;
  userId: string;

  // 메시지 히스토리
  messages: ChatMessage[];

  // 수집된 데이터
  collectedData: ProjectCollectedData;

  // 현재 Agent
  currentAgent: AgentType;

  // 다음 액션
  nextAction?: NextAction;

  // 브랜드 컨텍스트 (Brand Context Agent가 로드)
  brandContext?: BrandContext;

  // 생성 결과
  generationResult?: GenerationResult;

  // 에러
  errors: string[];
}

export type NextAction =
  | { type: 'continue'; targetAgent: AgentType }
  | { type: 'await_input' }
  | { type: 'generate' }
  | { type: 'complete'; projectId: string }
  | { type: 'error'; message: string };

export interface BrandContext {
  id: string;
  name: string;
  identity: string;
  toneAndManner: string;
  voiceTone?: string;
  imageKeywords: string[];
  styleGuide?: {
    colors?: {
      primary?: string;
      secondary?: string;
      palette?: string[];
    };
    images?: {
      logo?: string;
      favicon?: string;
      ogImage?: string;
    };
    fonts?: {
      primary?: string;
      all?: string[];
    };
  };
  ragChunks?: string[];
}

export interface GenerationResult {
  projectId: string;
  versionId: string;
  status: 'success' | 'failed';
  error?: string;
}

// ============================================
// Agent 응답 타입
// ============================================

export interface AgentResponse {
  message: string;
  metadata?: MessageMetadata;
  updatedCollectedData?: Partial<ProjectCollectedData>;
  nextAction: NextAction;
}

// ============================================
// API 요청/응답 타입
// ============================================

export interface CreateConversationRequest {
  initialMessage?: string;
  source?: 'dashboard' | 'projects' | 'direct';
}

export interface CreateConversationResponse {
  conversationId: string;
  status: ConversationStatus;
}

export interface SendMessageRequest {
  content: string;
  attachments?: string[];
  selectedOptionId?: string; // 선택지 선택 시
}

export interface SendMessageResponse {
  messageId: string;
  // SSE 스트림으로 응답
}

export interface ConversationListItem {
  id: string;
  title: string | null;
  status: ConversationStatus;
  currentAgent: AgentType;
  projectId: string | null;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  lastMessage?: string;
}

// ============================================
// 필수 필드 검증
// ============================================

// 핵심 필수 필드 (이것만 있으면 기획 진행 가능)
export const REQUIRED_FIELDS: (keyof ProjectCollectedData)[] = [
  'productName',
  'category',
  'copyLength',
];

// 뷰티 카테고리 추가 필수 필드
export const BEAUTY_REQUIRED_FIELDS: (keyof ProjectCollectedData)[] = [
  'subCategory',
];

export function getRequiredFields(category?: string): (keyof ProjectCollectedData)[] {
  if (category === 'BEAUTY') {
    return [...REQUIRED_FIELDS, ...BEAUTY_REQUIRED_FIELDS];
  }
  return REQUIRED_FIELDS;
}

export function getMissingFields(data: ProjectCollectedData): (keyof ProjectCollectedData)[] {
  const requiredFields = getRequiredFields(data.category);
  return requiredFields.filter(field => {
    const value = data[field];
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    return !value;
  });
}

export function isDataComplete(data: ProjectCollectedData): boolean {
  return getMissingFields(data).length === 0;
}

// ============================================
// 유틸리티 타입
// ============================================

export type AgentFunction = (state: AgentState) => Promise<Partial<AgentState>>;

export type RouteDecision = AgentType | '__end__';

export interface AgentConfig {
  name: AgentType;
  description: string;
  systemPrompt: string;
}

// Re-export Prisma types
export { AgentType, ConversationStatus } from '@prisma/client';
