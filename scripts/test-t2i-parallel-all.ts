/**
 * 립스틱 T2I 테스트 - 전체 병렬처리 (배치 없이)
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

import {
  orchestrateDetailPageGeneration,
  type GenerationInput,
} from '../src/services/ai/orchestration-service';
import {
  generateSectionImageWithOverlay,
  DEFAULT_IMAGE_MODEL,
} from '../src/services/image/gemini-image-generator';
import type { BeautySubCategory } from '../src/services/ai/prompts/beauty-subcategory';

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

async function testParallelAll() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outputDir = path.join(process.cwd(), 'TESTGEN', `lip-parallel-all-${timestamp}`);
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('=== Full Parallel T2I Test (NO BATCH) ===');
  console.log('Product:', TEST_INPUT.productName);
  console.log('Output:', outputDir);
  console.log('');

  // Step 1: 오케스트레이션
  console.log('--- Step 1: Orchestration ---');
  const orchestrationResults = await orchestrateDetailPageGeneration(TEST_INPUT);
  const version = orchestrationResults[0];
  console.log(`Sections: ${version.sections.length}`);
  console.log('');

  // 섹션별 태스크 수집
  const sectionTasks: { sectionType: string; sectionIndex: number; prompt: any }[] = [];
  for (let i = 0; i < version.sections.length; i++) {
    const section = version.sections[i];
    const prompts = section.imagePrompts || [];
    if (prompts.length > 0) {
      sectionTasks.push({
        sectionType: section.type,
        sectionIndex: i,
        prompt: prompts[0],
      });
    }
  }

  console.log(`--- Step 2: Generating ${sectionTasks.length} Images (ALL PARALLEL) ---`);
  console.log('');

  const startTime = Date.now();

  // ★★★ 전체 병렬처리 (배치 없음) ★★★
  const allResults = await Promise.all(
    sectionTasks.map(async (task) => {
      try {
        const result = await generateSectionImageWithOverlay(
          null,
          task.sectionType,
          TEST_INPUT.productName,
          TEST_INPUT.category,
          TEST_INPUT.keyFeatures,
          TEST_INPUT.targetAudience,
          {
            model: DEFAULT_IMAGE_MODEL,
            scenarioPrompt: task.prompt.imagePrompt,
            blockIndex: task.sectionIndex,
            totalBlocks: sectionTasks.length,
          }
        );

        if (!result || !result.image || !result.image.base64Data) {
          return { section: task.sectionType, success: false, error: 'No image generated', hasOverlay: false };
        }

        const filename = path.join(outputDir, `LIP_${task.sectionType}.png`);
        const buffer = Buffer.from(result.image.base64Data, 'base64');
        fs.writeFileSync(filename, buffer);

        const hasOverlay = !!result.overlayText;
        if (result.overlayText) {
          fs.writeFileSync(
            path.join(outputDir, `LIP_${task.sectionType}_overlay.json`),
            JSON.stringify({ section: task.sectionType, overlayText: result.overlayText }, null, 2)
          );
        }

        return { section: task.sectionType, success: true, fileSize: Math.round(buffer.length / 1024), hasOverlay };
      } catch (error: unknown) {
        return { section: task.sectionType, success: false, error: (error as Error).message, hasOverlay: false };
      }
    })
  );

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // 결과 출력
  for (const result of allResults) {
    if (result.success) {
      const overlay = result.hasOverlay ? ' + overlay' : '';
      console.log(`✅ ${result.section}: ${result.fileSize}KB${overlay}`);
    } else {
      console.log(`❌ ${result.section}: ${result.error}`);
    }
  }

  const successCount = allResults.filter(r => r.success).length;
  const failCount = allResults.filter(r => !r.success).length;
  const overlayCount = allResults.filter(r => r.hasOverlay).length;

  console.log('');
  console.log('='.repeat(50));
  console.log('=== FINAL SUMMARY (ALL PARALLEL) ===');
  console.log('='.repeat(50));
  console.log(`Success: ${successCount}/${sectionTasks.length}`);
  console.log(`Failed: ${failCount}/${sectionTasks.length}`);
  console.log(`With Overlay: ${overlayCount}/${successCount}`);
  console.log(`Total Time: ${elapsed}s`);
  console.log('');
  console.log(`Images saved to: ${outputDir}`);
}

testParallelAll();
