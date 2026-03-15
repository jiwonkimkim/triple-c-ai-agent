# 마켓플레이스 유사도 검색 아키텍처

## 1. 개요

템플릿 마켓플레이스에서 사용자 검색 쿼리에 대해 의미론적 유사도와 키워드 매칭을 결합한 하이브리드 검색 시스템입니다.

---

## 2. 아키텍처 흐름

### 2.1 전체 파이프라인

```
┌─────────────────────────────────────────────────────────────┐
│                      인덱싱 단계                              │
└─────────────────────────────────────────────────────────────┘

템플릿 발행 (publish)
        ↓
임베딩 텍스트 구성
├─ 이름 (2번 반복 = 가중치↑)
├─ 카테고리
├─ 설명
├─ 섹션 이미지 설명
└─ 태그
        ↓
Hugging Face API 호출
(BAAI/bge-large-en-v1.5)
        ↓
1024차원 벡터 반환
        ↓
PostgreSQL 저장
├─ embedding (vector 타입)
└─ embedding_text (원본 텍스트)


┌─────────────────────────────────────────────────────────────┐
│                      검색 단계                               │
└─────────────────────────────────────────────────────────────┘

사용자 검색 쿼리 입력
        ↓
쿼리 임베딩 생성 (동일 모델)
        ↓
    ┌───────────┴───────────┐
    ↓                       ↓
의미론적 검색            키워드 검색
(벡터 유사도)            (ILIKE 매칭)
    ↓                       ↓
cosine distance         점수 합산 (누적)
1 - (a <=> b)           name: +0.5
    ↓                   desc: +0.3
    ↓                   tags: +0.2
    ↓                   words: +0.4
    └───────────┬───────────┘
                ↓
        하이브리드 결합
   (semantic × 0.7) + (keyword × 0.3)
                ↓
        점수 순 정렬
                ↓
        결과 반환
```

---

## 3. 기술 스택

| 구성요소 | 기술 |
|----------|------|
| 임베딩 모델 | BAAI/bge-large-en-v1.5 |
| 임베딩 차원 | 1024 |
| 임베딩 제공자 | Hugging Face Inference API |
| 벡터 DB | PostgreSQL + pgvector 확장 |
| 유사도 계산 | Cosine Distance (`<=>` 연산자) |
| 최소 유사도 임계값 | 0.3 |

### 3.1 모델 업그레이드 히스토리

| 날짜 | 모델 | 차원 | 변경 이유 |
|------|------|------|----------|
| 초기 | bge-small-en-v1.5 | 384 | 초기 구현 |
| 2025-01-15 | **bge-large-en-v1.5** | **1024** | 검색 정확도 향상 |

**차원(Dimension) 설명:**
- 차원 = 텍스트를 표현하는 숫자의 개수
- 차원이 높을수록 더 세밀한 의미 구분 가능
- 1024차원은 384차원 대비 약 2.7배 더 많은 정보 표현

---

## 4. 임베딩 모델 설정

### 4.1 모델 정보

```typescript
const EMBEDDING_MODEL = 'BAAI/bge-large-en-v1.5';
const EMBEDDING_DIMENSION = 1024;
const MAX_BATCH_SIZE = 100;
const MAX_INPUT_CHARS = 8000;
```

### 4.2 API 엔드포인트

```
https://router.huggingface.co/hf-inference/models/BAAI/bge-large-en-v1.5
```

### 4.3 환경 변수

```env
HUGGINGFACE_API_KEY=hf_xxxxx
```

### 4.4 모델 비교

| 모델 | 차원 | 성능 | 한국어 | 비용 |
|------|------|------|--------|------|
| bge-small-en-v1.5 | 384 | 보통 | 약함 | 무료 |
| **bge-large-en-v1.5** (현재) | 1024 | 좋음 | 보통 | 무료 |
| bge-m3 | 1024 | 우수 | **강함** | HF API 미지원 |
| OpenAI text-embedding-3 | 1536/3072 | 최고 | 좋음 | 유료 |

---

## 5. 인덱싱 단계

### 5.1 임베딩 텍스트 구성

템플릿 발행 시 검색용 텍스트를 구성합니다.

```typescript
function buildTemplateSearchText(template: Template): string {
  return [
    template.name,
    template.name,        // 이름 2번 반복 (가중치 증가)
    template.category,
    template.description,
    ...template.sections.map(s => s.imageDescription),
    ...template.tags
  ].join(' ');
}
```

### 5.2 임베딩 생성 및 저장

```typescript
async function embedTemplate(templateId: string): Promise<void> {
  // 1. 템플릿 조회
  const template = await prisma.template.findUnique({...});

  // 2. 검색 텍스트 구성
  const searchText = buildTemplateSearchText(template);

  // 3. 임베딩 생성 (Hugging Face API)
  const embedding = await generateEmbedding(searchText);

  // 4. PostgreSQL 저장
  await prisma.$executeRaw`
    UPDATE templates
    SET
      embedding = ${embedding}::vector,
      embedding_text = ${searchText},
      embedded_at = NOW()
    WHERE id = ${templateId}
  `;
}
```

### 5.3 데이터베이스 스키마

```prisma
model Template {
  // ... 기타 필드

  embedding     Unsupported("vector(1024)")?
  embeddingText String?  @map("embedding_text") @db.Text
  embeddedAt    DateTime? @map("embedded_at")
}
```

---

## 6. 검색 단계

### 6.1 하이브리드 검색 가중치

| 모드 | 벡터 (Semantic) | 키워드 (Keyword) | 용도 |
|------|-----------------|------------------|------|
| `semantic` | 100% | 0% | 순수 의미 검색 |
| `keyword` | 0% | 100% | 정확한 키워드 매칭 |
| `hybrid` (기본) | 70% | 30% | 균형잡힌 검색 |

```typescript
let hybridWeight: number;
switch (mode) {
  case 'semantic':
    hybridWeight = 1.0;
    break;
  case 'keyword':
    hybridWeight = 0.0;
    break;
  case 'hybrid':
  default:
    hybridWeight = 0.7;
    break;
}
```

### 6.2 의미론적 검색 (Semantic Search)

벡터 간 Cosine Distance를 계산합니다.

```sql
-- CTE: semantic_scores
SELECT
  id,
  1 - (embedding <=> ${queryEmbedding}::vector) as semantic_score
FROM templates
WHERE is_published = true
  AND embedding IS NOT NULL
```

**유사도 계산**
- pgvector의 `<=>` 연산자 사용 (Cosine Distance)
- `1 - distance` = 유사도 (0~1)
- 값이 클수록 유사함

### 6.3 키워드 검색 (Keyword Search) - 합산 방식

**2025-01-15 업데이트:** `GREATEST` (최댓값) → **합산 방식**으로 변경

여러 필드에서 매칭되면 점수가 **누적**됩니다.

```sql
-- CTE: keyword_scores
SELECT
  id,
  -- 합산 방식: 여러 필드에서 매칭되면 점수가 누적됨
  (
    CASE WHEN name ILIKE '%${query}%' THEN 0.5 ELSE 0 END +
    CASE WHEN description ILIKE '%${query}%' THEN 0.3 ELSE 0 END +
    CASE WHEN array_to_string(tags, ' ') ILIKE '%${query}%' THEN 0.2 ELSE 0 END +
    -- 개별 단어 매칭 (2자 이상 단어들이 모두 포함되면 보너스)
    CASE WHEN embedding_text ILIKE ALL(
      SELECT '%' || word || '%'
      FROM unnest(string_to_array('${query}', ' ')) as word
      WHERE length(word) >= 2
    ) THEN 0.4 ELSE 0 END
  ) as keyword_score
FROM templates
WHERE is_published = true
```

### 6.4 키워드 점수 체계 (합산 방식)

| 필드 | 점수 | 설명 |
|------|------|------|
| `name` | +0.5 | 템플릿 이름에 검색어 포함 |
| `description` | +0.3 | 설명에 검색어 포함 |
| `tags` | +0.2 | 태그에 검색어 포함 |
| 단어별 전체 매칭 | +0.4 | 검색어의 모든 단어가 embedding_text에 포함 |

**합산 방식의 장점:**

| 검색어 | 이전 (GREATEST) | 현재 (합산) |
|--------|-----------------|-------------|
| "립스틱" (이름만 매칭) | 0.5 | 0.5 |
| "립스틱 보습" (이름+설명) | 0.5 | **0.5 + 0.3 = 0.8** |
| "립스틱 보습" (이름+설명+단어전체) | 0.5 | **0.5 + 0.3 + 0.4 = 1.2** |

**예시:**
```
검색어: "헤라 립스틱"
- 이름에 "헤라" 포함 → +0.5
- 설명에 "립스틱" 포함 → +0.3
- 모든 단어 포함 보너스 → +0.4
- 최종 키워드 점수: 1.2
```

### 6.5 하이브리드 결합

두 점수를 가중 합산합니다.

```sql
-- CTE: combined_scores
SELECT
  COALESCE(s.id, k.id) as id,
  (
    COALESCE(s.semantic_score, 0) * ${hybridWeight} +
    COALESCE(k.keyword_score, 0) * ${1 - hybridWeight}
  ) as combined_score
FROM semantic_scores s
FULL OUTER JOIN keyword_scores k ON s.id = k.id
WHERE
  COALESCE(s.semantic_score, 0) >= 0.3  -- 최소 유사도
  OR COALESCE(k.keyword_score, 0) > 0   -- 키워드 매칭
ORDER BY combined_score DESC
```

### 6.6 최종 점수 계산 예시

```
검색어: "헤라 립스틱"

템플릿 A:
- semantic_score: 0.75 (벡터 유사도)
- keyword_score: 1.2 (이름+설명+단어전체 매칭)
- combined: 0.75 × 0.7 + 1.2 × 0.3 = 0.525 + 0.36 = 0.885

템플릿 B:
- semantic_score: 0.80
- keyword_score: 0.5 (이름만 매칭)
- combined: 0.80 × 0.7 + 0.5 × 0.3 = 0.56 + 0.15 = 0.71

결과: 템플릿 A가 더 높은 순위 (키워드 매칭이 많아서)
```

---

## 7. API 엔드포인트

### 7.1 템플릿 검색

```
GET /api/marketplace/templates/search
```

**쿼리 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `q` | string | O | 검색 쿼리 (최소 2자) |
| `mode` | string | X | 검색 모드 (semantic/keyword/hybrid) |
| `category` | string | X | 카테고리 필터 |
| `minPrice` | number | X | 최소 가격 |
| `maxPrice` | number | X | 최대 가격 |
| `page` | number | X | 페이지 번호 (기본: 1) |
| `limit` | number | X | 페이지당 개수 (기본: 12) |

**응답**

```typescript
{
  templates: TemplateSearchResult[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  },
  meta: {
    query: string,
    mode: string,
    category: string
  }
}
```

### 7.2 유사 템플릿 검색

```
GET /api/marketplace/templates/:id/similar?limit=5
```

특정 템플릿과 유사한 템플릿을 벡터 유사도 기반으로 검색합니다.

```sql
WITH target AS (
  SELECT embedding FROM templates WHERE id = ${templateId}
)
SELECT
  t.id, t.name, ...
  1 - (t.embedding <=> (SELECT embedding FROM target)) as similarity
FROM templates t
WHERE
  t.is_published = true
  AND t.id != ${templateId}
  AND t.embedding IS NOT NULL
ORDER BY t.embedding <=> (SELECT embedding FROM target)
LIMIT ${limit}
```

---

## 8. 프론트엔드 연동

### 8.1 검색 UI 흐름

```
사용자 입력
    ↓
디바운싱 (300ms)
    ↓
AI 검색 토글 확인
├─ ON  → mode=hybrid
└─ OFF → mode=keyword
    ↓
API 호출
    ↓
결과 렌더링
```

### 8.2 검색 컴포넌트

```typescript
// marketplace-gallery.tsx
const handleSearch = async (query: string) => {
  const params = new URLSearchParams({
    q: query,
    mode: aiSearchEnabled ? 'hybrid' : 'keyword',
    category: selectedCategory,
    page: currentPage.toString(),
    limit: '12'
  });

  const response = await fetch(`/api/marketplace/templates/search?${params}`);
  const data = await response.json();
  setTemplates(data.templates);
};
```

---

## 9. 검색 결과 구조

```typescript
interface TemplateSearchResult {
  id: string;
  name: string;
  category: TemplateCategory;
  thumbnailUrl: string | null;
  description: string | null;
  price: number;
  tags: string[];
  downloadCount: number;
  rating: number | null;
  ratingCount: number;
  publishedAt: Date | null;
  similarity: number;        // 유사도 점수 (0~1)
  seller: {
    id: string;
    name: string;
    image: string | null;
  } | null;
  isPurchased: boolean;
  isOwner: boolean;
}
```

---

## 10. 성능 최적화

### 10.1 인덱싱

```sql
-- 카테고리 인덱스
CREATE INDEX idx_templates_category ON templates(category);

-- 발행 상태 인덱스
CREATE INDEX idx_templates_is_published ON templates(is_published);

-- pgvector HNSW 인덱스 (자동)
```

### 10.2 배치 처리

- 임베딩 생성: 50개씩 배치 처리
- 최대 배치 크기: 100

### 10.3 클라이언트 최적화

- 검색 입력 디바운싱: 300ms
- 페이지네이션: 12개/페이지

---

## 11. 파일 구조

```
src/
├── app/api/marketplace/templates/
│   ├── search/route.ts           # 하이브리드 검색 API
│   └── [id]/similar/route.ts     # 유사 템플릿 API
│
├── services/marketplace/
│   ├── template-search.ts        # 검색 로직
│   └── template-embedding.ts     # 임베딩 생성
│
├── services/rag/
│   └── embeddings.ts             # HuggingFace API 호출
│
└── components/marketplace/
    ├── marketplace-gallery.tsx   # 검색 UI
    └── rag-related-search.tsx    # RAG 관련 검색

scripts/
└── reembed-templates.ts          # 전체 템플릿 재임베딩 스크립트
```

---

## 12. 환경 변수

```env
# 임베딩 API
HUGGINGFACE_API_KEY=hf_xxxxx

# 데이터베이스 (pgvector 포함)
DATABASE_URL=postgresql://...
```

---

## 13. 제한사항 및 고려사항

### 13.1 현재 제한

- 최소 검색어 길이: 2자
- 최소 유사도 임계값: 0.3
- 임베딩 최대 입력: 8,000자

### 13.2 향후 개선 가능 영역

- 검색 결과 캐싱
- 사용자 검색 히스토리 기반 개인화
- 다국어 임베딩 모델 적용 (bge-m3 등)
- 실시간 인기 검색어 반영
- 청킹 기반 검색 (긴 템플릿에서 특정 섹션 매칭)

---

## 14. 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2025-01-15 | 임베딩 모델 업그레이드: bge-small (384) → bge-large (1024) |
| 2025-01-15 | 키워드 점수 계산 방식 변경: GREATEST → 합산 방식 |
| 초기 | 하이브리드 검색 시스템 구축 |
