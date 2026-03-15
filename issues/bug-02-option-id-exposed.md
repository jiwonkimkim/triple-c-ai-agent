# [Bug] 채팅 선택 옵션 클릭 시 내부 ID가 DB에 저장되는 문제

## 요약

AI가 제시한 선택지(예: "패션", "뷰티")를 클릭하면, 사용자 친화적인 라벨 대신 내부 식별자(`selectedOptionId`)가 DB에 저장되어 대화 재로드 시 깨진 텍스트가 표시되는 버그.

---

## 환경

| 항목 | 값 |
|------|-----|
| 영향 파일 | `src/hooks/use-chat.ts`, `src/app/api/chat/[conversationId]/messages/route.ts` |
| 수정 커밋 | `c050584` |
| 발생 일자 | 2026-01-23 |
| 심각도 | **High** |

---

## 재현 절차

1. 채팅 대화를 시작하고 AI가 선택지를 제시할 때까지 진행
2. 제시된 선택지 중 하나 클릭 (예: "패션")
3. 대화 페이지를 새로고침하거나 채팅 목록에서 동일 대화를 다시 열기
4. 해당 선택지 메시지 확인

**예상 결과:** "패션" 텍스트가 정상 표시됨
**실제 결과:** `"option-1"`, `"choice_fashion"` 등 내부 ID 문자열이 표시됨

---

## 원인 분석

`selectOption` 함수에서 API에 전달하는 페이로드와 로컬 상태 갱신 모두 `selectedOptionId`(내부 키)를 `content`로 사용했음.

```ts
// 수정 전 — use-chat.ts selectOption()
const response = await fetch(url, {
  method: 'POST',
  body: JSON.stringify({
    content: selectedOptionId,   // 내부 ID 전달
    selectedOptionId,
  }),
});

// 로컬 상태에도 ID로 표시
setMessages(prev => [...prev, { content: selectedOptionId, role: 'user', ... }]);
```

API Route(`messages/route.ts`)도 `content` 그대로를 DB에 저장해 영속화됨.

---

## 수정 내용 (커밋 `c050584`)

`selectedOptionLabel`을 `content`로 사용하도록 클라이언트·서버 양측 수정.

```ts
// 수정 후 — use-chat.ts
const response = await fetch(url, {
  method: 'POST',
  body: JSON.stringify({
    content: selectedOptionLabel,   // 사용자 표시 텍스트 전달
    selectedOptionId,
    selectedOptionLabel,
  }),
});

setMessages(prev => [...prev, { content: selectedOptionLabel, role: 'user', ... }]);
```

```ts
// 수정 후 — messages/route.ts
// selectedOptionLabel을 content로 저장
const userMessage = await prisma.message.create({
  data: {
    content: body.selectedOptionLabel ?? body.content,
    ...
  },
});
```

---

## 테스트 커버리지

- [ ] 선택지 클릭 후 대화창에 라벨 텍스트 표시 확인
- [ ] 페이지 새로고침 후 동일 텍스트 유지 확인 (DB 영속화)
- [ ] 선택지 클릭 후 AI 응답이 올바른 맥락(선택 내용)으로 이어지는지 확인
- [ ] DB에 저장된 `content` 컬럼 값 검증

---

## 관련 레퍼런스

- 수정 커밋: `c050584d13731beda679bd82b31eb5a3913a7cf4`
- 관련 파일: `src/hooks/use-chat.ts`, `src/app/api/chat/[conversationId]/messages/route.ts`
