import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

// 섹션별 aspectRatio 결정 (실제 코드와 동일)
function getSectionAspectRatio(sectionType: string): '1:1' | '16:9' | undefined {
  const upperType = sectionType.toUpperCase();
  if (/^MAIN|THUMBNAIL/.test(upperType)) return '1:1';
  if (/TEXT_BANNER|KEY_MESSAGE|BENEFIT_HIGHLIGHT|DIVIDER_VISUAL|BRAND_HEADER/.test(upperType)) return '16:9';
  return undefined;
}

// 섹션별 프롬프트 생성 (실제 코드와 유사)
function buildSectionPrompt(sectionType: string, productName: string): string {
  const prompts: Record<string, string> = {
    MAIN: `Create a KOREAN E-COMMERCE DETAIL PAGE THUMBNAIL for "${productName}".

[KOREAN DETAIL PAGE STYLE - 올리브영/쿠팡 스타일]
- Premium beauty product thumbnail style (한국 뷰티 상세페이지)
- Clean, bright, aspirational aesthetic that Korean consumers love
- Magazine editorial meets e-commerce quality
- Soft gradient background complementing product colors

[CREATIVE COMPOSITION]
Design a visually striking thumbnail featuring ${productName}.
- Product as HERO (50-60% of frame), sharp focus, eye-catching
- Product placement: CENTER or slightly UPPER-CENTER
- Decorative objects (15-20%): fresh pink roses, scattered rose petals
- Atmospheric elements (10-15%): soft morning light, gentle sparkles

[TECHNICAL REQUIREMENTS]
- Soft, diffused studio lighting with gentle rim light
- 8K resolution, photorealistic, no text in image`,

    HERO: `Create KOREAN E-COMMERCE HERO BANNER IMAGE for ${productName}.
[SCENARIO: 상세페이지 최상단 히어로 배너]
- 고객이 처음 보는 강렬한 첫인상 이미지
- 제품이 돋보이면서 브랜드 슬로건이 들어갈 공간 필요
- 프리미엄하고 드라마틱한 분위기
8K, photorealistic, no text.`,

    FEATURES: `Create KOREAN E-COMMERCE FEATURES SECTION IMAGE for ${productName}.
[SCENARIO: 제품 특징 소개 섹션]
- 제품의 장점과 특징을 설명하는 섹션용 이미지
- 제품 디테일이 잘 보이도록 각도 조절
- 클린하고 정보전달에 효과적인 구성
8K, photorealistic, no text.`,

    SOCIAL_PROOF: `Create KOREAN E-COMMERCE REVIEW/TESTIMONIAL IMAGE for ${productName}.
[SCENARIO: 고객 후기/리뷰 섹션]
- 리뷰와 별점이 함께 표시되는 섹션용 이미지
- 제품이 작고 자연스럽게 배치된 라이프스타일 느낌
- 신뢰감을 주는 따뜻한 분위기
8K, photorealistic, no text.`,

    HOW_TO_USE: `Create KOREAN E-COMMERCE HOW-TO-USE IMAGE for ${productName}.
[SCENARIO: 사용법 안내 섹션]
- 제품 사용 방법을 단계별로 설명하는 섹션용 이미지
- 제품을 손에 들거나 사용하는 맥락 표현
- 밝고 명확한 튜토리얼 분위기
8K, photorealistic, no text.`,

    TEXT_BANNER: `Create a simple, clean gradient background for text overlay.
[SCENARIO: 텍스트 배너 배경]
- Pure soft pink gradient background
- No objects, no products, just clean color
- Space for typography overlay
8K resolution, no text.`,

    DIVIDER_VISUAL: `Create a simple, elegant divider background.
[SCENARIO: 구분선 비주얼]
- Soft gradient from white to light pink
- Minimal, clean aesthetic
- Perfect for text overlay
8K resolution, no text.`,
  };

  return prompts[sectionType] || prompts.FEATURES;
}

async function testFullT2I() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_AI_API_KEY not found');
    return;
  }

  const client = new GoogleGenAI({ apiKey });
  const productName = "클리오 킬커버 더 뉴 파운웨어 쿠션";
  const outputDir = path.join(process.cwd(), 'TESTGEN');

  // 테스트할 섹션들
  const sections = [
    'MAIN',
    'HERO',
    'FEATURES',
    'SOCIAL_PROOF',
    'HOW_TO_USE',
    'TEXT_BANNER',
    'DIVIDER_VISUAL',
  ];

  console.log('=== Full T2I Test ===');
  console.log('Product:', productName);
  console.log('Model: gemini-2.5-flash-image');
  console.log('Output:', outputDir);
  console.log('Sections:', sections.length);
  console.log('');

  const results: { section: string; success: boolean; error?: string }[] = [];

  for (const section of sections) {
    const aspectRatio = getSectionAspectRatio(section);
    const prompt = buildSectionPrompt(section, productName);

    console.log(`--- ${section} (aspectRatio: ${aspectRatio || 'free'}) ---`);

    try {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [prompt],
        config: {
          responseModalities: ['Image', 'Text'],
          ...(aspectRatio && {
            imageConfig: { aspectRatio },
          }),
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      let imageFound = false;

      for (const part of parts) {
        if (part.inlineData?.data) {
          const filename = path.join(outputDir, `${section}.png`);
          const buffer = Buffer.from(part.inlineData.data, 'base64');
          fs.writeFileSync(filename, buffer);
          console.log(`✅ ${section}: Saved (${Math.round(buffer.length / 1024)}KB)`);
          imageFound = true;
          results.push({ section, success: true });
        }
      }

      if (!imageFound) {
        console.log(`❌ ${section}: No image in response`);
        results.push({ section, success: false, error: 'No image in response' });
      }

    } catch (error: unknown) {
      const err = error as Error;
      console.log(`❌ ${section}: ${err.message}`);
      results.push({ section, success: false, error: err.message });
    }

    // Rate limiting 방지
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('');
  console.log('=== Summary ===');
  const successCount = results.filter(r => r.success).length;
  console.log(`Success: ${successCount}/${sections.length}`);

  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log('Failures:');
    failures.forEach(f => console.log(`  - ${f.section}: ${f.error}`));
  }
}

testFullT2I();
