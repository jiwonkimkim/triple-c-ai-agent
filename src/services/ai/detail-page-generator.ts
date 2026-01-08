import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import {
  generateDetailPageImagesWithGemini,
  generateSectionImageWithGemini,
  generateImageFromImage,
  generateSectionImageFromProduct,
  preprocessProductImage,
  base64ToDataUrl,
  isGeminiConfigured,
  GeminiImageModel,
  DEFAULT_IMAGE_MODEL,
  urlToBase64DataUrl,
} from '@/services/image/gemini-image-generator';
import { uploadGeneratedImage } from '@/services/image/image-upload-service';
import {
  buildEnhancedSystemPrompt,
  buildEnhancedUserPrompt,
  OverlayTextContent,
} from './prompts';
import {
  orchestrateDetailPageGeneration,
  generateSectionImagePrompt,
  regenerateSectionImagePrompt,
  SectionImagePrompt,
  OrchestrationResult,
} from './orchestration-service';
import type { BeautySubCategory } from './prompts';

// Groq client (OpenAI-compatible API)
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || '',
  baseURL: 'https://api.groq.com/openai/v1',
});

// Types
interface BrandContext {
  name: string;
  identity: string;
  toneAndManner: string;
  imageKeywords: string[];
  ragContext?: string;
}

interface GenerateDetailPageInput {
  productImages: string[];
  productName: string;
  category: string;
  subCategory?: BeautySubCategory;  // ★ 뷰티 서브 카테고리 (스킨케어, 선케어, 립, 마스카라, 마스크팩 등)
  keyFeatures: string[];
  targetAudience: string;
  copyLength: 'short' | 'medium' | 'long';
  brandContext?: BrandContext | null;
  generateImages?: boolean;
  imageModel?: GeminiImageModel;
}

// OverlayTextContent는 ./prompts/types.ts에서 import (위치 + 스타일 정보 포함)

interface DetailPageSection {
  id: string;
  type: 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ' | 'CUSTOM';
  title?: string;
  body: string;
  order: number;
  imageUrl?: string;                    // 기존 호환성 (첫 번째 이미지)
  imageUrls?: string[];                 // 다중 이미지 URL 배열
  imagePrompt?: SectionImagePrompt;     // 기존 호환성 (첫 번째 프롬프트)
  imagePrompts?: SectionImagePrompt[];  // 다중 이미지 프롬프트 배열
  overlayText?: OverlayTextContent;     // ★ AI 생성 오버레이 텍스트 (이미지 위 자동 배치)
}

interface DetailPageVersion {
  hookMessage: string;
  sections: DetailPageSection[];
}

// 생성된 섹션 결과 타입 (개발자 모드용)
interface GeneratedSectionResult {
  type: string;
  title?: string;
  body: string;
  imageUrl?: string;
  imageUrls?: string[];  // 다중 이미지 URL
}

// 개발자 모드 프롬프트 정보 (DEV ONLY) - 생성 결과 포함
export interface DevPromptInfo {
  textGeneration: {
    systemPrompt: string;
    userPrompt: string;
    // 생성된 텍스트 결과
    generatedResult?: {
      hookMessage: string;
      sections: GeneratedSectionResult[];
    };
  };
  sectionImagePrompts: Array<{
    sectionType: string;
    imagePrompt: string;
    // 생성된 이미지 URL
    generatedImageUrl?: string;
  }>;
  // 오버레이 텍스트 프롬프트 (각 섹션별)
  overlayTextPrompts?: Array<{
    sectionType: string;
    blockIndex: number;
    overlayPrompt: string;
    // 생성된 오버레이 텍스트 결과
    generatedOverlay?: unknown;
  }>;
}

// 개발자 모드용 확장 응답 타입
export interface DetailPageGenerationResult {
  versions: DetailPageVersion[];
  devPrompts?: DevPromptInfo; // 개발 모드에서만 포함
}

// Copy length configurations
const COPY_LENGTH_CONFIG = {
  short: {
    hookLength: 50,
    sectionBodyLength: 100,
    description: 'concise and punchy',
  },
  medium: {
    hookLength: 100,
    sectionBodyLength: 200,
    description: 'balanced and informative',
  },
  long: {
    hookLength: 150,
    sectionBodyLength: 400,
    description: 'detailed and comprehensive',
  },
};

// Check if keys are placeholder values or actual keys
const isPlaceholder = (key: string | undefined) =>
  !key ||
  key.includes('your-') ||
  key.includes('placeholder') ||
  key.length < 20;

// Check if valid API keys are configured
function hasValidApiKey(): boolean {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const googleKey = process.env.GOOGLE_AI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  return !isPlaceholder(anthropicKey) || !isPlaceholder(openaiKey) || !isPlaceholder(googleKey) || !isPlaceholder(groqKey);
}

// Check which provider to use (Gemini first for Korean marketing content)
function getAvailableProvider(): 'gemini' | 'anthropic' | 'openai' | 'groq' | null {
  const googleKey = process.env.GOOGLE_AI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  // Gemini first for Korean marketing content (better Korean quality)
  if (!isPlaceholder(googleKey)) return 'gemini';
  if (!isPlaceholder(anthropicKey)) return 'anthropic';
  if (!isPlaceholder(openaiKey)) return 'openai';
  if (!isPlaceholder(groqKey)) return 'groq';
  return null;
}

// Generate mock detail page for development (브랜드 컨텍스트 반영)
function generateMockDetailPage(input: GenerateDetailPageInput, versionIndex: number): DetailPageVersion {
  // 브랜드 정보 추출
  const brandName = input.brandContext?.name || '';
  const brandTone = input.brandContext?.toneAndManner || '';
  const brandPrefix = brandName ? `${brandName} ` : '';

  const variations = [
    {
      hookMessage: brandName
        ? `${brandPrefix}${input.productName} - ${input.targetAudience}를 위한 ${brandTone || '특별한'} 선택`
        : `${input.productName} - ${input.targetAudience}를 위한 완벽한 선택`,
      angle: '혜택 중심',
    },
    {
      hookMessage: brandName
        ? `${brandName}이 선보이는 ${input.productName}의 놀라운 가치를 경험하세요`
        : `지금 바로 ${input.productName}의 놀라운 가치를 경험하세요`,
      angle: '행동 유도',
    },
  ];

  const variation = variations[versionIndex] || variations[0];

  return {
    hookMessage: variation.hookMessage,
    sections: [
      {
        id: uuidv4(),
        type: 'HERO',
        title: `${brandPrefix}${input.productName} 소개`,
        body: `${input.targetAudience}를 위해 설계된 ${brandPrefix}${input.productName}입니다. ${input.keyFeatures[0] || '뛰어난 품질'}을 자랑합니다.${brandTone ? ` ${brandTone}의 철학을 담았습니다.` : ''}`,
        order: 0,
      },
      {
        id: uuidv4(),
        type: 'FEATURES',
        title: '주요 특징',
        body: input.keyFeatures.map((f, i) => `${i + 1}. ${f}`).join('\n') || '다양한 기능을 제공합니다.',
        order: 1,
      },
      {
        id: uuidv4(),
        type: 'SOCIAL_PROOF',
        title: '고객 후기',
        body: `"${brandPrefix}${input.productName}을 사용한 후 정말 만족합니다!" - 실제 사용자 후기`,
        order: 2,
      },
      {
        id: uuidv4(),
        type: 'HOW_TO_USE',
        title: '사용 방법',
        body: `1. ${brandPrefix}${input.productName}을 준비합니다.\n2. 간단한 설정을 완료합니다.\n3. 바로 사용을 시작하세요!`,
        order: 3,
      },
      {
        id: uuidv4(),
        type: 'FAQ',
        title: '자주 묻는 질문',
        body: `Q: ${brandPrefix}${input.productName}의 주요 특징은 무엇인가요?\nA: ${input.keyFeatures[0] || '뛰어난 품질과 성능'}입니다.`,
        order: 4,
      },
    ],
  };
}

// Initialize AI clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Generate system prompt - 고도화된 버전 사용
// 기존 함수는 enhanced-prompts.ts의 buildEnhancedSystemPrompt로 대체됨
// 하위 호환성을 위해 래퍼 함수 유지
function buildSystemPrompt(
  copyLength: 'short' | 'medium' | 'long',
  brandContext?: BrandContext | null,
  category?: string
): string {
  return buildEnhancedSystemPrompt(copyLength, brandContext, category);
}

// Generate user prompt - 고도화된 버전 사용
// 기존 함수는 enhanced-prompts.ts의 buildEnhancedUserPrompt로 대체됨
function buildUserPrompt(input: GenerateDetailPageInput): string {
  return buildEnhancedUserPrompt(input);
}

// Parse AI response to DetailPageVersion
function parseResponse(response: string, versionIndex: number): DetailPageVersion {
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = response;
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr);

    return {
      hookMessage: parsed.hookMessage || 'Discover Something Amazing',
      sections: (parsed.sections || []).map(
        (
          section: { type?: string; title?: string; body?: string },
          index: number
        ) => ({
          id: uuidv4(),
          type: section.type || 'CUSTOM',
          title: section.title,
          body: section.body || '',
          order: index,
        })
      ),
    };
  } catch (error) {
    console.error(`Failed to parse AI response for version ${versionIndex}:`, error);

    // Return fallback structure
    return {
      hookMessage: 'Discover Our Amazing Product',
      sections: [
        {
          id: uuidv4(),
          type: 'HERO',
          title: 'Welcome',
          body: 'Explore our product and discover its benefits.',
          order: 0,
        },
        {
          id: uuidv4(),
          type: 'FEATURES',
          title: 'Features',
          body: 'Our product offers outstanding features designed for you.',
          order: 1,
        },
      ],
    };
  }
}

// Check if we should use mock generation (development without valid API keys)
function shouldUseMockGeneration(): boolean {
  // Always use mock if explicitly disabled
  if (process.env.USE_MOCK_AI === 'true') {
    return true;
  }

  // In development, use mock if no valid API keys
  const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  if (isDev && !hasValidApiKey()) {
    return true;
  }

  return false;
}

// Main generation function - 오케스트레이션 기반
export async function generateDetailPage(
  input: GenerateDetailPageInput,
  options?: { includeDevPrompts?: boolean }
): Promise<DetailPageGenerationResult> {
  const isDev = process.env.NODE_ENV === 'development';
  const includeDevPrompts = options?.includeDevPrompts ?? isDev;

  // 개발자 프롬프트 정보 수집을 위한 변수
  let devPrompts: DevPromptInfo | undefined;

  // Development mode fallback: return mock data if no valid API keys
  if (shouldUseMockGeneration()) {
    console.log('[DEV] Using mock detail page generation - mock mode enabled or no valid API keys');
    const mockVersions = [
      generateMockDetailPage(input, 0),
      generateMockDetailPage(input, 1),
    ];

    // Mock 모드에서도 프롬프트 정보 포함 (개발자 참고용) - 생성 결과 포함
    if (includeDevPrompts && mockVersions.length > 0) {
      devPrompts = {
        textGeneration: {
          systemPrompt: buildEnhancedSystemPrompt(input.copyLength, input.brandContext, input.category),
          userPrompt: buildEnhancedUserPrompt(input),
          generatedResult: {
            hookMessage: mockVersions[0].hookMessage,
            sections: mockVersions[0].sections.map((s) => ({
              type: s.type,
              title: s.title,
              body: s.body,
              imageUrl: s.imageUrl,
            })),
          },
        },
        sectionImagePrompts: [],
      };
    }

    return { versions: mockVersions, devPrompts };
  }

  // Get available provider
  const provider = getAvailableProvider();

  if (!provider) {
    console.log('[DEV] No API keys configured, using mock generation');
    const mockVersions = [
      generateMockDetailPage(input, 0),
      generateMockDetailPage(input, 1),
    ];
    return { versions: mockVersions };
  }

  console.log(`[AI] Using provider: ${provider}`);

  try {
    // 오케스트레이션 서비스를 사용하여 상세페이지 생성
    // - 패턴 분석 + 사용자 입력 + OCR 참조 데이터 통합
    // - 각 섹션별 개별 이미지 프롬프트 생성
    console.log('[AI] Starting orchestrated generation with pattern analysis...');

    const orchestrationResults = await orchestrateDetailPageGeneration({
      productImages: input.productImages,
      productName: input.productName,
      category: input.category,
      subCategory: input.subCategory,  // ★ 뷰티 서브 카테고리 전달
      keyFeatures: input.keyFeatures,
      targetAudience: input.targetAudience,
      copyLength: input.copyLength,
      brandContext: input.brandContext,
      generateImages: input.generateImages,
    });

    // OrchestrationResult를 DetailPageVersion으로 변환 (다중 이미지 프롬프트 + overlayText 포함)
    let versions: DetailPageVersion[] = orchestrationResults.map((result) => ({
      hookMessage: result.hookMessage,
      sections: result.sections.map((section) => {
        // 첫 번째 이미지 프롬프트에서 overlayText 추출
        const firstPrompt = section.imagePrompts?.[0] || section.imagePrompt;
        const overlayText = firstPrompt?.overlayText;

        return {
          id: section.id,
          type: section.type as DetailPageSection['type'],
          title: section.title,
          body: section.body,
          order: section.order,
          imagePrompt: section.imagePrompt,
          imagePrompts: section.imagePrompts,  // 다중 이미지 프롬프트 배열
          overlayText,                          // ★ AI 생성 오버레이 텍스트 포함!
        };
      }),
    }));

    // ============================================
    // 사용자 제품 이미지 직접 사용 (기본 동작)
    // - generateImages가 false이거나 undefined인 경우
    // - 사용자가 업로드한 제품 이미지를 섹션에 배치
    // ============================================
    if (!input.generateImages && input.productImages && input.productImages.length > 0) {
      console.log(`[AI] Using user's product images directly (${input.productImages.length} images)`);

      versions = versions.map((version) => {
        const updatedSections = version.sections.map((section, sectionIndex) => {
          // 각 섹션에 이미지 배치 전략:
          // - HERO: 첫 번째 이미지 (대표 이미지)
          // - FEATURES: 2번째 이미지부터 순차 배치
          // - 나머지 섹션: 순환하여 이미지 배치
          let imageIndex: number;

          switch (section.type) {
            case 'HERO':
              imageIndex = 0; // 첫 번째 이미지
              break;
            case 'FEATURES':
              imageIndex = Math.min(1, input.productImages.length - 1); // 두 번째 이미지 또는 첫 번째
              break;
            default:
              // 나머지 섹션은 순환 배치
              imageIndex = sectionIndex % input.productImages.length;
          }

          const productImage = input.productImages[imageIndex];

          return {
            ...section,
            imageUrl: productImage,  // 사용자 제품 이미지 직접 사용
          };
        });

        return {
          ...version,
          sections: updatedSections,
        };
      });

      console.log('[AI] User product images assigned to sections');
    }
    // ============================================
    // AI 이미지 생성 (generateImages가 true인 경우)
    // - Image-to-Image: 사용자 제품 이미지 + 이미지 프롬프트를 함께 사용
    // - 제품 이미지를 그대로 유지하면서 배경/스타일만 변경
    // ============================================
    console.log(`[AI DEBUG] generateImages=${input.generateImages}, isGeminiConfigured=${isGeminiConfigured()}, productImages=${input.productImages?.length || 0}`);

    if (input.generateImages && isGeminiConfigured()) {
      // 사용자 제품 이미지가 있는지 확인
      const hasProductImages = input.productImages && input.productImages.length > 0;
      const primaryProductImage = hasProductImages ? input.productImages[0] : null;

      if (hasProductImages && primaryProductImage) {
        // ============================================
        // Image-to-Image 모드: 사용자 제품 이미지 기반 생성
        // 1. URL을 base64로 변환 (Gemini API는 base64만 지원)
        // 2. 배경 제거하여 제품만 추출
        // 3. 추출된 제품 + 이미지 프롬프트로 새 이미지 생성
        // ============================================
        console.log('[AI] Starting Image-to-Image generation with user product image...');
        console.log(`[AI] Primary product image: ${primaryProductImage.substring(0, 80)}...`);

        try {
          const imageModel = input.imageModel || DEFAULT_IMAGE_MODEL;
          console.log(`[AI] ★★★ Using Image Model: ${imageModel} ★★★`);

          // Step 0: URL을 base64 data URL로 변환
          console.log('[AI] Step 0: Converting image URL to base64...');
          const base64ProductImage = await urlToBase64DataUrl(primaryProductImage);
          console.log('[AI] URL to base64 conversion completed');

          // Step 1: 배경 제거 - 제품만 추출
          console.log('[AI] Step 1: Removing background from product image...');
          const cleanProductImage = await preprocessProductImage(base64ProductImage, imageModel);
          console.log('[AI] Background removal completed');

          // Step 2: 각 섹션별 Image-to-Image 생성
          console.log('[AI] Step 2: Generating section images with clean product...');

          versions = await Promise.all(
            versions.map(async (version) => {
              const updatedSections = await Promise.all(
                version.sections.map(async (section, sectionIndex) => {
                  // 이미지 프롬프트 가져오기
                  const prompts = section.imagePrompts || (section.imagePrompt ? [section.imagePrompt] : []);

                  if (prompts.length === 0) {
                    // 프롬프트가 없으면 배경 제거된 제품 이미지 사용
                    return {
                      ...section,
                      imageUrl: cleanProductImage,
                    };
                  }

                  const sectionType = section.type as 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ';
                  console.log(`[AI I2I] Generating ${sectionType} section (${prompts.length} images)...`);
                  console.log(`[AI I2I] keyFeatures: ${input.keyFeatures?.slice(0, 2).join(', ')}, target: ${input.targetAudience}`);

                  // 다중 이미지 생성: 모든 프롬프트에 대해 이미지 생성
                  const generatedImageUrls: string[] = [];
                  const updatedPrompts = [...prompts]; // 최종 프롬프트 저장용

                  for (let i = 0; i < prompts.length; i++) {
                    try {
                      console.log(`[AI I2I] Generating ${sectionType} image ${i + 1}/${prompts.length}...`);

                      const generatedImage = await generateSectionImageFromProduct(
                        cleanProductImage,  // 배경 제거된 이미지 사용
                        sectionType,
                        input.productName,
                        input.category,
                        input.brandContext?.imageKeywords?.join(', '),  // additionalPrompt
                        imageModel,
                        input.keyFeatures,
                        input.targetAudience
                      );

                      if (generatedImage) {
                        // Cloudinary에 업로드 (설정되어 있으면) 또는 base64 fallback
                        const uploadResult = await uploadGeneratedImage(generatedImage, {
                          folder: 'triple-c/sections',
                          sectionType,
                        });
                        generatedImageUrls.push(uploadResult.url);

                        // ★ 최종 사용된 프롬프트로 업데이트 (revisedPrompt가 있으면)
                        if (generatedImage.revisedPrompt && updatedPrompts[i]) {
                          updatedPrompts[i] = {
                            ...updatedPrompts[i],
                            imagePrompt: generatedImage.revisedPrompt,
                          };
                        }

                        console.log(`[AI I2I] ${sectionType} image ${i + 1} generated successfully`);
                      }
                    } catch (imageError) {
                      console.error(`[AI I2I] ${sectionType} image ${i + 1} failed:`, imageError);
                    }
                  }

                  // 생성된 이미지가 있으면 결과 반환 (최종 프롬프트 포함)
                  if (generatedImageUrls.length > 0) {
                    return {
                      ...section,
                      imageUrl: generatedImageUrls[0],           // 기존 호환성 (첫 번째 이미지)
                      imageUrls: generatedImageUrls,             // 다중 이미지 배열
                      imagePrompts: updatedPrompts,              // ★ 최종 프롬프트로 업데이트
                    };
                  }

                  // 실패 시 배경 제거된 제품 이미지 폴백
                  return {
                    ...section,
                    imageUrl: cleanProductImage,
                  };
                })
              );

              return {
                ...version,
                sections: updatedSections,
              };
            })
          );

          const totalImages = versions[0]?.sections.reduce((sum, s) => {
            return sum + (s.imageUrls?.length || (s.imageUrl ? 1 : 0));
          }, 0) || 0;
          console.log(`[AI I2I] Image-to-Image generation completed. Total: ${totalImages}`);
        } catch (imageError) {
          console.error('[AI I2I] Image-to-Image generation failed:', imageError);
          // 실패 시 원본 제품 이미지 사용으로 폴백
          versions = versions.map((version) => ({
            ...version,
            sections: version.sections.map((section) => ({
              ...section,
              imageUrl: primaryProductImage,
            })),
          }));
        }
      } else {
        // ============================================
        // Text-to-Image 모드: 제품 이미지 없이 프롬프트만으로 생성
        // - MAIN 섹션: 1:1 정사각형 + 맞춤 오브제
        // - 나머지: 자유 비율
        // ============================================
        console.log('[AI] Generating images with Text-to-Image (no product image provided)...');

        try {
          const imageModel = input.imageModel || DEFAULT_IMAGE_MODEL;
          console.log(`[AI] ★★★ Using Image Model: ${imageModel} ★★★`);

          versions = await Promise.all(
            versions.map(async (version) => {
              const updatedSections = await Promise.all(
                version.sections.map(async (section) => {
                  const prompts = section.imagePrompts || (section.imagePrompt ? [section.imagePrompt] : []);

                  if (prompts.length === 0) {
                    return section;
                  }

                  const sectionType = section.type as 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ';
                  console.log(`[AI T2I] Generating ${sectionType} section (${prompts.length} images)...`);
                  console.log(`[AI T2I] keyFeatures: ${input.keyFeatures?.slice(0, 2).join(', ')}, target: ${input.targetAudience}`);

                  // 다중 이미지 생성: 모든 프롬프트에 대해 이미지 생성
                  const generatedImageUrls: string[] = [];
                  const updatedPrompts = [...prompts]; // 최종 프롬프트 저장용

                  for (let i = 0; i < prompts.length; i++) {
                    const prompt = prompts[i];
                    const imagePrompt = prompt?.imagePrompt || '';

                    try {
                      console.log(`[AI T2I] Generating ${sectionType} image ${i + 1}/${prompts.length}...`);

                      const generatedImage = await generateSectionImageWithGemini(
                        sectionType,
                        imagePrompt,
                        input.productName,
                        input.category,
                        imageModel,
                        input.keyFeatures,
                        input.targetAudience
                      );

                      if (generatedImage) {
                        // Cloudinary에 업로드 (설정되어 있으면) 또는 base64 fallback
                        const uploadResult = await uploadGeneratedImage(generatedImage, {
                          folder: 'triple-c/sections',
                          sectionType,
                        });
                        generatedImageUrls.push(uploadResult.url);

                        // ★ 최종 사용된 프롬프트로 업데이트 (revisedPrompt가 있으면)
                        if (generatedImage.revisedPrompt && updatedPrompts[i]) {
                          updatedPrompts[i] = {
                            ...updatedPrompts[i],
                            imagePrompt: generatedImage.revisedPrompt,
                          };
                        }

                        console.log(`[AI T2I] ${sectionType} image ${i + 1} generated successfully`);
                      }
                    } catch (imageError) {
                      console.error(`[AI T2I] ${sectionType} image ${i + 1} failed:`, imageError);
                    }
                  }

                  // 생성된 이미지가 있으면 결과 반환 (최종 프롬프트 포함)
                  if (generatedImageUrls.length > 0) {
                    return {
                      ...section,
                      imageUrl: generatedImageUrls[0],           // 기존 호환성 (첫 번째 이미지)
                      imageUrls: generatedImageUrls,             // 다중 이미지 배열
                      imagePrompts: updatedPrompts,              // ★ 최종 프롬프트로 업데이트
                    };
                  }

                  return section;
                })
              );

              return {
                ...version,
                sections: updatedSections,
              };
            })
          );

          const totalImages = versions[0]?.sections.reduce((sum, s) => {
            return sum + (s.imageUrls?.length || (s.imageUrl ? 1 : 0));
          }, 0) || 0;
          console.log(`[AI T2I] Text-to-Image generation completed. Total: ${totalImages}`);
        } catch (imageError) {
          console.error('[AI T2I] Text-to-Image generation failed:', imageError);
        }
      }
    }

    // 개발자 모드에서 프롬프트 정보 수집 (이미지 생성 후 - 생성된 결과 포함)
    if (includeDevPrompts && versions.length > 0) {
      const sectionImagePrompts: DevPromptInfo['sectionImagePrompts'] = [];
      const overlayTextPrompts: DevPromptInfo['overlayTextPrompts'] = [];

      // 모든 섹션의 이미지 프롬프트 및 생성된 이미지 수집 (다중 이미지 지원)
      for (const section of versions[0].sections) {
        const prompts = section.imagePrompts || (section.imagePrompt ? [section.imagePrompt] : []);
        const imageUrls = section.imageUrls || (section.imageUrl ? [section.imageUrl] : []);

        prompts.forEach((prompt, index) => {
          sectionImagePrompts.push({
            sectionType: section.type,
            imagePrompt: prompt.imagePrompt,
            generatedImageUrl: imageUrls[index], // 해당 인덱스의 생성된 이미지 URL
          });

          // 오버레이 텍스트 프롬프트 수집
          if (prompt.overlayPrompt) {
            overlayTextPrompts.push({
              sectionType: section.type,
              blockIndex: index,
              overlayPrompt: prompt.overlayPrompt,
              generatedOverlay: prompt.overlayText,
            });
          }
        });
      }

      devPrompts = {
        textGeneration: {
          systemPrompt: buildEnhancedSystemPrompt(input.copyLength, input.brandContext, input.category),
          userPrompt: buildEnhancedUserPrompt(input),
          // 생성된 텍스트 결과 포함
          generatedResult: {
            hookMessage: versions[0].hookMessage,
            sections: versions[0].sections.map((s) => ({
              type: s.type,
              title: s.title,
              body: s.body,
              imageUrl: s.imageUrl,
              imageUrls: s.imageUrls,  // 다중 이미지 URL도 포함
            })),
          },
        },
        sectionImagePrompts,
        overlayTextPrompts: overlayTextPrompts.length > 0 ? overlayTextPrompts : undefined,
      };
    }

    console.log('[AI] Orchestrated generation completed successfully');
    return { versions, devPrompts };

  } catch (error) {
    console.error('[AI] Failed to generate content from AI API:', error);

    // 폴백: 기존 방식으로 생성 시도
    console.log('[AI] Falling back to legacy generation method...');
    return generateDetailPageLegacy(input, includeDevPrompts);
  }
}

// 레거시 생성 함수 (폴백용)
async function generateDetailPageLegacy(
  input: GenerateDetailPageInput,
  includeDevPrompts?: boolean
): Promise<DetailPageGenerationResult> {
  const systemPrompt = buildEnhancedSystemPrompt(input.copyLength, input.brandContext, input.category);
  const userPrompt = buildEnhancedUserPrompt(input);
  const provider = getAvailableProvider();

  if (!provider) {
    const mockVersions = [
      generateMockDetailPage(input, 0),
      generateMockDetailPage(input, 1),
    ];

    // 개발자 프롬프트 정보 (생성 결과 포함)
    const devPrompts: DevPromptInfo | undefined = includeDevPrompts && mockVersions.length > 0 ? {
      textGeneration: {
        systemPrompt,
        userPrompt,
        generatedResult: {
          hookMessage: mockVersions[0].hookMessage,
          sections: mockVersions[0].sections.map((s) => ({
            type: s.type,
            title: s.title,
            body: s.body,
            imageUrl: s.imageUrl,
          })),
        },
      },
      sectionImagePrompts: [],
    } : undefined;

    return { versions: mockVersions, devPrompts };
  }

  const generateVersion = async (versionIndex: number): Promise<DetailPageVersion> => {
    const variationPrompt =
      versionIndex === 1
        ? '\n\nIMPORTANT: Create a distinctly different version with alternative messaging approach, different tone, or unique angle.'
        : '';

    if (provider === 'groq') {
      const response = await groq.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        max_tokens: 2000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt + variationPrompt + '\n\nReturn only the JSON object, no additional text or markdown.' },
        ],
      });
      return parseResponse(response.choices[0]?.message?.content || '', versionIndex);
    } else if (provider === 'anthropic') {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt + variationPrompt }],
      });
      const textContent = response.content.find((c) => c.type === 'text');
      return parseResponse(textContent?.text || '', versionIndex);
    } else if (provider === 'openai') {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        max_tokens: 2000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt + variationPrompt },
        ],
        response_format: { type: 'json_object' },
      });
      return parseResponse(response.choices[0]?.message?.content || '', versionIndex);
    } else {
      const gemini = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
      const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',  // 텍스트 생성용 (이미지 생성이 아님)
        contents: `${systemPrompt}\n\n${userPrompt}${variationPrompt}\n\nReturn only the JSON object, no additional text or markdown.`,
      });
      const textContent = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return parseResponse(textContent, versionIndex);
    }
  };

  try {
    const [version1, version2] = await Promise.all([
      generateVersion(0),
      generateVersion(1),
    ]);

    let versions = [version1, version2];

    if (input.generateImages && isGeminiConfigured()) {
      try {
        const imageModel = input.imageModel || DEFAULT_IMAGE_MODEL;
        const brandStyle = input.brandContext?.imageKeywords?.join(', ');

        const generatedImages = await generateDetailPageImagesWithGemini(
          input.productName,
          input.category,
          input.keyFeatures,
          brandStyle,
          imageModel
        );

        // Cloudinary 업로드를 위해 async 처리
        versions = await Promise.all(
          versions.map(async (version) => {
            const updatedSections = await Promise.all(
              version.sections.map(async (section, index) => {
                if (section.type === 'HERO' && generatedImages.heroImage) {
                  const uploadResult = await uploadGeneratedImage(generatedImages.heroImage, {
                    folder: 'triple-c/sections',
                    sectionType: 'HERO',
                  });
                  return {
                    ...section,
                    imageUrl: uploadResult.url,
                  };
                }
                if (section.type === 'FEATURES' && generatedImages.featureImages[0]) {
                  const featureIndex = Math.min(index - 1, generatedImages.featureImages.length - 1);
                  if (featureIndex >= 0 && generatedImages.featureImages[featureIndex]) {
                    const uploadResult = await uploadGeneratedImage(
                      generatedImages.featureImages[featureIndex],
                      {
                        folder: 'triple-c/sections',
                        sectionType: 'FEATURES',
                      }
                    );
                    return {
                      ...section,
                      imageUrl: uploadResult.url,
                    };
                  }
                }
                return section;
              })
            );

            return { ...version, sections: updatedSections };
          })
        );
      } catch (imageError) {
        console.error('[AI] Failed to generate images:', imageError);
      }
    }

    // 개발자 프롬프트 정보 (생성 결과 포함)
    const devPrompts: DevPromptInfo | undefined = includeDevPrompts && versions.length > 0 ? {
      textGeneration: {
        systemPrompt,
        userPrompt,
        generatedResult: {
          hookMessage: versions[0].hookMessage,
          sections: versions[0].sections.map((s) => ({
            type: s.type,
            title: s.title,
            body: s.body,
            imageUrl: s.imageUrl,
          })),
        },
      },
      sectionImagePrompts: [],
    } : undefined;

    return { versions, devPrompts };
  } catch (error) {
    console.error('[AI] Legacy generation failed:', error);
    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    if (isDev) {
      const fallbackVersions = [
        generateMockDetailPage(input, 0),
        generateMockDetailPage(input, 1),
      ];

      const fallbackDevPrompts: DevPromptInfo | undefined = includeDevPrompts && fallbackVersions.length > 0 ? {
        textGeneration: {
          systemPrompt,
          userPrompt,
          generatedResult: {
            hookMessage: fallbackVersions[0].hookMessage,
            sections: fallbackVersions[0].sections.map((s) => ({
              type: s.type,
              title: s.title,
              body: s.body,
              imageUrl: s.imageUrl,
            })),
          },
        },
        sectionImagePrompts: [],
      } : undefined;

      return { versions: fallbackVersions, devPrompts: fallbackDevPrompts };
    }
    throw error;
  }
}

// Generate hook message only
export async function generateHookMessage(
  productName: string,
  keyFeatures: string[],
  targetAudience: string,
  brandTone?: string,
  copyLength: 'short' | 'medium' | 'long' = 'medium'
): Promise<string> {
  // Development mode fallback
  if (shouldUseMockGeneration()) {
    console.log('[DEV] Using mock hook message - mock mode enabled or no valid API keys');
    return `${productName} - ${targetAudience}를 위한 최고의 선택!`;
  }

  const lengthConfig = COPY_LENGTH_CONFIG[copyLength];

  const prompt = `Create a compelling hook message for the following product:
Product: ${productName}
Key Features: ${keyFeatures.join(', ')}
Target Audience: ${targetAudience}
${brandTone ? `Brand Tone: ${brandTone}` : ''}

The hook should be approximately ${lengthConfig.hookLength} characters and be ${lengthConfig.description}.
Return only the hook message text, nothing else.`;

  const provider = getAvailableProvider();

  if (provider === 'groq') {
    const response = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.choices[0]?.message?.content?.trim() || 'Discover Something Amazing';
  } else if (provider === 'anthropic') {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    return textContent?.text?.trim() || 'Discover Something Amazing';
  } else if (provider === 'openai') {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.choices[0]?.message?.content?.trim() || 'Discover Something Amazing';
  }

  throw new Error('No AI API key configured');
}

// Generate section copy
export async function generateSectionCopy(
  sectionType: string,
  productName: string,
  keyFeatures: string[],
  brandTone?: string,
  copyLength: 'short' | 'medium' | 'long' = 'medium'
): Promise<{ title: string; body: string }> {
  // Development mode fallback
  if (shouldUseMockGeneration()) {
    console.log('[DEV] Using mock section copy - mock mode enabled or no valid API keys');
    const mockTitles: Record<string, string> = {
      HERO: `${productName} 소개`,
      FEATURES: '주요 특징',
      SOCIAL_PROOF: '고객 후기',
      HOW_TO_USE: '사용 방법',
      FAQ: '자주 묻는 질문',
      CUSTOM: '추가 정보',
    };
    return {
      title: mockTitles[sectionType] || '섹션 제목',
      body: `${productName}의 ${keyFeatures[0] || '뛰어난 품질'}을 경험해보세요.`,
    };
  }

  const lengthConfig = COPY_LENGTH_CONFIG[copyLength];

  const sectionDescriptions: Record<string, string> = {
    HERO: 'an impactful hero section that immediately captures attention',
    FEATURES: 'a features section highlighting key product benefits',
    SOCIAL_PROOF: 'a social proof section with testimonials or trust indicators',
    HOW_TO_USE: 'a how-to-use section with clear usage instructions',
    FAQ: 'an FAQ section addressing common customer questions',
    CUSTOM: 'a custom section with relevant product information',
  };

  const prompt = `Create ${sectionDescriptions[sectionType] || sectionDescriptions.CUSTOM} for:
Product: ${productName}
Key Features: ${keyFeatures.join(', ')}
${brandTone ? `Brand Tone: ${brandTone}` : ''}

The body should be approximately ${lengthConfig.sectionBodyLength} characters and be ${lengthConfig.description}.

Return in JSON format: {"title": "Section Title", "body": "Section content"}`;

  const provider = getAvailableProvider();
  let responseText = '';

  if (provider === 'groq') {
    const response = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    responseText = response.choices[0]?.message?.content || '';
  } else if (provider === 'anthropic') {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    responseText = textContent?.text || '';
  } else if (provider === 'openai') {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    responseText = response.choices[0]?.message?.content || '';
  } else {
    throw new Error('No AI API key configured');
  }

  try {
    const parsed = JSON.parse(responseText);
    return {
      title: parsed.title || 'Section Title',
      body: parsed.body || 'Section content',
    };
  } catch {
    return {
      title: 'Section Title',
      body: responseText || 'Section content',
    };
  }
}

// ============================================
// 오케스트레이션 서비스 함수 재내보내기
// ============================================

export {
  generateSectionImagePrompt,
  regenerateSectionImagePrompt,
  orchestrateDetailPageGeneration,
} from './orchestration-service';

export type { SectionImagePrompt, OrchestrationResult } from './orchestration-service';
