# [Bug] 이미지 업로드 질문 없이 기획/생성 단계로 넘어가는 버그

## 요약

코디네이터 에이전트(`coordinator.ts`)의 상태 라우팅 로직에 `productImages` 체크가 누락되어, 사용자가 이미지를 업로드하지 않았음에도 기획(PLANNING) 또는 생성(GENERATION) 단계로 바로 진행되는 버그.

---

## 환경

| 항목 | 값 |
|------|-----|
| 영향 파일 | `src/services/chat-agents/agents/coordinator.ts` |
| 수정 커밋 | `b80bfa1` |
| 발생 일자 | 2026-01-22 |
| 심각도 | **High** |

---

## 재현 절차

1. 채팅을 시작하고 제품명, 카테고리, 타겟 등 기본 정보 입력
2. 이미지 업로드 없이 정보 제공 완료 의사 전달 (예: "완료", "다음으로")
3. 또는 이미지 관련 언급 없이 전체 정보를 한 번에 입력

**예상 결과:** 코디네이터가 이미지 업로드를 요청하는 질문으로 이동
**실제 결과:** 이미지 없이 기획(PLANNING) 또는 생성(GENERATION) 단계로 직행

---

## 원인 분석

`coordinator.ts`의 두 라우팅 분기에서 `productImages` 유무를 확인하지 않았음.

```ts
// 수정 전 — CONFIRM case: 이미지 체크 없이 바로 PLANNING으로
case 'CONFIRM':
  return 'PLANNING';

// 수정 전 — 상태 기반 라우팅: productImages 체크 누락
if (state.collectedData.productName && state.collectedData.category) {
  return 'PLANNING';   // 이미지 없어도 통과
}
```

---

## 수정 내용 (커밋 `b80bfa1`)

세 가지 라우팅 경로에 `productImages` 체크를 추가. +46 lines.

```ts
// 수정 후 — CONFIRM case: 이미지가 없으면 IMAGE_UPLOAD로
case 'CONFIRM':
  if (!state.collectedData.productImages || state.collectedData.productImages.length === 0) {
    return 'IMAGE_UPLOAD';
  }
  return 'PLANNING';

// 수정 후 — PROVIDE_INFO case: 이미지 관련 입력 감지 시 IMAGE_UPLOAD로 전환
case 'PROVIDE_INFO':
  if (isImageRelatedInput(userMessage)) {
    return 'IMAGE_UPLOAD';
  }
  return 'COLLECT_INFO';

// 수정 후 — 상태 기반 라우팅: productImages도 체크, 기획 후에도 이미지 없으면 SUGGESTER로
if (
  state.collectedData.productName &&
  state.collectedData.category &&
  state.collectedData.productImages?.length > 0
) {
  return 'PLANNING';
}
```

---

## 영향 범위

이미지 없이 생성된 상세페이지는 결과물 품질이 현저히 낮아지며, 이미지 기반 RAG/프롬프트가 동작하지 않아 브랜드 일관성이 깨짐. 핵심 사용자 플로우에 직접적인 영향을 미치는 버그.

---

## 테스트 커버리지

- [ ] 이미지 미첨부 상태에서 "완료" 입력 시 IMAGE_UPLOAD 단계로 이동 확인
- [ ] 이미지 관련 텍스트 입력 시 IMAGE_UPLOAD 흐름으로 전환 확인
- [ ] 이미지 첨부 후 PLANNING 단계로 정상 진행 확인
- [ ] 기획 완료 후 이미지 없는 경우 SUGGESTER로 라우팅 확인

---

## 관련 레퍼런스

- 수정 커밋: `b80bfa15d12f61bd93c859ca9f104509be8e8dd0`
- 관련 파일: `src/services/chat-agents/agents/coordinator.ts`
