import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import {
  generateDetailPageImagesWithGemini,
  base64ToDataUrl,
  isGeminiConfigured,
  GeminiImageModel,
} from '@/services/image/gemini-image-generator';
import {
  buildEnhancedSystemPrompt,
  buildEnhancedUserPrompt,
  ENHANCED_COPY_LENGTH_CONFIG,
} from './enhanced-prompts';
import {
  orchestrateDetailPageGeneration,
  generateSectionImagePrompt,
  regenerateSectionImagePrompt,
  SectionImagePrompt,
  OrchestrationResult,
} from './orchestration-service';

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
  keyFeatures: string[];
  targetAudience: string;
  copyLength: 'short' | 'medium' | 'long';
  brandContext?: BrandContext | null;
  generateImages?: boolean;
  imageModel?: GeminiImageModel;
}

interface DetailPageSection {
  id: string;
  type: 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ' | 'CUSTOM';
  title?: string;
  body: string;
  order: number;
  imageUrl?: string;
  imagePrompt?: SectionImagePrompt; // 섹션별 이미지 생성 프롬프트
}

interface DetailPageVersion {
  hookMessage: string;
  sections: DetailPageSection[];
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

// Generate mock detail page for development
function generateMockDetailPage(input: GenerateDetailPageInput, versionIndex: number): DetailPageVersion {
  const variations = [
    {
      hookMessage: `${input.productName} - ${input.targetAudience}를 위한 완벽한 선택`,
      angle: '혜택 중심',
    },
    {
      hookMessage: `지금 바로 ${input.productName}의 놀라운 가치를 경험하세요`,
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
        title: `${input.productName} 소개`,
        body: `${input.targetAudience}를 위해 설계된 ${input.productName}입니다. ${input.keyFeatures[0] || '뛰어난 품질'}을 자랑합니다.`,
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
        body: `"${input.productName}을 사용한 후 정말 만족합니다!" - 실제 사용자 후기`,
        order: 2,
      },
      {
        id: uuidv4(),
        type: 'HOW_TO_USE',
        title: '사용 방법',
        body: `1. ${input.productName}을 준비합니다.\n2. 간단한 설정을 완료합니다.\n3. 바로 사용을 시작하세요!`,
        order: 3,
      },
      {
        id: uuidv4(),
        type: 'FAQ',
        title: '자주 묻는 질문',
        body: `Q: ${input.productName}의 주요 특징은 무엇인가요?\nA: ${input.keyFeatures[0] || '뛰어난 품질과 성능'}입니다.`,
        order: 4,
      },
    ],
  };
}

// Initialize AI clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
  input: GenerateDetailPageInput
): Promise<DetailPageVersion[]> {
  // Development mode fallback: return mock data if no valid API keys
  if (shouldUseMockGeneration()) {
    console.log('[DEV] Using mock detail page generation - mock mode enabled or no valid API keys');
    return [
      generateMockDetailPage(input, 0),
      generateMockDetailPage(input, 1),
    ];
  }

  // Get available provider
  const provider = getAvailableProvider();

  if (!provider) {
    console.log('[DEV] No API keys configured, using mock generation');
    return [
      generateMockDetailPage(input, 0),
      generateMockDetailPage(input, 1),
    ];
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
      keyFeatures: input.keyFeatures,
      targetAudience: input.targetAudience,
      copyLength: input.copyLength,
      brandContext: input.brandContext,
      generateImages: input.generateImages,
    });

    // OrchestrationResult를 DetailPageVersion으로 변환
    let versions: DetailPageVersion[] = orchestrationResults.map((result) => ({
      hookMessage: result.hookMessage,
      sections: result.sections.map((section) => ({
        id: section.id,
        type: section.type as DetailPageSection['type'],
        title: section.title,
        body: section.body,
        order: section.order,
        imagePrompt: section.imagePrompt,
      })),
    }));

    // 이미지 생성이 활성화된 경우 Gemini로 이미지 생성
    if (input.generateImages && isGeminiConfigured()) {
      console.log('[AI] Generating images with Gemini using section-specific prompts...');

      try {
        const imageModel = input.imageModel || 'gemini-2.0-flash-exp';

        // 각 섹션별 이미지 생성 (각 섹션의 imagePrompt 사용)
        versions = await Promise.all(
          versions.map(async (version) => {
            const updatedSections = await Promise.all(
              version.sections.map(async (section) => {
                // 이미지 프롬프트가 있는 섹션만 이미지 생성
                if (section.imagePrompt && ['HERO', 'FEATURES', 'SOCIAL_PROOF'].includes(section.type)) {
                  try {
                    // 섹션별 맞춤 프롬프트로 이미지 생성
                    const sectionImages = await generateDetailPageImagesWithGemini(
                      input.productName,
                      input.category,
                      input.keyFeatures,
                      section.imagePrompt.imagePrompt, // 섹션별 커스텀 프롬프트 사용
                      imageModel
                    );

                    if (sectionImages.heroImage) {
                      return {
                        ...section,
                        imageUrl: base64ToDataUrl(
                          sectionImages.heroImage.base64Data,
                          sectionImages.heroImage.mimeType
                        ),
                      };
                    }
                  } catch (sectionImageError) {
                    console.error(`[AI] Failed to generate image for ${section.type}:`, sectionImageError);
                  }
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

        console.log('[AI] Section-specific images generated successfully');
      } catch (imageError) {
        console.error('[AI] Failed to generate images with Gemini:', imageError);
        // Continue without images - don't fail the entire generation
      }
    }

    console.log('[AI] Orchestrated generation completed successfully');
    return versions;

  } catch (error) {
    console.error('[AI] Failed to generate content from AI API:', error);

    // 폴백: 기존 방식으로 생성 시도
    console.log('[AI] Falling back to legacy generation method...');
    return generateDetailPageLegacy(input);
  }
}

// 레거시 생성 함수 (폴백용)
async function generateDetailPageLegacy(
  input: GenerateDetailPageInput
): Promise<DetailPageVersion[]> {
  const systemPrompt = buildEnhancedSystemPrompt(input.copyLength, input.brandContext, input.category);
  const userPrompt = buildEnhancedUserPrompt(input);
  const provider = getAvailableProvider();

  if (!provider) {
    return [
      generateMockDetailPage(input, 0),
      generateMockDetailPage(input, 1),
    ];
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
        model: 'gemini-2.0-flash-exp',
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
        const imageModel = input.imageModel || 'gemini-2.0-flash-exp';
        const brandStyle = input.brandContext?.imageKeywords?.join(', ');

        const generatedImages = await generateDetailPageImagesWithGemini(
          input.productName,
          input.category,
          input.keyFeatures,
          brandStyle,
          imageModel
        );

        versions = versions.map((version) => {
          const updatedSections = version.sections.map((section, index) => {
            if (section.type === 'HERO' && generatedImages.heroImage) {
              return {
                ...section,
                imageUrl: base64ToDataUrl(
                  generatedImages.heroImage.base64Data,
                  generatedImages.heroImage.mimeType
                ),
              };
            }
            if (section.type === 'FEATURES' && generatedImages.featureImages[0]) {
              const featureIndex = Math.min(index - 1, generatedImages.featureImages.length - 1);
              if (featureIndex >= 0 && generatedImages.featureImages[featureIndex]) {
                return {
                  ...section,
                  imageUrl: base64ToDataUrl(
                    generatedImages.featureImages[featureIndex].base64Data,
                    generatedImages.featureImages[featureIndex].mimeType
                  ),
                };
              }
            }
            return section;
          });

          return { ...version, sections: updatedSections };
        });
      } catch (imageError) {
        console.error('[AI] Failed to generate images:', imageError);
      }
    }

    return versions;
  } catch (error) {
    console.error('[AI] Legacy generation failed:', error);
    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    if (isDev) {
      return [
        generateMockDetailPage(input, 0),
        generateMockDetailPage(input, 1),
      ];
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
