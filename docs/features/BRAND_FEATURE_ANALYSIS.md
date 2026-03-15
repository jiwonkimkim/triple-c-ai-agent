# Triple C 브랜드 기능 분석

## 개요

브랜드 프로필은 **AI가 콘텐츠 생성할 때 참고하는 가이드라인**입니다.

### 핵심 흐름

```
1. 브랜드 생성 (가이드라인 저장)
        ↓
2. 프로젝트 생성 시 브랜드 연결
        ↓
3. 상세페이지 AI 생성 시 브랜드 정보 참조
        ↓
4. 브랜드에 맞는 카피/이미지 생성
```

---

## 브랜드 생성

### 전체 흐름

```
/dashboard/brands → "새 브랜드" 클릭 → /dashboard/brands/new → 폼 작성 → POST /api/brands → DB 저장
```

### 입력 필드

| 필드 | 필수 | 설명 | 최대 길이 |
|-----|-----|------|----------|
| `name` | ✅ | 브랜드명 | 100자 |
| `identity` | ✅ | 브랜드 아이덴티티 (핵심 가치, 미션) | 2000자 |
| `toneAndManner` | ✅ | 톤앤매너 (말투, 분위기) | 2000자 |
| `imageKeywords` | ✅ | 이미지 키워드 | 최소 1개, 최대 10개 |
| `websiteUrl` | ❌ | 웹사이트 URL | - |
| `instagramUrl` | ❌ | 인스타그램 URL | - |

### AI 활용 예시

| 브랜드 정보 | 입력 예시 | AI가 활용하는 방식 |
|------------|----------|-------------------|
| **아이덴티티** | "자연주의 화장품, 비건 인증" | 카피에 "자연 유래 성분", "동물실험 NO" 반영 |
| **톤앤매너** | "친근하고 따뜻한 말투, ~해요체" | "피부가 좋아져요~" 스타일로 작성 |
| **이미지 키워드** | "깨끗한, 자연, 그린톤" | 이미지 생성 시 초록색 계열, 자연 배경 적용 |

### 현재 상태

- **AI 개입 없음**: 모든 필드 수동 입력
- 브랜드 생성 시점에서는 AI 자동 생성/추천 기능 없음

---

## 브랜드 상세 페이지 (3개 탭)

브랜드 생성 후 `/dashboard/brands/[id]` 페이지

### 1. 기본 정보 탭

**역할**: 브랜드 프로필 수정

| 항목 | 설명 |
|-----|------|
| 브랜드명 | 브랜드 이름 |
| 아이덴티티 | 브랜드 핵심 가치, 미션 |
| 톤앤매너 | 말투, 분위기 스타일 |
| 이미지 키워드 | 이미지 생성 시 스타일 가이드 |
| URL | 웹사이트/인스타그램 주소 |

→ 생성할 때 입력한 정보를 수정하는 곳

---

### 2. 지식베이스 탭 (RAG)

**역할**: 브랜드 관련 자료를 AI가 학습할 수 있게 저장

```
URL 크롤링 또는 문서 업로드 → 텍스트 추출 → 청크 분할 → 벡터 DB 저장
```

| 기능 | 설명 |
|-----|------|
| **URL 크롤링** | 웹사이트/인스타그램에서 텍스트 자동 수집 |
| **문서 업로드** | PDF, 브랜드 가이드 등 직접 업로드 |
| **청크 관리** | 저장된 텍스트 조각 확인/삭제 |

**활용 예시**:
- 공식 홈페이지 크롤링 → 제품 설명, 브랜드 스토리 저장
- 브랜드 가이드라인 PDF 업로드
- AI가 상세페이지 생성 시 이 자료 참고하여 더 정확한 카피 작성

→ **AI에게 브랜드 지식을 먹이는 곳**

---

### 3. 프로젝트 탭

**역할**: 이 브랜드를 사용하는 프로젝트 목록

| 표시 내용 | 설명 |
|----------|------|
| 프로젝트 제목 | 연결된 프로젝트 이름 |
| 업데이트 날짜 | 마지막 수정일 |
| 바로가기 | 클릭 시 해당 프로젝트로 이동 |

**흐름**:
```
프로젝트 생성 시 브랜드 선택 → 여기에 자동으로 표시됨
```

→ **이 브랜드로 만든 작업물 모아보는 곳**

---

## 탭 요약

| 탭 | 한줄 정리 |
|----|----------|
| **기본 정보** | 브랜드 설정 수정 |
| **지식베이스** | AI 학습 자료 추가 (RAG) |
| **프로젝트** | 이 브랜드 사용한 프로젝트 목록 |

---

## 파일 구조

### 페이지

| 파일 | 역할 |
|-----|------|
| `src/app/(dashboard)/dashboard/brands/page.tsx` | 브랜드 목록 페이지 |
| `src/app/(dashboard)/dashboard/brands/new/page.tsx` | 브랜드 생성 페이지 |
| `src/app/(dashboard)/dashboard/brands/[id]/page.tsx` | 브랜드 상세/편집 페이지 (3개 탭) |

### 컴포넌트

| 파일 | 역할 |
|-----|------|
| `src/components/brands/brand-form.tsx` | 브랜드 폼 (생성/수정 공용) |
| `src/components/brands/brand-card.tsx` | 브랜드 카드 (목록용) |
| `src/components/brands/keyword-tag-input.tsx` | 키워드 태그 입력 |
| `src/components/brands/brand-rag-panel.tsx` | 지식베이스 관리 패널 |

### API

| 파일 | 역할 |
|-----|------|
| `src/app/api/brands/route.ts` | GET (목록), POST (생성) |
| `src/app/api/brands/[id]/route.ts` | GET (상세), PUT (수정), DELETE (삭제) |
| `src/app/api/brands/[id]/knowledge/route.ts` | 지식베이스 조회 |
| `src/app/api/brands/[id]/knowledge/upload/route.ts` | 문서 업로드 |
| `src/app/api/brands/[id]/knowledge/chunks/route.ts` | 청크 관리 |

### 데이터 모델

```prisma
model BrandProfile {
  id            String   @id @default(cuid())
  workspaceId   String?  // 팀 브랜드일 경우
  userId        String?  // 개인 브랜드일 경우
  name          String
  identity      String   @db.Text
  toneAndManner String   @db.Text
  imageKeywords String[]
  websiteUrl    String?
  instagramUrl  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  user           User?
  workspace      Workspace?
  projects       Project[]
  documentChunks BrandDocumentChunk[]  // RAG 청크
}
```

---

## 특이사항

1. **개인/팀 브랜드 구분**
   - `workspaceId` 있으면 팀 브랜드
   - `userId`만 있으면 개인 브랜드

2. **삭제 제한**
   - 연결된 프로젝트가 있으면 삭제 버튼 비활성화

3. **개발 환경 사용자 ID 동기화**
   - 세션 ID와 DB ID 불일치 시 이메일로 재검색

---

## 향후 개선 가능 사항

### AI 자동 생성 기능 추가

1. **URL 기반 자동 분석**
   - 웹사이트/인스타그램 URL 입력 → AI가 크롤링 후 아이덴티티, 톤앤매너, 키워드 자동 추출

2. **브랜드명으로 자동 검색**
   - 브랜드명 입력 → AI가 웹에서 정보 수집 → 나머지 필드 자동 완성

3. **간단한 설명으로 생성**
   - "20대 여성 타겟의 미니멀 화장품 브랜드" → AI가 전체 프로필 생성

---

*작성일: 2024-12-23*
*프로젝트: Triple C Marketing Contents Agent*
