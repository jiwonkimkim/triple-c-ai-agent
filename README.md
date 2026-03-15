# Triple C - AI 마케팅 콘텐츠 에이전트

> **상품 상세페이지 제작 시간을 1시간 → 10분으로 단축하는 AI 기반 마케팅 콘텐츠 자동화 플랫폼**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com/)

---

## 프로젝트 소개

**Triple C (Contents · Copy · Creative)** 는 AI를 활용하여 마케팅 콘텐츠를 자동 생성하는 B2B/B2C 플랫폼입니다.

### 해결하고자 한 문제
- 상품 상세페이지 제작에 **평균 1시간 이상** 소요
- 디자이너/카피라이터 리소스 부족
- 브랜드 톤앤매너 일관성 유지 어려움

### 솔루션
| 기존 방식 | Triple C |
|----------|----------|
| 수동 디자인/카피 작성 | AI 자동 생성 (2개 버전) |
| 브랜드 가이드 수동 참조 | RAG 기반 브랜드 분석 자동 적용 |
| 단일 포맷 출력 | HTML, 이미지, GIF, MP4 다중 포맷 |

---

## 주요 기능

### 1. AI 상세페이지 자동 생성
- 상품 이미지/텍스트 입력 → **2개 버전 자동 생성**
- 섹션별 카피/이미지 AI 생성 (HERO, FEATURES, HOW_TO_USE 등)
- 프롬프트 기반 이미지 재생성 및 편집

### 2. RAG 기반 브랜드 분석
- 웹사이트 URL, 문서 업로드 → 자동 크롤링 및 청킹
- OpenAI Embeddings + 벡터 검색으로 브랜드 톤앤매너 추출
- 생성 시 브랜드 일관성 자동 적용

### 3. 에디터 & 내보내기
- 드래그 앤 드롭 블록 에디터
- 배경 제거, 이미지 리사이징
- HTML, PNG, GIF, MP4 다중 포맷 내보내기

### 4. 마켓플레이스
- 템플릿 판매/구매 시스템
- CLIP 기반 유사 이미지 검색
- 크레딧 기반 결제 시스템

---

## 기술 스택

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **State**: React Hook Form, Zustand

### Backend
- **API**: Next.js API Routes
- **Database**: PostgreSQL (Neon) + Prisma ORM
- **Auth**: NextAuth.js (JWT)
- **Storage**: Cloudinary (이미지), R2 (파일)

### AI & ML
- **Text Generation**: Google Gemini, OpenAI GPT-4, Anthropic Claude
- **Image Generation**: Google Gemini Image API
- **Embeddings**: OpenAI text-embedding-3-small
- **Image Search**: CLIP (Xenova/transformers.js)

### Infrastructure
- **Deployment**: Vercel (Frontend + API)
- **Database**: Neon Postgres (Serverless)
- **Container**: Docker Compose (개발 환경)
- **CI/CD**: GitHub Actions

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│    Login │ Dashboard │ Editor │ Marketplace                      │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Next.js Application (Vercel)                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  App Router (Frontend) + API Routes (Backend)            │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Services: AI │ Image │ RAG │ Payment                    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
   │  Neon    │  │Cloudinary│  │  Gemini  │  │  OpenAI  │
   │ Postgres │  │  (CDN)   │  │ (AI Gen) │  │(Embed)   │
   └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

> 상세 아키텍처: [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)

---

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 페이지
│   ├── (dashboard)/       # 대시보드
│   ├── api/               # API Routes
│   └── editor/            # 에디터 페이지
├── components/            # React 컴포넌트
│   ├── ui/               # shadcn/ui 기반 UI
│   ├── editor/           # 에디터 컴포넌트
│   └── dashboard/        # 대시보드 컴포넌트
├── services/             # 비즈니스 로직
│   ├── ai/              # AI 서비스 (Gemini, OpenAI)
│   ├── image/           # 이미지 처리
│   └── rag/             # RAG 파이프라인
├── lib/                  # 유틸리티
└── types/               # TypeScript 타입
```

---

## 실행 방법

### 1. 환경 설정

```bash
# 저장소 클론
git clone https://github.com/jiwonkimkim/triple-c-ai-agent.git
cd triple-c-ai-agent

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
```

### 2. 개발 서버 실행

```bash
# 개발 서버
npm run dev

# Docker 환경 (PostgreSQL 포함)
docker-compose up -d
```

### 3. 빌드 & 테스트

```bash
# 프로덕션 빌드
npm run build

# 린트
npm run lint

# 테스트
npm test
```

---

## 기술적 도전과 해결

### 1. AI 이미지 생성 품질 최적화
**문제**: Gemini 이미지 생성 시 텍스트 오버레이가 깨지는 현상
**해결**: 2-Step 파이프라인 구현 (이미지 생성 → 별도 오버레이 렌더링)

### 2. 브랜드 일관성 유지
**문제**: 다양한 브랜드의 톤앤매너를 자동으로 파악하기 어려움
**해결**: RAG 파이프라인 구축 (웹크롤링 → 청킹 → 임베딩 → 벡터 검색)

### 3. 실시간 에디터 성능
**문제**: 대용량 이미지 편집 시 렌더링 지연
**해결**: Canvas 기반 레이어 시스템 + 이미지 lazy loading

---

## 🔍 System State Transition Diagram (QA Analysis)

## 🔍 System State Transition Analysis (QA)

```mermaid
stateDiagram-v2
    direction TB

    [*] --> Lobby

    state "🏠 로비 (Lobby)" as Lobby {
        [*] --> COORDINATOR
        COORDINATOR --> DISCOVERY : Discovery 의도 감지
        DISCOVERY --> Await_L : await_input
        COORDINATOR --> Await_L : await_input
        Await_L --> [*]
    }

    Lobby --> InfoCollection : PROVIDE_INFO / CREATE 의도 감지

    state "📋 정보수집 (Info Collection)" as InfoCollection {
        [*] --> INTAKE
        INTAKE --> CLARIFIER : 모호한 답변 감지
        CLARIFIER --> INTAKE : 명확화 완료
        INTAKE --> SUGGESTER : 필드 누락
        SUGGESTER --> Await_IC : await_input
        INTAKE --> Await_IC : await_input
        INTAKE --> INTAKE_ERR : ⚠ API 실패
        INTAKE_ERR --> Await_IC
    }

    InfoCollection --> Planning : 필수 필드 완료

    state "🗂 기획 (Planning)" as Planning {
        [*] --> PLANNER
        PLANNER --> Await_PL : 플랜 제시
        PLANNER --> PLAN_ERR : ⚠ 플랜 생성 실패
        PLAN_ERR --> [*]
    }

    Planning --> GenConfirm : generate 선택
    Planning --> Feedback : modify 선택

    state "✅ 생성 확인" as GenConfirm {
        [*] --> DOUBLE_CHECK
        DOUBLE_CHECK --> Await_GC : confirm/modify
    }

    GenConfirm --> Generation : confirm 선택
    GenConfirm --> Feedback : modify 재선택

    state "⚙️ 생성 (Generation)" as Generation {
        [*] --> AI_GEN
        AI_GEN --> SAVE_DB : 생성 성공
        SAVE_DB --> COMPLETED : 저장 성공
        AI_GEN --> GEN_ERR : ⚠ API 실패
        GEN_ERR --> [*]
    }

    Generation --> Complete : 성공 리다이렉트
    Generation --> Feedback : 실패 시 피드백 위임
    Complete --> [*]

    state "🔄 피드백 (Feedback)" as Feedback {
        [*] --> ANALYZE_FB
        ANALYZE_FB --> FB_TO_PLAN : 기획 수정
        ANALYZE_FB --> FB_ERR : ⚠ 분석 실패
    }

    Feedback --> Planning : 수정 반영

---

## 팀 구성

| 이름 | 역할 | 담당 기능 |
|------|------|----------|
| 김지원 | Full-Stack | AI 이미지 생성, 에디터, 마켓플레이스, 프롬프트 엔지니어링 |
| 팀원2 | Backend | RAG 파이프라인, 브랜드 분석, CLIP 검색 |
| 팀원3 | Frontend | 대시보드, UI/UX |

---

## 문서

- [시스템 아키텍처](./SYSTEM_ARCHITECTURE.md)
- [아키텍처 다이어그램](./ARCHITECTURE_DIAGRAM.md)
- [배포 가이드](./DEPLOYMENT.md)
- [Docker 설정](./DOCKER_SETUP.md)
- [PRD](./Plan_prd_trd/PRD_TripleC_EN.md)
- [TRD](./Plan_prd_trd/TRD_TripleC_EN.md)

---

## 라이선스

이 프로젝트는 팀 프로젝트로 진행되었습니다.
