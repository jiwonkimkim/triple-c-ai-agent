# 2026-01-02 ComfyUI API 연동 가이드

## 개요

Triple C 프로젝트에서 로컬 ComfyUI 서버를 통해 Stable Diffusion 3.5 이미지를 생성하는 API 연동 가이드입니다.

---

## 1. 사전 준비

### 1.1 ComfyUI 설치 확인

ComfyUI가 설치되어 있어야 합니다. 설치 방법은 `COMFYUI_SETUP.md` 참조.

```bash
# ComfyUI 위치
/Users/admin/Desktop/ComfyUI/
```

### 1.2 모델 파일 확인

```bash
# 체크포인트
/Users/admin/Desktop/ComfyUI/models/checkpoints/sd3.5_medium.safetensors

# Text Encoders (CLIP)
/Users/admin/Desktop/ComfyUI/models/clip/clip_l.safetensors
/Users/admin/Desktop/ComfyUI/models/clip/clip_g.safetensors
/Users/admin/Desktop/ComfyUI/models/clip/t5xxl_fp8_e4m3fn.safetensors
```

---

## 2. Triple C 파일 구조

### 2.1 생성된 파일들

```
Triple_C/
├── src/
│   ├── lib/
│   │   └── services/
│   │       └── comfyui.ts          # ComfyUI 서비스 클래스
│   ├── app/
│   │   └── api/
│   │       └── generate/
│   │           └── sd/
│   │               └── route.ts     # SD 이미지 생성 API 엔드포인트
│   └── middleware.ts               # 인증 미들웨어 (수정됨)
├── .env                            # 환경 변수 (COMFYUI_API_URL 추가)
└── docs/
    └── 2026-01-02_ComfyUI_API_Integration.md  # 이 문서
```

### 2.2 환경 변수 (.env)

```env
# ComfyUI (Local Stable Diffusion)
COMFYUI_API_URL=http://127.0.0.1:8188
```

---

## 3. ComfyUI 서비스 (comfyui.ts)

### 3.1 주요 클래스와 메서드

```typescript
// src/lib/services/comfyui.ts

export class ComfyUIService {
  // 서버 상태 확인
  async isAvailable(): Promise<boolean>

  // 큐 상태 확인
  async getQueueStatus(): Promise<{ running: number; pending: number }>

  // 이미지 생성
  async generate(options: SD35GenerateOptions): Promise<ComfyUIGenerateResult>

  // 체크포인트 목록 조회
  async getCheckpoints(): Promise<string[]>
}

// 싱글톤 인스턴스 가져오기
export function getComfyUIService(): ComfyUIService
```

### 3.2 이미지 생성 옵션

```typescript
interface SD35GenerateOptions {
  prompt: string;           // 필수: 생성할 이미지 설명
  negativePrompt?: string;  // 선택: 제외할 요소
  width?: number;           // 기본값: 1024
  height?: number;          // 기본값: 1024
  steps?: number;           // 기본값: 28
  cfg?: number;             // 기본값: 4.5
  seed?: number;            // 기본값: 랜덤
  sampler?: string;         // 기본값: 'euler'
}
```

### 3.3 생성 결과

```typescript
interface ComfyUIGenerateResult {
  success: boolean;
  imageUrl?: string;      // base64 data URL
  filename?: string;      // 저장된 파일명
  promptId?: string;      // ComfyUI 작업 ID
  error?: string;         // 에러 메시지
  executionTime?: number; // 실행 시간 (ms)
}
```

---

## 4. API 엔드포인트

### 4.1 서버 상태 확인

```bash
GET /api/generate/sd
```

**응답 예시:**
```json
{
  "available": true,
  "queue": {
    "running": 0,
    "pending": 0
  },
  "checkpoints": ["sd3.5_medium.safetensors", ...],
  "model": "sd3.5-medium",
  "serverUrl": "http://127.0.0.1:8188"
}
```

### 4.2 이미지 생성

```bash
POST /api/generate/sd
Content-Type: application/json

{
  "prompt": "a cute cat sitting on a sofa, photorealistic",
  "negativePrompt": "ugly, blurry",
  "width": 1024,
  "height": 1024,
  "steps": 20,
  "cfg": 4.5
}
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "imageUrl": "data:image/png;base64,iVBORw0KGgo...",
    "filename": "triple_c_00001_.png",
    "promptId": "abc123-def456",
    "executionTime": 280000,
    "generator": "sd3.5-medium",
    "settings": {
      "prompt": "a cute cat sitting on a sofa, photorealistic",
      "width": 1024,
      "height": 1024,
      "steps": 20,
      "cfg": 4.5
    }
  }
}
```

---

## 5. 사용 방법

### 5.1 ComfyUI 서버 시작

```bash
cd /Users/admin/Desktop/ComfyUI
source venv/bin/activate
python main.py --force-fp16
```

서버가 시작되면:
```
To see the GUI go to: http://127.0.0.1:8188
```

### 5.2 Triple C 개발 서버 시작

```bash
cd /Users/admin/Desktop/Triple_C
npm run dev
```

### 5.3 API 테스트

**상태 확인:**
```bash
curl http://localhost:3001/api/generate/sd
```

**이미지 생성:**
```bash
curl -X POST http://localhost:3001/api/generate/sd \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a beautiful sunset over the ocean",
    "width": 1024,
    "height": 1024,
    "steps": 20
  }'
```

---

## 6. SD 3.5 워크플로우 구조

### 6.1 노드 구성

```
┌─────────────────────────────────────────────────────────────────┐
│                       ComfyUI Workflow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [1] CheckpointLoaderSimple                                     │
│      └── ckpt_name: "sd3.5_medium.safetensors"                  │
│                                                                  │
│  [2] TripleCLIPLoader                                           │
│      ├── clip_name1: "clip_l.safetensors"                       │
│      ├── clip_name2: "clip_g.safetensors"                       │
│      └── clip_name3: "t5xxl_fp8_e4m3fn.safetensors"             │
│                                                                  │
│  [3] CLIPTextEncode (Positive)                                  │
│      ├── text: <prompt>                                         │
│      └── clip: [2, 0]                                           │
│                                                                  │
│  [4] CLIPTextEncode (Negative)                                  │
│      ├── text: <negative_prompt>                                │
│      └── clip: [2, 0]                                           │
│                                                                  │
│  [5] EmptySD3LatentImage                                        │
│      ├── width: 1024                                            │
│      ├── height: 1024                                           │
│      └── batch_size: 1                                          │
│                                                                  │
│  [6] KSampler                                                   │
│      ├── seed: <random>                                         │
│      ├── steps: 28                                              │
│      ├── cfg: 4.5                                               │
│      ├── sampler_name: "euler"                                  │
│      ├── scheduler: "normal"                                    │
│      ├── denoise: 1.0                                           │
│      ├── model: [1, 0]                                          │
│      ├── positive: [3, 0]                                       │
│      ├── negative: [4, 0]                                       │
│      └── latent_image: [5, 0]                                   │
│                                                                  │
│  [7] VAEDecode                                                  │
│      ├── samples: [6, 0]                                        │
│      └── vae: [1, 2]                                            │
│                                                                  │
│  [8] SaveImage                                                  │
│      ├── filename_prefix: "triple_c"                            │
│      └── images: [7, 0]                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 노드 연결 흐름

```
CheckpointLoader ─────┬─────────────────────┐
        │             │                     │
        │ [model]     │ [clip]              │ [vae]
        │             │                     │
        ▼             │                     │
   KSampler ◄─────────┤                     │
        │             │                     │
        │ [samples]   ▼                     │
        │      TripleCLIPLoader             │
        │             │                     │
        │             │ [clip]              │
        │             ▼                     │
        │      CLIPTextEncode (x2)          │
        │             │                     │
        │             │ [conditioning]      │
        │             │                     │
        │       ◄─────┘                     │
        │                                   │
        │ [latent]                          │
        │      ◄──── EmptySD3LatentImage    │
        │                                   │
        ▼                                   │
   VAEDecode ◄──────────────────────────────┘
        │
        │ [images]
        ▼
   SaveImage
```

---

## 7. 트러블슈팅

### 7.1 ComfyUI 서버 연결 실패

**증상:**
```json
{
  "error": "ComfyUI 서버가 실행 중이지 않습니다."
}
```

**해결:**
```bash
# ComfyUI 서버 시작
cd /Users/admin/Desktop/ComfyUI
source venv/bin/activate
python main.py --force-fp16
```

### 7.2 CLIP 모델 누락

**증상:**
```
ERROR: clip input is invalid: None
```

**해결:**
Text encoder 파일들이 올바른 위치에 있는지 확인:
```bash
ls /Users/admin/Desktop/ComfyUI/models/clip/
# clip_l.safetensors
# clip_g.safetensors
# t5xxl_fp8_e4m3fn.safetensors
```

### 7.3 메모리 부족

**증상:**
```
RuntimeError: MPS backend out of memory
```

**해결:**
- `--force-fp16` 플래그 사용
- 이미지 크기 줄이기 (512x512)
- steps 수 줄이기

### 7.4 포트 충돌

**증상:**
```
OSError: [Errno 48] Address already in use
```

**해결:**
```bash
# 기존 프로세스 종료
lsof -i :8188 | grep LISTEN
kill -9 <PID>
```

---

## 8. 성능 참고

### 8.1 M1 Mac (16GB RAM) 기준

| 설정 | 시간 |
|------|------|
| 1024x1024, 28 steps | ~5분 30초 |
| 1024x1024, 20 steps | ~4분 |
| 512x512, 20 steps | ~2분 |

### 8.2 권장 설정

```json
{
  "width": 1024,
  "height": 1024,
  "steps": 20,
  "cfg": 4.5,
  "sampler": "euler"
}
```

---

## 9. 프론트엔드 연동 예시

### 9.1 React 컴포넌트

```tsx
'use client';

import { useState } from 'react';

export function SDImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate/sd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          width: 1024,
          height: 1024,
          steps: 20,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setImageUrl(data.data.imageUrl);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('이미지 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="이미지 설명 입력..."
      />
      <button onClick={generateImage} disabled={loading}>
        {loading ? '생성 중...' : '이미지 생성'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {imageUrl && (
        <img src={imageUrl} alt="Generated" style={{ maxWidth: '100%' }} />
      )}
    </div>
  );
}
```

---

## 10. 다음 단계

- [ ] 이미지 생성 진행률 실시간 표시 (WebSocket)
- [ ] 생성된 이미지 S3 업로드
- [ ] 다양한 모델 지원 (SDXL, SD 3.5 Large 등)
- [ ] ControlNet 연동
- [ ] 이미지 업스케일링

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-01-02 | 최초 작성 - ComfyUI API 연동 |
