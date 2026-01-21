import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

async function testOverlayPosition() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_AI_API_KEY not found');
    return;
  }

  const client = new GoogleGenAI({ apiKey });
  const productName = "클리오 킬커버 더 뉴 파운웨어 쿠션";

  const prompt = `Create a KOREAN E-COMMERCE DETAIL PAGE THUMBNAIL for "${productName}".

[KOREAN DETAIL PAGE STYLE - 올리브영/쿠팡 스타일]
- Premium beauty product thumbnail style (한국 뷰티 상세페이지)
- Clean, bright, aspirational aesthetic that Korean consumers love
- Soft gradient background complementing product colors

[CREATIVE COMPOSITION]
Design a visually striking thumbnail featuring ${productName}.
- Product as HERO (50-60% of frame), sharp focus, eye-catching
- Product placement: CENTER or slightly UPPER-CENTER
- Leave CLEAN SPACE at top (20%) for text overlay (slogan area)

[TECHNICAL REQUIREMENTS]
- Soft, diffused studio lighting with gentle rim light
- Premium commercial photography, photorealistic, NO TEXT in image

[★★★ OUTPUT REQUIREMENTS ★★★]
1. GENERATE IMAGE FIRST (REQUIRED) - This is the primary output
2. THEN return overlay text JSON (for placing text ON TOP of the generated image)

[★ CREATIVE OVERLAY TEXT DESIGN ★]
★★★ FONT SIZE (정확한 픽셀값 사용!) ★★★
- 브랜드명/섹션명: 12-16px (작고 절제된)
- 헤드라인: 24-36px (핵심 메시지, bold)
- 서브헤드라인: 16-22px (보조 설명, medium)
- 본문: 12-16px (상세 설명, normal)

★★★ POSITION (x, y는 0-100% 정수값) ★★★
- y: 5-15 = 상단 (브랜드명, 섹션명)
- y: 20-40 = 상단-중앙 (헤드라인)
- y: 45-65 = 중앙 (핵심 메시지, 통계)
- y: 70-85 = 하단-중앙 (본문, 설명)
- y: 88-95 = 하단 (CTA, 태그라인)
- x: 50 = 중앙 정렬 (가장 일반적)
- 텍스트 간 y값 최소 10 이상 간격 유지!

Return overlay as JSON:
{
  "texts": [
    { "text": "CLIO", "x": 50, "y": 8, "fontSize": 14, "fontWeight": "medium", "color": "#333333", "textAlign": "center" },
    { "text": "킬커버 더 뉴 파운웨어 쿠션", "x": 50, "y": 20, "fontSize": 28, "fontWeight": "bold", "color": "#1a1a1a", "textAlign": "center" },
    { "text": "완벽한 커버력, 하루 종일 지속되는 피니시", "x": 50, "y": 85, "fontSize": 14, "fontWeight": "normal", "color": "#666666", "textAlign": "center" }
  ]
}

CRITICAL:
- fontSize MUST be INTEGER between 12-48
- x, y MUST be INTEGER between 0-100
- Use textAlign: "center" for most cases
- Do NOT overlap texts (maintain y gap of 10+)`;

  console.log('=== Overlay Position Test ===');
  console.log('Generating image with overlay...');

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [prompt],
      config: {
        responseModalities: ['Image', 'Text'],
        imageConfig: { aspectRatio: '1:1' },
      },
    });

    console.log('finishReason:', response.candidates?.[0]?.finishReason);
    console.log('partsLength:', response.candidates?.[0]?.content?.parts?.length);

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part.inlineData?.data) {
        const filename = `test-overlay-result.png`;
        const buffer = Buffer.from(part.inlineData.data, 'base64');
        fs.writeFileSync(filename, buffer);
        console.log(`\n✅ Image saved to ${filename} (${buffer.length} bytes)`);
      } else if (part.text) {
        console.log(`\n★★★ OVERLAY JSON RESPONSE ★★★`);
        console.log(part.text);

        // Parse and validate
        try {
          let jsonStr = part.text.trim();
          const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonStr = jsonMatch[1];
          }
          const parsed = JSON.parse(jsonStr);

          console.log('\n★★★ PARSED OVERLAY DATA ★★★');
          if (parsed.texts) {
            parsed.texts.forEach((t: { text: string; x: number; y: number; fontSize: number }, idx: number) => {
              console.log(`[${idx}] "${t.text.substring(0, 30)}..." → x:${t.x}, y:${t.y}, fontSize:${t.fontSize}px`);
            });
          }
        } catch (e) {
          console.log('(JSON 파싱 실패)');
        }
      }
    }

  } catch (error: unknown) {
    const err = error as Error;
    console.error('ERROR:', err.message);
  }
}

testOverlayPosition();
