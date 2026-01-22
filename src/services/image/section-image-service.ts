/**
 * 섹션 이미지 생성 공유 서비스
 *
 * 초기 생성, 전체 재생성, 섹션 재생성에서 동일한 프로세스를 사용합니다.
 * 이 모듈을 수정하면 모든 이미지 생성에 자동 적용됩니다.
 */

import {
  generateSectionImageWithOverlay,
  GeminiImageModel,
  DEFAULT_IMAGE_MODEL,
  ImageWithOverlayResult,
} from './gemini-image-generator';
import { uploadGeneratedImage } from './image-upload-service';
import { withRetry } from '@/lib/utils';

// ============================================
// 타입 정의
// ============================================

export interface SectionImageGenerationInput {
  /** 제품 이미지 URL (T2I 모드면 null 또는 빈 문자열) */
  productImage: string | null;
  /** 섹션 타입 */
  sectionType: string;
  /** 제품명 */
  productName: string;
  /** 카테고리 */
  category: string;
  /** 핵심 특징 */
  keyFeatures: string[];
  /** 타겟 고객 */
  targetAudience: string;
  /** 이미지 생성 모델 */
  imageModel?: GeminiImageModel;
  /** 브랜드 이미지 키워드 (additionalPrompt) */
  brandImageKeywords?: string;
  /** 이미지 프롬프트 (T2I/I2I 공통) */
  imagePrompt?: string;
  /** 블록 인덱스 (다중 이미지 생성 시) */
  blockIndex?: number;
  /** 총 블록 수 */
  totalBlocks?: number;
}

export interface SectionImageGenerationResult {
  /** 생성 성공 여부 */
  success: boolean;
  /** 업로드된 이미지 URL */
  imageUrl?: string;
  /** 오버레이 텍스트 */
  overlayText?: ImageWithOverlayResult['overlayText'];
  /** 오버레이 프롬프트 */
  overlayPrompt?: string;
  /** 이미지 생성 결과 (프롬프트 구성요소 포함) */
  imageResult?: ImageWithOverlayResult['image'];
  /** 에러 메시지 */
  error?: string;
  /** 모드 (T2I/I2I) */
  mode: 'T2I' | 'I2I';
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * T2I 모드 감지 (제품 이미지가 없거나 빈 문자열이면 T2I 모드)
 */
export function isT2IMode(productImage: string | null): boolean {
  return !productImage || productImage.length === 0;
}

/**
 * 텍스트 배경 섹션 감지
 */
export function isTextBackgroundSection(sectionType: string): boolean {
  return /^(TEXT_BANNER|KEY_MESSAGE|BENEFIT_HIGHLIGHT|DIVIDER_VISUAL)/i.test(sectionType);
}

// ============================================
// 메인 함수
// ============================================

/**
 * 섹션 이미지를 생성합니다.
 * T2I/I2I 모드를 자동으로 감지하고, 재시도 로직이 적용됩니다.
 *
 * 사용 위치:
 * - 초기 생성 (detail-page-generator.ts)
 * - 전체 재생성 (detail-page-generator.ts)
 * - 섹션 재생성 (section/route.ts)
 */
export async function generateSectionImage(
  input: SectionImageGenerationInput
): Promise<SectionImageGenerationResult> {
  const {
    productImage,
    sectionType,
    productName,
    category,
    keyFeatures,
    targetAudience,
    imageModel = DEFAULT_IMAGE_MODEL,
    brandImageKeywords,
    imagePrompt,
    blockIndex = 0,
    totalBlocks = 1,
  } = input;

  // T2I/I2I 모드 결정
  const t2iMode = isT2IMode(productImage);
  const mode = t2iMode ? 'T2I' : 'I2I';

  console.log(`[SectionImageService] Generating ${sectionType} image (${mode} mode, block ${blockIndex + 1}/${totalBlocks})...`);

  try {
    // ★★★ 통합 함수 사용: 이미지 + 오버레이 텍스트 동시 생성 (재시도 로직 적용)
    const result = await withRetry(
      () => generateSectionImageWithOverlay(
        t2iMode ? null : productImage,  // T2I: null, I2I: productImage
        sectionType,
        productName,
        category,
        keyFeatures,
        targetAudience,
        {
          additionalPrompt: brandImageKeywords,
          model: imageModel,
          // ★★★ T2I/I2I 모두 imagePrompt 사용 (통일된 인터페이스)
          imagePrompt: imagePrompt,
          blockIndex,
          totalBlocks,
        }
      ),
      3,     // 최대 3회 재시도
      1500   // 1.5초 기본 대기 (지수 백오프)
    );

    if (!result || !result.image) {
      return {
        success: false,
        error: '이미지 생성에 실패했습니다.',
        mode,
      };
    }

    // 생성된 이미지 업로드
    const uploadResult = await uploadGeneratedImage(result.image, {
      folder: 'triple-c/sections',
      sectionType,
    });

    if (!uploadResult.url) {
      return {
        success: false,
        error: '이미지 업로드에 실패했습니다.',
        mode,
      };
    }

    console.log(`[SectionImageService] ${sectionType} image generated and uploaded successfully`);

    return {
      success: true,
      imageUrl: uploadResult.url,
      overlayText: result.overlayText,
      overlayPrompt: result.overlayPrompt,
      imageResult: result.image,
      mode,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[SectionImageService] ${sectionType} image generation failed:`, errMsg);

    return {
      success: false,
      error: errMsg,
      mode,
    };
  }
}

/**
 * 여러 섹션 이미지를 생성합니다.
 * 각 이미지 생성 사이에 짧은 대기 시간을 둡니다.
 */
export async function generateMultipleSectionImages(
  inputs: SectionImageGenerationInput[],
  delayBetweenImages: number = 500
): Promise<SectionImageGenerationResult[]> {
  const results: SectionImageGenerationResult[] = [];

  for (let i = 0; i < inputs.length; i++) {
    const result = await generateSectionImage(inputs[i]);
    results.push(result);

    // 각 이미지 생성 후 짧은 대기 (rate limit 방지)
    if (i < inputs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenImages));
    }
  }

  return results;
}
