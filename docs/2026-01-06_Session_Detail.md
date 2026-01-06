# 2026-01-06 세션 상세 기록

## 개요

SD/Flux 프롬프트 시스템 구축, Ollama 번역기 연동, Mac 호환성 이슈 해결 및 설정 페이지 업데이트 작업 기록입니다.

---

## 1. 프롬프트 시스템 구축

### 1.1 배경

- 기존: Gemini가 모든 프롬프트 생성 (SD 최적화 없음)
- 문제: SD 3.5는 키워드 기반, Gemini Imagen은 자연어 기반으로 특성이 다름
- 해결: 모델별 전용 프롬프트 빌더 시스템 구축

### 1.2 레지스트리/플러그인 패턴 구조

```
src/lib/services/comfyui/
├── index.ts                    # export hub
├── comfyui-service.ts          # ComfyUI API 통신
│
└── prompts/                    # 프롬프트 시스템
    ├── index.ts                # 모델 자동 등록
    ├── types.ts                # 공통 인터페이스
    ├── base-templates.ts       # 공통 템플릿
    ├── registry.ts             # 모델 레지스트리
    ├── translator.ts           # 한→영 번역기 (NEW)
    │
    └── models/
        ├── sd35/
        │   ├── config.ts       # SD 3.5 설정
        │   ├── negative.ts     # 네거티브 프롬프트
        │   └── builder.ts      # 키워드 기반 빌더
        │
        └── flux/
            ├── config.ts       # Flux 설정
            └── builder.ts      # 자연어 기반 빌더
```

### 1.3 핵심 인터페이스

```typescript
// types.ts
export interface ModelPromptBuilder {
  config: ModelConfig;
  buildPrompt(input: PromptInput): PromptOutput;
  buildMainPrompt?(input: PromptInput): PromptOutput;
}

export interface PromptInput {
  sectionType: SectionType;
  productName: string;      // 한글 가능 → 번역됨
  category: string;
  background?: string;
  keyFeatures?: string[];
  includeHuman?: boolean;
}

export interface PromptOutput {
  positive: string;         // 영어 프롬프트
  negative: string;         // 네거티브 (SD만)
}
```

### 1.4 Flux 프롬프트 예시 (builder.ts)

```typescript
// MAIN 섹션 프롬프트 생성
buildMainPrompt(input: PromptInput): PromptOutput {
  const sentences: string[] = [];

  sentences.push(
    `Stunning e-commerce hero shot of ${input.productName}, a premium ${categoryTags[0]}.`
  );
  sentences.push(
    'Product centered in frame taking 50-60% of the image...'
  );
  sentences.push(
    `Clean ${background} gradient background with empty space...`
  );
  // ... 더 많은 문장

  return { positive: sentences.join(' '), negative: '' };
}
```

---

## 2. 한→영 번역기 구현

### 2.1 Ollama 설정

```bash
# Ollama 설치 확인
ollama --version  # v0.13.2

# Qwen3:8b 다운로드 (5.2GB)
ollama pull qwen3:8b
```

### 2.2 번역기 구조 (translator.ts)

```typescript
export type TranslatorType = 'ollama' | 'gemini';

// 번역기 변경
export function setTranslator(type: TranslatorType): void;

// 현재 번역기 확인
export function getTranslator(): TranslatorType;

// 제품명 번역 (캐시 지원)
export async function translateProductName(
  koreanText: string,
  translator?: TranslatorType
): Promise<TranslationResult>;
```

### 2.3 번역 흐름

```
사용자 입력: "로즈 글로우 립틴트"
        ↓
translateProductName() 호출
        ↓
[캐시 확인] → 없으면 번역
        ↓
[Ollama/Gemini 선택]
        ↓
Ollama: POST http://localhost:11434/api/generate
        ↓
결과: "Rose Glow Lip Tint"
        ↓
캐시 저장 후 반환
```

### 2.4 Gemini 폴백

- Gemini API 키 없음 → Ollama 사용
- Gemini 오류 발생 → Ollama로 자동 전환

---

## 3. 설정 페이지 업데이트

### 3.1 번역기 선택 UI 추가

**위치:** `/src/app/(dashboard)/dashboard/settings/page.tsx`

**테마 및 언어 탭에 추가된 항목:**

```
┌─────────────────────────────────────┐
│ 한→영 번역기                        │
├─────────────────────────────────────┤
│ ● Ollama: 연결됨     [새로고침]     │
├─────────────────────────────────────┤
│ [✓] Ollama (로컬)   [ ] Gemini     │
│     무료/무제한         API 비용    │
└─────────────────────────────────────┘
```

### 3.2 상태 관리

```typescript
// 상태
const [translator, setTranslator] = useState<'ollama' | 'gemini'>('ollama');
const [ollamaAvailable, setOllamaAvailable] = useState(false);

// Ollama 상태 확인
const checkOllamaStatus = useCallback(async () => {
  try {
    const res = await fetch('http://localhost:11434/api/tags');
    setOllamaAvailable(res.ok);
  } catch {
    setOllamaAvailable(false);
  }
}, []);

// 설정 저장 (localStorage)
const handleTranslatorChange = (value: typeof translator) => {
  setTranslator(value);
  localStorage.setItem('translator', value);
};
```

---

## 4. Flux 다운로드 이슈

### 4.1 다운로드 시도 기록

| 시도 | 방법 | 결과 |
|------|------|------|
| 1차 | `huggingface_hub` Python | 96%에서 멈춤 (22GB/23GB) |
| 2차 | 프로세스 종료 후 재시작 | 동일하게 96%에서 멈춤 |
| 3차 | `curl -C -` 이어받기 | 13MB 오류 페이지만 다운로드 |
| 4차 | `huggingface_hub` 백그라운드 | CAS service error |
| **최종** | **사용자 수동 다운로드** | **성공 (22GB)** |

### 4.2 수동 다운로드 정보

```
다운로드 URL:
https://huggingface.co/black-forest-labs/FLUX.1-schnell/resolve/main/flux1-schnell.safetensors

저장 위치:
/Users/admin/Desktop/ComfyUI/models/unet/flux1-schnell.safetensors

파일 크기: 약 23GB (22GB 실제)
```

---

## 5. Mac MPS 호환성 이슈

### 5.1 Flux Float8 오류

**에러 메시지:**
```
TypeError: Trying to convert Float8_e4m3fn to the MPS backend
but it does not have support for that dtype.
```

**원인:** Flux Schnell 모델이 Float8 타입 사용, Mac MPS는 Float8 미지원

### 5.2 Mac 호환 모델 비교

| 모델 | 속도 | 품질 | 용량 | 8GB M1 |
|------|------|------|------|--------|
| **SD 1.5** | ~30초 | ⭐⭐⭐ | ~4GB | ✅ |
| **SSD-1B** | ~20초 | ⭐⭐⭐⭐ | ~5GB | ✅ |
| **SDXL Turbo** | ~10초 | ⭐⭐⭐⭐ | ~7GB | ⚠️ 빠듯 |
| **SDXL Base** | ~1-2분 | ⭐⭐⭐⭐⭐ | ~7GB | ⚠️ 빠듯 |
| SD 3.5 | ~4-5분 | ⭐⭐⭐⭐⭐ | ~8GB | ❌ 메모리 부족 |
| Flux (FP8) | - | ⭐⭐⭐⭐⭐ | ~23GB | ❌ Float8 미지원 |
| Flux GGUF Q8 | ~3-4분 | ⭐⭐⭐⭐⭐ | ~13GB | ❌ 메모리 부족 |

### 5.3 Mac 호환 Flux 대안

```
Flux FP16 버전: ~24GB (Mac 호환, 메모리 많이 필요)
Flux GGUF Q4:   ~8GB (Mac 호환, 품질 약간 저하)
Flux GGUF Q8:   ~13GB (Mac 호환, 품질 좋음)

다운로드:
https://huggingface.co/city96/FLUX.1-schnell-gguf/resolve/main/flux1-schnell-Q8_0.gguf
```

### 5.4 8GB M1 Mac 권장

- **추천:** SSD-1B 또는 SD 1.5
- **이유:** 메모리 제한으로 대형 모델 실행 불가

---

## 6. 서버 실행 설정

### 6.1 기존 방식 (터미널 2개)

**터미널 1 - Next.js:**
```bash
cd /Users/admin/Desktop/Triple_C
npm run dev
```

**터미널 2 - ComfyUI:**
```bash
cd /Users/admin/Desktop/ComfyUI
source venv/bin/activate
python main.py --force-fp16
```

### 6.2 통합 실행 스크립트 추가

**package.json 수정:**
```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "dev:all": "/Users/admin/Desktop/ComfyUI/venv/bin/python /Users/admin/Desktop/ComfyUI/main.py --force-fp16 & next dev --turbo"
  }
}
```

**사용법:**
```bash
npm run dev:all  # ComfyUI + Next.js 동시 실행
```

### 6.3 설정 페이지 안내 메시지 업데이트

```
Before:
"로컬 모델을 사용하려면 ComfyUI를 먼저 시작하세요:
cd ~/Desktop/ComfyUI && python main.py --force-fp16"

After:
"로컬 모델을 사용하려면 ComfyUI와 함께 실행하세요:
npm run dev:all"
```

---

## 7. 재생성 흐름

### 7.1 전체 흐름

```
1. 사용자 클릭 (재생성 버튼)
   └── use-regeneration.ts

2. API 호출
   └── POST /api/generate/detail-page
       └── src/app/api/generate/detail-page/route.ts

3. 상세페이지 생성
   └── generateDetailPage()
       └── src/services/ai/detail-page-generator.ts

4. 이미지 생성 (generateImages: true인 경우)
   └── generateSectionImageWithGemini()
       └── src/services/image/gemini-image-generator.ts

       로컬 모델(SD/Flux) 선택 시:
       └── buildPromptAsync() ← 한글 번역 포함
           └── src/lib/services/comfyui/prompts/registry.ts
           └── ComfyUI로 이미지 생성
```

### 7.2 핵심 파일 경로

| 단계 | 파일 |
|------|------|
| 훅 | `/src/.../[id]/_hooks/use-regeneration.ts` |
| API | `/src/app/api/generate/detail-page/route.ts` |
| 생성기 | `/src/services/ai/detail-page-generator.ts` |
| 이미지 | `/src/services/image/gemini-image-generator.ts` |
| 프롬프트 | `/src/lib/services/comfyui/prompts/` |

---

## 8. 생성된/수정된 파일 목록

### 8.1 새로 생성된 파일

| 파일 | 설명 |
|------|------|
| `/src/lib/services/comfyui/prompts/types.ts` | 공통 인터페이스 |
| `/src/lib/services/comfyui/prompts/base-templates.ts` | 공통 템플릿 |
| `/src/lib/services/comfyui/prompts/registry.ts` | 모델 레지스트리 |
| `/src/lib/services/comfyui/prompts/translator.ts` | 한→영 번역기 |
| `/src/lib/services/comfyui/prompts/index.ts` | 모듈 export |
| `/src/lib/services/comfyui/prompts/models/index.ts` | 모델 export |
| `/src/lib/services/comfyui/prompts/models/sd35/config.ts` | SD 3.5 설정 |
| `/src/lib/services/comfyui/prompts/models/sd35/negative.ts` | 네거티브 프롬프트 |
| `/src/lib/services/comfyui/prompts/models/sd35/builder.ts` | SD 3.5 빌더 |
| `/src/lib/services/comfyui/prompts/models/sd35/index.ts` | SD 3.5 export |
| `/src/lib/services/comfyui/prompts/models/flux/config.ts` | Flux 설정 |
| `/src/lib/services/comfyui/prompts/models/flux/builder.ts` | Flux 빌더 |
| `/src/lib/services/comfyui/prompts/models/flux/index.ts` | Flux export |

### 8.2 수정된 파일

| 파일 | 변경 내용 |
|------|-----------|
| `/src/lib/services/comfyui/index.ts` | prompts 모듈 export 추가 |
| `/src/services/image/gemini-image-generator.ts` | buildPromptAsync 연동 |
| `/src/app/(dashboard)/dashboard/settings/page.tsx` | 번역기 선택 UI 추가 |
| `/package.json` | dev:all 스크립트 추가 |

---

## 9. 발생한 오류 및 해결

### 9.1 TypeScript Set iteration 오류

```typescript
// 오류
[...new Set(parts)]

// 해결
Array.from(new Set(parts))
```

### 9.2 Flux Float8 MPS 미지원

```
오류: TypeError: Trying to convert Float8_e4m3fn to the MPS backend
해결: Mac에서는 SD 3.5, SSD-1B, 또는 Flux GGUF 버전 사용
```

### 9.3 python 명령어 없음

```bash
# 오류
zsh: command not found: python

# 해결
python3 main.py --force-fp16
# 또는
source venv/bin/activate && python main.py --force-fp16
```

### 9.4 PIL 모듈 없음

```bash
# 오류
ModuleNotFoundError: No module named 'PIL'

# 해결: 가상환경 활성화
source venv/bin/activate && python main.py --force-fp16
```

### 9.5 npm 스크립트 source 명령어 문제

```json
// 오류 (source 명령어가 npm에서 작동 안 함)
"dev:all": "cd /Users/admin/Desktop/ComfyUI && source venv/bin/activate && python main.py --force-fp16 & next dev --turbo"

// 해결 (전체 경로 사용)
"dev:all": "/Users/admin/Desktop/ComfyUI/venv/bin/python /Users/admin/Desktop/ComfyUI/main.py --force-fp16 & next dev --turbo"
```

---

## 10. TODO (다음 단계)

- [ ] 8GB M1 Mac용 SSD-1B 모델 추가
- [ ] 프롬프트 테스트 및 품질 검증
- [ ] 생성 전 모델 선택 UI 추가
- [ ] 번역기 설정을 서버에 전달하는 로직 구현

---

## 11. 참고 링크

- [Flux on Apple Silicon Guide 2025](https://apatero.com/blog/flux-apple-silicon-m1-m2-m3-m4-complete-performance-guide-2025)
- [Flux + ComfyUI on Apple Silicon 2025](https://medium.com/@tchpnk/flux-comfyui-on-apple-silicon-with-hardware-acceleration-2025-ac8a3852f13f)
- [ComfyUI on Apple Silicon 2025](https://medium.com/@tchpnk/comfyui-on-apple-silicon-from-scratch-2025-9facb41c842f)
- [Stable Diffusion on Apple Silicon](https://neurocanvas.net/blog/stable-diffusion-apple-guide/)
- [Best Ollama Models 2025](https://collabnix.com/best-ollama-models-in-2025-complete-performance-comparison/)
