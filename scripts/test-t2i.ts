import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

async function testT2I() {
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
- Magazine editorial meets e-commerce quality
- Soft gradient background complementing product colors

[CREATIVE COMPOSITION]
Design a visually striking thumbnail featuring ${productName}.
- Product as HERO (50-60% of frame), sharp focus, eye-catching
- Product placement: CENTER or slightly UPPER-CENTER
- Decorative objects (15-20%): fresh pink roses, scattered rose petals
- Atmospheric elements (10-15%): soft morning light, gentle sparkles
- Create depth with layered composition (foreground → product → background)
- Leave CLEAN SPACE at top (20%) for text overlay (slogan area)

[STYLING DIRECTION]
Target aesthetic: Premium universal appeal
Highlight product quality
Korean beauty trend: 글로우, 투명감, 프리미엄

[TECHNICAL REQUIREMENTS]
- Soft, diffused studio lighting with gentle rim light
- Shallow depth of field, soft bokeh background
- Rich, vibrant colors with professional color grading
- Premium commercial photography that triggers purchase desire
- 8K resolution, photorealistic, no text in image`;

  console.log('=== MAIN Section Test ===');
  console.log('Generating image...');

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
        const filename = `test-t2i-result-${i}.png`;
        const buffer = Buffer.from(part.inlineData.data, 'base64');
        fs.writeFileSync(filename, buffer);
        console.log(`Part ${i}: Image saved to ${filename} (${buffer.length} bytes)`);
      } else if (part.text) {
        console.log(`Part ${i}: Text response: ${part.text.substring(0, 200)}...`);
      }
    }

  } catch (error: unknown) {
    const err = error as Error;
    console.error('ERROR:', err.message);
  }
}

testT2I();
