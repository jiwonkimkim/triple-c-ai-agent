# Triple C - 시스템 아키텍처 문서

## 목차
1. [프로젝트 개요](#1-프로젝트-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [기술 스택](#3-기술-스택)
4. [배포 환경](#4-배포-환경)
5. [데이터베이스 설계](#5-데이터베이스-설계)
6. [API 구조](#6-api-구조)
7. [AI 서비스 통합](#7-ai-서비스-통합)
8. [보안 아키텍처](#8-보안-아키텍처)
9. [주요 기능 흐름](#9-주요-기능-흐름)

---

## 1. 프로젝트 개요

### 1.1 Triple C란?
**Triple C (Contents · Copy · Creative)** 는 AI 기반 마케팅 콘텐츠 에이전트 서비스입니다.

개인 크리에이터와 마케팅 팀이 상품 상세페이지와 프로모션 크리에이티브를 빠르게 생성, 편집, 내보내기 할 수 있도록 지원합니다.

### 1.2 핵심 가치
| 기존 방식 | Triple C |
|----------|----------|
| 상세페이지 제작 1시간+ | **10분 이내** |
| 디자이너/카피라이터 필요 | **AI 자동 생성** |
| 브랜드 일관성 유지 어려움 | **RAG 기반 브랜드 분석** |

### 1.3 주요 기능
- **상세페이지 자동 생성**: 상품 이미지/텍스트 입력 → 2개 버전 자동 생성
- **브랜드 일관성 유지**: RAG 기반 브랜드 톤앤매너 분석 및 적용
- **에디터**: 텍스트/이미지 편집, 배경 제거, 프롬프트 기반 이미지 생성
- **다양한 내보내기**: HTML, 이미지, GIF, MP4 지원
- **B2C/B2B 지원**: 개인 사용자 및 팀/워크스페이스 기능

---

## 2. 시스템 아키텍처

### 2.1 전체 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              클라이언트 (Browser)                            │
│                                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│   │   로그인    │    │  대시보드   │    │   에디터    │    │  마켓플레이스│ │
│   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Vercel Edge Network                               │
│                          (CDN + Edge Functions)                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Next.js Application (Vercel)                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        App Router (Frontend)                          │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────┐  │   │
│  │  │ (auth)     │  │ (dashboard)│  │ (editor)   │  │ (marketplace)  │  │   │
│  │  │ - login    │  │ - projects │  │ - canvas   │  │ - templates    │  │   │
│  │  │ - signup   │  │ - brands   │  │ - layers   │  │ - purchases    │  │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        API Routes (Backend)                           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │ /auth    │ │/projects │ │/generate │ │ /brands  │ │/templates│   │   │
│  │  │ /billing │ │/settings │ │/ai/edit  │ │/analytics│ │/seller   │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         Services Layer                                │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐  │   │
│  │  │ AI Services    │  │ Image Services │  │ RAG Services           │  │   │
│  │  │ - Gemini       │  │ - Generation   │  │ - Brand Analysis       │  │   │
│  │  │ - OpenAI       │  │ - Processing   │  │ - Document Chunking    │  │   │
│  │  │ - Anthropic    │  │ - Cloudinary   │  │ - Vector Search        │  │   │
│  │  └────────────────┘  └────────────────┘  └────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
         │                    │                         │
         ▼                    ▼                         ▼
┌─────────────────┐  ┌─────────────────┐       ┌─────────────────┐
│  Neon Postgres  │  │   Cloudinary    │       │   AI Services   │
│  (Database)     │  │ (Image Storage) │       │                 │
│                 │  │                 │       │ ┌─────────────┐ │
│ - Users         │  │ - Product Images│       │ │Google Gemini│ │
│ - Projects      │  │ - Generated     │       │ │ - Text Gen  │ │
│ - Templates     │  │ - Thumbnails    │       │ │ - Image Gen │ │
│ - Workspaces    │  │                 │       │ └─────────────┘ │
│ - Brands        │  │                 │       │ ┌─────────────┐ │
│ - Payments      │  │                 │       │ │   OpenAI    │ │
│                 │  │                 │       │ │ - Embeddings│ │
└─────────────────┘  └─────────────────┘       │ │ - DALL-E    │ │
                                               │ └─────────────┘ │
                                               │ ┌─────────────┐ │
                                               │ │  Anthropic  │ │
                                               │ │ - Claude    │ │
                                               │ └─────────────┘ │
                                               └─────────────────┘
```

### 2.2 아키텍처 패턴

#### Monolithic Architecture (현재)
- Next.js App Router를 활용한 풀스택 모놀리식 구조
- 프론트엔드와 백엔드가 단일 배포 단위
- 빠른 개발 및 배포에 최적화

#### 향후 확장 계획
```
현재: Monolithic (Next.js)
  ↓
Phase 2: API 분리 (FastAPI/Go for AI Engine)
  ↓
Phase 3: Microservices (필요시)
```

---

## 3. 기술 스택

### 3.1 Frontend

| 기술 | 버전 | 용도 |
|-----|------|-----|
| **Next.js** | 14.x | React 프레임워크 (App Router) |
| **TypeScript** | 5.x | 타입 안정성 |
| **Tailwind CSS** | 3.x | 유틸리티 기반 스타일링 |
| **shadcn/ui** | - | UI 컴포넌트 라이브러리 |
| **React Hook Form** | 7.x | 폼 상태 관리 |
| **Zod** | 3.x | 스키마 유효성 검사 |

### 3.2 Backend

| 기술 | 버전 | 용도 |
|-----|------|-----|
| **Next.js API Routes** | 14.x | REST API 엔드포인트 |
| **Prisma** | 5.x | ORM & 데이터베이스 마이그레이션 |
| **NextAuth.js** | 4.x | 인증 & 세션 관리 |
| **bcryptjs** | - | 비밀번호 해싱 |

### 3.3 Database & Storage

| 서비스 | 용도 | 특징 |
|-------|-----|------|
| **Neon Postgres** | 메인 데이터베이스 | Serverless PostgreSQL |
| **Cloudinary** | 이미지 저장소 | 25GB 무료, CDN 포함 |

### 3.4 AI & External APIs

| 서비스 | 모델 | 용도 |
|-------|-----|------|
| **Google Gemini** | gemini-2.0-flash | 텍스트 생성, 상세페이지 카피 |
| **Google Gemini** | gemini-2.5-flash-image | 이미지 생성 |
| **OpenAI** | text-embedding-3-small | RAG 임베딩 |
| **OpenAI** | DALL-E 3 | 이미지 생성 (대체) |
| **Anthropic** | Claude 3.5 | 텍스트 편집/개선 |

### 3.5 배포 & 인프라

| 서비스 | 용도 |
|-------|-----|
| **Vercel** | 호스팅 & 배포 |
| **GitHub** | 소스 코드 관리 |
| **GitHub Actions** | CI/CD (자동 배포) |

---

## 4. 배포 환경

### 4.1 배포 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Repository                         │
│                     (main branch = production)                   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ Push to main
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Vercel CI/CD Pipeline                       │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐   │
│  │ 1. Build      │→ │ 2. Test       │→ │ 3. Deploy         │   │
│  │ npm run build │  │ Type Check    │  │ Edge Network      │   │
│  └───────────────┘  └───────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Production Environment                       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Vercel Edge Network                     │   │
│  │  • Global CDN (서울, 도쿄, 싱가포르 등)                  │   │
│  │  • Automatic HTTPS                                       │   │
│  │  • DDoS Protection                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                               │                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │ Serverless      │  │ Neon Postgres   │  │ Cloudinary    │  │
│  │ Functions       │  │ (us-east-1)     │  │ (Global CDN)  │  │
│  │ (Edge Runtime)  │  │ • Connection    │  │ • 25GB Free   │  │
│  │                 │  │   Pooling       │  │ • Auto-resize │  │
│  └─────────────────┘  └─────────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 환경변수 구성

```bash
# 인증
NEXTAUTH_URL=https://triple-c.vercel.app
NEXTAUTH_SECRET=<generated-secret>

# 데이터베이스
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# 이미지 저장소
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# AI API Keys
GOOGLE_GENERATIVE_AI_API_KEY=<gemini-api-key>
OPENAI_API_KEY=<openai-api-key>
ANTHROPIC_API_KEY=<anthropic-api-key>

# 개발자 모드 (선택)
NEXT_PUBLIC_DEV_MODE=true
```

### 4.3 배포 URL

| 환경 | URL | 용도 |
|-----|-----|-----|
| Production | https://triple-c.vercel.app | 실서비스 |
| Preview | https://triple-c-*-*.vercel.app | PR 미리보기 |
| Local | http://localhost:3000 | 개발 환경 |

### 4.4 무료 티어 사용량

| 서비스 | 무료 한도 | 현재 사용 |
|-------|----------|----------|
| Vercel | 100GB 대역폭/월 | - |
| Neon Postgres | 0.5GB 스토리지 | - |
| Cloudinary | 25GB 스토리지 | - |
| Gemini API | 15 RPM (무료) | - |

---

## 5. 데이터베이스 설계

### 5.1 ERD (Entity Relationship Diagram)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │    Workspace    │       │    Company      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │──┐    │ id              │       │ id              │
│ email           │  │    │ name            │       │ name            │
│ name            │  │    │ ownerId      ───┼───────│ domain          │
│ userType (B2C/B2B)│  │    │ companyId    ───┼───────│ size            │
│ plan            │  │    └─────────────────┘       └─────────────────┘
│ credits         │  │
└─────────────────┘  │
         │           │
         │           │    ┌─────────────────┐
         │           └───▶│ WorkspaceMember │
         │                ├─────────────────┤
         │                │ workspaceId     │
         │                │ userId          │
         │                │ role            │
         │                └─────────────────┘
         │
         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    Project      │       │  BrandProfile   │       │    Template     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │       │ id              │
│ title           │◀──────│ name            │       │ name            │
│ ownerId         │       │ identity        │       │ category        │
│ brandProfileId  │       │ toneAndManner   │       │ price           │
│ content (JSON)  │       │ imageKeywords   │       │ isPublished     │
│ productName     │       └─────────────────┘       └─────────────────┘
│ category        │                │
└─────────────────┘                │
         │                         ▼
         │            ┌─────────────────────┐
         │            │ BrandDocumentChunk  │
         │            ├─────────────────────┤
         │            │ id                  │
         │            │ brandProfileId      │
         │            │ source (WEBSITE/    │
         │            │         INSTAGRAM/  │
         │            │         UPLOAD)     │
         │            │ content             │
         │            │ vectorId            │
         │            └─────────────────────┘
         │
         ▼
┌─────────────────┐       ┌─────────────────┐
│ DetailPageVersion│       │  ProjectVersion │
├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │
│ projectId       │       │ projectId       │
│ versionNumber   │       │ versionNumber   │
│ hookMessage     │       │ action          │
│ sections (JSON) │       │ content (JSON)  │
│ status          │       │ createdById     │
└─────────────────┘       └─────────────────┘
```

### 5.2 핵심 모델 설명

#### User (사용자)
- B2C(개인) / B2B(기업) 사용자 구분
- 무료/유료 플랜 관리
- 크레딧 기반 과금 시스템

#### Project (프로젝트)
- 상세페이지 프로젝트 단위
- 상품 정보 저장 (재생성용)
- 버전 히스토리 관리

#### BrandProfile (브랜드 프로필)
- 브랜드 아이덴티티 및 톤앤매너
- RAG 문서 청크와 연결
- 일관된 브랜드 콘텐츠 생성에 활용

#### Template (템플릿)
- 시스템/사용자 생성 템플릿
- 마켓플레이스 판매 기능
- 카테고리별 분류

---

## 6. API 구조

### 6.1 API 엔드포인트 맵

```
/api
├── /auth
│   ├── [...nextauth]     # NextAuth 핸들러
│   ├── /signup           # POST: 회원가입
│   └── /record-session   # POST: 세션 기록
│
├── /projects
│   ├── GET               # 프로젝트 목록
│   ├── POST              # 프로젝트 생성
│   └── /[id]
│       ├── GET/PUT/DELETE # 프로젝트 CRUD
│       ├── /content       # 콘텐츠 조회/수정
│       ├── /drafts        # 에디터 드래프트
│       ├── /versions      # 버전 히스토리
│       └── /export        # 내보내기
│
├── /generate
│   ├── /detail-page      # POST: 상세페이지 생성
│   ├── /stream           # POST: 스트리밍 생성
│   ├── /image            # POST: 이미지 생성
│   ├── /motion           # POST: 모션/GIF 생성
│   └── /video            # POST: 비디오 생성
│
├── /ai
│   └── /edit             # POST: AI 텍스트/이미지 편집
│
├── /brands
│   ├── GET/POST          # 브랜드 목록/생성
│   └── /[id]
│       ├── GET/PUT/DELETE
│       └── /knowledge    # RAG 문서 관리
│
├── /templates
│   ├── GET               # 템플릿 목록
│   └── /[id]
│       ├── GET           # 템플릿 상세
│       └── /apply        # 템플릿 적용
│
├── /marketplace
│   ├── /templates        # 마켓플레이스 템플릿
│   └── /purchases        # 구매 내역
│
├── /billing
│   ├── /checkout         # 결제 세션 생성
│   ├── /subscription     # 구독 관리
│   ├── /credits          # 크레딧 조회
│   └── /webhook          # Stripe 웹훅
│
├── /settings
│   ├── /account          # 계정 설정
│   ├── /profile          # 프로필 설정
│   ├── /password         # 비밀번호 변경
│   ├── /2fa              # 2단계 인증
│   ├── /sessions         # 활성 세션 관리
│   └── /workspaces       # 워크스페이스 관리
│
├── /analytics
│   └── /usage            # 사용량 분석
│
└── /seller
    ├── /dashboard        # 판매자 대시보드
    ├── /balance          # 수익 잔액
    └── /withdraw         # 출금 요청
```

### 6.2 API 응답 형식

```typescript
// 성공 응답
{
  "success": true,
  "data": { ... }
}

// 에러 응답
{
  "success": false,
  "error": "에러 메시지",
  "details": "상세 정보 (개발 환경에서만)"
}
```

---

## 7. AI 서비스 통합

### 7.1 AI 서비스 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Orchestration Layer                        │
│              (src/services/ai/orchestration-service.ts)          │
└─────────────────────────────────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Text Generator │  │ Image Generator │  │  RAG Service    │
│                 │  │                 │  │                 │
│ • Gemini 2.0    │  │ • Gemini Image  │  │ • Embeddings    │
│ • Claude 3.5    │  │ • DALL-E 3      │  │ • Vector Search │
│ • Groq          │  │                 │  │ • Chunking      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 7.2 상세페이지 생성 파이프라인

```
1. 입력 수집
   ├── 상품 이미지 (Cloudinary 업로드)
   ├── 상품 정보 (이름, 카테고리, 특징)
   └── 브랜드 프로필 ID (선택)

2. 브랜드 컨텍스트 로드 (RAG)
   ├── 브랜드 프로필 조회
   ├── 관련 문서 청크 검색 (Vector Search)
   └── 톤앤매너 컨텍스트 구성

3. 콘텐츠 생성 (Gemini/Claude)
   ├── 훅 메시지 생성
   ├── 섹션별 카피 생성
   │   ├── HERO (히어로)
   │   ├── FEATURES (특징)
   │   ├── SOCIAL_PROOF (소셜 프루프)
   │   ├── HOW_TO_USE (사용법)
   │   └── FAQ (자주 묻는 질문)
   └── 이미지 프롬프트 생성

4. 이미지 생성 (Gemini Image)
   ├── 배경 이미지
   └── 섹션별 보조 이미지

5. 결과 조합 및 저장
   ├── DetailPageVersion 생성
   └── Project 업데이트
```

### 7.3 RAG (Retrieval-Augmented Generation)

```
브랜드 문서 수집                벡터 저장소              콘텐츠 생성
┌─────────────┐            ┌─────────────┐        ┌─────────────┐
│ 웹사이트    │───┐        │             │        │             │
│ 크롤링     │   │        │   OpenAI    │        │   Gemini    │
├─────────────┤   │        │  Embeddings │        │   Claude    │
│ Instagram  │───┼──────▶ │             │──────▶ │             │
│ 피드       │   │        │ (1536 dim)  │        │ + 브랜드    │
├─────────────┤   │        │             │        │   컨텍스트  │
│ PDF/문서   │───┘        │             │        │             │
│ 업로드     │            └─────────────┘        └─────────────┘
└─────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│           Text Chunking                  │
│  • 500-1000 characters per chunk        │
│  • Overlap: 100 characters              │
│  • Metadata: source, timestamp          │
└─────────────────────────────────────────┘
```

---

## 8. 보안 아키텍처

### 8.1 인증 흐름

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  NextAuth   │────▶│  Database   │
│             │     │  Middleware │     │  (Users)    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   │ JWT Token
       │                   ▼
       │            ┌─────────────┐
       │            │   Session   │
       │            │   Cookie    │
       │            │ (httpOnly,  │
       │            │  secure,    │
       │            │  sameSite)  │
       │            └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────────────────────────────────┐
│            Protected Routes              │
│  /dashboard, /projects, /settings        │
└─────────────────────────────────────────┘
```

### 8.2 보안 기능

| 기능 | 구현 |
|-----|-----|
| **비밀번호 해싱** | bcrypt (12 rounds) |
| **세션 관리** | JWT + Secure Cookie |
| **HTTPS** | Vercel 자동 적용 |
| **CSRF 보호** | NextAuth 내장 |
| **2FA** | TOTP (선택적) |
| **Rate Limiting** | Vercel Edge (기본) |

### 8.3 환경변수 보안

- 모든 API 키는 서버사이드에서만 접근
- `NEXT_PUBLIC_` 접두사가 없는 변수는 클라이언트에 노출되지 않음
- Vercel 환경변수 암호화 저장

---

## 9. 주요 기능 흐름

### 9.1 프로젝트 생성 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                     새 프로젝트 생성 흐름                        │
└─────────────────────────────────────────────────────────────────┘

[1] 사용자 입력
    │
    ├── 프로젝트 정보 (제목, 설명)
    ├── 상품 정보 (이름, 카테고리, 특징, 타겟)
    ├── 상품 이미지 업로드
    ├── 브랜드 프로필 선택 (선택)
    └── 옵션 (카피 길이, 이미지 모델)
    │
    ▼
[2] 이미지 업로드 (Cloudinary)
    │
    ├── 클라이언트 → Cloudinary 직접 업로드
    └── URL 반환
    │
    ▼
[3] 프로젝트 생성 (DB)
    │
    └── Project 레코드 생성
    │
    ▼
[4] 상세페이지 생성 요청
    │
    ├── /api/generate/detail-page
    ├── 브랜드 컨텍스트 로드 (RAG)
    └── AI 콘텐츠 생성 시작
    │
    ▼
[5] AI 생성 (병렬 처리)
    │
    ├── 훅 메시지 생성
    ├── 섹션별 카피 생성
    └── 이미지 생성 (Gemini/DALL-E)
    │
    ▼
[6] 결과 저장
    │
    ├── DetailPageVersion 생성
    ├── Project.content 업데이트
    └── 버전 히스토리 기록
    │
    ▼
[7] 완료 → 에디터 페이지로 이동
```

### 9.2 에디터 자동 저장 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                      에디터 자동 저장 흐름                        │
└─────────────────────────────────────────────────────────────────┘

[사용자 편집]
    │
    ▼
[Debounce 30초]
    │
    ▼
[자동 저장 트리거]
    │
    ├── EditorDraft 업데이트 (실시간 드래프트)
    │
    └── 매 5분 또는 중요 변경 시
        │
        └── ProjectVersion 생성 (버전 히스토리)
```

### 9.3 이미지 생성/편집 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI 이미지 편집 흐름                           │
└─────────────────────────────────────────────────────────────────┘

[1] 사용자 요청
    │
    ├── 편집 유형: 배경 제거 / 스타일 변경 / 새 이미지 생성
    └── 프롬프트 입력 (선택)
    │
    ▼
[2] /api/ai/edit 호출
    │
    ├── 요청 유형 분석
    └── 적절한 AI 서비스 선택
    │
    ▼
[3] AI 처리
    │
    ├── Gemini Image → 새 이미지 생성
    ├── DALL-E 3 → 고품질 이미지 생성
    └── Background Removal → 배경 제거
    │
    ▼
[4] 결과 저장
    │
    ├── Cloudinary 업로드
    └── 프로젝트 콘텐츠 업데이트
    │
    ▼
[5] 클라이언트 업데이트
```

---

## 부록: 개발 명령어

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 타입 체크
npm run type-check

# 린트
npm run lint

# 데이터베이스 마이그레이션
npx prisma db push

# Prisma Studio (DB GUI)
npx prisma studio
```

---

*문서 버전: 1.0*
*최종 업데이트: 2025년 1월*
*작성: Triple C 개발팀*
