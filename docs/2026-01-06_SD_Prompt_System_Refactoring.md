# 2026-01-06 SD 프롬프트 시스템 리팩토링

## 개요

SD 3.5 / Flux 모델 전용 프롬프트 시스템 구축 및 기존 Gemini 프롬프트 시스템과의 분리 작업 기록입니다.

---

## 1. 배경 및 문제점

### 1.1 기존 시스템 흐름

```
[사용자 입력 (한글)]
        ↓
[orchestrateDetailPageGeneration()]
        ↓
[generateSectionImagePrompt()] ← Gemini 2.5 Flash가 프롬프트 생성
        ↓
[생성된 영어 프롬프트]
        ↓
[generateSectionImageWithGemini()]
        ↓
[isSDModel() 체크]
    ├── true → ComfyUI로 전달 (SD/Flux)
    └── false → Gemini API로 전달
```

### 1.2 발견된 문제점

| 문제 | 상세 |
|------|------|
| **템플릿 미사용** | `section-templates.ts` (2,618줄)의 상세 프롬프트가 "참조"로만 전달되고 Gemini가 새로 생성 |
| **Gemini 의존성** | 프롬프트 품질이 Gemini 해석에 완전 의존 |
| **SD 최적화 없음** | 프롬프트가 Gemini Imagen용으로 설계됨 (SD 3.5 특성 미반영) |
| **네거티브 프롬프트** | SD는 별도 네거티브 프롬프트 지원하지만 positive에 섞여있었음 |
| **사람 이미지 생성** | 제품 대신 사람 이미지가 생성되는 문제 발생 |

### 1.3 SD 3.5 vs Gemini Imagen 특성 비교

| 특성 | Gemini Imagen | SD 3.5 |
|------|---------------|--------|
| **프롬프트 이해력** | 자연어 잘 이해 | 키워드 기반 선호 |
| **긴 프롬프트** | 잘 처리 | 앞부분에 집중 |
| **네거티브 프롬프트** | 지원 안 함 | 별도 파라미터 지원 |
| **한글 이해** | 이해 가능 | 거의 못 알아들음 |

---

## 2. 해결 방안: SD 전용 프롬프트 시스템

### 2.1 설계 원칙

1. **기존 Gemini 시스템 유지**: Gemini 모델 선택 시 기존 로직 그대로 사용
2. **SD 전용 경로 추가**: SD/Flux 모델 선택 시 별도 프롬프트 시스템 사용
3. **키워드 우선 구조**: SD가 잘 이해하는 키워드 기반 프롬프트
4. **네거티브 프롬프트 분리**: 별도 파라미터로 전달

### 2.2 새 폴더 구조 (레지스트리/플러그인 패턴)

```
src/lib/services/comfyui/
├── index.ts                    # export hub
├── comfyui-service.ts          # 기존 ComfyUI API 통신 (이동됨)
│
└── prompts/                    # 프롬프트 시스템
    ├── index.ts                # prompts export (모델 자동 등록)
    ├── types.ts                # 공통 인터페이스 (ModelConfig, PromptInput, PromptOutput 등)
    ├── base-templates.ts       # 모델 공통 템플릿 (섹션별 구도, 카테고리 태그)
    ├── registry.ts             # 모델 레지스트리 (registerModel, getModelBuilder, buildPrompt)
    │
    └── models/                 # 모델별 구현
        ├── index.ts            # models export
        │
        ├── sd35/               # SD 3.5 전용
        │   ├── index.ts        # sd35 export
        │   ├── config.ts       # SD 3.5 설정 (steps, cfg, sampler 등)
        │   ├── negative.ts     # 네거티브 프롬프트 빌더
        │   └── builder.ts      # SD 3.5 프롬프트 빌더 (키워드 기반)
        │
        └── flux/               # Flux Schnell 전용
            ├── index.ts        # flux export
            ├── config.ts       # Flux 설정 (cfg=1, 네거티브 미지원)
            └── builder.ts      # Flux 프롬프트 빌더 (자연어 기반)
```

### 2.3 레지스트리 패턴

새 모델 추가 시 3단계로 확장 가능:
1. `models/새모델/` 폴더에 config.ts, builder.ts 생성
2. `ModelPromptBuilder` 인터페이스 구현
3. `prompts/index.ts`에서 `registerModel()` 호출

---

## 3. 파일별 상세 설명

### 3.1 templates.ts - 섹션별 SD 프롬프트 템플릿

**경로**: `/src/lib/services/comfyui/prompts/sd35/templates.ts`

```typescript
// 섹션 타입 정의
export type SectionType = 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ';

// 섹션 템플릿 구조
export interface SD35SectionTemplate {
  coreKeywords: string[];      // 핵심 키워드 (프롬프트 앞에 배치)
  composition: string;         // 구도 지시
  background: string;          // 배경 스타일
  lighting: string;            // 라이팅
  style: string;               // 추가 스타일
  reserveTextSpace: boolean;   // 텍스트 오버레이 영역 확보
  textSpacePosition?: string;  // 텍스트 영역 위치
}

// 예시: MAIN 섹션 (메인 썸네일)
MAIN: {
  coreKeywords: ['{product}', 'product photography', 'hero shot', 'centered composition'],
  composition: 'product centered in frame, 50-60% of image...',
  background: '{background} gradient background...',
  lighting: 'soft studio lighting...',
  style: 'commercial photography, e-commerce style, Korean beauty aesthetic...',
  reserveTextSpace: true,
  textSpacePosition: 'top-bottom',
}
```

**포함 내용**:
- `SD35_SECTION_TEMPLATES`: 6개 섹션별 템플릿
- `SD35_QUALITY_TAGS`: 품질 태그 (masterpiece, 8K, sharp focus 등)
- `CATEGORY_STYLE_TAGS`: 카테고리별 스타일 태그 (beauty, skincare, makeup, lip)
- `BACKGROUND_STYLES`: 배경 스타일 옵션

---

### 3.2 negative.ts - 네거티브 프롬프트

**경로**: `/src/lib/services/comfyui/prompts/sd35/negative.ts`

```typescript
// 네거티브 프롬프트 카테고리
export const SD35_NEGATIVE_PROMPTS = {
  text: ['text', 'typography', 'letters', 'watermark', 'logo'...],
  quality: ['blurry', 'low quality', 'pixelated', 'artifacts'...],
  noHuman: ['person', 'human', 'face', 'hand', 'body', 'model'...],
  cleanBackground: ['cluttered', 'busy background', 'messy'...],
  style: ['amateur', 'cartoon', 'anime', 'illustration'...],
};

// 네거티브 프롬프트 빌드 함수
export function buildSD35NegativePrompt(options: {
  excludeHuman?: boolean;    // 사람 제외 (기본: true)
  cleanBackground?: boolean; // 깨끗한 배경 (기본: true)
  additional?: string[];     // 추가 키워드
}): string;
```

---

### 3.3 builder.ts - 프롬프트 조합

**경로**: `/src/lib/services/comfyui/prompts/sd35/builder.ts`

```typescript
// 프롬프트 빌드 입력
export interface SD35PromptInput {
  sectionType: SectionType;
  productName: string;
  category: string;
  background?: string;
  additionalKeywords?: string[];
  includeHuman?: boolean;
  keyFeatures?: string[];
}

// 프롬프트 빌드 출력
export interface SD35PromptOutput {
  positive: string;   // SD에 전달할 프롬프트
  negative: string;   // 네거티브 프롬프트
}

// 메인 빌드 함수
export function buildSD35Prompt(input: SD35PromptInput): SD35PromptOutput;

// MAIN 섹션 전용 (재료 오브제 자동 추출)
export function buildSD35MainPrompt(
  productName: string,
  category: string,
  background?: string,
  keyFeatures?: string[]
): SD35PromptOutput;
```

**프롬프트 구조**:
```
[품질 태그] + [제품 + 핵심 키워드] + [카테고리 태그] + [구도] + [배경] + [라이팅] + [스타일]
```

**재료 키워드 자동 추출** (제품명 분석):
- "로즈" → "rose petals"
- "베리" → "fresh berries"
- "허니" → "honey drip"
- "녹차" → "green tea leaves"

---

### 3.4 comfyui-service.ts - ComfyUI API 통신

**경로**: `/src/lib/services/comfyui/comfyui-service.ts`

**변경 없음** - 기존 위치에서 이동만 됨

```typescript
export class ComfyUIService {
  async isAvailable(): Promise<boolean>;
  async getQueueStatus(): Promise<{ running: number; pending: number }>;
  async generate(options: GenerateOptions): Promise<ComfyUIGenerateResult>;
  async getImage(filename: string): Promise<string>;
}
```

---

### 3.5 gemini-image-generator.ts 수정사항

**경로**: `/src/services/image/gemini-image-generator.ts`

**주요 변경**:

1. **import 추가**:
```typescript
import {
  getComfyUIService,
  ModelType,
  buildSD35Prompt,
  buildSD35MainPrompt,
  type SectionType as SD35SectionType,
} from '@/lib/services/comfyui';
```

2. **generateImageWithComfyUI 함수 수정**:
```typescript
async function generateImageWithComfyUI(
  prompt: string,
  model: 'sd35-medium' | 'flux-schnell',
  aspectRatio?: ImageAspectRatio,
  negativePrompt?: string  // 추가됨
): Promise<GeminiGeneratedImage[]>
```

3. **generateSectionImageWithGemini 함수 수정**:
```typescript
export async function generateSectionImageWithGemini(...) {
  // SD 모델: 전용 프롬프트 시스템 사용
  if (isSDModel(model)) {
    const sdPrompt = sectionType === 'MAIN'
      ? buildSD35MainPrompt(productName, category, 'neutral', keyFeatures)
      : buildSD35Prompt({ sectionType, productName, category, ... });

    return generateImageWithComfyUI(
      sdPrompt.positive,
      model,
      aspectRatio,
      sdPrompt.negative
    );
  }

  // Gemini 모델: 기존 로직 유지
  // ...
}
```

---

## 4. 기존 프롬프트 시스템 (Gemini용)

### 4.1 orchestration-service.ts

**경로**: `/src/services/ai/orchestration-service.ts`

Gemini를 사용해 프롬프트를 생성하는 메인 로직:
- `generateSectionImagePrompt()`: 섹션별 이미지 프롬프트 생성
- `regenerateSectionImagePrompt()`: 프롬프트 재생성
- `buildFallbackImagePrompt()`: AI 실패 시 폴백 프롬프트

### 4.2 section-templates.ts (기존)

**경로**: `/src/services/ai/prompts/section-templates.ts`

Gemini 참조용 상세 템플릿 (2,618줄):
- `SECTION_TEMPLATES`: 16개 확장 섹션 타입 템플릿
- `getSectionTemplate()`: 템플릿 조회
- `buildSectionTemplatePrompt()`: 플레이스홀더 치환
- `getCategorySpecificPrompt()`: 카테고리별 특화 프롬프트

---

## 5. 미해결 이슈

### 5.1 한글 입력 처리

**문제**: 사용자가 한글로 입력 → SD는 한글 이해 못함

**논의된 해결 방안**:

| 방안 | 설명 | 비용 |
|------|------|------|
| Gemini 번역 | 한글 → 영어 번역 후 SD에 전달 | API 비용 발생 |
| Ollama 로컬 LLM | 로컬에서 무료 번역 | 무료, 추가 설치 필요 |
| 키워드 사전 매핑 | 미리 정의된 한→영 사전 | 무료, 제한적 |
| 카테고리만 번역 | 제품명 무시, 카테고리만 영어로 | 무료, 간단 |

**참고**: SD는 특정 제품을 재현할 수 없음 (text2img 한계)
- "로즈 글로우 립틴트" → SD가 이해 못함
- "lip tint" → SD가 일반적인 립틴트 생성

### 5.2 Flux 다운로드

**상태**: ✅ 다운로드 완료 (2026-01-06 13:32)

#### 다운로드 시도 기록

| 시도 | 방법 | 결과 |
|------|------|------|
| 1차 | `huggingface_hub` Python | 96%에서 멈춤 (22GB/23GB) |
| 2차 | 프로세스 강제 종료 후 재시작 | 동일하게 96%에서 멈춤 |
| 3차 | `curl -C -` 이어받기 | 13MB 파일 다운로드 (리다이렉트/오류 페이지) |

#### 수동 다운로드 정보

```
다운로드 URL:
https://huggingface.co/black-forest-labs/FLUX.1-schnell/resolve/main/flux1-schnell.safetensors

저장 위치:
/Users/admin/Desktop/ComfyUI/models/unet/flux1-schnell.safetensors

파일 크기: 약 23GB (23,797,939,424 bytes)
```

**권장 다운로드 방법**:
1. Hugging Face 웹사이트 직접 접속
2. 로그인 후 다운로드 (대용량 파일 인증 필요할 수 있음)
3. 브라우저에서 직접 다운로드

**참고**: CLI 도구(curl, wget, huggingface_hub)로 다운로드 시 리다이렉트 문제 발생 가능

---

## 6. 모델별 설정 정보

### 6.1 SD 3.5 Medium

```typescript
{
  model: 'sd35-medium',
  checkpoint: 'sd3.5_medium.safetensors',
  steps: 20,
  cfg: 4.5,
  sampler: 'euler',
  scheduler: 'normal',
  생성시간: '약 4-5분/이미지'
}
```

### 6.2 Flux Schnell

```typescript
{
  model: 'flux-schnell',
  unet: 'flux1-schnell.safetensors',
  steps: 4,
  cfg: 1,
  sampler: 'euler',
  scheduler: 'simple',
  생성시간: '약 30초/이미지'
}
```

---

## 7. 파일 경로 요약

### 7.1 새로 생성된 파일

#### 공통 파일
| 파일 | 경로 | 설명 |
|------|------|------|
| 타입 정의 | `/src/lib/services/comfyui/prompts/types.ts` | ModelConfig, PromptInput, PromptOutput 인터페이스 |
| 베이스 템플릿 | `/src/lib/services/comfyui/prompts/base-templates.ts` | 섹션별 공통 구도, 카테고리 태그 |
| 레지스트리 | `/src/lib/services/comfyui/prompts/registry.ts` | registerModel, getModelBuilder, buildPrompt, buildPromptAsync |
| **번역기** | `/src/lib/services/comfyui/prompts/translator.ts` | Ollama 기반 한→영 번역 (Qwen3:8b) |
| Prompts 인덱스 | `/src/lib/services/comfyui/prompts/index.ts` | 모델 자동 등록 및 export |
| Models 인덱스 | `/src/lib/services/comfyui/prompts/models/index.ts` | 모델 빌더 export |
| ComfyUI 인덱스 | `/src/lib/services/comfyui/index.ts` | 전체 서비스 export |

#### SD 3.5 파일
| 파일 | 경로 | 설명 |
|------|------|------|
| SD35 설정 | `/src/lib/services/comfyui/prompts/models/sd35/config.ts` | steps, cfg, sampler 등 |
| SD35 네거티브 | `/src/lib/services/comfyui/prompts/models/sd35/negative.ts` | 네거티브 프롬프트 빌더 |
| SD35 빌더 | `/src/lib/services/comfyui/prompts/models/sd35/builder.ts` | 키워드 기반 프롬프트 빌더 |
| SD35 인덱스 | `/src/lib/services/comfyui/prompts/models/sd35/index.ts` | sd35 export |

#### Flux 파일
| 파일 | 경로 | 설명 |
|------|------|------|
| Flux 설정 | `/src/lib/services/comfyui/prompts/models/flux/config.ts` | cfg=1, 네거티브 미지원 |
| Flux 빌더 | `/src/lib/services/comfyui/prompts/models/flux/builder.ts` | 자연어 기반 프롬프트 빌더 |
| Flux 인덱스 | `/src/lib/services/comfyui/prompts/models/flux/index.ts` | flux export |

### 7.2 이동된 파일

| 파일 | 이전 경로 | 새 경로 |
|------|-----------|---------|
| ComfyUI 서비스 | `/src/lib/services/comfyui.ts` | `/src/lib/services/comfyui/comfyui-service.ts` |

### 7.3 수정된 파일

| 파일 | 경로 |
|------|------|
| 이미지 생성기 | `/src/services/image/gemini-image-generator.ts` |

### 7.4 기존 프롬프트 파일 (참조용)

| 파일 | 경로 |
|------|------|
| 오케스트레이션 | `/src/services/ai/orchestration-service.ts` |
| 섹션 템플릿 (Gemini용) | `/src/services/ai/prompts/section-templates.ts` |
| 이미지 구도 | `/src/services/ai/prompts/image-composition.ts` |
| 프롬프트 인덱스 | `/src/services/ai/prompts/index.ts` |

---

## 8. 다음 단계 (TODO)

1. [x] 레지스트리/플러그인 패턴으로 확장 가능한 프롬프트 시스템 구축
2. [x] SD 3.5 프롬프트 빌더 구현 (키워드 기반)
3. [x] Flux 프롬프트 빌더 구현 (자연어 기반)
4. [x] gemini-image-generator.ts에 로컬 모델 연동
5. [x] **Flux 다운로드 완료** (사용자 수동 다운로드, 22GB)
6. [x] 한글 → 영어 변환: Ollama + Qwen3:8b 구현 완료
7. [ ] 생성 전 모델 선택 UI 추가 (Gemini / SD / Flux)
8. [ ] 프롬프트 테스트 및 품질 검증

---

## 9. 관련 문서

- [ComfyUI API 연동 가이드](./2026-01-02_ComfyUI_API_Integration.md)
- [SD 3.5 아키텍처](./2026-01-02_Stable_Diffusion_3.5_Architecture.md)
- [ComfyUI 설치 가이드](./COMFYUI_SETUP.md)
- [현재 프롬프트 분석](./current_prompts.md)

---

## 10. 세션 히스토리

### 2026-01-06 세션 기록

| 시간 | 작업 | 상태 |
|------|------|------|
| 세션 시작 | 기존 프롬프트 시스템 분석 | 완료 |
| | section-templates.ts가 참조로만 사용되고 Gemini가 프롬프트 생성 확인 | 완료 |
| | SD 3.5 vs Gemini Imagen 특성 비교 | 완료 |
| | 한글 입력 처리 방안 논의 (Ollama vs 키워드 매핑) | 대기 |
| | 확장성을 위한 레지스트리/플러그인 패턴 설계 | 완료 |
| | prompts/ 폴더 구조 생성 | 완료 |
| | types.ts 생성 (공통 인터페이스) | 완료 |
| | base-templates.ts 생성 (공통 템플릿) | 완료 |
| | registry.ts 생성 (모델 레지스트리) | 완료 |
| | sd35/ 폴더 (config, negative, builder) 생성 | 완료 |
| | flux/ 폴더 (config, builder) 생성 | 완료 |
| | gemini-image-generator.ts 수정 (로컬 모델 연동) | 완료 |
| | TypeScript 오류 수정 (Set iteration → Array.from) | 완료 |
| | Flux 다운로드 시도 (huggingface_hub) | 실패 (96% 멈춤) |
| | Flux 다운로드 시도 (curl 이어받기) | 실패 (13MB 리다이렉트) |
| | Flux 다운로드 URL 및 저장 위치 제공 | 완료 |
| | 사용자 수동 다운로드 완료 (22GB) | 완료 |
| | Ollama 번역 모델 선택 (Qwen3:8b) | 완료 |
| | Qwen3:8b 다운로드 (5.2GB) | 완료 |
| | translator.ts 생성 (Ollama 연동) | 완료 |
| | registry.ts에 buildPromptAsync 추가 | 완료 |
| | gemini-image-generator.ts 번역 연동 | 완료 |
| 현재 | 프롬프트 시스템 테스트 대기 | 준비 완료 |

### 발생한 오류 및 해결

1. **TypeScript Set iteration 오류**
   - 오류: `[...new Set(parts)]` 에서 타입 에러
   - 해결: `Array.from(new Set(parts))`로 변경

2. **Flux 다운로드 중단**
   - 증상: huggingface_hub로 다운로드 시 96%에서 멈춤
   - 시도 1: 프로세스 종료 후 재시작 → 동일하게 96%에서 멈춤
   - 시도 2: curl 이어받기 → 13MB 오류 페이지만 다운로드
   - 시도 3: huggingface_hub 백그라운드 → `CAS service error : IO Error: No such file or directory` 오류
   - 해결: 사용자가 브라우저에서 직접 다운로드
   - 정리: 잘못된 13MB 파일 및 .cache 폴더 삭제 완료
