# [Bug] 이미지만 첨부한 메시지가 대화창에서 사라지는 문제

## 요약

이미지 파일만 첨부하고 텍스트를 입력하지 않은 채 전송한 메시지가, AI 응답 수신 후 대화창에서 사라지는 버그.

---

## 환경

| 항목 | 값 |
|------|-----|
| 영향 파일 | `src/hooks/use-chat.ts` |
| 수정 커밋 | `12146b1` |
| 발생 일자 | 2026-01-23 |
| 심각도 | **Medium** |

---

## 재현 절차

1. `/dashboard/chat/[conversationId]` 페이지로 이동
2. 텍스트 없이 이미지 파일만 첨부 후 전송
3. AI가 응답을 반환할 때까지 대기
4. 대화창에서 사용자의 이미지 메시지 확인

**예상 결과:** 이미지 첨부 메시지가 대화창에 유지됨
**실제 결과:** AI 응답 수신 직후 이미지 메시지가 대화 목록에서 사라짐

---

## 원인 분석

`use-chat.ts`의 두 곳에서 `content`가 빈 문자열인 메시지를 필터링하는 로직이 있었음.

```ts
// 수정 전 — onDone 콜백 내 메시지 갱신 시
setMessages(prev => prev.filter(m => m.content.trim()));

// 수정 전 — DB에서 메시지 로드 시
const filtered = data.filter((m: Message) => m.content.trim());
```

이미지만 첨부한 메시지는 `content === ""`이므로 위 필터에 의해 제거되었음.

---

## 수정 내용 (커밋 `12146b1`)

`attachments`가 있는 메시지는 `content`가 비어 있어도 유지하도록 조건 변경.

```ts
// 수정 후 — content가 없어도 attachments가 있으면 유지
setMessages(prev =>
  prev.filter(m => m.content.trim() || (m.attachments && m.attachments.length > 0))
);

// 수정 후 — 메시지 로드 시도 동일하게 적용
const filtered = data.filter(
  (m: Message) => m.content.trim() || (m.attachments && m.attachments.length > 0)
);
```

---

## 테스트 커버리지

- [ ] 이미지만 첨부하고 전송 후 메시지 유지 확인
- [ ] 텍스트 + 이미지 첨부 시 정상 동작 확인
- [ ] 텍스트만 입력 시 기존 필터링 정상 동작 확인
- [ ] 대화 페이지 재진입 후 이미지 메시지 복원 확인 (DB 로드 경로)

---

## 관련 레퍼런스

- 수정 커밋: `12146b1c43f08bcb0fd26c567f76722d2895bfd1`
- 관련 파일: `src/hooks/use-chat.ts`
