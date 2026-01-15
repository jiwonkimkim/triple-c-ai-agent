/**
 * Chat Agent System Types
 * 대화형 프로젝트 생성을 위한 Multi-Agent 시스템 타입 정의
 */

import { AgentType, ConversationStatus } from '@prisma/client';

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

export const COPY_LENGTHS = ['short', 'medium', 'long'] as const;
export type CopyLength = (typeof COPY_LENGTHS)[number];

export const IMAGE_MODELS = [
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview',
] as const;
export type ImageModel = (typeof IMAGE_MODELS)[number];

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

  // URL
  productUrl?: string;

  // Planner가 생성한 기획 정보
  plannedSections?: PlannedSection[];
  visualTheme?: string;
  toneAndManner?: string;
  colorPalette?: string[];
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

export const REQUIRED_FIELDS: (keyof ProjectCollectedData)[] = [
  'productName',
  'category',
  'keyFeatures',
  'copyLength',
];

export function getRequiredFields(): (keyof ProjectCollectedData)[] {
  return REQUIRED_FIELDS;
}

export function getMissingFields(data: ProjectCollectedData): (keyof ProjectCollectedData)[] {
  return REQUIRED_FIELDS.filter(field => {
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
