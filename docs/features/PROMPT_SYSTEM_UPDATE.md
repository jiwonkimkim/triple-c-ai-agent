# 프롬프트 시스템 고도화 작업 정리

> 작성일: 2026-01-06
> 작업자: Claude Code
> 관련 커밋: `f2a9ee0`, `67911a9`, `f9c6254`

---

## 1. 변경 개요

### 목표
- **텍스트 생성**: 전문적인 상세페이지 톤 강화 (이모지 제거, 전문 카피라이팅)
- **이미지 생성**: 텍스트 내용에 맞는 이미지 생성 (텍스트 기반 시각화)
- **오버레이 텍스트**: AI 추천 텍스트에 위치(x, y) + 스타일(폰트, 색상, 크기) 포함

### 핵심 변경점

```
[이전 흐름]
텍스트 생성 → 이미지 생성 (독립적)
            ↓
      overlayText (내용만)

[변경 후 흐름]
텍스트 생성 → 텍스트 분석 → 이미지 생성 (텍스트 기반 시각화)
            ↓
      overlayText (내용 + 위치 + 스타일)
```

---

## 2. 아키텍처

### 상세페이지 생성 플로우

```
┌─────────────────────────────────────────────────────────────────┐
│                    사용자 입력                                    │
│  (제품 이미지, 제품명, 카테고리, 특징, 타겟)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              orchestrateDetailPageGeneration()                   │
│                 orchestration-service.ts                         │
├─────────────────────────────────────────────────────────────────┤
│  1. 텍스트 생성 (Groq/Claude)                                    │
│     - buildEnhancedSystemPrompt()  ← 전문 상세페이지 톤          │
│     - buildEnhancedUserPrompt()    ← 섹션별 구체적 예시          │
│                                                                  │
│  2. 텍스트 분석 → 이미지 프롬프트 생성                            │
│     - extractKeyMessagesFromText()  ← 핵심 메시지 추출           │
│     - generateSectionImagePromptFromText() ← 텍스트 기반 시각화  │
│                                                                  │
│  3. 오버레이 텍스트 생성 (항상 생성)                              │
│     - generateOverlayText()  ← 위치 + 스타일 포함                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     에디터 표시                                   │
│                content/route.ts                                  │
├─────────────────────────────────────────────────────────────────┤
│  - AI 생성 위치/스타일 우선 적용                                  │
│  - 기본값 폴백 (섹션별 안전 영역 기반)                            │
│  - 이미지 위에 텍스트 오버레이 자동 배치                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 주요 파일 및 역할

| 파일 | 역할 | 주요 변경 |
|------|------|----------|
| `orchestration-service.ts` | 생성 오케스트레이션 | 텍스트 기반 이미지 프롬프트 생성 로직 추가 |
| `prompts/system-prompts.ts` | 시스템 프롬프트 | 전문 상세페이지 톤, MAIN 섹션 가이드, 금지 표현 |
| `prompts/user-prompts.ts` | 유저 프롬프트 | 섹션별 구체적 예시, 카테고리별 특화 |
| `prompts/overlay-prompts.ts` | 오버레이 텍스트 | SECTION_LAYOUT_GUIDE (위치 + 스타일) |
| `prompts/types.ts` | 타입 정의 | OverlayTextItem, OverlayStatisticItem |
| `content/route.ts` | 에디터 API | AI 생성 위치/스타일 적용 로직 |

---

## 4. 텍스트 생성 개선 상세

### 4.1 전문 상세페이지 톤 (system-prompts.ts)

```typescript
// 피해야 할 표현
- 이모지 (😊, ✨, 💕 등) 절대 금지
- "완전", "대박", "꿀템" 등 과장 표현
- "~해요", "~드려요" 등 친근체

// 권장 표현
- 전문적이고 신뢰감 있는 톤
- 구체적 수치와 성분명
- "~합니다", "~입니다" 등 격식체
```

### 4.2 섹션별 가이드 예시 (user-prompts.ts)

| 섹션 | 목적 | 예시 카피 |
|------|------|----------|
| MAIN | 첫인상, 구매 욕구 | "피부 본연의 힘을 깨우다" |
| HERO | 핵심 가치 전달 | "92%가 경험한 탄력 개선" |
| FEATURES | 특징/성분 상세 | "히알루론산 5종 복합체" |
| SOCIAL_PROOF | 신뢰 구축 | "피부과 전문의 92% 추천" |
| HOW_TO_USE | 사용법 안내 | "세안 후 2-3방울 도포" |

---

## 5. 이미지 생성 개선 상세

### 5.1 텍스트 기반 시각화 (orchestration-service.ts)

```typescript
// 텍스트 분석 → 시각 키워드 추출
extractKeyMessagesFromText(textContent, sectionType)
  → { mainMessage, emotionalTone, visualKeywords, targetScene }

// 예시
입력: "피부 속 깊은 곳까지 수분을 전달합니다"
출력: {
  mainMessage: "깊은 수분 전달",
  emotionalTone: "청량한, 촉촉한",
  visualKeywords: ["water droplets", "deep penetration", "hydration"],
  targetScene: "수분이 피부에 스며드는 장면"
}
```

### 5.2 이미지 프롬프트 구조

```
[TEXT-DRIVEN VISUALIZATION]
- CONCEPT TO VISUALIZE: "깊은 수분 전달" (텍스트 렌더링 X, 시각적 메타포만)
- EMOTIONAL ATMOSPHERE: 청량한, 촉촉한
- VISUAL ELEMENTS: water droplets, deep penetration
- SCENE SETTING: 수분이 피부에 스며드는 장면

[SECTION TEMPLATE]
- 섹션별 기본 구도 (section-templates.ts)

[BRAND STYLE]
- 브랜드 톤 프리셋 적용
```

---

## 6. 오버레이 텍스트 시스템

### 6.1 새로운 타입 구조 (types.ts)

```typescript
interface OverlayTextItem {
  text: string;        // 텍스트 내용
  x: number;           // X 위치 (%, 0-100)
  y: number;           // Y 위치 (%, 0-100)
  fontSize: number;    // 폰트 크기 (px)
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  color: string;       // 색상 (#ffffff)
  textAlign?: 'left' | 'center' | 'right';
}

interface OverlayTextContent {
  headline?: OverlayTextItem | string;    // 하위 호환성
  subheadline?: OverlayTextItem | string;
  body?: OverlayTextItem | string;
  statistics?: (OverlayStatisticItem | string)[];
  cta?: OverlayTextItem | string;
}
```

### 6.2 섹션별 기본 레이아웃 (overlay-prompts.ts)

| 섹션 | 헤드라인 위치 | 제품 영역 | 특징 |
|------|-------------|----------|------|
| MAIN | 좌상단 (5%, 8%) | 우측 중앙 | 좌측에 텍스트, 우측에 제품 |
| HERO | 상단 중앙 (50%, 10%) | 중앙 | 상단 텍스트, 중앙 제품 |
| FEATURES | 상단 중앙 (50%, 8%) | 중앙 | 상하단에 텍스트 |
| SOCIAL_PROOF | 상단 중앙 (50%, 8%) | 중앙 | 큰 통계 숫자 강조 |
| HOW_TO_USE | 상단 중앙 (50%, 5%) | 중앙 | 단계별 설명 |

### 6.3 AI 응답 예시

```json
{
  "headline": {
    "text": "피부 본연의 힘",
    "x": 50,
    "y": 10,
    "fontSize": 36,
    "fontWeight": "bold",
    "color": "#ffffff",
    "textAlign": "center"
  },
  "statistics": [
    {
      "text": "92%",
      "x": 50,
      "y": 45,
      "fontSize": 48,
      "fontWeight": "bold",
      "color": "#ffffff"
    }
  ],
  "cta": {
    "text": "지금 만나보세요",
    "x": 50,
    "y": 90,
    "fontSize": 16,
    "fontWeight": "semibold",
    "color": "#ffffff"
  }
}
```

---

## 7. 이미지 프롬프트 고도화 - 수정 위치 가이드

### 7.1 섹션 템플릿 수정 위치

| 섹션 | 파일 | 함수/상수 | 라인 (대략) | 설명 |
|------|------|----------|------------|------|
| **MAIN** | `section-templates.ts` | `SECTION_TEMPLATES.MAIN` | ~50 | 메인 비주얼 프롬프트 |
| **HERO** | `section-templates.ts` | `SECTION_TEMPLATES.HERO` | ~80 | 히어로 섹션 프롬프트 |
| **FEATURES** | `section-templates.ts` | `SECTION_TEMPLATES.FEATURES` | ~110 | 특징 섹션 프롬프트 |
| **TEXTURE** | `section-templates.ts` | `SECTION_TEMPLATES.TEXTURE` | ~140 | 텍스처 클로즈업 |
| **INGREDIENT** | `section-templates.ts` | `SECTION_TEMPLATES.INGREDIENT` | ~170 | 성분 시각화 |
| **PRODUCT_LINEUP** | `section-templates.ts` | `SECTION_TEMPLATES.PRODUCT_LINEUP` | ~200 | 라인업 배치 |
| **SKIN_RESULT** | `section-templates.ts` | `SECTION_TEMPLATES.SKIN_RESULT` | ~230 | 피부 결과 |
| **MODEL_SHOT** | `section-templates.ts` | `SECTION_TEMPLATES.MODEL_SHOT` | ~260 | 모델 샷 |
| **SPECS** | `section-templates.ts` | `SECTION_TEMPLATES.SPECS` | ~290 | 스펙 다이어그램 |
| **MATERIAL** | `section-templates.ts` | `SECTION_TEMPLATES.MATERIAL` | ~320 | 소재/원료 |
| **SOCIAL_PROOF** | `section-templates.ts` | `SECTION_TEMPLATES.SOCIAL_PROOF` | ~350 | 후기/인증 |
| **HOW_TO_USE** | `section-templates.ts` | `SECTION_TEMPLATES.HOW_TO_USE` | ~380 | 사용법 |
| **LIFESTYLE** | `section-templates.ts` | `SECTION_TEMPLATES.LIFESTYLE` | ~410 | 라이프스타일 |
| **FAQ** | `section-templates.ts` | `SECTION_TEMPLATES.FAQ` | ~440 | FAQ |
| **INFO_TABLE** | `section-templates.ts` | `SECTION_TEMPLATES.INFO_TABLE` | ~470 | 정보 테이블 |
| **CTA** | `section-templates.ts` | `SECTION_TEMPLATES.CTA` | ~500 | CTA |

### 7.2 카테고리별 패턴 수정 위치

| 카테고리 | 파일 | 상수 | 설명 |
|----------|------|------|------|
| 스킨케어 | `category-patterns.ts` | `CATEGORY_PATTERNS.skincare` | 수분, 탄력, 미백 등 |
| 메이크업 | `category-patterns.ts` | `CATEGORY_PATTERNS.makeup` | 립, 쿠션, 아이 등 |
| 클렌징 | `category-patterns.ts` | `CATEGORY_PATTERNS.cleansing` | 클렌저, 리무버 등 |
| 선케어 | `category-patterns.ts` | `CATEGORY_PATTERNS.suncare` | 자외선 차단 |
| 마스크팩 | `category-patterns.ts` | `CATEGORY_PATTERNS.mask` | 시트마스크, 워시오프 |

### 7.3 비주얼 테마 수정 위치

| 테마 | 파일 | 상수 | 설명 |
|------|------|------|------|
| Minimal | `visual-theme.ts` | `VISUAL_THEMES.minimal` | 미니멀 스타일 |
| Luxury | `visual-theme.ts` | `VISUAL_THEMES.luxury` | 럭셔리 스타일 |
| Natural | `visual-theme.ts` | `VISUAL_THEMES.natural` | 자연/유기농 |
| Clinical | `visual-theme.ts` | `VISUAL_THEMES.clinical` | 더마/클리니컬 |
| Trendy | `visual-theme.ts` | `VISUAL_THEMES.trendy` | 트렌디/영 |

### 7.4 오버레이 레이아웃 수정 위치

| 항목 | 파일 | 상수 | 설명 |
|------|------|------|------|
| 섹션별 기본 위치 | `overlay-prompts.ts` | `SECTION_LAYOUT_GUIDE` | 헤드라인, 바디, CTA 위치 |
| 텍스트 안전 영역 | `content/route.ts` | `productZones` | 제품 영역 (텍스트 배치 피함) |

---

## 8. 향후 작업 가이드

### 8.1 섹션 프롬프트 개선 시

1. `section-templates.ts`에서 해당 섹션 템플릿 수정
2. 테스트: 해당 섹션만 포함된 상세페이지 생성
3. 결과 확인 후 미세 조정

### 8.2 새 카테고리 추가 시

1. `category-patterns.ts`에 새 패턴 추가
2. `getCategoryPattern()` 함수에 매칭 로직 추가
3. 테스트 후 배포

### 8.3 오버레이 위치 조정 시

1. `overlay-prompts.ts`의 `SECTION_LAYOUT_GUIDE` 수정
2. `content/route.ts`의 `productZones` 확인 (충돌 방지)

---

## 9. 테스트 체크리스트

- [ ] 텍스트 생성: 이모지 없는지 확인
- [ ] 텍스트 생성: 전문적 톤인지 확인
- [ ] 이미지 생성: 텍스트 내용과 연관된 시각 요소인지 확인
- [ ] 이미지 생성: 텍스트가 이미지에 렌더링되지 않는지 확인
- [ ] 오버레이: 위치/스타일 정보가 포함되는지 확인
- [ ] 오버레이: 제품 영역과 텍스트가 겹치지 않는지 확인

---

## 10. 관련 파일 경로

```
src/services/ai/
├── orchestration-service.ts    # 생성 오케스트레이션
├── detail-page-generator.ts    # 상세페이지 생성기
└── prompts/
    ├── index.ts                # Export 모음
    ├── types.ts                # 타입 정의
    ├── system-prompts.ts       # 시스템 프롬프트
    ├── user-prompts.ts         # 유저 프롬프트
    ├── overlay-prompts.ts      # 오버레이 텍스트 프롬프트
    ├── section-templates.ts    # ★ 섹션별 이미지 프롬프트
    ├── category-patterns.ts    # ★ 카테고리별 패턴
    ├── visual-theme.ts         # ★ 비주얼 테마
    └── brand-presets.ts        # 브랜드 톤 프리셋

src/app/api/projects/[id]/
└── content/route.ts            # 에디터 콘텐츠 API
```
