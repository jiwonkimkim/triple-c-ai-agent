/**
 * 립스틱 카테고리 전체 T2I 테스트 스크립트
 * ★★★ 프로덕션 코드와 100% 동일한 오케스트레이션 프로세스 사용 ★★★
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

// ★★★ 프로덕션 코드 직접 import ★★★
import {
  orchestrateDetailPageGeneration,
  type GenerationInput,
} from '../src/services/ai/orchestration-service';
import {
  generateSectionImageWithOverlay,
  preprocessProductImage,
  DEFAULT_IMAGE_MODEL,
} from '../src/services/image/gemini-image-generator';
import type { BeautySubCategory } from '../src/services/ai/prompts/beauty-subcategory';

// 테스트 입력 데이터 (프로덕션과 동일한 구조)
const TEST_INPUT: GenerationInput = {
  productImages: [],  // T2I 모드 (제품 이미지 없음)
  productName: '롬앤 듀이풀 워터 틴트',
  category: 'Beauty',
  subCategory: 'lip' as BeautySubCategory,
  keyFeatures: ['글로시 피니쉬', '고발색', '촉촉한 수분감', '12시간 지속력'],
  targetAudience: '20-30대 여성',
  copyLength: 'medium',
  brandContext: null,
  generateImages: true,  // 이미지 생성 활성화
};

async function testLipT2IFull() {
  // TESTGEN 내부에 타임스탬프 폴더 생성
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outputDir = path.join(process.cwd(), 'TESTGEN', `lip-test-${timestamp}`);
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('=== Full Lip T2I Test (Production Orchestration) ===');
  console.log('Product:', TEST_INPUT.productName);
  console.log('Category:', TEST_INPUT.category, '/', TEST_INPUT.subCategory);
  console.log('Model:', DEFAULT_IMAGE_MODEL);
  console.log('Output:', outputDir);
  console.log('');

  // ★★★ Step 1: 오케스트레이션 실행 (프로덕션과 동일) ★★★
  console.log('--- Step 1: Running Orchestration ---');
  const orchestrationResults = await orchestrateDetailPageGeneration(TEST_INPUT);

  if (!orchestrationResults || orchestrationResults.length === 0) {
    console.error('❌ Orchestration failed: No results');
    return;
  }

  // 첫 번째 버전 사용
  const version = orchestrationResults[0];
  console.log(`Orchestration complete: ${version.sections.length} sections generated`);
  console.log('Hook Message:', version.hookMessage?.substring(0, 100) + '...');
  console.log('');

  // 오케스트레이션 결과 저장
  const orchestrationFilename = path.join(outputDir, '_orchestration_result.json');
  fs.writeFileSync(orchestrationFilename, JSON.stringify({
    hookMessage: version.hookMessage,
    sections: version.sections.map(s => ({
      type: s.type,
      title: s.title,
      body: s.body?.substring(0, 100),
      promptCount: s.imagePrompts?.length || 0,
    })),
  }, null, 2));
  console.log('Orchestration result saved to:', orchestrationFilename);
  console.log('');

  // ★★★ Step 2: 각 섹션별 이미지 생성 (프로덕션과 동일한 배치 처리) ★★★
  console.log('--- Step 2: Generating Section Images ---');

  const allResults: { section: string; success: boolean; error?: string; fileSize?: number; hasOverlay: boolean }[] = [];

  // 섹션별 프롬프트 수집
  const sectionTasks: { sectionType: string; sectionIndex: number; prompt: any }[] = [];
  for (let i = 0; i < version.sections.length; i++) {
    const section = version.sections[i];
    const prompts = section.imagePrompts || [];
    if (prompts.length > 0) {
      sectionTasks.push({
        sectionType: section.type,
        sectionIndex: i,
        prompt: prompts[0],  // 첫 번째 프롬프트 사용
      });
    }
  }

  console.log(`Total sections to generate: ${sectionTasks.length}`);
  console.log('Batch Size: 5 (parallel)');
  console.log('');

  // ★★★ 배치 처리 (5개씩 병렬) ★★★
  const BATCH_SIZE = 5;
  const batches: typeof sectionTasks[] = [];
  for (let i = 0; i < sectionTasks.length; i += BATCH_SIZE) {
    batches.push(sectionTasks.slice(i, i + BATCH_SIZE));
  }

  console.log(`Processing in ${batches.length} batches...`);
  console.log('');

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    console.log(`--- Batch ${batchIdx + 1}/${batches.length}: [${batch.map(t => t.sectionType).join(', ')}] ---`);

    // 병렬 처리
    const batchResults = await Promise.all(
      batch.map(async (task) => {
        try {
          // ★★★ generateSectionImageWithOverlay 호출 (프로덕션과 동일) ★★★
          const result = await generateSectionImageWithOverlay(
            null,  // T2I 모드
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

          // 이미지 저장
          const filename = path.join(outputDir, `LIP_${task.sectionType}.png`);
          const buffer = Buffer.from(result.image.base64Data, 'base64');
          fs.writeFileSync(filename, buffer);
          const fileSize = Math.round(buffer.length / 1024);

          // 오버레이 텍스트 저장
          const hasOverlay = !!result.overlayText;
          if (result.overlayText) {
            const overlayFilename = path.join(outputDir, `LIP_${task.sectionType}_overlay.json`);
            fs.writeFileSync(overlayFilename, JSON.stringify({
              section: task.sectionType,
              overlayText: result.overlayText,
            }, null, 2));
          }

          // 프롬프트 저장
          const promptFilename = path.join(outputDir, `LIP_${task.sectionType}_prompt.txt`);
          fs.writeFileSync(promptFilename, task.prompt.imagePrompt || '');

          return { section: task.sectionType, success: true, fileSize, hasOverlay };

        } catch (error: unknown) {
          const err = error as Error;
          return { section: task.sectionType, success: false, error: err.message, hasOverlay: false };
        }
      })
    );

    // 결과 출력
    for (const result of batchResults) {
      if (result.success) {
        const overlayInfo = result.hasOverlay ? ' + overlay' : '';
        console.log(`✅ ${result.section}: Saved (${result.fileSize}KB${overlayInfo})`);
      } else {
        console.log(`❌ ${result.section}: ${result.error}`);
      }
      allResults.push(result);
    }

    // 배치 간 대기 (Rate Limit 방지)
    if (batchIdx < batches.length - 1) {
      console.log('   Waiting 3s before next batch...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    console.log('');
  }

  // 최종 결과 요약
  const successCount = allResults.filter(r => r.success).length;
  const failCount = allResults.filter(r => !r.success).length;
  const overlayCount = allResults.filter(r => r.hasOverlay).length;

  console.log('='.repeat(50));
  console.log('=== FINAL SUMMARY ===');
  console.log('='.repeat(50));
  console.log(`Success: ${successCount}/${sectionTasks.length}`);
  console.log(`Failed: ${failCount}/${sectionTasks.length}`);
  console.log(`With Overlay: ${overlayCount}/${successCount}`);
  console.log('');

  if (successCount > 0) {
    console.log('✅ Successful:');
    allResults.filter(r => r.success).forEach(r => {
      const overlay = r.hasOverlay ? ' ✓overlay' : '';
      console.log(`   - ${r.section} (${r.fileSize}KB${overlay})`);
    });
  }

  if (failCount > 0) {
    console.log('');
    console.log('❌ Failed:');
    allResults.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.section}: ${r.error}`);
    });
  }

  console.log('');
  console.log(`All files saved to: ${outputDir}`);
}

testLipT2IFull();
