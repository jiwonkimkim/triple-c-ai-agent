/**
 * 한→영 번역기
 * SD/Flux 프롬프트용 제품명 번역
 * 지원: Ollama (무료), Gemini (API)
 */

import { GoogleGenAI } from '@google/genai';

// ============================================
// 타입 정의
// ============================================

export type TranslatorType = 'ollama' | 'gemini';

interface TranslationResult {
  original: string;
  translated: string;
  cached: boolean;
  translator: TranslatorType;
}

// ============================================
// 설정
// ============================================

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3:8b';

// 기본 번역기 설정 (환경변수 또는 기본값)
let currentTranslator: TranslatorType =
  (process.env.TRANSLATOR_TYPE as TranslatorType) || 'ollama';

// ============================================
// 캐시 (메모리)
// ============================================

const translationCache = new Map<string, string>();

// ============================================
// 번역기 설정
// ============================================

/**
 * 번역기 변경
 */
export function setTranslator(type: TranslatorType): void {
  currentTranslator = type;
  console.log(`[Translator] Switched to: ${type}`);
}

/**
 * 현재 번역기 확인
 */
export function getTranslator(): TranslatorType {
  return currentTranslator;
}

// ============================================
// Gemini 클라이언트
// ============================================

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GOOGLE_AI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GOOGLE_AI_API_KEY,
    });
  }
  return geminiClient;
}

// ============================================
// 번역 함수들
// ============================================

/**
 * Ollama로 한국어 → 영어 번역 (무료/로컬)
 */
async function translateWithOllama(text: string): Promise<string> {
  const prompt = `Translate Korean to English. Output ONLY the translation, no explanation.
Korean: ${text}
English:`;

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 100,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    const translated = data.response?.trim() || text;

    return translated.replace(/^["']|["']$/g, '').trim();
  } catch (error) {
    console.error('[Translator] Ollama error:', error);
    return text;
  }
}

/**
 * Gemini로 한국어 → 영어 번역 (API/빠름)
 */
async function translateWithGemini(text: string): Promise<string> {
  const client = getGeminiClient();
  if (!client) {
    console.warn('[Translator] Gemini API key not set, falling back to Ollama');
    return translateWithOllama(text);
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Translate this Korean text to English. Output ONLY the translation, nothing else.

Korean: ${text}
English:`,
    });

    const translated = response.text?.trim() || text;
    return translated.replace(/^["']|["']$/g, '').trim();
  } catch (error) {
    console.error('[Translator] Gemini error:', error);
    // Gemini 실패 시 Ollama로 폴백
    console.log('[Translator] Falling back to Ollama');
    return translateWithOllama(text);
  }
}

// ============================================
// 메인 번역 함수
// ============================================

/**
 * 제품명 번역 (캐시 지원, 번역기 선택 가능)
 */
export async function translateProductName(
  koreanText: string,
  translator?: TranslatorType
): Promise<TranslationResult> {
  const useTranslator = translator || currentTranslator;

  // 빈 문자열 체크
  if (!koreanText || koreanText.trim() === '') {
    return { original: koreanText, translated: '', cached: false, translator: useTranslator };
  }

  // 이미 영어인지 체크 (한글 없으면 그대로 반환)
  const hasKorean = /[가-힣]/.test(koreanText);
  if (!hasKorean) {
    return { original: koreanText, translated: koreanText, cached: false, translator: useTranslator };
  }

  // 캐시 확인
  const cached = translationCache.get(koreanText);
  if (cached) {
    return { original: koreanText, translated: cached, cached: true, translator: useTranslator };
  }

  // 선택된 번역기로 번역
  const translated = useTranslator === 'gemini'
    ? await translateWithGemini(koreanText)
    : await translateWithOllama(koreanText);

  // 캐시 저장
  translationCache.set(koreanText, translated);

  console.log(`[Translator] ${useTranslator}: "${koreanText}" → "${translated}"`);

  return { original: koreanText, translated, cached: false, translator: useTranslator };
}

/**
 * 여러 텍스트 일괄 번역
 */
export async function translateBatch(texts: string[]): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  for (const text of texts) {
    const result = await translateProductName(text);
    results.set(text, result.translated);
  }

  return results;
}

/**
 * 캐시 초기화
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}

/**
 * Ollama 서버 상태 확인
 */
export async function checkOllamaStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
}
