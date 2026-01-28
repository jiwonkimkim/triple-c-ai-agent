# Triple C 배포 가이드

## 배포 구조


```
┌─────────────────────────────────────────────────────────────────┐
│                         사용자 요청                              │
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Vercel (호스팅)                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Next.js 애플리케이션                         │   │
│  │  - 프론트엔드 (React)                                    │   │
│  │  - API Routes (백엔드)                                   │   │
│  │  - 서버리스 함수                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Vercel Postgres │  │   Cloudinary    │  │   AI APIs       │
│  (데이터베이스)   │  │ (이미지 저장소)  │  │  - Gemini       │
│  - Prisma ORM    │  │ - 25GB 무료     │  │  - Anthropic    │
│  - 256MB 무료    │  │ - CDN 포함      │  │  - OpenAI       │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## 기술 스택 조합 선택 이유

### Vercel + Vercel Postgres + Cloudinary

| 서비스 | 역할 | 선택 이유 |
|--------|------|-----------|
| **Vercel** | 호스팅 | Next.js 공식 호스팅, 자동 배포, Edge 네트워크, 무료 티어 충분 |
| **Vercel Postgres** | 데이터베이스 | Vercel과 네이티브 통합, 환경변수 자동 설정, Prisma 완벽 지원 |
| **Cloudinary** | 이미지 저장 | 25GB 무료 (가장 넉넉), 이미지 최적화/변환 자동, CDN 포함 |

### 왜 이 조합인가?

1. **비용 효율성**: 모든 서비스가 무료 티어 제공
2. **통합 용이성**: Vercel 생태계 내에서 원클릭 설정
3. **성능**: CDN, Edge Functions, 이미지 최적화 기본 제공
4. **확장성**: 필요시 유료 플랜으로 쉽게 업그레이드

### 기존 로컬 환경과의 차이

| 항목 | 로컬 (Docker) | Vercel 배포 |
|------|---------------|-------------|
| 데이터베이스 | PostgreSQL 컨테이너 | Vercel Postgres (Neon) |
| 이미지 저장 | DB에 base64 저장 (비효율) | Cloudinary URL 저장 (효율) |
| 서버 | Docker 컨테이너 | 서버리스 함수 |

---

## 배포 실행 방법

### 1단계: Cloudinary 계정 생성 (5분)

1. https://cloudinary.com 가입
2. Dashboard에서 다음 정보 확인:
   - Cloud Name
   - API Key
   - API Secret

### 2단계: Vercel 프로젝트 생성 (5분)

1. https://vercel.com 가입 (GitHub 연동)
2. **Add New Project** 클릭
3. `Triple_C` 저장소 선택
4. **Framework Preset**: Next.js (자동 감지됨)

### 3단계: Vercel Postgres 생성 (2분)

1. Vercel Dashboard → 프로젝트 선택
2. **Storage** 탭 클릭
3. **Create Database** → **Postgres** 선택
4. 데이터베이스 이름 입력 (예: `triple-c-db`)
5. **Create** 클릭
6. 환경변수가 자동으로 설정됨 (`DATABASE_URL`, `POSTGRES_*`)

### 4단계: 환경변수 설정

Vercel Dashboard → **Settings** → **Environment Variables**

#### 필수 환경변수

```bash
# Database (Vercel Postgres 자동 설정됨)
DATABASE_URL=자동설정
POSTGRES_PRISMA_URL=자동설정
POSTGRES_URL_NON_POOLING=자동설정

# NextAuth
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=랜덤시크릿 (openssl rand -base64 32)

# OAuth (Google 로그인)
GOOGLE_CLIENT_ID=Google Cloud Console에서 발급
GOOGLE_CLIENT_SECRET=Google Cloud Console에서 발급

# Cloudinary (이미지 저장)
CLOUDINARY_CLOUD_NAME=Cloudinary Dashboard에서 확인
CLOUDINARY_API_KEY=Cloudinary Dashboard에서 확인
CLOUDINARY_API_SECRET=Cloudinary Dashboard에서 확인

# AI APIs (최소 1개 필수)
GOOGLE_AI_API_KEY=Google AI Studio에서 발급
ANTHROPIC_API_KEY=Anthropic Console에서 발급 (선택)
OPENAI_API_KEY=OpenAI Platform에서 발급 (선택)
```

#### 환경변수 생성 방법

```bash
# NEXTAUTH_SECRET 생성 (터미널에서)
openssl rand -base64 32
```

### 5단계: 배포 실행

환경변수 설정 완료 후:
1. **Deploy** 버튼 클릭
2. 또는 GitHub에 push하면 자동 배포

### 6단계: 데이터베이스 마이그레이션

배포 완료 후 로컬에서 실행:

```bash
# Vercel에서 환경변수 가져오기
npx vercel env pull .env.local

# Prisma 마이그레이션
npx prisma db push
```

또는 Vercel CLI 사용:

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 프로젝트 연결
vercel link

# 데이터베이스 마이그레이션 실행
vercel env pull .env.production.local
DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2) npx prisma db push
```

---

## 코드 수정 내역

### 1. Cloudinary 통합

#### 새로 추가된 파일

**`src/lib/cloudinary.ts`**
- Cloudinary SDK 설정 및 유틸리티 함수
- base64 이미지 업로드 기능
- 이미지 URL 최적화 기능

```typescript
// 주요 함수
export async function uploadBase64ToCloudinary(base64Data: string, options?: {...})
export function isCloudinaryConfigured(): boolean
export function getOptimizedUrl(publicId: string, options?: {...})
```

**`src/services/image/image-upload-service.ts`**
- 이미지 업로드 추상화 레이어
- Cloudinary 설정 시 → Cloudinary 업로드
- 미설정 시 → base64 fallback (기존 방식)

```typescript
// 주요 함수
export async function uploadGeneratedImage(image: GeminiGeneratedImage, options?: {...})
```

#### 수정된 파일

**`src/services/ai/detail-page-generator.ts`**

```diff
+ import { uploadGeneratedImage } from '@/services/image/image-upload-service';

  // I2I 모드 이미지 생성
  if (generatedImage) {
-   const imageUrl = base64ToDataUrl(
-     generatedImage.base64Data,
-     generatedImage.mimeType
-   );
+   const uploadResult = await uploadGeneratedImage(generatedImage, {
+     folder: 'triple-c/sections',
+     sectionType,
+   });
    return {
      ...section,
-     imageUrl,
+     imageUrl: uploadResult.url,
    };
  }
```

**`.env.example`**

```diff
+ # Cloudinary (Image Storage - Recommended for Vercel deployment)
+ CLOUDINARY_CLOUD_NAME="your-cloud-name"
+ CLOUDINARY_API_KEY="your-api-key"
+ CLOUDINARY_API_SECRET="your-api-secret"
```

**`package.json`**

```diff
  "dependencies": {
+   "cloudinary": "^2.x.x",
    ...
  }
```

### 2. 이미지 저장 방식 변경

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 저장 위치 | DB (base64) | Cloudinary URL |
| DB 용량 | 550+ MB | ~10 MB |
| 로딩 속도 | 느림 (base64 파싱) | 빠름 (CDN) |
| 확장성 | 제한적 | 무제한 (외부 저장소) |

---

## Fallback 동작

Cloudinary가 설정되지 않은 경우 (로컬 개발 등):

1. `isCloudinaryConfigured()` → `false` 반환
2. `uploadGeneratedImage()` → base64 data URL 반환 (기존 방식)
3. 기존 로컬 개발 환경과 동일하게 동작

```typescript
// image-upload-service.ts
export async function uploadGeneratedImage(...) {
  if (isCloudinaryConfigured()) {
    // Cloudinary에 업로드
    return { url: cloudinaryUrl, ... };
  }
  // Fallback: base64 data URL
  return { url: base64DataUrl, ... };
}
```

---

## 배포 후 확인 사항

### 1. 기본 동작 확인

- [ ] 홈페이지 접속 가능
- [ ] 로그인/회원가입 동작
- [ ] 프로젝트 목록 로딩
- [ ] 새 프로젝트 생성

### 2. 이미지 생성 확인

- [ ] 상세페이지 생성 시 이미지가 Cloudinary URL로 저장되는지 확인
- [ ] Cloudinary Dashboard에서 업로드된 이미지 확인
- [ ] 이미지 로딩 속도 정상

### 3. 데이터베이스 확인

```sql
-- Vercel Postgres에서 확인
SELECT pg_size_pretty(pg_database_size('neondb'));
-- 예상: ~10 MB (이미지가 외부 저장되므로)
```

---

## 문제 해결

### 빌드 실패

```bash
# 로컬에서 빌드 테스트
npm run build
```

### 환경변수 누락

```bash
# Vercel에서 환경변수 확인
vercel env ls
```

### Prisma 오류

```bash
# Prisma 클라이언트 재생성
npx prisma generate

# 스키마 동기화
npx prisma db push
```

### Cloudinary 업로드 실패

1. 환경변수 확인 (CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET)
2. Cloudinary Dashboard에서 API 접근 권한 확인
3. 로그 확인: `[Cloudinary] Upload failed: ...`

---

## 비용 예상 (무료 티어 기준)

| 서비스 | 무료 한도 | 예상 사용량 | 상태 |
|--------|----------|-------------|------|
| Vercel | 100GB 대역폭/월 | ~10GB | 충분 |
| Vercel Postgres | 256MB 저장소 | ~10MB | 충분 |
| Cloudinary | 25GB 저장소 | ~1GB/월 | 충분 |

---

## 로컬 개발 환경과 공존

이 구조는 로컬 Docker 환경과 완벽히 공존합니다:

```bash
# 로컬 개발 (Docker)
docker-compose up -d
# → PostgreSQL 로컬, base64 이미지 (Cloudinary 미설정)

# Vercel 배포
git push origin main
# → Vercel Postgres, Cloudinary 이미지
```

환경변수만 다르게 설정하면 동일한 코드가 두 환경에서 모두 동작합니다.
