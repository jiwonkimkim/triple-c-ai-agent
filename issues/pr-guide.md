# PR 작성 가이드 — 버그 이슈 연결 방법

이 가이드는 `issues/` 폴더에 저장된 버그 리포트를 GitHub Issues에 등록한 뒤,
수정 PR 본문에 `Closes #이슈번호`를 포함해 자동 종결 연결하는 방법을 설명합니다.

---

## 1단계: GitHub Issues 등록

각 `.md` 파일을 GitHub Issues에 등록할 때 사용할 제목과 레이블:

| 파일 | 이슈 제목 | 레이블 |
|------|-----------|--------|
| `bug-01-image-message-disappear.md` | `[Bug] 이미지만 첨부한 메시지가 대화창에서 사라지는 문제` | `bug`, `ux` |
| `bug-02-option-id-exposed.md` | `[Bug] 채팅 선택 옵션 클릭 시 내부 ID가 DB에 저장되는 문제` | `bug`, `data-integrity` |
| `bug-03-image-step-skipped.md` | `[Bug] 이미지 업로드 질문 없이 기획/생성 단계로 넘어가는 버그` | `bug`, `critical`, `flow` |

---

## 2단계: PR 본문 템플릿

PR 제목과 본문 예시입니다. `#이슈번호`는 실제 등록 후 부여된 번호로 교체하세요.

### Closes #3

```
제목: fix: 이미지만 첨부한 메시지가 대화창에서 사라지는 문제 수정

본문:

## 변경 사항

- `use-chat.ts`의 메시지 필터 조건을 수정하여 `attachments`가 있는 메시지는
  `content`가 비어 있어도 유지되도록 처리

## 원인

`content.trim()`만으로 필터링하던 로직이 이미지 전용 메시지를 제거했음

## 수정 파일

- `src/hooks/use-chat.ts`

Closes #3
```

---

### Closes #4

```
제목: fix: 채팅 선택 옵션이 ID 대신 라벨로 저장되도록 수정

본문:

## 변경 사항

- `selectOption()` 페이로드에서 `selectedOptionId` → `selectedOptionLabel`을 `content`로 전달
- `messages/route.ts`에서 `selectedOptionLabel`을 DB `content`에 저장

## 원인

클라이언트·서버 양측이 내부 ID를 그대로 content로 사용해 영속화됨

## 수정 파일

- `src/hooks/use-chat.ts`
- `src/app/api/chat/[conversationId]/messages/route.ts`

Closes #4
```

---

### Closes #5

```
제목: fix: 이미지 업로드 질문 없이 기획/생성으로 넘어가는 버그 수정

본문:

## 변경 사항

- `CONFIRM` case에 `productImages` 체크 추가 → 없으면 `IMAGE_UPLOAD`로 라우팅
- `PROVIDE_INFO` case에 이미지 관련 입력 감지 시 `IMAGE_UPLOAD` 전환 추가
- 상태 기반 라우팅에서 `productImages` 조건 추가

## 원인

coordinator.ts의 라우팅 분기 3곳에서 `productImages` 유무를 확인하지 않음

## 수정 파일

- `src/services/chat-agents/agents/coordinator.ts`

Closes #5
```

---

## 여러 이슈를 하나의 PR로 닫는 경우

하나의 PR이 여러 이슈를 함께 수정한다면 본문 끝에 나열합니다:

```
Closes #3
Closes #4
Closes #5
```

또는 한 줄로:

```
Closes #3, Closes #4, Closes #5
```

> **참고:** `Closes`, `Fixes`, `Resolves` 키워드 모두 GitHub에서 동일하게 동작합니다.
> PR이 **main** 브랜치에 머지될 때 해당 이슈가 자동으로 닫힙니다.

---

## 수정 커밋 참조

| 버그 | 수정 커밋 |
|------|-----------|
| Closes #3 | `12146b1` |
| Closes #4 | `c050584` |
| Closes #5 | `b80bfa1` |
