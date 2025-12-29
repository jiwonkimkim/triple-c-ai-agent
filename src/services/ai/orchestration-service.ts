/**
 * 상세페이지 생성 오케스트레이션 서비스
 *
 * 메인 감독 역할:
 * 1. 전체 생성 흐름 관리
 * 2. 각 섹션별 개별 이미지 프롬프트 생성
 * 3. 패턴 분석 + 사용자 입력 + OCR 참조 데이터 통합
 *
 * 핵심 원칙:
 * - 이미지에는 텍스트 없이 제품만 생성
 * - 텍스트는 별도로 생성하여 이미지 위에 오버레이
 */

import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import {
  getReferencePrompts,
  getVisualStyleKeywords,
  mapSectionTypeToPosition,
  SECTION_COMPOSITION_GUIDE,
  addMidjourneyParams,
  SectionPosition,
} from './ocr-reference-data';
import {
  buildEnhancedSystemPrompt,
  buildEnhancedUserPrompt,
  buildOverlayTextPrompt,
  OverlayTextContent,
} from './enhanced-prompts';

// ============================================
// 타입 정의
// ============================================

export interface BrandContext {
  name: string;
  identity: string;
  toneAndManner: string;
  imageKeywords: string[];
  ragContext?: string;
}

export interface GenerationInput {
  productImages: string[];
  productName: string;
  category: string;
  keyFeatures: string[];
  targetAudience: string;
  copyLength: 'short' | 'medium' | 'long';
  brandContext?: BrandContext | null;
  generateImages?: boolean;
}

export interface SectionImagePrompt {
  sectionType: 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ';
  position: SectionPosition;
  imagePrompt: string;
  imagePromptMidjourney: string;
  overlayText?: OverlayTextContent;
  compositionGuide: typeof SECTION_COMPOSITION_GUIDE[SectionPosition];
}

export interface OrchestrationResult {
  hookMessage: string;
  sections: {
    id: string;
    type: string;
    title?: string;
    body: string;
    order: number;
    imagePrompt: SectionImagePrompt;
  }[];
}

// ============================================
// AI 클라이언트 초기화
// ============================================

const isPlaceholder = (key: string | undefined) =>
  !key || key.includes('your-') || key.includes('placeholder') || key.length < 20;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (isPlaceholder(apiKey)) return null;
  return new GoogleGenAI({ apiKey: apiKey! });
}

// ============================================
// 섹션별 이미지 프롬프트 생성기
// ============================================

export async function generateSectionImagePrompt(
  sectionType: 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ',
  productName: string,
  category: string,
  keyFeatures: string[],
  targetAudience: string,
  brandStyle?: string
): Promise<SectionImagePrompt> {
  const position = mapSectionTypeToPosition(sectionType);
  const referencePrompts = getReferencePrompts(category, position);
  const visualKeywords = getVisualStyleKeywords(category);
  const compositionGuide = SECTION_COMPOSITION_GUIDE[position];

  // 텍스트 없는 이미지 프롬프트 생성
  const noTextInstruction = 'absolutely no text, no typography, no letters, no words, no labels, no watermarks, text-free image only';

  // 참조 프롬프트에서 영감을 받아 새 프롬프트 생성
  const gemini = getGeminiClient();

  let imagePrompt: string;

  if (gemini) {
    // AI를 사용하여 맞춤형 프롬프트 생성
    const promptGenerationRequest = `
당신은 상세페이지 이미지 프롬프트 전문가입니다.
다음 정보를 바탕으로 이미지 생성 프롬프트를 만들어주세요.

## 제품 정보
- 제품명: ${productName}
- 카테고리: ${category}
- 핵심 특징: ${keyFeatures.join(', ')}
- 타겟: ${targetAudience}
${brandStyle ? `- 브랜드 스타일: ${brandStyle}` : ''}

## 섹션 정보
- 섹션 타입: ${sectionType}
- 위치: ${position}
- 레이아웃 가이드: ${compositionGuide.layout}
- 제품 배치: ${compositionGuide.productPlacement}
- 라이팅: ${compositionGuide.lighting}
- 분위기: ${compositionGuide.mood}

## 참조 프롬프트 예시 (올리브영 베스트셀러 기반)
${referencePrompts.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## 비주얼 스타일 키워드
${visualKeywords.join(', ')}

## 중요 규칙
1. 이미지에 텍스트가 절대 포함되면 안 됩니다
2. 제품과 비주얼 요소만 포함해야 합니다
3. 영어로 작성해주세요
4. Midjourney/Stable Diffusion 스타일로 작성해주세요

## 요청
위 정보를 종합하여 ${sectionType} 섹션에 적합한 이미지 프롬프트를 생성해주세요.
프롬프트만 반환하고, 다른 설명은 포함하지 마세요.
`;

    try {
      const response = await gemini.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: promptGenerationRequest,
      });

      imagePrompt = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

      // 텍스트 제외 지시가 없으면 추가
      if (!imagePrompt.toLowerCase().includes('no text')) {
        imagePrompt = `${imagePrompt}, ${noTextInstruction}`;
      }
    } catch (error) {
      console.error('[Orchestration] Failed to generate prompt with AI, using fallback:', error);
      imagePrompt = buildFallbackImagePrompt(sectionType, productName, category, keyFeatures, brandStyle, position, visualKeywords);
    }
  } else {
    // AI 없이 규칙 기반 프롬프트 생성
    imagePrompt = buildFallbackImagePrompt(sectionType, productName, category, keyFeatures, brandStyle, position, visualKeywords);
  }

  return {
    sectionType,
    position,
    imagePrompt,
    imagePromptMidjourney: addMidjourneyParams(imagePrompt),
    compositionGuide,
  };
}

// 폴백 이미지 프롬프트 생성 (AI 없을 때)
function buildFallbackImagePrompt(
  sectionType: string,
  productName: string,
  category: string,
  keyFeatures: string[],
  brandStyle: string | undefined,
  position: SectionPosition,
  visualKeywords: string[]
): string {
  const noTextInstruction = 'absolutely no text, no typography, no letters, no words, no labels, no watermarks, text-free image only';
  const styleKeywords = visualKeywords.slice(0, 4).join(', ');
  const brandAddition = brandStyle ? `, brand style: ${brandStyle}` : '';

  const basePrompts: Record<string, string> = {
    HERO: `product photography of ${productName}, elegant ${category} product, centered hero composition, gradient background, soft diffused studio lighting, subtle reflection, luxury beauty advertisement, premium cosmetic branding, high-end minimalist aesthetic, ${styleKeywords}${brandAddition}, ${noTextInstruction}`,

    FEATURES: `key ingredient visualization for ${category}, ${keyFeatures[0] || 'natural ingredients'}, fresh botanical elements with water droplets, detailed macro photography, clean background, natural soft lighting, scientific yet elegant aesthetic, ${styleKeywords}${brandAddition}, ${noTextInstruction}`,

    SOCIAL_PROOF: `skin texture comparison for ${category}, split screen composition showing improvement, even studio lighting, neutral background, clinical results visualization, professional dermatology style, ${styleKeywords}${brandAddition}, ${noTextInstruction}`,

    HOW_TO_USE: `beauty application tutorial, model applying ${category} product, clear instructional composition, bright lighting, clean minimal background, how-to tutorial style, ${styleKeywords}${brandAddition}, ${noTextInstruction}`,

    FAQ: `${category} product collection showcase, complete lineup display, products arranged elegantly, gradient background, studio lighting, brand portfolio presentation, ${styleKeywords}${brandAddition}, ${noTextInstruction}`,
  };

  return basePrompts[sectionType] || basePrompts['FEATURES'];
}

// ============================================
// 오버레이 텍스트 생성기
// ============================================

export async function generateOverlayText(
  sectionType: 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ',
  productName: string,
  category: string,
  keyFeatures: string[],
  targetAudience: string
): Promise<OverlayTextContent | undefined> {
  const gemini = getGeminiClient();
  if (!gemini) return undefined;

  const prompt = buildOverlayTextPrompt(sectionType, productName, category, keyFeatures, targetAudience);

  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // JSON 파싱
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    return JSON.parse(jsonStr) as OverlayTextContent;
  } catch (error) {
    console.error('[Orchestration] Failed to generate overlay text:', error);
    return undefined;
  }
}

// ============================================
// 메인 오케스트레이션 함수
// ============================================

export async function orchestrateDetailPageGeneration(
  input: GenerationInput
): Promise<OrchestrationResult[]> {
  console.log('[Orchestration] Starting detail page generation...');
  console.log(`[Orchestration] Product: ${input.productName}, Category: ${input.category}`);

  const gemini = getGeminiClient();

  // 1. 텍스트 콘텐츠 생성 (훅 메시지 + 섹션 카피)
  const systemPrompt = buildEnhancedSystemPrompt(input.copyLength, input.brandContext, input.category);
  const userPrompt = buildEnhancedUserPrompt(input);

  const generateTextContent = async (versionIndex: number) => {
    const variationPrompt = versionIndex === 1
      ? '\n\nIMPORTANT: Create a distinctly different version with alternative messaging approach, different tone, or unique angle.'
      : '';

    if (!gemini) {
      // Mock 데이터 반환
      return {
        hookMessage: `${input.productName} - ${input.targetAudience}를 위한 완벽한 선택`,
        sections: [
          { type: 'HERO', title: `${input.productName} 소개`, body: `${input.targetAudience}를 위해 설계된 ${input.productName}입니다.` },
          { type: 'FEATURES', title: '주요 특징', body: input.keyFeatures.map((f, i) => `${i + 1}. ${f}`).join('\n') },
          { type: 'SOCIAL_PROOF', title: '고객 후기', body: `"${input.productName}을 사용한 후 정말 만족합니다!" - 실제 사용자` },
          { type: 'HOW_TO_USE', title: '사용 방법', body: `1. ${input.productName}을 준비합니다.\n2. 설정을 완료합니다.\n3. 사용을 시작하세요!` },
          { type: 'FAQ', title: '자주 묻는 질문', body: `Q: 주요 특징은?\nA: ${input.keyFeatures[0] || '뛰어난 품질'}입니다.` },
        ],
      };
    }

    const response = await gemini.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `${systemPrompt}\n\n${userPrompt}${variationPrompt}\n\nReturn only the JSON object, no additional text or markdown.`,
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // JSON 파싱
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    try {
      return JSON.parse(jsonStr);
    } catch {
      console.error('[Orchestration] Failed to parse text content, using fallback');
      return null;
    }
  };

  // 2. 두 버전의 텍스트 콘텐츠 생성
  console.log('[Orchestration] Generating text content for 2 versions...');
  const [textContent1, textContent2] = await Promise.all([
    generateTextContent(0),
    generateTextContent(1),
  ]);

  // 3. 각 섹션별 이미지 프롬프트 생성
  console.log('[Orchestration] Generating section image prompts...');
  const sectionTypes: Array<'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ'> = [
    'HERO', 'FEATURES', 'SOCIAL_PROOF', 'HOW_TO_USE', 'FAQ'
  ];

  const brandStyle = input.brandContext?.imageKeywords?.join(', ');

  // 각 섹션별 이미지 프롬프트 병렬 생성
  const imagePrompts = await Promise.all(
    sectionTypes.map(async (sectionType) => {
      const [imagePrompt, overlayText] = await Promise.all([
        generateSectionImagePrompt(
          sectionType,
          input.productName,
          input.category,
          input.keyFeatures,
          input.targetAudience,
          brandStyle
        ),
        input.generateImages ? generateOverlayText(
          sectionType,
          input.productName,
          input.category,
          input.keyFeatures,
          input.targetAudience
        ) : undefined,
      ]);

      return {
        ...imagePrompt,
        overlayText,
      };
    })
  );

  console.log('[Orchestration] Image prompts generated for all sections');

  // 4. 결과 조합
  const buildResult = (textContent: { hookMessage: string; sections: Array<{ type: string; title?: string; body: string }> } | null): OrchestrationResult => {
    if (!textContent) {
      // 폴백 결과
      return {
        hookMessage: `${input.productName} - 최고의 선택`,
        sections: sectionTypes.map((type, index) => {
          const imagePrompt = imagePrompts.find(p => p.sectionType === type) || imagePrompts[0];
          return {
            id: uuidv4(),
            type,
            title: type,
            body: `${input.productName} ${type} 섹션`,
            order: index,
            imagePrompt,
          };
        }),
      };
    }

    return {
      hookMessage: textContent.hookMessage,
      sections: textContent.sections.map((section, index) => {
        const sectionType = section.type as 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ';
        const imagePrompt = imagePrompts.find(p => p.sectionType === sectionType) ||
          imagePrompts.find(p => p.position === mapSectionTypeToPosition(sectionType)) ||
          imagePrompts[Math.min(index, imagePrompts.length - 1)];

        return {
          id: uuidv4(),
          type: section.type,
          title: section.title,
          body: section.body,
          order: index,
          imagePrompt,
        };
      }),
    };
  };

  const results = [
    buildResult(textContent1),
    buildResult(textContent2),
  ];

  console.log('[Orchestration] Detail page generation completed');

  return results;
}

// ============================================
// 단일 섹션 재생성 함수
// ============================================

export async function regenerateSectionImagePrompt(
  sectionType: 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ',
  productName: string,
  category: string,
  keyFeatures: string[],
  targetAudience: string,
  brandStyle?: string,
  userFeedback?: string
): Promise<SectionImagePrompt> {
  console.log(`[Orchestration] Regenerating image prompt for ${sectionType}...`);

  const position = mapSectionTypeToPosition(sectionType);
  const referencePrompts = getReferencePrompts(category, position);
  const visualKeywords = getVisualStyleKeywords(category);
  const compositionGuide = SECTION_COMPOSITION_GUIDE[position];

  const noTextInstruction = 'absolutely no text, no typography, no letters, no words, no labels, no watermarks, text-free image only';

  const gemini = getGeminiClient();

  if (!gemini) {
    return {
      sectionType,
      position,
      imagePrompt: buildFallbackImagePrompt(sectionType, productName, category, keyFeatures, brandStyle, position, visualKeywords),
      imagePromptMidjourney: addMidjourneyParams(buildFallbackImagePrompt(sectionType, productName, category, keyFeatures, brandStyle, position, visualKeywords)),
      compositionGuide,
    };
  }

  const promptGenerationRequest = `
당신은 상세페이지 이미지 프롬프트 전문가입니다.
기존 프롬프트를 개선하여 새로운 버전을 만들어주세요.

## 제품 정보
- 제품명: ${productName}
- 카테고리: ${category}
- 핵심 특징: ${keyFeatures.join(', ')}
- 타겟: ${targetAudience}
${brandStyle ? `- 브랜드 스타일: ${brandStyle}` : ''}

## 섹션: ${sectionType} (${position})
- 레이아웃: ${compositionGuide.layout}
- 분위기: ${compositionGuide.mood}

## 참조 프롬프트 (올리브영 베스트셀러)
${referencePrompts.slice(0, 2).join('\n')}

${userFeedback ? `## 사용자 피드백\n${userFeedback}` : ''}

## 규칙
1. 텍스트 없이 제품만 포함
2. 영어로 작성
3. 이전과 다른 새로운 접근

프롬프트만 반환하세요.
`;

  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: promptGenerationRequest,
    });

    let imagePrompt = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    if (!imagePrompt.toLowerCase().includes('no text')) {
      imagePrompt = `${imagePrompt}, ${noTextInstruction}`;
    }

    return {
      sectionType,
      position,
      imagePrompt,
      imagePromptMidjourney: addMidjourneyParams(imagePrompt),
      compositionGuide,
    };
  } catch (error) {
    console.error('[Orchestration] Regeneration failed:', error);
    const fallback = buildFallbackImagePrompt(sectionType, productName, category, keyFeatures, brandStyle, position, visualKeywords);
    return {
      sectionType,
      position,
      imagePrompt: fallback,
      imagePromptMidjourney: addMidjourneyParams(fallback),
      compositionGuide,
    };
  }
}
