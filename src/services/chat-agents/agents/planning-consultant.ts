/**
 * Planning Consultant Agent
 * 뷰티 제품에 특화된 상세페이지 기획 컨설팅
 * 섹션 구성, 스타일, 톤앤매너 추천
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AgentType } from '@prisma/client';
import { ChatAgentState } from '../graph';
import {
  ChatMessage,
  PlannedSection,
  ProjectCollectedData,
  BeautySubCategory,
  BEAUTY_SPECIALIST_DATA,
} from '../types';

// Lazy initialization
let _model: ChatGoogleGenerativeAI | null = null;
function getModel() {
  if (!_model) {
    _model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash-exp',
      temperature: 0.4,
      apiKey: process.env.GOOGLE_AI_API_KEY,
    });
  }
  return _model;
}

// 섹션 타입별 설명
const SECTION_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
  HERO: { name: '히어로', description: '메인 비주얼과 핵심 카피' },
  KEY_MESSAGE: { name: '핵심 메시지', description: '제품의 핵심 가치 전달' },
  COLOR_SHOWCASE: { name: '컬러 쇼케이스', description: '다양한 컬러/발색 전시' },
  TEXTURE: { name: '텍스처', description: '제형/질감 상세 설명' },
  INGREDIENTS: { name: '성분', description: '주요 성분과 효능' },
  BEFORE_AFTER: { name: '비포애프터', description: '사용 전후 비교' },
  HOW_TO_USE: { name: '사용법', description: '올바른 사용 방법' },
  ROUTINE: { name: '루틴', description: '스킨케어 루틴 가이드' },
  UV_PROTECTION: { name: '자외선 차단', description: 'SPF/PA 정보 및 효과' },
  COVERAGE: { name: '커버력', description: '커버력 단계별 비교' },
  SHADE_GUIDE: { name: '호수 가이드', description: '피부톤별 색상 추천' },
  COLOR_PALETTE: { name: '컬러 팔레트', description: '팔레트 색상 구성' },
  LOOK_TUTORIAL: { name: '룩 튜토리얼', description: '다양한 연출법' },
  CLEANSING_POWER: { name: '세정력', description: '클렌징 효과 비교' },
  EFFECT_SHOWCASE: { name: '효과 쇼케이스', description: '주요 효과 시연' },
  SOCIAL_PROOF: { name: '리뷰/후기', description: '고객 후기와 평점' },
  FAQ: { name: 'FAQ', description: '자주 묻는 질문' },
  DAILY_USE: { name: '데일리 사용', description: '일상 사용 팁' },
};

// 스타일 테마 옵션
const STYLE_THEMES = {
  clean: { name: '클린', description: '깔끔하고 미니멀한', colors: ['#FFFFFF', '#F5F5F5', '#333333'] },
  luxury: { name: '럭셔리', description: '고급스럽고 세련된', colors: ['#1A1A1A', '#C9A961', '#FFFFFF'] },
  playful: { name: '플레이풀', description: '밝고 활기찬', colors: ['#FF6B9D', '#FFE66D', '#4ECDC4'] },
  natural: { name: '내추럴', description: '자연스럽고 편안한', colors: ['#E8DFD8', '#A8B5A2', '#5C4033'] },
  modern: { name: '모던', description: '현대적이고 트렌디한', colors: ['#000000', '#FF4444', '#FFFFFF'] },
};

// 서브카테고리별 추천 스타일
const CATEGORY_STYLE_MAP: Record<BeautySubCategory, string[]> = {
  lip: ['playful', 'modern', 'luxury'],
  skincare: ['clean', 'natural', 'luxury'],
  suncare: ['clean', 'natural', 'playful'],
  mascara: ['modern', 'playful', 'luxury'],
  maskpack: ['natural', 'clean', 'playful'],
  cushion: ['clean', 'luxury', 'modern'],
  eyeshadow: ['playful', 'modern', 'luxury'],
  cleanser: ['clean', 'natural', 'modern'],
  other_beauty: ['clean', 'modern', 'natural'],
};

export async function planningConsultantAgent(
  state: ChatAgentState
): Promise<Partial<ChatAgentState>> {
  const { collectedData } = state;

  // 서브카테고리 확인
  const subCategory = collectedData.subCategory;
  if (!subCategory) {
    // 서브카테고리가 없으면 기본 기획
    return createDefaultPlan(state);
  }

  const specialistData = BEAUTY_SPECIALIST_DATA[subCategory];
  const recommendedStyles = CATEGORY_STYLE_MAP[subCategory] || ['clean', 'modern'];

  // 추천 섹션 구성
  const recommendedSections = specialistData.recommendedSections;
  const plannedSections: PlannedSection[] = recommendedSections.map(type => {
    const sectionInfo = SECTION_DESCRIPTIONS[type] || { name: type, description: '' };
    return {
      type,
      name: sectionInfo.name,
      description: sectionInfo.description,
    };
  });

  // 추천 스타일
  const primaryStyle = STYLE_THEMES[recommendedStyles[0] as keyof typeof STYLE_THEMES];

  // 톤앤매너 결정
  const toneAndManner = getToneAndManner(subCategory, collectedData.copyLength || 'medium');

  // 기획 프리뷰 메시지
  const sectionsPreview = plannedSections
    .map((s, idx) => `${idx + 1}. **${s.name}** - ${s.description}`)
    .join('\n');

  const styleOptions = recommendedStyles.map(styleKey => {
    const style = STYLE_THEMES[styleKey as keyof typeof STYLE_THEMES];
    return `• **${style.name}** - ${style.description}`;
  }).join('\n');

  const previewContent = `${specialistData.emoji} **${collectedData.productName || '제품'}** 상세페이지 기획이에요!\n\n` +
    `## 📋 추천 섹션 구성\n${sectionsPreview}\n\n` +
    `## 🎨 추천 스타일\n${styleOptions}\n\n` +
    `## 🎯 톤앤매너\n${toneAndManner}\n\n` +
    `## 💡 카피 팁\n${specialistData.tipsForCopy.map(t => `• ${t}`).join('\n')}\n\n` +
    `이대로 진행할까요, 아니면 수정하고 싶은 부분이 있으세요?`;

  const planMessage: ChatMessage = {
    id: `msg_${Date.now()}`,
    role: 'assistant',
    content: previewContent,
    agentType: 'PLANNER',
    metadata: {
      uiType: 'confirmation',
      planPreview: {
        sections: plannedSections,
        theme: primaryStyle.name,
        tone: toneAndManner,
      },
      options: [
        { id: 'generate', label: '✨ 이대로 생성하기', value: 'generate', description: '상세페이지 생성 시작' },
        { id: 'modify_sections', label: '📝 섹션 수정', value: 'modify_sections', description: '섹션 구성 변경' },
        { id: 'modify_style', label: '🎨 스타일 변경', value: 'modify_style', description: '스타일/톤 변경' },
      ],
    },
    createdAt: new Date(),
  };

  return {
    messages: [planMessage],
    collectedData: {
      plannedSections,
      visualTheme: primaryStyle.name,
      toneAndManner,
      colorPalette: primaryStyle.colors,
    },
    currentAgent: 'PLANNER',
    nextAction: { type: 'await_input' },
  };
}

// 톤앤매너 결정
function getToneAndManner(subCategory: BeautySubCategory, copyLength: string): string {
  const toneMap: Record<BeautySubCategory, string> = {
    lip: '발랄하고 트렌디한',
    skincare: '신뢰감 있고 전문적인',
    suncare: '밝고 건강한',
    mascara: '세련되고 매력적인',
    maskpack: '편안하고 힐링되는',
    cushion: '세련되고 자연스러운',
    eyeshadow: '화려하고 개성있는',
    cleanser: '깔끔하고 상쾌한',
    other_beauty: '친근하고 실용적인',
  };

  const lengthAdjective = {
    short: '간결하고',
    medium: '',
    long: '상세하고',
  }[copyLength] || '';

  const baseTone = toneMap[subCategory] || '친근하고 전문적인';
  return lengthAdjective ? `${lengthAdjective} ${baseTone}` : baseTone;
}

// 기본 기획 (서브카테고리 없을 때)
function createDefaultPlan(state: ChatAgentState): Partial<ChatAgentState> {
  const { collectedData } = state;

  const defaultSections: PlannedSection[] = [
    { type: 'HERO', name: '히어로', description: '메인 비주얼과 핵심 카피' },
    { type: 'KEY_MESSAGE', name: '핵심 메시지', description: '제품의 핵심 가치' },
    { type: 'FEATURES', name: '제품 특징', description: '주요 특징 및 장점' },
    { type: 'HOW_TO_USE', name: '사용법', description: '사용 방법 안내' },
    { type: 'SOCIAL_PROOF', name: '고객 후기', description: '리뷰 및 평점' },
  ];

  const planMessage: ChatMessage = {
    id: `msg_${Date.now()}`,
    role: 'assistant',
    content: `**${collectedData.productName || '제품'}** 상세페이지 기획이에요!\n\n` +
      `## 📋 섹션 구성\n` +
      defaultSections.map((s, idx) => `${idx + 1}. **${s.name}**`).join('\n') +
      `\n\n이대로 진행할까요?`,
    agentType: 'PLANNER',
    metadata: {
      uiType: 'confirmation',
      planPreview: {
        sections: defaultSections,
        theme: '클린',
        tone: '친근하고 전문적인',
      },
      options: [
        { id: 'generate', label: '✨ 생성하기', value: 'generate' },
        { id: 'modify', label: '📝 수정하기', value: 'modify' },
      ],
    },
    createdAt: new Date(),
  };

  return {
    messages: [planMessage],
    collectedData: {
      plannedSections: defaultSections,
      visualTheme: '클린',
      toneAndManner: '친근하고 전문적인',
      colorPalette: ['#FFFFFF', '#F5F5F5', '#333333'],
    },
    currentAgent: 'PLANNER',
    nextAction: { type: 'await_input' },
  };
}
