/**
 * ★ Gemini 유틸리티 모듈
 * - 원본: gemini-image-generator.ts에서 분리
 * - 클라이언트 관리, base64 변환, 재료/무드 랜덤 선택 등
 */

import { GoogleGenAI } from '@google/genai';

// ============================================
// ★ Gemini 클라이언트 싱글턴
// ============================================

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    if (!process.env.GOOGLE_AI_API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY is not set');
    }

    geminiClient = new GoogleGenAI({
      apiKey: process.env.GOOGLE_AI_API_KEY,
    });
  }

  return geminiClient;
}

// ============================================
// ★ Base64 / Data URL 유틸리티
// ============================================

/** Convert base64 image to data URL */
export function base64ToDataUrl(base64Data: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64Data}`;
}

/** Check if Gemini API is configured */
export function isGeminiConfigured(): boolean {
  return !!process.env.GOOGLE_AI_API_KEY;
}

/**
 * URL을 base64 data URL로 변환
 * - 이미 data URL이면 그대로 반환
 * - 상대 경로(/uploads/...)면 서버에서 fetch하여 base64로 변환
 * - 외부 URL이면 fetch하여 base64로 변환
 */
export async function urlToBase64DataUrl(imageUrl: string): Promise<string> {
  // 이미 data URL인 경우 그대로 반환
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  try {
    let fetchUrl = imageUrl;

    // 상대 경로인 경우 절대 경로로 변환
    if (imageUrl.startsWith('/')) {
      // Docker 내부에서는 항상 localhost:3000 사용
      fetchUrl = `http://localhost:3000${imageUrl}`;
    }
    // localhost:3002 (외부 포트) → localhost:3000 (내부 포트) 변환
    else if (imageUrl.includes('localhost:3002')) {
      fetchUrl = imageUrl.replace('localhost:3002', 'localhost:3000');
    }

    console.log(`[Image Utils] Fetching image from: ${fetchUrl}`);

    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    // Content-Type 가져오기
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    const dataUrl = `data:${contentType};base64,${base64}`;
    console.log(`[Image Utils] Converted to base64 (${Math.round(base64.length / 1024)}KB)`);

    return dataUrl;
  } catch (error) {
    console.error('[Image Utils] Failed to convert URL to base64:', error);
    throw error;
  }
}

/**
 * URL, data URL, 또는 순수 base64에서 base64 데이터 추출
 * - HTTP/HTTPS URL: fetch하여 base64 변환
 * - data URL: 파싱하여 base64 추출
 * - 순수 base64: 그대로 반환
 */
export async function extractBase64FromSource(source: string): Promise<{ base64: string; mimeType: string }> {
  // HTTP/HTTPS URL인 경우 fetch하여 base64로 변환
  if (source.startsWith('http://') || source.startsWith('https://')) {
    console.log('[Gemini] Fetching image from URL for base64 conversion...');
    try {
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      // MIME 타입 결정 (확장자 기반 fallback)
      let mimeType = contentType.split(';')[0].trim();
      if (!mimeType.startsWith('image/')) {
        // URL 확장자로 추측
        if (source.endsWith('.webp')) mimeType = 'image/webp';
        else if (source.endsWith('.png')) mimeType = 'image/png';
        else if (source.endsWith('.gif')) mimeType = 'image/gif';
        else mimeType = 'image/jpeg';
      }

      console.log(`[Gemini] Image fetched: ${(arrayBuffer.byteLength / 1024).toFixed(1)}KB, ${mimeType}`);
      return { base64, mimeType };
    } catch (error) {
      console.error('[Gemini] Failed to fetch image from URL:', error);
      throw new Error(`Failed to fetch image from URL: ${source}`);
    }
  }

  // data URL 형식인 경우 파싱
  if (source.startsWith('data:')) {
    const matches = source.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      return { base64: matches[2], mimeType: matches[1] };
    }
    throw new Error('Invalid data URL format');
  }

  // 순수 base64인 경우 그대로 반환
  return { base64: source, mimeType: 'image/jpeg' };
}

/**
 * URL 또는 data URL에서 base64 데이터 추출 (동기 버전 - 레거시 호환)
 * @deprecated extractBase64FromSource 사용 권장
 */
export function extractBase64FromDataUrl(dataUrl: string): { base64: string; mimeType: string } {
  // HTTP URL은 동기 함수에서 처리 불가 - 에러 발생시킴
  if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
    throw new Error('HTTP URLs must be processed with extractBase64FromSource (async)');
  }

  // 이미 순수 base64인 경우
  if (!dataUrl.startsWith('data:')) {
    return { base64: dataUrl, mimeType: 'image/jpeg' };
  }

  // data:image/jpeg;base64,... 형식 파싱
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (matches) {
    return { base64: matches[2], mimeType: matches[1] };
  }

  throw new Error('Invalid data URL format');
}

// ============================================
// ★ 재료/무드 랜덤 선택 유틸리티
// ============================================

/** 매번 다른 분위기 오브제 조합을 선택하는 헬퍼 함수 */
export function selectRandomMoodObjects(): { selected: string[]; style: string } {
  const moodCategories = [
    { style: 'Romantic/Feminine', objects: ['soft silk fabric draped elegantly', 'dried flower petals', 'satin ribbon curls', 'delicate lace edge'] },
    { style: 'Fresh/Natural', objects: ['crystal water droplets', 'fresh green leaves', 'morning dew on petals', 'bamboo elements'] },
    { style: 'Luxurious/Premium', objects: ['velvet texture backdrop', 'crystal prism accents', 'gold metallic accents', 'pearl scattered'] },
    { style: 'Clean/Minimal', objects: ['smooth white pebbles', 'geometric marble shapes', 'frosted glass elements', 'simple ceramic'] },
    { style: 'Warm/Cozy', objects: ['cream cashmere fabric', 'natural wood slice', 'warm-toned dried flowers', 'cork elements'] },
    { style: 'Cool/Refreshing', objects: ['ice cube accents', 'water splash frozen', 'mint leaves', 'blue-tinted glass'] },
  ];

  // 랜덤하게 무드 카테고리 선택
  const randomIndex = Math.floor(Math.random() * moodCategories.length);
  const selectedMood = moodCategories[randomIndex];

  // 해당 카테고리에서 1-2개 랜덤 선택
  const shuffled = [...selectedMood.objects].sort(() => Math.random() - 0.5);
  const count = 1 + Math.floor(Math.random() * 2); // 1-2개

  return {
    selected: shuffled.slice(0, count),
    style: selectedMood.style
  };
}

/** 제품명에서 재료 키워드 추출 및 구체적 오브제 반환 */
export function extractIngredientObjects(productName: string, category: string): string[] {
  const lowerName = productName.toLowerCase();
  const ingredients: string[] = [];

  // 제품명에서 키워드 매칭
  if (lowerName.includes('로즈') || lowerName.includes('rose') || lowerName.includes('장미')) {
    ingredients.push('fresh pink roses', 'scattered rose petals');
  }
  if (lowerName.includes('베리') || lowerName.includes('berry')) {
    const berries = ['fresh strawberries', 'ripe raspberries', 'blueberries with water droplets'];
    ingredients.push(berries[Math.floor(Math.random() * berries.length)]);
  }
  if (lowerName.includes('허니') || lowerName.includes('honey') || lowerName.includes('꿀')) {
    ingredients.push('golden honey drip', 'honeycomb piece');
  }
  if (lowerName.includes('그린티') || lowerName.includes('녹차') || lowerName.includes('green tea')) {
    ingredients.push('fresh green tea leaves', 'matcha powder dusting');
  }
  if (lowerName.includes('시트러스') || lowerName.includes('citrus') || lowerName.includes('레몬') || lowerName.includes('오렌지')) {
    ingredients.push('citrus fruit slices with water droplets');
  }
  if (lowerName.includes('라벤더') || lowerName.includes('lavender')) {
    ingredients.push('lavender sprigs', 'dried lavender buds');
  }
  if (lowerName.includes('민트') || lowerName.includes('mint')) {
    ingredients.push('fresh mint leaves');
  }
  if (lowerName.includes('코코넛') || lowerName.includes('coconut')) {
    ingredients.push('coconut pieces', 'coconut flakes');
  }
  if (lowerName.includes('아보카도') || lowerName.includes('avocado')) {
    ingredients.push('creamy avocado slices');
  }
  if (lowerName.includes('알로에') || lowerName.includes('aloe')) {
    ingredients.push('aloe vera gel texture', 'aloe leaves');
  }
  if (lowerName.includes('진주') || lowerName.includes('pearl')) {
    ingredients.push('pearl beads scattered elegantly');
  }
  if (lowerName.includes('골드') || lowerName.includes('gold')) {
    ingredients.push('gold leaf accents', 'gold flakes');
  }
  if (lowerName.includes('히알루론') || lowerName.includes('hyaluronic') || lowerName.includes('수분')) {
    ingredients.push('water droplets', 'hydrating gel texture');
  }
  if (lowerName.includes('비타민') || lowerName.includes('vitamin') || lowerName.includes('c')) {
    ingredients.push('fresh orange slices', 'vitamin capsules');
  }
  if (lowerName.includes('콜라겐') || lowerName.includes('collagen')) {
    ingredients.push('gel texture swirls', 'protein molecule visualization');
  }

  // 매칭되는 키워드 없으면 카테고리 기반 기본 오브제
  if (ingredients.length === 0) {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('립') || categoryLower.includes('lip')) {
      ingredients.push('fresh flower petals', 'glossy texture elements');
    } else if (categoryLower.includes('스킨') || categoryLower.includes('skin')) {
      ingredients.push('water droplets', 'fresh botanical leaves');
    } else if (categoryLower.includes('헤어') || categoryLower.includes('hair')) {
      ingredients.push('silk strands', 'natural oil droplets');
    } else {
      ingredients.push('elegant botanical elements', 'natural texture accents');
    }
  }

  // 최대 2개만 반환 (랜덤 셔플)
  return ingredients.sort(() => Math.random() - 0.5).slice(0, 2);
}
