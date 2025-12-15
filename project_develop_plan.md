# Triple C 프로젝트 개발 진행 기록

## 프로젝트 정보
- **프로젝트명**: Triple C Marketing Contents Agent
- **버전**: 0.1.0
- **기술 스택**: Next.js 14, TypeScript, Tailwind CSS, Prisma, NextAuth

---

## 개발 진행 현황

### 2025-12-15 (일)

---

#### 17:00 - 프로젝트 초기화 및 설정 파일 생성 ✅

**완료된 파일:**

| 파일명 | 설명 |
|--------|------|
| `package.json` | 프로젝트 의존성 및 스크립트 정의 |
| `tsconfig.json` | TypeScript 컴파일러 설정 |
| `next.config.js` | Next.js 설정 (이미지 도메인, CORS 등) |
| `tailwind.config.ts` | Tailwind CSS 커스텀 테마 및 애니메이션 |
| `postcss.config.js` | PostCSS 설정 |
| `.env.example` | 환경 변수 템플릿 |
| `.gitignore` | Git 제외 파일 설정 |

---

#### 17:30 - 타입 정의 파일 작성 ✅

**완료된 파일:**

| 파일명 | 설명 |
|--------|------|
| `src/types/index.ts` | 핵심 데이터 모델 타입 정의 |
| `src/types/api.ts` | API 요청/응답 타입 정의 |
| `src/types/next-auth.d.ts` | NextAuth 타입 확장 |

---

#### 18:00 - Prisma 스키마 및 데이터베이스 설정 ✅

**완료된 파일:**

| 파일명 | 설명 |
|--------|------|
| `prisma/schema.prisma` | 전체 데이터베이스 스키마 (18개 모델) |
| `prisma/seed.ts` | 시스템 템플릿 시드 데이터 (5개 카테고리) |
| `src/lib/prisma.ts` | Prisma 클라이언트 싱글톤 |

---

#### 18:30 - 인증 시스템 구현 (NextAuth + JWT) ✅

**완료된 파일:**

| 파일명 | 설명 |
|--------|------|
| `src/lib/auth.ts` | NextAuth 설정 (Google OAuth + Credentials) |
| `src/middleware.ts` | 인증 미들웨어 (라우트 보호) |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth API 핸들러 |
| `src/app/api/auth/signup/route.ts` | B2C/B2B 회원가입 API |
| `src/app/api/auth/verify-email/route.ts` | 이메일 인증 API |

---

#### 19:00 - API 라우트 구현 ✅

**완료된 파일:**

| 파일명 | 설명 |
|--------|------|
| `src/app/api/projects/route.ts` | 프로젝트 목록/생성 API |
| `src/app/api/projects/[id]/route.ts` | 프로젝트 상세/수정/삭제 API |
| `src/app/api/brands/route.ts` | 브랜드 프로필 목록/생성 API |
| `src/app/api/generate/detail-page/route.ts` | 상세 페이지 생성 API |
| `src/lib/validations.ts` | Zod 검증 스키마 모음 |
| `src/lib/utils.ts` | 유틸리티 함수 모음 |

---

#### 19:30 - AI 서비스 레이어 구현 ✅

**완료된 파일:**

| 파일명 | 설명 |
|--------|------|
| `src/services/ai/detail-page-generator.ts` | AI 상세 페이지 생성 서비스 |

---

#### 20:00 - UI 컴포넌트 라이브러리 설정 ✅

**완료된 파일:**

| 파일명 | 설명 |
|--------|------|
| `src/app/globals.css` | 전역 스타일 및 CSS 변수 (다크모드 포함) |
| `src/components/ui/button.tsx` | Button 컴포넌트 |
| `src/components/ui/input.tsx` | Input 컴포넌트 |
| `src/components/ui/label.tsx` | Label 컴포넌트 |
| `src/components/ui/card.tsx` | Card 컴포넌트 세트 |
| `src/components/ui/dialog.tsx` | Dialog 모달 컴포넌트 |
| `src/components/ui/toast.tsx` | Toast 알림 컴포넌트 |
| `src/components/ui/toaster.tsx` | Toaster 컨테이너 |
| `src/components/ui/select.tsx` | Select 드롭다운 컴포넌트 |
| `src/components/ui/avatar.tsx` | Avatar 컴포넌트 |
| `src/components/ui/textarea.tsx` | Textarea 컴포넌트 |
| `src/components/ui/dropdown-menu.tsx` | DropdownMenu 컴포넌트 |
| `src/components/ui/index.ts` | UI 컴포넌트 통합 export |
| `src/hooks/use-toast.ts` | Toast 훅 |

**구현된 UI 컴포넌트:**
- Button (variants: default, destructive, outline, secondary, ghost, link)
- Input, Textarea, Label (with error states)
- Card (Header, Title, Description, Content, Footer)
- Dialog (모달 시스템)
- Toast & Toaster (알림 시스템)
- Select (드롭다운)
- Avatar (프로필 이미지)
- DropdownMenu (컨텍스트 메뉴)

---

#### 20:30 - 페이지 및 레이아웃 구현 ✅

**완료된 파일:**

| 파일명 | 설명 |
|--------|------|
| `src/app/layout.tsx` | Root 레이아웃 (메타데이터, 폰트) |
| `src/app/providers.tsx` | 전역 Provider (Session, Theme, Query) |
| `src/app/page.tsx` | 랜딩 페이지 |
| `src/app/(auth)/login/page.tsx` | 로그인 페이지 |
| `src/app/(auth)/signup/page.tsx` | 회원가입 페이지 |
| `src/app/(dashboard)/layout.tsx` | 대시보드 레이아웃 (사이드바, 헤더) |
| `src/app/(dashboard)/dashboard/page.tsx` | 대시보드 메인 페이지 |
| `src/app/(dashboard)/dashboard/projects/page.tsx` | 프로젝트 목록 페이지 |
| `src/app/(dashboard)/dashboard/projects/new/page.tsx` | 새 프로젝트 생성 페이지 |

**구현된 페이지:**
- 랜딩 페이지: Hero, Features, How It Works, CTA 섹션
- 로그인: Google OAuth + 이메일/비밀번호 폼
- 회원가입: B2C/B2B 선택, 유효성 검증
- 대시보드: 통계 카드, 퀵 액션, 최근 프로젝트
- 프로젝트 목록: 검색, 그리드 뷰, 드롭다운 메뉴
- 새 프로젝트: 2단계 위자드 (프로젝트 정보 → 제품 정보)

**레이아웃 기능:**
- 반응형 사이드바 (모바일 토글)
- 사용자 드롭다운 메뉴
- 네비게이션 활성 상태
- SessionProvider, ThemeProvider, QueryClientProvider 통합

---

#### 21:00 - 에디터 컴포넌트 구현 ✅

**완료된 파일:**

| 파일명 | 설명 |
|--------|------|
| `src/stores/editor-store.ts` | Zustand 에디터 상태 관리 스토어 |
| `src/components/editor/blocks/heading-block.tsx` | 제목 블록 컴포넌트 (H1-H4) |
| `src/components/editor/blocks/text-block.tsx` | 텍스트 블록 컴포넌트 |
| `src/components/editor/blocks/image-block.tsx` | 이미지 블록 컴포넌트 (업로드, 캡션) |
| `src/components/editor/blocks/button-block.tsx` | 버튼 블록 컴포넌트 (3가지 스타일) |
| `src/components/editor/blocks/divider-block.tsx` | 구분선 블록 컴포넌트 |
| `src/components/editor/blocks/spacer-block.tsx` | 공백 블록 컴포넌트 |
| `src/components/editor/blocks/list-block.tsx` | 리스트 블록 컴포넌트 (bullet/number) |
| `src/components/editor/blocks/quote-block.tsx` | 인용문 블록 컴포넌트 |
| `src/components/editor/blocks/index.ts` | 블록 컴포넌트 통합 export |
| `src/components/editor/block-renderer.tsx` | 블록 타입별 렌더러 |
| `src/components/editor/editor-section.tsx` | 섹션 컴포넌트 (드래그앤드롭) |
| `src/components/editor/editor-toolbar.tsx` | 에디터 툴바 (Undo/Redo, 저장, 내보내기) |
| `src/components/editor/detail-page-editor.tsx` | 메인 에디터 컴포넌트 |
| `src/components/editor/index.ts` | 에디터 컴포넌트 통합 export |
| `src/hooks/use-auto-save.ts` | 자동 저장 훅 (30초 간격) |
| `src/app/api/projects/[id]/drafts/route.ts` | 드래프트 저장/조회 API |
| `src/app/api/projects/[id]/export/route.ts` | HTML/JSON 내보내기 API |
| `src/app/(dashboard)/dashboard/projects/[id]/page.tsx` | 프로젝트 상세 페이지 (에디터) |
| `src/app/(dashboard)/dashboard/projects/[id]/preview/page.tsx` | 프로젝트 미리보기 페이지 |

**구현된 기능:**
- 8가지 블록 타입 (heading, text, image, button, list, quote, divider, spacer)
- 블록 드래그앤드롭 재정렬
- 섹션 단위 관리 (추가, 삭제, 복제, 이동)
- 인라인 편집 (더블클릭으로 편집 모드)
- Undo/Redo 기능 (Ctrl+Z, Ctrl+Shift+Z)
- 자동 저장 (30초 간격, Ctrl+S 단축키)
- 반응형 프리뷰 (Desktop/Tablet/Mobile)
- HTML/JSON 내보내기
- 버전 히스토리 관리

---

#### 21:30 - RAG 파이프라인 구현 ✅

**완료된 파일:**

| 파일명 | 설명 |
|--------|------|
| `src/lib/pinecone.ts` | Pinecone 벡터 DB 클라이언트 설정 |
| `src/services/rag/text-chunker.ts` | 텍스트 청킹 유틸리티 (HTML 추출 포함) |
| `src/services/rag/embeddings.ts` | OpenAI 임베딩 생성 서비스 |
| `src/services/rag/web-crawler.ts` | 웹사이트 크롤링 서비스 |
| `src/services/rag/brand-context.ts` | 브랜드 컨텍스트 검색 서비스 |
| `src/services/rag/index.ts` | RAG 서비스 통합 export |
| `src/app/api/brands/[id]/knowledge/route.ts` | 브랜드 지식 베이스 API |

**구현된 기능:**
- Pinecone 벡터 데이터베이스 연동
- 웹사이트 크롤링 (단일 URL / 사이트 전체)
- HTML 텍스트 추출 및 정제
- 텍스트 청킹 (오버랩 지원, 토큰 기반)
- OpenAI text-embedding-3-small 임베딩 생성
- 브랜드별 네임스페이스 벡터 저장
- 유사도 기반 컨텍스트 검색
- 브랜드 지식 베이스 CRUD API

---

#### 22:00 - 실시간 진행 표시기 구현 ✅

**완료된 파일:**

| 파일명 | 설명 |
|--------|------|
| `src/stores/generation-store.ts` | 생성 작업 상태 관리 스토어 |
| `src/components/ui/progress.tsx` | Progress 바 컴포넌트 |
| `src/components/generation/generation-progress.tsx` | 단계별 진행 표시 컴포넌트 |
| `src/components/generation/generation-modal.tsx` | 생성 진행 모달 |
| `src/components/generation/index.ts` | Generation 컴포넌트 통합 export |
| `src/app/api/generate/stream/route.ts` | SSE 기반 스트리밍 생성 API |
| `src/hooks/use-generation.ts` | 생성 작업 훅 (SSE 소비) |

**구현된 기능:**
- Server-Sent Events (SSE) 기반 실시간 진행 스트리밍
- 단계별 진행 상태 표시 (6단계)
- Undo/Redo 지원 히스토리 관리
- 작업 완료/실패 알림
- 경과 시간 표시

---

#### 22:30 - 이미지 품질 옵션 구현 ✅

**완료된 파일:**

| 파일명 | 설명 |
|--------|------|
| `src/services/image/image-generator.ts` | DALL-E 3 이미지 생성 서비스 |
| `src/services/image/index.ts` | Image 서비스 통합 export |
| `src/components/generation/quality-selector.tsx` | 품질 선택 UI 컴포넌트 |

**구현된 기능:**
- Draft/HD 품질 옵션
- DALL-E 3 통합 (OpenAI)
- Hero/Feature/Lifestyle/Banner 이미지 타입
- 예상 생성 시간 표시

---

#### 23:00 - Motion/GIF 생성 기능 구현 ✅

**완료된 파일:**

| 파일명 | 설명 |
|--------|------|
| `src/services/motion/motion-generator.ts` | Motion/GIF 생성 서비스 |
| `src/services/motion/index.ts` | Motion 서비스 통합 export |
| `src/app/api/generate/motion/route.ts` | Motion 생성 API |
| `src/components/generation/motion-selector.tsx` | Motion 효과 선택 UI |
| `src/components/ui/slider.tsx` | Slider 컴포넌트 |

**구현된 기능:**
- 6가지 모션 효과 (Zoom, Pan, Rotate, Bounce, Fade, Parallax)
- 3단계 강도 조절 (Subtle, Moderate, Dramatic)
- GIF/MP4/WebM 출력 포맷
- CSS 애니메이션 프리뷰
- 이징 함수 선택

---

#### 23:30 - 프로젝트 히스토리 & 버전 관리 UI 구현 ✅

**완료된 파일:**

| 파일명 | 설명 |
|--------|------|
| `src/stores/history-store.ts` | 버전 히스토리 상태 관리 스토어 |
| `src/components/history/version-timeline.tsx` | 버전 타임라인 컴포넌트 |
| `src/components/history/version-compare.tsx` | 버전 비교 뷰 컴포넌트 |
| `src/components/history/history-panel.tsx` | 히스토리 패널 (통합 컴포넌트) |
| `src/components/history/index.ts` | History 컴포넌트 통합 export |
| `src/hooks/use-version-history.ts` | 버전 히스토리 훅 |
| `src/app/api/projects/[id]/versions/route.ts` | 버전 목록/생성 API |
| `src/app/api/projects/[id]/versions/[versionId]/restore/route.ts` | 버전 복원 API |

**구현된 기능:**
- 버전 타임라인 UI (시간순 정렬, 액션별 아이콘/색상)
- 두 버전 간 비교 뷰 (섹션/블록 단위 diff)
- 버전 복원 기능 (새 버전으로 기록)
- 자동 저장 지원 (interval 기반)
- 변경사항 요약 (추가/수정/삭제 카운트)

**Prisma 스키마 업데이트:**
- `ProjectVersion` 모델 추가 (버전 스냅샷 저장)
- `Project` 모델에 `content`, `currentVersion` 필드 추가
- `ProjectHistory` 모델 단순화 (액션 로깅용)
- `MotionJob` 모델 업데이트 (새 모션 효과 지원)

---

### Sprint 2 완료 ✅

---

#### 00:00 - 짧은 광고 영상 생성 기능 구현 ✅ (Sprint 3)

**완료된 파일:**

| 파일명 | 설명 |
|--------|------|
| `src/services/video/video-generator.ts` | Runway ML API 연동 영상 생성 서비스 |
| `src/services/video/index.ts` | Video 서비스 통합 export |
| `src/app/api/generate/video/route.ts` | 영상 생성 API |
| `src/components/video/video-style-selector.tsx` | 영상 스타일 선택 UI |
| `src/components/video/video-options.tsx` | 영상 옵션 (비율, 길이, 모션) UI |
| `src/components/video/video-generator.tsx` | 영상 생성 메인 컴포넌트 |
| `src/components/video/index.ts` | Video 컴포넌트 통합 export |

**구현된 기능:**
- Runway ML API 연동 (Image-to-Video)
- 5가지 영상 스타일 (시네마틱, 광고, 소셜미디어, 제품 쇼케이스, 라이프스타일)
- 4가지 화면 비율 (16:9, 9:16, 1:1, 4:5)
- 3단계 영상 길이 (4초, 8초, 16초)
- 3단계 모션 강도
- 참조 이미지 업로드
- 크레딧 기반 과금 시스템

---

#### 00:30 - 템플릿 마켓플레이스 구현 ✅ (Sprint 3)

**완료된 파일:**

| 파일명 | 설명 |
|--------|------|
| `src/app/api/templates/route.ts` | 템플릿 목록/생성 API |
| `src/app/api/templates/[id]/route.ts` | 템플릿 상세/수정/삭제 API |
| `src/app/api/templates/[id]/apply/route.ts` | 템플릿 적용 API |
| `src/components/templates/template-card.tsx` | 템플릿 카드 컴포넌트 |
| `src/components/templates/template-gallery.tsx` | 템플릿 갤러리 (마켓플레이스) |
| `src/components/templates/template-preview-modal.tsx` | 템플릿 미리보기 모달 |
| `src/components/templates/index.ts` | Templates 컴포넌트 통합 export |

**구현된 기능:**
- 템플릿 마켓플레이스 UI (그리드/페이지네이션)
- 카테고리별 필터링 (일반, 패션, 음식, 뷰티, 디지털)
- 검색 기능
- 템플릿 미리보기 (반응형 뷰포트)
- 프로젝트에 템플릿 적용
- 사용자 템플릿 생성/관리

---

#### 01:00 - 팀 협업 기능 구현 ✅ (Sprint 3)

**완료된 파일:**

| 파일명 | 설명 |
|--------|------|
| `src/app/api/workspaces/[id]/members/route.ts` | 워크스페이스 멤버 목록/초대 API |
| `src/app/api/workspaces/[id]/members/[memberId]/route.ts` | 멤버 역할 변경/제거 API |
| `src/components/team/member-list.tsx` | 팀 멤버 목록 컴포넌트 |
| `src/components/team/invite-member-dialog.tsx` | 멤버 초대 다이얼로그 |
| `src/components/team/team-panel.tsx` | 팀 관리 패널 |
| `src/components/team/index.ts` | Team 컴포넌트 통합 export |
| `src/components/ui/alert-dialog.tsx` | Alert Dialog 컴포넌트 |

**구현된 기능:**
- 워크스페이스 멤버 관리
- 역할 기반 권한 (소유자, 관리자, 편집자, 뷰어)
- 이메일로 멤버 초대
- 멤버 역할 변경
- 멤버 제거 / 워크스페이스 떠나기

---

### Sprint 3 완료 ✅

---

## 디렉토리 구조 (현재)

```
Triple_C/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── CLAUDE.md
├── README.md
├── GIT_GUIDE.md
├── project_develop_plan.md
├── Plan_prd_trd/
│   ├── PRD_TripleC_EN.md
│   └── TRD_TripleC_EN.md
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── src/
    ├── app/
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   └── signup/page.tsx
    │   ├── (dashboard)/
    │   │   ├── layout.tsx
    │   │   └── dashboard/
    │   │       ├── page.tsx
    │   │       └── projects/
    │   │           ├── page.tsx
    │   │           ├── new/page.tsx
    │   │           └── [id]/
    │   │               ├── page.tsx
    │   │               └── preview/page.tsx
    │   ├── api/
    │   │   ├── auth/
    │   │   │   ├── [...nextauth]/route.ts
    │   │   │   ├── signup/route.ts
    │   │   │   └── verify-email/route.ts
    │   │   ├── projects/
    │   │   │   ├── route.ts
    │   │   │   └── [id]/
    │   │   │       ├── route.ts
    │   │   │       ├── drafts/route.ts
    │   │   │       ├── export/route.ts
    │   │   │       └── versions/
    │   │   │           ├── route.ts
    │   │   │           └── [versionId]/
    │   │   │               └── restore/route.ts
    │   │   ├── brands/
    │   │   │   ├── route.ts
    │   │   │   └── [id]/
    │   │   │       └── knowledge/route.ts
    │   │   └── generate/
    │   │       ├── detail-page/route.ts
    │   │       ├── stream/route.ts
    │   │       └── motion/route.ts
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── providers.tsx
    ├── components/
    │   ├── editor/
    │   │   ├── blocks/
    │   │   │   ├── heading-block.tsx
    │   │   │   ├── text-block.tsx
    │   │   │   ├── image-block.tsx
    │   │   │   ├── button-block.tsx
    │   │   │   ├── divider-block.tsx
    │   │   │   ├── spacer-block.tsx
    │   │   │   ├── list-block.tsx
    │   │   │   ├── quote-block.tsx
    │   │   │   └── index.ts
    │   │   ├── block-renderer.tsx
    │   │   ├── editor-section.tsx
    │   │   ├── editor-toolbar.tsx
    │   │   ├── detail-page-editor.tsx
    │   │   └── index.ts
    │   ├── generation/
    │   │   ├── generation-progress.tsx
    │   │   ├── generation-modal.tsx
    │   │   ├── quality-selector.tsx
    │   │   ├── motion-selector.tsx
    │   │   └── index.ts
    │   ├── history/
    │   │   ├── version-timeline.tsx
    │   │   ├── version-compare.tsx
    │   │   ├── history-panel.tsx
    │   │   └── index.ts
    │   └── ui/
    │       ├── avatar.tsx
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── dialog.tsx
    │       ├── dropdown-menu.tsx
    │       ├── index.ts
    │       ├── input.tsx
    │       ├── label.tsx
    │       ├── progress.tsx
    │       ├── scroll-area.tsx
    │       ├── select.tsx
    │       ├── sheet.tsx
    │       ├── slider.tsx
    │       ├── textarea.tsx
    │       ├── toast.tsx
    │       ├── toaster.tsx
    │       └── tooltip.tsx
    ├── hooks/
    │   ├── use-toast.ts
    │   ├── use-auto-save.ts
    │   ├── use-generation.ts
    │   └── use-version-history.ts
    ├── lib/
    │   ├── auth.ts
    │   ├── pinecone.ts
    │   ├── prisma.ts
    │   ├── utils.ts
    │   └── validations.ts
    ├── middleware.ts
    ├── services/
    │   ├── ai/
    │   │   └── detail-page-generator.ts
    │   ├── image/
    │   │   ├── image-generator.ts
    │   │   └── index.ts
    │   ├── motion/
    │   │   ├── motion-generator.ts
    │   │   └── index.ts
    │   └── rag/
    │       ├── text-chunker.ts
    │       ├── embeddings.ts
    │       ├── web-crawler.ts
    │       ├── brand-context.ts
    │       └── index.ts
    ├── stores/
    │   ├── editor-store.ts
    │   ├── generation-store.ts
    │   └── history-store.ts
    └── types/
        ├── api.ts
        ├── index.ts
        └── next-auth.d.ts
```

---

## Sprint 로드맵 (PRD 기반)

### Sprint 1 - Core (완료) ✅
- [x] 프로젝트 설정
- [x] 타입 정의
- [x] 데이터베이스 스키마
- [x] 인증 시스템 (B2C/B2B)
- [x] 프로젝트 & 브랜드 프로필 관리
- [x] 상세 페이지 자동 생성 (기본)
- [x] UI 컴포넌트 라이브러리
- [x] 페이지 및 레이아웃
- [x] 기본 에디터 v1
- [x] 브랜드 분석 RAG (기본)

### Sprint 2 - Templates & Motion (완료) ✅
- [x] 샘플 템플릿 (5개 카테고리 seed)
- [x] Motion/GIF 생성
- [x] 실시간 진행 표시기
- [x] 이미지 품질 옵션 (draft/HD)
- [x] 프로젝트 히스토리 & 버전 관리 UI 개선

### Sprint 3 - Video & Advanced (완료) ✅
- [x] 짧은 광고 영상 생성 (Runway ML)
- [x] 템플릿 마켓플레이스
- [x] 팀 협업 기능

### Sprint 4+ - (예정)
- [ ] 결제 시스템 (Stripe)
- [ ] 사용량 분석 대시보드
- [ ] A/B 테스트 기능
- [ ] 다국어 지원

---

## 완료된 파일 목록 (총 125개+)

### 설정 파일 (7개)
1. `package.json`
2. `tsconfig.json`
3. `next.config.js`
4. `tailwind.config.ts`
5. `postcss.config.js`
6. `.env.example`
7. `.gitignore`

### Prisma (2개)
8. `prisma/schema.prisma`
9. `prisma/seed.ts`

### 타입 정의 (3개)
10. `src/types/index.ts`
11. `src/types/api.ts`
12. `src/types/next-auth.d.ts`

### 라이브러리 (5개)
13. `src/lib/prisma.ts`
14. `src/lib/auth.ts`
15. `src/lib/pinecone.ts`
16. `src/lib/utils.ts`
17. `src/lib/validations.ts`

### API 라우트 (14개)
18. `src/app/api/auth/[...nextauth]/route.ts`
19. `src/app/api/auth/signup/route.ts`
20. `src/app/api/auth/verify-email/route.ts`
21. `src/app/api/projects/route.ts`
22. `src/app/api/projects/[id]/route.ts`
23. `src/app/api/projects/[id]/drafts/route.ts`
24. `src/app/api/projects/[id]/export/route.ts`
25. `src/app/api/projects/[id]/versions/route.ts`
26. `src/app/api/projects/[id]/versions/[versionId]/restore/route.ts`
27. `src/app/api/brands/route.ts`
28. `src/app/api/brands/[id]/knowledge/route.ts`
29. `src/app/api/generate/detail-page/route.ts`
30. `src/app/api/generate/stream/route.ts`
31. `src/app/api/generate/motion/route.ts`

### AI 서비스 (1개)
32. `src/services/ai/detail-page-generator.ts`

### RAG 서비스 (5개)
33. `src/services/rag/text-chunker.ts`
34. `src/services/rag/embeddings.ts`
35. `src/services/rag/web-crawler.ts`
36. `src/services/rag/brand-context.ts`
37. `src/services/rag/index.ts`

### Image 서비스 (2개)
38. `src/services/image/image-generator.ts`
39. `src/services/image/index.ts`

### Motion 서비스 (2개)
40. `src/services/motion/motion-generator.ts`
41. `src/services/motion/index.ts`

### UI 컴포넌트 (18개)
42. `src/app/globals.css`
43. `src/components/ui/button.tsx`
44. `src/components/ui/input.tsx`
45. `src/components/ui/label.tsx`
46. `src/components/ui/card.tsx`
47. `src/components/ui/dialog.tsx`
48. `src/components/ui/toast.tsx`
49. `src/components/ui/toaster.tsx`
50. `src/components/ui/select.tsx`
51. `src/components/ui/avatar.tsx`
52. `src/components/ui/textarea.tsx`
53. `src/components/ui/dropdown-menu.tsx`
54. `src/components/ui/progress.tsx`
55. `src/components/ui/scroll-area.tsx`
56. `src/components/ui/sheet.tsx`
57. `src/components/ui/slider.tsx`
58. `src/components/ui/tooltip.tsx`
59. `src/components/ui/index.ts`

### 에디터 컴포넌트 (14개)
60. `src/components/editor/blocks/heading-block.tsx`
61. `src/components/editor/blocks/text-block.tsx`
62. `src/components/editor/blocks/image-block.tsx`
63. `src/components/editor/blocks/button-block.tsx`
64. `src/components/editor/blocks/divider-block.tsx`
65. `src/components/editor/blocks/spacer-block.tsx`
66. `src/components/editor/blocks/list-block.tsx`
67. `src/components/editor/blocks/quote-block.tsx`
68. `src/components/editor/blocks/index.ts`
69. `src/components/editor/block-renderer.tsx`
70. `src/components/editor/editor-section.tsx`
71. `src/components/editor/editor-toolbar.tsx`
72. `src/components/editor/detail-page-editor.tsx`
73. `src/components/editor/index.ts`

### Generation 컴포넌트 (5개)
74. `src/components/generation/generation-progress.tsx`
75. `src/components/generation/generation-modal.tsx`
76. `src/components/generation/quality-selector.tsx`
77. `src/components/generation/motion-selector.tsx`
78. `src/components/generation/index.ts`

### History 컴포넌트 (4개)
79. `src/components/history/version-timeline.tsx`
80. `src/components/history/version-compare.tsx`
81. `src/components/history/history-panel.tsx`
82. `src/components/history/index.ts`

### Hooks (4개)
83. `src/hooks/use-toast.ts`
84. `src/hooks/use-auto-save.ts`
85. `src/hooks/use-generation.ts`
86. `src/hooks/use-version-history.ts`

### 스토어 (3개)
87. `src/stores/editor-store.ts`
88. `src/stores/generation-store.ts`
89. `src/stores/history-store.ts`

### 페이지 및 레이아웃 (11개)
90. `src/app/layout.tsx`
91. `src/app/providers.tsx`
92. `src/app/page.tsx`
93. `src/app/(auth)/login/page.tsx`
94. `src/app/(auth)/signup/page.tsx`
95. `src/app/(dashboard)/layout.tsx`
96. `src/app/(dashboard)/dashboard/page.tsx`
97. `src/app/(dashboard)/dashboard/projects/page.tsx`
98. `src/app/(dashboard)/dashboard/projects/new/page.tsx`
99. `src/app/(dashboard)/dashboard/projects/[id]/page.tsx`
100. `src/app/(dashboard)/dashboard/projects/[id]/preview/page.tsx`

### 미들웨어 (1개)
101. `src/middleware.ts`

### 문서 (2개)
102. `CLAUDE.md`
103. `project_develop_plan.md`

---

## 참고 문서
- [PRD_TripleC_EN.md](./Plan_prd_trd/PRD_TripleC_EN.md)
- [TRD_TripleC_EN.md](./Plan_prd_trd/TRD_TripleC_EN.md)
- [CLAUDE.md](./CLAUDE.md)
- [GIT_GUIDE.md](./GIT_GUIDE.md)
