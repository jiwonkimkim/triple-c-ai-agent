/**
 * 립스틱 T2I 테스트 - 오버레이 텍스트 요청 없이
 * 오버레이 요청이 이미지 생성을 방해하는지 확인
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

import { GoogleGenAI } from '@google/genai';
import {
  orchestrateDetailPageGeneration,
  type GenerationInput,
} from '../src/services/ai/orchestration-service';
import type { BeautySubCategory } from '../src/services/ai/prompts/beauty-subcategory';

// 테스트 입력 데이터
const TEST_INPUT: GenerationInput = {
  productImages: [],
  productName: '롬앤 듀이풀 워터 틴트',
  category: 'Beauty',
  subCategory: 'lip' as BeautySubCategory,
  keyFeatures: ['글로시 피니쉬', '고발색', '촉촉한 수분감', '12시간 지속력'],
  targetAudience: '20-30대 여성',
  copyLength: 'medium',
  brandContext: null,
  generateImages: true,
};

// 섹션별 aspectRatio 결정
function getSectionAspectRatio(sectionType: string): '1:1' | '16:9' | undefined {
  const upperType = sectionType.toUpperCase();
  if (/^MAIN|THUMBNAIL/.test(upperType)) return '1:1';
  if (/TEXT_BANNER|KEY_MESSAGE|BENEFIT_HIGHLIGHT|DIVIDER_VISUAL|BRAND_HEADER/.test(upperType)) return '16:9';
  return undefined;
}

// 오버레이 요청 제거 함수
function removeOverlayRequest(prompt: string): string {
  // [★★★ OVERLAY TEXT ... ] 부분 제거
  return prompt.replace(/\[★★★ OVERLAY TEXT[\s\S]*?JSON in your text response\.\]?/gi, '')
               .replace(/\[★★★ OVERLAY TEXT[\s\S]*$/gi, '')
               .trim();
}

async function testWithoutOverlay() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_AI_API_KEY not found');
    return;
  }

  const client = new GoogleGenAI({ apiKey });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outputDir = path.join(process.cwd(), 'TESTGEN', `lip-no-overlay-${timestamp}`);
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('=== Lip T2I Test WITHOUT Overlay Request ===');
  console.log('Product:', TEST_INPUT.productName);
  console.log('Output:', outputDir);
  console.log('');

  // Step 1: 오케스트레이션 실행
  console.log('--- Step 1: Running Orchestration ---');
  const orchestrationResults = await orchestrateDetailPageGeneration(TEST_INPUT);
  const version = orchestrationResults[0];
  console.log(`Orchestration complete: ${version.sections.length} sections`);
  console.log('');

  // 섹션별 프롬프트 수집
  const sectionTasks: { sectionType: string; prompt: string }[] = [];
  for (const section of version.sections) {
    const prompts = section.imagePrompts || [];
    if (prompts.length > 0 && prompts[0].imagePrompt) {
      // ★★★ 오버레이 요청 제거 ★★★
      const cleanPrompt = removeOverlayRequest(prompts[0].imagePrompt);
      sectionTasks.push({
        sectionType: section.type,
        prompt: cleanPrompt,
      });
    }
  }

  console.log(`--- Step 2: Generating ${sectionTasks.length} Images (NO OVERLAY) ---`);
  console.log('');

  // 배치 처리 (5개씩)
  const BATCH_SIZE = 5;
  const allResults: { section: string; success: boolean; error?: string; fileSize?: number }[] = [];

  for (let i = 0; i < sectionTasks.length; i += BATCH_SIZE) {
    const batch = sectionTasks.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(sectionTasks.length / BATCH_SIZE);

    console.log(`--- Batch ${batchNum}/${totalBatches}: [${batch.map(t => t.sectionType).join(', ')}] ---`);

    const batchResults = await Promise.all(
      batch.map(async (task) => {
        const aspectRatio = getSectionAspectRatio(task.sectionType);

        try {
          // ★★★ 오버레이 없이 직접 API 호출 ★★★
          const response = await client.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: [task.prompt],
            config: {
              responseModalities: ['Image', 'Text'],
              ...(aspectRatio && {
                imageConfig: { aspectRatio },
              }),
            },
          });

          const parts = response.candidates?.[0]?.content?.parts || [];

          for (const part of parts) {
            if (part.inlineData?.data) {
              const filename = path.join(outputDir, `LIP_${task.sectionType}.png`);
              const buffer = Buffer.from(part.inlineData.data, 'base64');
              fs.writeFileSync(filename, buffer);
              return { section: task.sectionType, success: true, fileSize: Math.round(buffer.length / 1024) };
            }
          }

          return { section: task.sectionType, success: false, error: 'No image in response' };
        } catch (error: unknown) {
          return { section: task.sectionType, success: false, error: (error as Error).message };
        }
      })
    );

    for (const result of batchResults) {
      if (result.success) {
        console.log(`✅ ${result.section}: Saved (${result.fileSize}KB)`);
      } else {
        console.log(`❌ ${result.section}: ${result.error}`);
      }
      allResults.push(result);
    }

    if (i + BATCH_SIZE < sectionTasks.length) {
      console.log('   Waiting 3s...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    console.log('');
  }

  // 최종 결과
  const successCount = allResults.filter(r => r.success).length;
  const failCount = allResults.filter(r => !r.success).length;

  console.log('='.repeat(50));
  console.log('=== FINAL SUMMARY (NO OVERLAY REQUEST) ===');
  console.log('='.repeat(50));
  console.log(`Success: ${successCount}/${sectionTasks.length}`);
  console.log(`Failed: ${failCount}/${sectionTasks.length}`);
  console.log('');
  console.log(`Images saved to: ${outputDir}`);
}

testWithoutOverlay();
