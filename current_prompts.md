# 시스템 프롬프트 아키텍처

## 파일 구조

```
src/services/ai/prompts/
├── index.ts                 ← 메인 엔트리 (모든 모듈 re-export)
├── types.ts                 ← 타입 정의
│
├── system-prompts.ts        ← AI 역할/규칙 정의
├── user-prompts.ts          ← 사용자 요청 프롬프트
│
├── image-prompts.ts         ← 이미지 생성 프롬프트
├── image-composition.ts     ← 레이아웃/구도/네거티브
├── overlay-prompts.ts       ← 텍스트 오버레이
├── visual-theme.ts          ← 8가지 비주얼 테마
│
├── section-templates.ts     ← 17가지 섹션 템플릿
├── category-patterns.ts     ← 카테고리별 패턴 데이터
├── brand-presets.ts         ← 5가지 브랜드 톤 프리셋
└── reference-data.ts        ← OCR 참조 데이터
```

---

## 생성 흐름 (Data Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                        사용자 입력                               │
│  (제품명, 카테고리, 특징, 타겟, 이미지, 브랜드 정보)              │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   orchestration-service.ts                       │
│                      (오케스트레이션)                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          ▼                                   ▼
┌──────────────────────┐           ┌──────────────────────┐
│   SYSTEM PROMPT      │           │    USER PROMPT       │
│  (system-prompts.ts) │           │  (user-prompts.ts)   │
├──────────────────────┤           ├──────────────────────┤
│ • AI 역할 정의       │           │ • 제품 정보          │
│ • 스토리텔링 원칙    │           │ • 브랜드 컨텍스트    │
│ • 섹션별 패턴        │           │ • JSON 형식 스펙     │
│ • 카피 길이 설정     │           │ • 섹션별 작성 지침   │
│ • 품질 체크리스트    │           │ • 이모지 금지 규칙   │
└──────────┬───────────┘           └──────────┬───────────┘
           │                                  │
           └────────────┬─────────────────────┘
                        ▼
              ┌──────────────────┐
              │   AI 텍스트 생성  │
              │ (Gemini/Claude)  │
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │   JSON 응답 파싱  │
              │  (hookMessage +   │
              │    sections[])    │
              └────────┬─────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    각 섹션별 이미지 프롬프트                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │visual-theme │  │  section-   │  │   image-    │             │
│  │    .ts      │  │ templates.ts│  │composition.ts│            │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤             │
│  │ 8가지 테마  │  │ 17가지 섹션 │  │ 9가지 레이아웃│            │
│  │ 색상/조명   │  │ 목적/구조   │  │ 텍스트 영역 │             │
│  │ 무드 키워드 │  │ 이미지 수   │  │ 네거티브    │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         └────────────────┼────────────────┘                    │
│                          ▼                                     │
│                ┌──────────────────┐                            │
│                │ image-prompts.ts │                            │
│                │  (최종 조합)      │                            │
│                └────────┬─────────┘                            │
└─────────────────────────┼───────────────────────────────────────┘
                          ▼
                ┌──────────────────┐
                │   이미지 생성     │
                │ (Gemini Imagen)  │
                └────────┬─────────┘
                         ▼
                ┌──────────────────┐
                │    최종 결과      │
                │ DetailPageResult │
                └──────────────────┘
```

---

## 모듈별 의존성

```
                    ┌──────────────────┐
                    │    types.ts      │  ← 모든 모듈이 참조
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ category-     │   │ brand-        │   │ reference-    │
│ patterns.ts   │   │ presets.ts    │   │ data.ts       │
├───────────────┤   ├───────────────┤   ├───────────────┤
│ • 카테고리별  │   │ • luxury      │   │ • OCR 패턴    │
│   키워드      │   │ • clean       │   │ • 실제 예시   │
│ • 텍스트패턴  │   │ • natural     │   │               │
│ • 시각패턴    │   │ • trendy      │   │               │
│ • 톤가이드    │   │ • derma       │   │               │
└───────┬───────┘   └───────┬───────┘   └───────────────┘
        │                   │
        └─────────┬─────────┘
                  ▼
        ┌───────────────────┐
        │ system-prompts.ts │  ← 핵심 시스템 프롬프트
        │ user-prompts.ts   │
        └─────────┬─────────┘
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
┌─────────┐ ┌───────────┐ ┌───────────┐
│ visual- │ │ section-  │ │ image-    │
│ theme   │ │ templates │ │composition│
└────┬────┘ └─────┬─────┘ └─────┬─────┘
     │            │             │
     └────────────┼─────────────┘
                  ▼
          ┌─────────────┐
          │ image-      │  ← 이미지 프롬프트 최종 조합
          │ prompts.ts  │
          └─────────────┘
```

---

## 핵심 데이터 구조

### 1. 시스템 프롬프트 구성요소

| 구성요소 | 설명 | 소스 |
|---------|------|------|
| AI 역할 | 이커머스 마케팅 카피라이터 | `system-prompts.ts` |
| 섹션별 패턴 | HERO, FEATURES 등 5개 섹션 | `category-patterns.ts` |
| 카피 길이 | short/medium/long 설정 | `category-patterns.ts` |
| 브랜드 톤 | 5가지 프리셋 | `brand-presets.ts` |
| 품질 체크 | 필수 항목 검증 | `brand-presets.ts` |

### 2. 이미지 프롬프트 구성요소

| 구성요소 | 옵션 수 | 설명 |
|---------|--------|------|
| 레이아웃 | 9가지 | hero-centered, split-left 등 |
| 비주얼 테마 | 8가지 | minimal-warm, luxury-dark 등 |
| 섹션 템플릿 | 17가지 | MAIN, HERO, FEATURES 등 |
| 텍스트 영역 | 9가지 | top-full, center-left 등 |
| 네거티브 | 5카테고리 | quality, style, content 등 |

---

## 핵심 특징

### 다층 구조 설계

```
Layer 1: 시스템 레벨   → AI 역할, 스토리텔링 원칙
    ↓
Layer 2: 요청 레벨     → 제품 정보, JSON 형식 스펙
    ↓
Layer 3: 카테고리 레벨 → 올리브영 데이터 기반 패턴
    ↓
Layer 4: 브랜드 레벨   → 톤 프리셋 (luxury, clean 등)
    ↓
Layer 5: 시각 레벨     → 레이아웃, 테마, 네거티브 프롬프트
```

### 데이터 기반 설계

- 올리브영 398개 제품, 12,470개 이미지 분석 기반
- 섹션별 효과적 패턴 통계 (before-after 341회 등)
- OCR 참조 데이터로 실제 프롬프트 패턴 제공

---

## 주요 파일 상세

### system-prompts.ts

**주요 함수**: `buildSystemPrompt(copyLength, brandContext?, category?)`

**구성 요소**:
1. AI의 역할: "한국 이커머스 상세페이지 전문 마케팅 카피라이터"
2. 데이터 소스: "올리브영 패턴 분석 기반 (398개 제품, 12,470개 이미지)"
3. 섹션별 효과적인 텍스트 패턴
4. 핵심 원칙: 스토리텔링 구조
5. 카피 길이 설정 (COPY_LENGTH_CONFIG)
6. 조건부 추가: 카테고리 색상, 브랜드 톤, RAG 컨텍스트

### user-prompts.ts

**주요 함수**: `buildUserPrompt(input: GenerateDetailPageInput)`

**생성 순서**:
1. 필수 규칙 (이모지/특수문자 금지)
2. 제품 정보 섹션
3. 카테고리 특화 가이드
4. JSON 형식 스펙
5. 각 섹션별 작성 지침 (MAIN, HERO, FEATURES, SOCIAL_PROOF, HOW_TO_USE, FAQ)

### image-prompts.ts

**주요 함수**: `buildImagePrompt(section, productName, category, keyFeatures, brandStyle?, visualReference?, options?)`

**구성**:
- 제품 일관성 지시
- 카테고리별 시각 패턴
- 섹션별 구도 가이드
- 텍스트 안전 영역

### category-patterns.ts

**카테고리별 특화 데이터**:
```typescript
CategoryPattern {
  keywords: string[];        // 강조 키워드
  textPatterns: string[];    // 효과적인 텍스트 패턴
  visualPatterns: string[];  // 시각 패턴
  toneGuide: string;         // 톤 가이드
  topStats: Array<{ text, visual }>;  // 사용 빈도 통계
}
```

### brand-presets.ts

**5가지 프리셋**:

| 프리셋 | 폰트 | 색상 | 톤 |
|--------|------|------|-----|
| luxury | Serif (Playfair) | 골드, 블랙 | 격조 있고 절제된 |
| clean | Sans-serif | 화이트, 블랙 | 간결하고 명확한 |
| natural | 따뜻한 Sans-serif | 어스톤 그린, 테라코타 | 자연 친화적 |
| trendy | 볼드 Sans-serif | 비비드 컬러 | 활기차고 개성 있는 |
| derma | Clean Sans-serif | 파스텔/의료 컬러 | 신뢰감 있고 과학적 |

### visual-theme.ts

**8가지 테마**:
- `minimal-warm` - 베이지, 크림
- `minimal-cool` - 화이트, 그레이
- `natural-organic` - 그린, 브라운
- `luxury-dark` - 블랙, 골드
- `luxury-light` - 화이트, 골드
- `clinical-clean` - 화이트, 블루
- `vibrant-pop` - 컬러풀
- `soft-pastel` - 파스텔톤

### section-templates.ts

**17가지 확장 섹션 타입**:
- MAIN, HERO, BRAND_CONCEPT, FEATURES, TEXTURE
- INGREDIENT, PRODUCT_LINEUP, SKIN_RESULT, MODEL_SHOT
- SPECS, SOCIAL_PROOF, HOW_TO_USE, LIFESTYLE
- FAQ, INFO_TABLE, CTA

### image-composition.ts

**9가지 레이아웃 프리셋**:
- hero-centered, hero-bottom
- split-left, split-right
- floating, grid
- comparison, step-sequence, lifestyle

**텍스트 안전 영역** (SafeZonePosition):
- top-full, top-left, top-right
- center-left, center-right
- bottom-full, bottom-left, bottom-right
- overlay-center

---

## 프롬프트 호출 지점

### detail-page-generator.ts

```typescript
import {
  buildEnhancedSystemPrompt,
  buildEnhancedUserPrompt,
} from './prompts';
```

### orchestration-service.ts

```typescript
import {
  getReferencePrompts,
  getVisualStyleKeywords,
  buildEnhancedSystemPrompt,
  buildEnhancedUserPrompt,
  buildOverlayTextPrompt,
  autoSelectTheme,
  getVisualTheme,
  getSectionTemplate,
  buildSectionTemplatePrompt,
  buildNegativePrompt,
  getSectionImagePrompt,
} from './prompts';
```

---

## 요약

이 아키텍처는 **모듈화**와 **데이터 기반 설계**를 통해 확장성과 일관성을 모두 확보:

1. **시스템 프롬프트**: AI의 역할과 규칙 정의
2. **사용자 프롬프트**: 제품 정보 기반 요청 생성
3. **이미지 프롬프트**: 레이아웃 + 테마 + 템플릿 조합
4. **카테고리 패턴**: 올리브영 데이터 기반 특화
5. **브랜드 프리셋**: 톤 일관성 보장
