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

채팅 에이전트 시스템의 상태 전이를 LangGraph 소스코드 기반으로 분석한 다이어그램입니다.
QA 관점에서 **정상 경로(Happy Path)** 와 **예외 경로(Error Path)** 를 함께 표현합니다.

```mermaid
stateDiagram-v2
    direction TB

    [*] --> Lobby

    %% ── 🏠 로비 ─────────────────────────────────────────────
    state "🏠 로비 (Lobby)" as Lobby {
        [*]         --> COORDINATOR
        COORDINATOR --> DISCOVERY   : Discovery 의도 감지
        DISCOVERY   --> Await_L     : await_input (트렌드/시즌 선택지)
        COORDINATOR --> Await_L     : await_input (웰컴 메시지)
        Await_L     --> [*]
    }

    Lobby --> InfoCollection : PROVIDE_INFO / CREATE 의도 감지
    Lobby --> InfoCollection : Discovery 선택지 선택 완료

    %% ── 📋 정보수집 ──────────────────────────────────────────
    state "📋 정보수집 (Info Collection)" as InfoCollection {
        [*]        --> INTAKE
        INTAKE     --> CLARIFIER  : 모호한 답변 감지
        CLARIFIER  --> INTAKE     : continue (명확화 완료)
        CLARIFIER  --> Await_IC   : await_input (재질문)
        INTAKE     --> SUGGESTER  : 필드 누락 (category / copyLength 등)
        SUGGESTER  --> Await_IC   : await_input (순차 선택지 제시)
        INTAKE     --> Await_IC   : await_input (추가 질문 중)
        Await_IC   --> [*]

        INTAKE     --> INTAKE_ERR  : ⚠ LLM API 호출 실패 (Gemini 오류)
        INTAKE_ERR --> Await_IC    : 오류 메시지 반환 후 대기
        CLARIFIER  --> CLARIFY_ERR : ⚠ LLM API 호출 실패
        CLARIFY_ERR --> Await_IC   : 오류 메시지 반환 후 대기
    }

    InfoCollection --> Planning   : 필수 필드 완료 (productName · category · copyLength · imageModel)
    InfoCollection --> UPLOAD_ERR : ⚠ /api/upload 실패 (R2 오류 / 네트워크)
    UPLOAD_ERR     --> InfoCollection : toast 알림 후 재시도 가능

    %% ── 🗂 기획 ──────────────────────────────────────────────
    state "🗂 기획 (Planning)" as Planning {
        [*]          --> PLANNER
        PLANNER      --> PLAN_CONSULT : BEAUTY 카테고리 감지
        PLANNER      --> Await_PL     : 플랜 제시 await_input
        PLAN_CONSULT --> Await_PL     : 전문 플랜 제시 await_input
        Await_PL     --> [*]

        PLANNER      --> PLAN_ERR  : ⚠ LLM 플랜 생성 실패
        PLAN_CONSULT --> PLAN_ERR  : ⚠ LLM 전문 플랜 생성 실패
        PLAN_ERR     --> [*]
    }

    Planning   --> GenConfirm : generate 선택 (readyToGenerate=true)
    Planning   --> Feedback   : modify 선택 (modifyRequest 설정)
    Planning   --> Feedback   : ⚠ 기획 LLM 실패 → error 위임

    %% ── ✅ 생성 확인 (이중 확인 구조) ───────────────────────
    state "✅ 생성 확인 (Double-Check)" as GenConfirm {
        [*]          --> DOUBLE_CHECK
        DOUBLE_CHECK --> Await_GC : await_input (confirm / modify)
        Await_GC     --> [*]
    }

    GenConfirm --> Generation : confirm 선택 (confirmedGenerate=true)
    GenConfirm --> Feedback   : modify 재선택

    %% ── ⚙️ 생성 ────────────────────────────────────────────
    state "⚙️ 생성 (Generation)" as Generation {
        [*]         --> DUP_CHECK
        DUP_CHECK   --> SET_GEN    : 신규 요청
        DUP_CHECK   --> EXIST_PROJ : ⚠ 중복 요청 감지 (status=GENERATING)
        EXIST_PROJ  --> [*]

        SET_GEN     --> FIELD_VALID
        FIELD_VALID --> AI_GEN   : 필드 검증 통과
        FIELD_VALID --> GEN_ERR  : ⚠ 필수 필드 누락 (getMissingFields)

        AI_GEN      --> SAVE_DB   : AI 생성 성공 (generateDetailPage)
        SAVE_DB     --> DEDUCT_CR : DB 저장 (DetailPageVersion · ProjectVersion)
        DEDUCT_CR   --> COMPLETED : 크레딧 차감 (trialCredits--)
        COMPLETED   --> [*]

        AI_GEN    --> GEN_ERR : ⚠ AI API 타임아웃 / 실패
        SAVE_DB   --> GEN_ERR : ⚠ DB 오류 (Prisma)
        DEDUCT_CR --> GEN_ERR : ⚠ DB 오류 (크레딧 갱신 실패)
        GEN_ERR   --> [*]
    }

    Generation --> Complete  : nextAction=complete (에디터 리다이렉트)
    Generation --> Feedback  : nextAction=error (AI 생성 실패)
    Complete   --> [*]

    %% ── 🔄 피드백 ──────────────────────────────────────────
    state "🔄 피드백 (Feedback)" as Feedback {
        [*]        --> ANALYZE_FB
        ANALYZE_FB --> Await_FB   : clarification (의도 불명확)
        ANALYZE_FB --> FB_TO_PLAN : field_update / section_change
        ANALYZE_FB --> FB_REGEN   : regenerate
        Await_FB   --> [*]
        FB_TO_PLAN --> [*]
        FB_REGEN   --> [*]

        ANALYZE_FB --> FB_ERR  : ⚠ LLM 피드백 분석 실패
        FB_ERR     --> Await_FB : 오류 메시지 후 재입력 대기
    }

    Feedback --> Planning   : field_update / section_change
    Feedback --> Generation : regenerate
    Feedback --> End_Await  : await_input (clarification)
    End_Await --> [*]

    note right of Generation
        ⚠ 전역 예외 — QA 체크포인트
        ─────────────────────────────
        세션 만료       → 401 → 로그인 리다이렉트
        LLM Rate Limit  → Gemini 429 오류 (모든 LLM 호출 공통)
        Graph 재귀 한도 → 50회 초과 시 강제 종료 (recursionLimit)
        SSE 끊김        → 클라이언트 재연결 / 오류 표시 필요
    end note
```

### 단계별 예외 (QA 체크포인트)

| 단계 | 예외 | 코드 위치 | 실제 동작 |
|------|------|-----------|-----------|
| 정보수집 | LLM API 실패 (INTAKE/CLARIFIER) | `intake.ts` LLM 호출 블록 | 오류 메시지 → `await_input` |
| 정보수집 | `/api/upload` 실패 | `chat-input.tsx` → `route.ts` | toast 알림 후 재시도 가능 |
| 기획 | LLM 플랜 생성 실패 | `planner.ts` LLM 호출 블록 | `nextAction: error` → Feedback 위임 |
| 생성 | 중복 요청 (`status=GENERATING`) | `generator.ts:18` | 기존 프로젝트 반환, 신규 생성 차단 |
| 생성 | 필수 필드 누락 | `generator.ts:88` + `types.ts:484` | `GEN_ERR` → `nextAction: error` → Feedback |
| 생성 | AI API 타임아웃/실패 | `generator.ts:243` | `GEN_ERR` → Feedback으로 라우팅 |
| 생성 | DB 오류 | `generator.ts:129, 273, 334` | `GEN_ERR` → Feedback으로 라우팅 |
| 피드백 | LLM 피드백 분석 실패 | `feedback.ts` LLM 호출 블록 | 오류 메시지 → `await_input` |

### 전역 예외 (모든 단계 공통)

| 예외 | 발생 위치 | 트리거 조건 |
|------|-----------|-------------|
| 세션 만료 | `messages/route.ts` 상단 auth 체크 | NextAuth 세션 없음 → 401 |
| LLM Rate Limit | 모든 에이전트 LLM 호출 | Gemini 429 응답 |
| Graph 재귀 초과 | `graph.ts:325` `recursionLimit: 50` | 에이전트 루프 50회 |
| SSE 연결 끊김 | `route.ts` ReadableStream | 클라이언트 네트워크 단절 |

### ⚠ 주의해야 할 QA 취약 구간

1. **생성 확인 이중 구조** — `readyToGenerate=true` 후 COORDINATOR가 한 번 더 확인 메시지를 보내야 `confirmedGenerate=true`가 됨. 확인 없이 바로 생성 진입하는 경로 테스트 필요
2. **이미지 스킵 키워드 의존** — `route.ts`에서 `'스킵/건너뛰/없어...'` 키워드 매칭으로 스킵 처리. 다른 표현 사용 시 `waitingForImageUpload` 상태에 갇힘
3. **SUGGESTER 순차 루프** — 필드 완성 후 SUGGESTER가 다음 빈 필드로 계속 이동. 특정 필드 스킵 불가 시 무한 대기
4. **Graph 재귀 50회 한도** — COORDINATOR ↔ 에이전트 루프 + Feedback ↔ 재생성 반복 시 도달 가능

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
