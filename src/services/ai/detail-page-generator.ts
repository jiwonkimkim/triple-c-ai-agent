import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

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
}

interface DetailPageSection {
  id: string;
  type: 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ' | 'CUSTOM';
  title?: string;
  body: string;
  order: number;
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

// Check if valid API keys are configured
function hasValidApiKey(): boolean {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // Check if keys are placeholder values or actual keys
  const isPlaceholder = (key: string | undefined) =>
    !key ||
    key.includes('your-') ||
    key.includes('placeholder') ||
    key.length < 20;

  return !isPlaceholder(anthropicKey) || !isPlaceholder(openaiKey);
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

// Generate system prompt
function buildSystemPrompt(
  copyLength: 'short' | 'medium' | 'long',
  brandContext?: BrandContext | null
): string {
  const lengthConfig = COPY_LENGTH_CONFIG[copyLength];

  let systemPrompt = `You are an expert marketing copywriter specializing in product detail pages and e-commerce content.
Your task is to create compelling, conversion-focused product detail page content.

Writing Style Guidelines:
- Write ${lengthConfig.description} copy
- Hook messages should be around ${lengthConfig.hookLength} characters
- Section body text should be around ${lengthConfig.sectionBodyLength} characters
- Use persuasive language that drives action
- Focus on benefits, not just features
- Include emotional triggers where appropriate
- Write in a professional yet engaging tone`;

  if (brandContext) {
    systemPrompt += `

Brand Guidelines:
- Brand Name: ${brandContext.name}
- Brand Identity: ${brandContext.identity}
- Tone & Manner: ${brandContext.toneAndManner}
- Visual Keywords: ${brandContext.imageKeywords.join(', ')}`;

    if (brandContext.ragContext) {
      systemPrompt += `

Brand Context (from previous materials):
${brandContext.ragContext}`;
    }
  }

  return systemPrompt;
}

// Generate user prompt
function buildUserPrompt(input: GenerateDetailPageInput): string {
  return `Create a product detail page for the following product:

Product Name: ${input.productName}
Category: ${input.category}
Target Audience: ${input.targetAudience}
Key Features:
${input.keyFeatures.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Please generate the content in the following JSON format:
{
  "hookMessage": "A compelling headline that grabs attention",
  "sections": [
    {
      "type": "HERO",
      "title": "Hero section title",
      "body": "Hero section description"
    },
    {
      "type": "FEATURES",
      "title": "Features section title",
      "body": "Detailed features description"
    },
    {
      "type": "SOCIAL_PROOF",
      "title": "Social proof section title",
      "body": "Customer testimonials or trust signals"
    },
    {
      "type": "HOW_TO_USE",
      "title": "How to use section title",
      "body": "Usage instructions or benefits"
    },
    {
      "type": "FAQ",
      "title": "FAQ section title",
      "body": "Common questions and answers"
    }
  ]
}

Important:
- Create content that resonates with ${input.targetAudience}
- Highlight the unique selling points
- Make the copy scannable and easy to read
- Include a call-to-action where appropriate

Return only the JSON object, no additional text.`;
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

// Main generation function
export async function generateDetailPage(
  input: GenerateDetailPageInput
): Promise<DetailPageVersion[]> {
  // Development mode fallback: return mock data if no valid API keys
  if (process.env.NODE_ENV === 'development' && !hasValidApiKey()) {
    console.log('[DEV] Using mock detail page generation - no valid API keys configured');
    return [
      generateMockDetailPage(input, 0),
      generateMockDetailPage(input, 1),
    ];
  }

  const systemPrompt = buildSystemPrompt(input.copyLength, input.brandContext);
  const userPrompt = buildUserPrompt(input);

  // Generate 2 versions concurrently
  const useAnthropic = process.env.ANTHROPIC_API_KEY;
  const useOpenAI = process.env.OPENAI_API_KEY;

  if (!useAnthropic && !useOpenAI) {
    throw new Error('No AI API key configured. Please set ANTHROPIC_API_KEY or OPENAI_API_KEY in your .env file.');
  }

  const generateVersion = async (versionIndex: number): Promise<DetailPageVersion> => {
    // Alternate between providers or use available one
    const useProvider =
      versionIndex === 0
        ? useAnthropic
          ? 'anthropic'
          : 'openai'
        : useOpenAI
          ? 'openai'
          : 'anthropic';

    // Add variation instruction for second version
    const variationPrompt =
      versionIndex === 1
        ? '\n\nIMPORTANT: Create a distinctly different version with alternative messaging approach, different tone, or unique angle.'
        : '';

    if (useProvider === 'anthropic') {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt + variationPrompt,
          },
        ],
      });

      const textContent = response.content.find((c) => c.type === 'text');
      return parseResponse(textContent?.text || '', versionIndex);
    } else {
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
    }
  };

  // Generate both versions concurrently
  const [version1, version2] = await Promise.all([
    generateVersion(0),
    generateVersion(1),
  ]);

  return [version1, version2];
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
  if (process.env.NODE_ENV === 'development' && !hasValidApiKey()) {
    console.log('[DEV] Using mock hook message - no valid API keys configured');
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

  if (process.env.ANTHROPIC_API_KEY) {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    return textContent?.text?.trim() || 'Discover Something Amazing';
  } else if (process.env.OPENAI_API_KEY) {
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
  if (process.env.NODE_ENV === 'development' && !hasValidApiKey()) {
    console.log('[DEV] Using mock section copy - no valid API keys configured');
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

  let responseText = '';

  if (process.env.ANTHROPIC_API_KEY) {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    responseText = textContent?.text || '';
  } else if (process.env.OPENAI_API_KEY) {
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
