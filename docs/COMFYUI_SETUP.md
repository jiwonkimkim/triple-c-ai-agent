# ComfyUI 설치 및 Triple C 연동 가이드

## 개요

Triple C 프로젝트에서 Stable Diffusion 이미지 생성을 위해 ComfyUI를 로컬 서버로 사용합니다.

### 시스템 요구사항
- **OS**: macOS (Apple Silicon M1/M2/M3)
- **RAM**: 16GB 이상 권장 (8GB도 가능)
- **Python**: 3.9 이상
- **Git**: 설치 필요

---

## 1. ComfyUI 설치

### 1.1 저장소 클론

```bash
cd /Users/admin/Desktop
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI
```

### 1.2 가상환경 생성 및 활성화

```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
```

### 1.3 PyTorch 설치 (M1 Mac용)

```bash
pip install torch torchvision torchaudio
```

> **참고**: M1/M2/M3 Mac에서는 MPS (Metal Performance Shaders)를 사용하여 GPU 가속이 가능합니다.

### 1.4 ComfyUI 의존성 설치

```bash
pip install -r requirements.txt
```

설치되는 주요 패키지:
- `torch` - PyTorch (딥러닝 프레임워크)
- `transformers` - Hugging Face Transformers
- `safetensors` - 안전한 텐서 저장 형식
- `aiohttp` - 비동기 HTTP 클라이언트/서버
- `kornia` - 컴퓨터 비전 라이브러리
- `einops` - 텐서 연산 라이브러리

---

## 2. Stable Diffusion 모델 다운로드

### 2.1 모델 저장 경로

```
ComfyUI/
├── models/
│   ├── checkpoints/     # SD 모델 (.safetensors, .ckpt)
│   ├── vae/             # VAE 모델
│   ├── loras/           # LoRA 모델
│   ├── controlnet/      # ControlNet 모델
│   └── embeddings/      # Textual Inversion 임베딩
```

### 2.2 추천 모델

| 모델명 | 용도 | 크기 | 다운로드 |
|--------|------|------|----------|
| **SD 1.5** | 범용, 빠름 | ~4GB | [Hugging Face](https://huggingface.co/runwayml/stable-diffusion-v1-5) |
| **SDXL 1.0** | 고품질, 1024px | ~6.5GB | [Hugging Face](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0) |
| **SD 3.5** | 최신, 고품질 | ~8GB | [Hugging Face](https://huggingface.co/stabilityai/stable-diffusion-3.5-large) |

### 2.3 모델 다운로드 방법

```bash
# Hugging Face CLI 설치
pip install huggingface_hub

# 모델 다운로드 (예: SD 1.5)
cd /Users/admin/Desktop/ComfyUI/models/checkpoints
huggingface-cli download runwayml/stable-diffusion-v1-5 v1-5-pruned-emaonly.safetensors --local-dir .
```

---

## 3. ComfyUI 실행

### 3.1 기본 실행

```bash
cd /Users/admin/Desktop/ComfyUI
source venv/bin/activate
python main.py
```

### 3.2 M1 Mac 최적화 실행

```bash
python main.py --force-fp16
```

### 3.3 API 서버로 실행

```bash
python main.py --listen 0.0.0.0 --port 8188
```

> **기본 URL**: http://127.0.0.1:8188

---

## 4. ComfyUI API 사용법

### 4.1 워크플로우 실행 API

```bash
curl -X POST http://127.0.0.1:8188/prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": { /* 워크플로우 JSON */ },
    "client_id": "triple-c"
  }'
```

### 4.2 이미지 가져오기

```bash
curl http://127.0.0.1:8188/view?filename=ComfyUI_00001_.png
```

### 4.3 히스토리 조회

```bash
curl http://127.0.0.1:8188/history
```

---

## 5. Triple C 연동

### 5.1 환경 변수 설정 (.env)

```env
COMFYUI_API_URL=http://127.0.0.1:8188
COMFYUI_ENABLED=true
```

### 5.2 API 서비스 구현

`src/lib/services/comfyui.ts` 파일 생성:

```typescript
// TODO: ComfyUI API 서비스 구현
export class ComfyUIService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://127.0.0.1:8188') {
    this.baseUrl = baseUrl;
  }

  async generateImage(prompt: string, options?: GenerateOptions): Promise<string> {
    // 구현 예정
  }
}
```

---

## 6. 트러블슈팅

### 6.1 MPS 관련 오류

```
RuntimeError: MPS backend out of memory
```

**해결책**: `--force-fp16` 플래그 사용 또는 이미지 크기 줄이기

### 6.2 모델 로딩 오류

```
FileNotFoundError: [Errno 2] No such file or directory: 'models/checkpoints/...'
```

**해결책**: 모델 파일이 올바른 경로에 있는지 확인

### 6.3 포트 충돌

```
Address already in use
```

**해결책**: 다른 포트 사용 `--port 8189`

---

## 설치 진행 상태

- [x] ComfyUI 저장소 클론
- [x] Python 가상환경 생성
- [x] PyTorch 설치 (M1 MPS 지원)
- [x] ComfyUI 의존성 설치
- [ ] SD 모델 다운로드
- [ ] ComfyUI 실행 테스트
- [ ] Triple C API 연동

---

## 참고 자료

- [ComfyUI GitHub](https://github.com/comfyanonymous/ComfyUI)
- [ComfyUI API 문서](https://github.com/comfyanonymous/ComfyUI/blob/master/server.py)
- [Hugging Face Models](https://huggingface.co/models?pipeline_tag=text-to-image)
