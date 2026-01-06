# 2026-01-02 Stable Diffusion 3.5 아키텍처 및 Text Encoder 분석

## 개요

Triple C 프로젝트에서 이미지 생성을 위해 Stable Diffusion 3.5 Medium 모델을 ComfyUI와 연동하는 과정에서 학습한 내용을 정리합니다.

---

## 1. Stable Diffusion 3.5 모델 구성요소

### 1.1 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                        사용자 입력                                   │
│         "a beautiful sunset over the ocean, cinematic"              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      TEXT ENCODERS (3개)                            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐     │
│  │   CLIP-L    │    │   CLIP-G    │    │      T5-XXL         │     │
│  │   (~250MB)  │    │   (~1.4GB)  │    │      (~9GB)         │     │
│  │  77 tokens  │    │  77 tokens  │    │    256 tokens       │     │
│  └──────┬──────┘    └──────┬──────┘    └──────────┬──────────┘     │
│         │                  │                      │                 │
│         ▼                  ▼                      ▼                 │
│   [Text Embedding]   [Text Embedding]      [Text Embedding]        │
│         │                  │                      │                 │
│         └──────────────────┴──────────────────────┘                 │
│                            │                                        │
│                            ▼                                        │
│                   [Concatenated Embeddings]                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DIFFUSION TRANSFORMER (DiT)                      │
│                                                                     │
│   - SD 3.5의 핵심 이미지 생성 모델                                   │
│   - MMDiT (Multimodal Diffusion Transformer) 아키텍처               │
│   - 노이즈에서 시작하여 점진적으로 이미지 생성                        │
│   - Text Embedding을 조건으로 사용                                   │
│                                                                     │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐      │
│   │ Step 1  │ ──▶ │ Step 2  │ ──▶ │  ...    │ ──▶ │ Step N  │      │
│   │ (노이즈) │     │         │     │         │     │ (깨끗함) │      │
│   └─────────┘     └─────────┘     └─────────┘     └─────────┘      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         VAE DECODER                                 │
│                                                                     │
│   - Variational Auto-Encoder                                        │
│   - 잠재 공간(Latent Space) → 실제 픽셀 이미지 변환                  │
│   - 8x 업스케일 (64x64 latent → 512x512 image)                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                            🖼️ 최종 이미지 출력
```

### 1.2 구성요소별 역할

| 구성요소 | 역할 | 파일명 | 크기 |
|---------|------|--------|------|
| **CLIP-L** | 기본 텍스트 인코딩 | `clip_l.safetensors` | ~250MB |
| **CLIP-G** | 고급 시각적 개념 인코딩 | `clip_g.safetensors` | ~1.4GB |
| **T5-XXL** | 복잡한 문장/긴 프롬프트 처리 | `t5xxl_fp16.safetensors` | ~9GB |
| **DiT** | 이미지 생성 (Diffusion) | `sd3.5_medium.safetensors` 내 포함 | ~4.5GB |
| **VAE** | 잠재공간 ↔ 이미지 변환 | `sd3.5_medium.safetensors` 내 포함 | ~300MB |

---

## 2. Text Encoder 상세 분석

### 2.1 Text Encoder란?

Text Encoder는 사람이 작성한 자연어 프롬프트를 AI 모델이 이해할 수 있는 **수치 벡터(Embedding)**로 변환하는 역할을 합니다.

```
입력: "a cute cat"
      ↓
[Text Encoder]
      ↓
출력: [0.234, -0.567, 0.891, 0.123, -0.456, ...]  (수백~수천 차원의 벡터)
```

### 2.2 CLIP-L (CLIP ViT-L/14)

**개발**: OpenAI

**특징**:
- 가장 기본적인 text encoder
- 이미지-텍스트 쌍으로 학습된 모델
- 토큰 제한: 77개 (약 50-60 단어)

**처리 방식**:
```
"a beautiful sunset over the ocean"
    ↓
[Tokenizer] → [49406, 320, 1652, 18870, 962, 518, 8376, 49407, ...]
    ↓
[Transformer Layers] × 12
    ↓
[77 × 768] 차원의 임베딩
```

**장점**: 빠르고 가벼움
**단점**: 복잡한 문장이나 긴 프롬프트 처리 제한

### 2.3 CLIP-G (CLIP ViT-bigG/14)

**개발**: OpenAI (확장 버전)

**특징**:
- CLIP-L보다 더 큰 모델
- 더 세밀한 시각적 개념 이해
- 토큰 제한: 77개

**비교**:
| 속성 | CLIP-L | CLIP-G |
|-----|--------|--------|
| 파라미터 수 | ~125M | ~1B |
| 임베딩 차원 | 768 | 1280 |
| 시각적 이해 | 기본 | 정교함 |

**예시**:
```
프롬프트: "a red apple"

CLIP-L 이해:
- "빨간색" ✓
- "사과" ✓

CLIP-G 이해:
- "빨간색" ✓
- "사과" ✓
- "광택 있는 표면" ✓
- "둥근 형태" ✓
- "과일 특유의 질감" ✓
```

### 2.4 T5-XXL

**개발**: Google

**특징**:
- Text-to-Text Transfer Transformer
- 자연어 처리에 특화된 대규모 언어 모델
- 토큰 제한: 256개 (CLIP의 3배 이상)

**왜 T5를 사용하는가?**

```
CLIP의 한계:
┌─────────────────────────────────────────────────────────────────────┐
│ 프롬프트: "a cat wearing a tiny hat, sitting on a stack of books,  │
│           looking out a rainy window, cozy atmosphere, soft        │
│           lighting, digital art style, highly detailed"            │
│                                                                     │
│ CLIP (77 토큰): "a cat wearing a tiny hat, sitting on a sta..."    │
│                 ─────────────────────────────────────────────       │
│                              ↑ 여기서 잘림!                         │
└─────────────────────────────────────────────────────────────────────┘

T5-XXL의 해결:
┌─────────────────────────────────────────────────────────────────────┐
│ T5 (256 토큰): 전체 프롬프트 처리 가능 ✓                            │
│                                                                     │
│ + 문맥 이해 능력 향상                                               │
│ + 복잡한 관계 파악 (A가 B 위에 있고, B는 C 옆에...)                 │
│ + 부정문, 조건문 등 복잡한 문법 처리                                 │
└─────────────────────────────────────────────────────────────────────┘
```

**메모리 최적화 버전**:
| 버전 | 정밀도 | 크기 | VRAM 사용량 |
|-----|--------|------|------------|
| t5xxl_fp32 | 32-bit | ~18GB | ~20GB |
| t5xxl_fp16 | 16-bit | ~9GB | ~10GB |
| t5xxl_fp8 | 8-bit | ~4.5GB | ~5GB |

---

## 3. 임베딩 결합 메커니즘

### 3.1 Multi-Encoder Fusion

SD 3.5는 3개의 encoder 출력을 결합하여 사용합니다:

```python
# 개념적 코드 (실제 구현은 더 복잡함)

def encode_prompt(prompt):
    # 각 encoder로 임베딩 생성
    clip_l_embed = clip_l.encode(prompt)    # [1, 77, 768]
    clip_g_embed = clip_g.encode(prompt)    # [1, 77, 1280]
    t5_embed = t5xxl.encode(prompt)         # [1, 256, 4096]

    # CLIP 임베딩 결합
    clip_embed = concatenate([clip_l_embed, clip_g_embed], dim=-1)
    # 결과: [1, 77, 2048]

    # T5와 결합 (별도 경로로 DiT에 전달)
    return {
        'clip_embed': clip_embed,
        't5_embed': t5_embed
    }
```

### 3.2 DiT에서의 사용

```
┌─────────────────────────────────────────────────────────────────┐
│                      DiT Block                                   │
│                                                                  │
│   ┌──────────────┐                                              │
│   │ Self-Attention│ ←── 이미지 특징 간 관계                     │
│   └──────┬───────┘                                              │
│          │                                                       │
│          ▼                                                       │
│   ┌──────────────┐      ┌─────────────┐                         │
│   │Cross-Attention│ ←── │ CLIP Embed  │  텍스트 조건 주입       │
│   └──────┬───────┘      └─────────────┘                         │
│          │                                                       │
│          ▼                                                       │
│   ┌──────────────┐      ┌─────────────┐                         │
│   │   MLP Block  │ ←── │  T5 Embed   │  추가 텍스트 정보        │
│   └──────┬───────┘      └─────────────┘                         │
│          │                                                       │
│          ▼                                                       │
│     [다음 Block]                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. 파일 구조 및 다운로드 내역

### 4.1 다운로드된 파일 목록

```
/Users/admin/Desktop/ComfyUI/models/checkpoints/sd3.5-medium/
├── sd3.5_medium.safetensors          # 메인 체크포인트 (4.8GB) ✅
├── model_index.json                   # 모델 구성 정보
├── scheduler/
│   └── scheduler_config.json          # 샘플링 스케줄러 설정
├── text_encoder/                      # CLIP-L
│   ├── config.json
│   ├── model.safetensors             # fp32 버전
│   └── model.fp16.safetensors        # fp16 버전
├── text_encoder_2/                    # CLIP-G
│   ├── config.json
│   ├── model.safetensors
│   └── model.fp16.safetensors
├── text_encoder_3/                    # T5-XXL
│   ├── config.json
│   ├── model.safetensors.index.json
│   ├── model-00001-of-00002.safetensors
│   ├── model-00002-of-00002.safetensors
│   ├── model.fp16-00001-of-00002.safetensors
│   └── model.fp16-00002-of-00002.safetensors
├── text_encoders/                     # ComfyUI용 통합 파일
│   ├── clip_l.safetensors
│   ├── clip_g.safetensors
│   ├── t5xxl_fp16.safetensors
│   └── t5xxl_fp8_e4m3fn.safetensors  # 메모리 절약용
├── tokenizer/                         # CLIP-L 토크나이저
├── tokenizer_2/                       # CLIP-G 토크나이저
├── tokenizer_3/                       # T5 토크나이저
├── transformer/
│   ├── config.json
│   └── diffusion_pytorch_model.safetensors
├── vae/
│   ├── config.json
│   └── diffusion_pytorch_model.safetensors
└── *.json                             # 워크플로우 예제들
```

### 4.2 ComfyUI에서 필요한 파일

**필수:**
- `sd3.5_medium.safetensors` (4.8GB) - 메인 체크포인트

**선택 (별도 text encoder 사용 시):**
- `text_encoders/clip_l.safetensors`
- `text_encoders/clip_g.safetensors`
- `text_encoders/t5xxl_fp16.safetensors` 또는 `t5xxl_fp8_e4m3fn.safetensors`

### 4.3 Diffusers vs Checkpoint 형식

| 형식 | 용도 | 구조 | 크기 |
|-----|------|------|------|
| **Diffusers** | Python/PyTorch 직접 사용 | 폴더 + 여러 파일 | ~30GB |
| **Checkpoint** | ComfyUI/A1111 | 단일 .safetensors | ~5GB |

현재 다운로드는 Diffusers 형식 전체를 받고 있어 용량이 큽니다.
ComfyUI 사용 시에는 `sd3.5_medium.safetensors` 하나로 충분합니다.

---

## 5. 메모리 최적화 팁

### 5.1 16GB RAM Mac에서의 권장 설정

```bash
# ComfyUI 실행 시
python main.py --force-fp16
```

### 5.2 Text Encoder 메모리 사용량

| 설정 | CLIP-L+G | T5-XXL | 총 VRAM |
|-----|----------|--------|---------|
| fp32 | ~2GB | ~18GB | ~20GB ❌ |
| fp16 | ~1.5GB | ~9GB | ~10.5GB ⚠️ |
| fp8 | ~1.5GB | ~4.5GB | ~6GB ✅ |

**16GB Mac 권장**: T5-XXL fp8 버전 사용

---

## 6. 참고 자료

- [Stable Diffusion 3 Paper](https://arxiv.org/abs/2403.03206)
- [ComfyUI GitHub](https://github.com/comfyanonymous/ComfyUI)
- [Hugging Face - SD 3.5 Medium](https://huggingface.co/stabilityai/stable-diffusion-3.5-medium)
- [CLIP Paper](https://arxiv.org/abs/2103.00020)
- [T5 Paper](https://arxiv.org/abs/1910.10683)

---

## 변경 이력

| 날짜 | 내용 |
|-----|------|
| 2026-01-02 | 최초 작성 - SD 3.5 아키텍처 및 Text Encoder 분석 |
