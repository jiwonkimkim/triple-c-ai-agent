# Triple C 프롬프트 시스템 아키텍처

## 1. 시스템 개요도

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PROMPT SYSTEM ARCHITECTURE                            │
│                              (src/services/ai/prompts/)                         │
└─────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────┐
                                    │   User UI   │
                                    │  (page.tsx) │
                                    └──────┬──────┘
                                           │
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              ORCHESTRATION LAYER                                  │
│                         (orchestration-service.ts)                                │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │  generateSectionImagePromptFromText()                                       │  │
│  │     │                                                                       │  │
│  │     ├── subCategory 존재? ──YES──▶ buildUnifiedImagePrompt()               │  │
│  │     │                              (beauty-subcategory.ts)                  │  │
│  │     │                                                                       │  │
│  │     └── NO ──▶ 기존 프롬프트 시스템 (Fallback)                              │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                              │
                    ▼                                              ▼
┌───────────────────────────────────┐          ┌───────────────────────────────────┐
│   ADVANCED PROMPT SYSTEM (NEW)    │          │   LEGACY PROMPT SYSTEM (FALLBACK) │
│   (카테고리별 고도화 프롬프트)        │          │   (범용 프롬프트)                    │
└───────────────────────────────────┘          └───────────────────────────────────┘
                    │                                              │
     ┌──────────────┼──────────────┐                ┌──────────────┼──────────────┐
     │              │              │                │              │              │
     ▼              ▼              ▼                ▼              ▼              ▼
┌─────────┐  ┌─────────┐  ┌─────────┐        ┌─────────┐  ┌─────────┐  ┌─────────┐
│Skincare │  │Suncare  │  │  Lip    │        │ Section │  │ Visual  │  │ Image   │
│ 11섹션   │  │ 11섹션   │  │ 14섹션  │        │Templates│  │ Theme   │  │Composit.│
└─────────┘  └─────────┘  └─────────┘        └─────────┘  └─────────┘  └─────────┘
     │              │              │
     ▼              ▼              ▼
┌─────────┐  ┌─────────┐
│Mascara  │  │MaskPack │
│ 15섹션   │  │ 17섹션   │
└─────────┘  └─────────┘
```

---

## 2. 모듈 계층 구조

```
src/services/ai/prompts/
│
├── index.ts                      # 메인 엔트리 포인트 (모든 모듈 re-export)
│
├── ─────────────────────────────────────────────────────────────────────────────
│   [LAYER 1: 타입 정의]
├── types.ts                      # 공통 타입 정의
│   └── BrandContext, SectionType, OverlayTextContent, etc.
│
├── ─────────────────────────────────────────────────────────────────────────────
│   [LAYER 2: 기반 시스템 - 범용 프롬프트]
├── category-patterns.ts          # 카테고리별 패턴 및 색상 가이드
├── brand-presets.ts              # 브랜드 톤 프리셋 (luxury, natural, clean 등)
├── system-prompts.ts             # LLM 시스템 프롬프트
├── user-prompts.ts               # 사용자 프롬프트 빌더
├── image-prompts.ts              # 기본 이미지 프롬프트 빌더
├── image-composition.ts          # 레이아웃, 텍스트 영역, 네거티브 프롬프트
├── overlay-prompts.ts            # 오버레이 텍스트 생성
├── reference-data.ts             # OCR 참조 데이터
├── visual-theme.ts               # 비주얼 테마 시스템
├── section-templates.ts          # 섹션 템플릿 (MAIN, HERO, FEATURES 등)
├── section-color-palette.ts      # 섹션별 색상 팔레트
│
├── ─────────────────────────────────────────────────────────────────────────────
│   [LAYER 3: 고도화 시스템 - 카테고리별 전용 프롬프트] ★NEW★
├── skincare-image-prompts.ts     # 스킨케어 전용 (토너/에센스/세럼/크림)
├── suncare-image-prompts.ts      # 선케어 전용 (선크림/선스틱/선스프레이)
├── lip-image-prompts.ts          # 립 메이크업 전용 (립글로스/립틴트/립스틱)
├── mascara-image-prompts.ts      # 마스카라 전용 (볼륨/컬링/롱래쉬)
├── maskpack-image-prompts.ts     # 마스크팩 전용 (시트마스크/워시오프/수면팩)
│
├── ─────────────────────────────────────────────────────────────────────────────
│   [LAYER 4: 통합 라우터]
└── beauty-subcategory.ts         # 서브 카테고리 통합 인터페이스
    └── buildUnifiedImagePrompt() → 적절한 카테고리 빌더로 라우팅
```

---

## 3. 데이터 플로우

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW                                        │
└──────────────────────────────────────────────────────────────────────────────┘

[INPUT]
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  GenerationInput                                                             │
│  {                                                                           │
│    productName: "퓨어 비타민C 세럼",                                           │
│    category: "Beauty & Skincare",                                            │
│    subCategory: "skincare",          ◀── ★ 서브 카테고리 (NEW)                │
│    keyFeatures: ["비타민C 20%", "브라이트닝"],                                  │
│    targetAudience: "25-45세 여성",                                            │
│    copyLength: "medium",                                                     │
│    brandContext: { ... }                                                     │
│  }                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  DECISION POINT: hasAdvancedPromptSystem(subCategory)?                       │
└─────────────────────────────────────────────────────────────────────────────┘
    │                                           │
    │ YES (skincare/suncare/lip/              │ NO (cushion/eyeshadow/
    │      mascara/maskpack)                   │     cleanser/other)
    ▼                                           ▼
┌────────────────────────┐            ┌────────────────────────┐
│  buildUnifiedImagePrompt()         │  기존 프롬프트 시스템     │
│                        │            │  - section-templates   │
│  switch(subCategory):  │            │  - image-prompts       │
│    skincare → build... │            │  - visual-theme        │
│    suncare  → build... │            └────────────────────────┘
│    lip      → build... │
│    mascara  → build... │
│    maskpack → build... │
└────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  섹션별/블록별 프롬프트 생성                                                    │
│                                                                              │
│  예: 스킨케어 HERO_SPLASH 섹션                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Block 0: "water splash with product, dynamic motion, droplets"        │  │
│  │ Block 1: "gentle mist spray, ethereal atmosphere, morning dew"        │  │
│  │ Block 2: "cream texture swirl, luxurious, silky smooth"               │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
    │
    ▼
[OUTPUT: SectionImagePrompt]
```

---

## 4. 카테고리별 섹션 구성

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     CATEGORY-SPECIFIC SECTIONS                               │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   SKINCARE      │  │   SUNCARE       │  │     LIP         │
│   (11 섹션)      │  │   (11 섹션)      │  │   (14 섹션)      │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ BRAND_TRUST     │  │ BRAND_TRUST     │  │ BRAND_HERO      │
│ AWARD_RANKING   │  │ UV_PROTECTION   │  │ MODEL_LIP_CLOSEUPx3│
│ HERO_SPLASH     │  │ HERO_SPLASH     │  │ COLOR_SWATCHES  │
│ REVIEW_SHOWCASE │  │ TEXTURE_FEEL    │  │ TEXTURE_VISUAL  │
│ EFFICACY_VISUAL │  │ SKIN_COMFORT    │  │ BEFORE_AFTER    │
│ INGREDIENT_TECH │  │ FREE_SYSTEM     │  │ INGREDIENT_TECH │
│ MODEL_RESULT    │  │ INGREDIENT_TECH │  │ HOW_TO_APPLY    │
│ STEP_GUIDE      │  │ OUTDOOR_SCENE   │  │ SHADE_RANGE     │
│ PRODUCT_LINEUP  │  │ ROUTINE_GUIDE   │  │ PACKAGE_DETAIL  │
│ SIZE_OPTIONS    │  │ PRODUCT_LINEUP  │  │ SET_LINEUP      │
│ CTA_CLOSING     │  │ CTA_CLOSING     │  │ SOCIAL_PROOF    │
└─────────────────┘  └─────────────────┘  │ BRAND_STORY     │
                                          │ SIZE_OPTIONS    │
                                          │ CTA_CLOSING     │
                                          └─────────────────┘

┌─────────────────┐  ┌─────────────────┐
│   MASCARA       │  │   MASKPACK      │
│   (15 섹션)      │  │   (17 섹션)      │
├─────────────────┤  ├─────────────────┤
│ BRAND_HERO      │  │ BRAND_HERO      │
│ EYE_BEFORE_AFTERx3│ │ MODEL_WEARING  │
│ WAND_CLOSEUP    │  │ UNFOLDING_SCENE │
│ LASH_DETAIL_MACRO│ │ ESSENCE_DRIP   │
│ FORMULA_TEXTURE │  │ SKIN_BEFORE_AFTERx3│
│ WEAR_TEST       │  │ INGREDIENT_TEATREEx4│
│ SMUDGE_PROOF    │  │ STEP_GUIDE      │
│ REMOVAL_EASY    │  │ USAGE_TIPS      │
│ MODEL_LOOK_VARIETYx3│ │ PRODUCT_LINEUP │
│ INGREDIENT_TECH │  │ SIZE_OPTIONS    │
│ BRUSH_COMPARISON│  │ SOCIAL_PROOF    │
│ PACKAGE_DETAIL  │  │ CTA_CLOSING     │
│ SOCIAL_PROOF    │  └─────────────────┘
│ SIZE_OPTIONS    │
│ CTA_CLOSING     │
└─────────────────┘
```

---

## 5. 프롬프트 조합 파이프라인

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        PROMPT COMPOSITION PIPELINE                           │
└──────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────┐
                    │         FINAL IMAGE PROMPT          │
                    └─────────────────────────────────────┘
                                      ▲
                                      │ 조합
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│  CONSISTENCY  │           │   CATEGORY    │           │   QUALITY     │
│   PREFIX      │           │   PROMPT      │           │   SUFFIX      │
├───────────────┤           ├───────────────┤           ├───────────────┤
│ [CRITICAL -   │           │ [★★★ ADVANCED │           │ 8K resolution,│
│  PRODUCT      │           │  SKINCARE     │           │ photorealistic│
│  CONSISTENCY: │           │  PROMPT ★★★]  │           │ commercial    │
│  same product │           │               │           │ photography   │
│  in all       │           │ serum bottle  │           │               │
│  images]      │           │ with water    │           │ --negative    │
│               │           │ splash...     │           │ text, blur... │
└───────────────┘           └───────────────┘           └───────────────┘
        │                             │                             │
        │                             ▼                             │
        │                   ┌───────────────┐                       │
        │                   │  VISUAL THEME │                       │
        │                   ├───────────────┤                       │
        │                   │ [BACKGROUND:  │                       │
        │                   │  soft gradient│                       │
        │                   │  #F5F0EB]     │                       │
        │                   └───────────────┘                       │
        │                             │                             │
        └─────────────────────────────┼─────────────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │         COMPLETE PROMPT             │
                    │  (ProductConsistency + Theme +      │
                    │   CategoryPrompt + Quality +        │
                    │   NegativePrompt)                   │
                    └─────────────────────────────────────┘
```

---

## 6. 서브 카테고리 지원 현황

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      SUBCATEGORY SUPPORT STATUS                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  AVAILABLE (고도화 프롬프트 시스템 구현 완료)                                   │
│  ═══════════════════════════════════════════                                │
│                                                                              │
│  ✅ skincare   │ 토너, 에센스, 세럼, 크림, 로션       │ 11 섹션 │ 6 효능타입  │
│  ✅ suncare    │ 선크림, 선스틱, 선스프레이           │ 11 섹션 │ SPF/PA 레벨 │
│  ✅ lip        │ 립글로스, 립틴트, 립스틱, 립밤       │ 14 섹션 │ 8 피니시   │
│  ✅ mascara    │ 볼륨, 컬링, 롱래쉬, 워터프루프       │ 15 섹션 │ 8 브러시타입│
│  ✅ maskpack   │ 시트마스크, 워시오프, 수면팩         │ 17 섹션 │ 13 성분타입│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  PENDING (추후 추가 예정 - 현재 기존 시스템으로 폴백)                            │
│  ═══════════════════════════════════════════════════                        │
│                                                                              │
│  ⏳ cushion     │ 쿠션, 파운데이션, 프라이머                                   │
│  ⏳ eyeshadow   │ 아이섀도우 팔레트, 싱글                                      │
│  ⏳ cleanser    │ 클렌징폼, 오일, 워터                                        │
│  ⏳ other_beauty│ 기타 뷰티 제품                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. 주요 함수 호출 관계

```
orchestrateDetailPageGeneration()
    │
    ├── autoSelectTheme()                    # 비주얼 테마 자동 선택
    ├── autoSelectPalette()                  # 색상 팔레트 자동 선택
    ├── generateProductVisualReference()     # 제품 외형 참조 생성
    │
    └── generateSectionImagePromptFromText()
            │
            ├── [subCategory 존재 시]
            │       │
            │       └── buildUnifiedImagePrompt()
            │               │
            │               ├── buildSkincareImagePrompt()
            │               ├── buildSuncareImagePrompt()
            │               ├── buildLipImagePrompt()
            │               ├── buildMascaraImagePrompt()
            │               └── buildMaskPackImagePrompt()
            │
            └── [subCategory 없음 시]
                    │
                    ├── extractKeyMessagesFromText()
                    ├── getSectionTemplate()
                    ├── buildSectionTemplatePrompt()
                    └── buildNegativePrompt()
```

---

## 8. 파일별 역할 요약

| 파일명 | 역할 | 라인 수 |
|--------|------|---------|
| `index.ts` | 메인 엔트리, 모든 모듈 re-export | ~380 |
| `types.ts` | 공통 타입 정의 | ~200 |
| `category-patterns.ts` | 카테고리별 패턴/색상 | ~400 |
| `brand-presets.ts` | 브랜드 톤 프리셋 | ~300 |
| `section-templates.ts` | 섹션 템플릿 시스템 | ~1,200 |
| `visual-theme.ts` | 비주얼 테마 | ~500 |
| `image-composition.ts` | 레이아웃/네거티브 | ~600 |
| `overlay-prompts.ts` | 오버레이 텍스트 | ~800 |
| **`skincare-image-prompts.ts`** | 스킨케어 전용 ★NEW | ~480 |
| **`suncare-image-prompts.ts`** | 선케어 전용 ★NEW | ~570 |
| **`lip-image-prompts.ts`** | 립 전용 ★NEW | ~700 |
| **`mascara-image-prompts.ts`** | 마스카라 전용 ★NEW | ~680 |
| **`maskpack-image-prompts.ts`** | 마스크팩 전용 ★NEW | ~770 |
| **`beauty-subcategory.ts`** | 통합 라우터 ★NEW | ~440 |

**총 프롬프트 코드: ~7,500+ 라인**

---

*Generated: 2026-01-07*
*Author: Claude Code*
