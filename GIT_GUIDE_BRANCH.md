● Git 브랜치 병합 전략

  3명이 동시에 작업할 때 깔끔하게 병합하는 방법을 설명해드릴게요.

  권장 워크플로우

  main (기준 브랜치)
    ├── feature/donghun-기능A
    ├── feature/jiwon-기능B
    └── feature/jiyun-기능C

  단계별 진행 방법

  1. 각자 브랜치 생성 (작업 시작 전)

  # main에서 최신 코드 가져오기
  git checkout main
  git pull origin main

  # 각자 브랜치 생성
  git checkout -b feature/donghun-기능A   # 동훈님
  git checkout -b feature/jiwon-기능B     # 지원님
  git checkout -b feature/jiyun-기능C     # 지윤님

  2. 병합 전 최신 main 반영 (중요!)

  # 본인 브랜치에서
  git checkout feature/jiyun-기능C
  git fetch origin
  git rebase origin/main   # 또는 git merge origin/main

  3. 병합 순서

  순차적으로 병합하는 게 핵심입니다:

  # 1번째 사람 병합 후
  git checkout main
  git merge feature/donghun-기능A
  git push origin main

  # 2번째 사람: 최신 main 반영 후 병합
  git checkout feature/jiwon-기능B
  git fetch origin
  git rebase origin/main   # 충돌 있으면 해결
  git checkout main
  git pull origin main
  git merge feature/jiwon-기능B
  git push origin main

  # 3번째 사람도 동일하게

  충돌 방지 팁

  | 방법     | 설명                                   |
  |--------|--------------------------------------|
  | 파일 분리  | 가능하면 서로 다른 파일 수정                     |
  | 자주 동기화 | 하루에 1-2번 git fetch + rebase          |
  | PR 사용  | GitHub PR로 리뷰 후 병합 (Squash merge 권장) |

  GitHub PR 사용 시 (권장)

  # 각자 브랜치 push
  git push origin feature/jiyun-기능C

  # GitHub에서 PR 생성 → 리뷰 → Squash and merge

  Squash and merge 옵션을 사용하면:
  - 브랜치의 여러 커밋이 하나로 합쳐짐
  - 히스토리가 깔끔해짐
  - 디버깅 중간 커밋들이 main에 남지 않음

  요약

  1. main에서 브랜치 생성
  2. 병합 전 항상 최신 main을 rebase/merge
  3. 순차적으로 병합 (동시 병합 X)
  4. PR + Squash merge 권장

  이렇게 하면 이전 코드가 남지 않고 깔끔하게 병합

  
# Git 브랜치 협업 완전 가이드

## 1. 왜 브랜치가 필요한가?

```
문제 상황: 3명이 main에서 직접 작업하면?

동훈: 로그인 기능 수정 중... (아직 미완성)
지원: git pull → 동훈의 미완성 코드 받음 → 에러 발생!
지윤: git push → 충돌! 누구 코드가 맞는거지?
```

**브랜치 = 독립된 작업 공간**. 각자 브랜치에서 작업하면 서로 영향 없이 개발 가능.

---

## 2. 전체 흐름 그림

```
시간 →

main:         ●────────────────●────────●────────●────────●
              ↑                ↑        ↑        ↑        ↑
              │                │        │        │        │
동훈 브랜치:   └──●──●──●──────┘        │        │        │
                 작업  작업  완료→병합    │        │        │
                                        │        │        │
지원 브랜치:      └──●──●──●────────────┘        │        │
                    작업  작업  완료→병합         │        │
                                                 │        │
지윤 브랜치:         └──●──●──●──●───────────────┘        │
                       작업  작업  작업  완료→병합
```

---

## 3. 실제 작업 시나리오

### 시작: 각자 브랜치 만들기

**동훈님 (로그인 버그 수정)**
```bash
# 1. main 브랜치로 이동
git checkout main

# 2. 최신 코드 받기
git pull origin main

# 3. 새 브랜치 생성 + 이동
git checkout -b feature/donghun-login-fix

# 이제 이 브랜치에서 자유롭게 작업!
```

**지원님 (회원가입 기능 개선)**
```bash
git checkout main
git pull origin main
git checkout -b feature/jiwon-signup-improve
```

**지윤님 (에디터 버그 수정)**
```bash
git checkout main
git pull origin main
git checkout -b feature/jiyun-editor-fix
```

---

### 작업 중: 커밋하기

```bash
# 파일 수정 후...

# 변경사항 확인
git status

# 스테이징 (커밋할 파일 선택)
git add .

# 커밋 (작업 저장)
git commit -m "fix: 로그인 세션 만료 버그 수정"

# 원격 저장소에 푸시 (백업 + 공유)
git push origin feature/donghun-login-fix
```

**커밋은 자주 하세요!** 작은 단위로 저장해두면 문제 생겼을 때 되돌리기 쉽습니다.

---

### 병합 전: 최신 main 코드 반영하기 (핵심!)

동훈님이 먼저 병합을 완료했다고 가정. 지원님이 병합하기 전:

```bash
# 지원님 브랜치에서
git checkout feature/jiwon-signup-improve

# 원격 저장소의 최신 정보 가져오기
git fetch origin

# main의 최신 변경사항을 내 브랜치에 반영
git rebase origin/main
```

**왜 이게 필요한가?**
```
동훈님 병합 전:
main:    A ── B ── C
지원님:  A ── B ── C ── D ── E (내 작업)

동훈님 병합 후:
main:    A ── B ── C ── F (동훈님 코드)
지원님:  A ── B ── C ── D ── E (동훈님 코드 없음!)

rebase 후:
main:    A ── B ── C ── F
지원님:  A ── B ── C ── F ── D ── E (동훈님 코드 포함!)
```

---

## 4. 병합 방법 2가지

### 방법 A: 로컬에서 직접 병합

```bash
# 1. main으로 이동
git checkout main

# 2. 최신 main 받기
git pull origin main

# 3. 내 브랜치 병합
git merge feature/donghun-login-fix

# 4. 원격에 푸시
git push origin main
```

### 방법 B: GitHub PR 사용 (권장)

```bash
# 1. 내 브랜치를 원격에 푸시
git push origin feature/donghun-login-fix
```

그 다음 GitHub에서:

1. **Pull Request 생성**
   - GitHub 저장소 → "Pull requests" → "New pull request"
   - base: `main` ← compare: `feature/donghun-login-fix`
   - 제목과 설명 작성 → "Create pull request"

2. **코드 리뷰** (선택사항)
   - 팀원이 코드 확인하고 코멘트

3. **병합**
   - "Squash and merge" 버튼 클릭 (권장)

**Squash and merge의 장점:**
```
병합 전 (브랜치에 커밋 5개):
- "작업 시작"
- "버그 수정 시도"
- "아 이거 아니네"
- "진짜 수정"
- "오타 수정"

Squash merge 후 (main에 커밋 1개):
- "fix: 로그인 세션 만료 버그 수정"

→ 히스토리가 깔끔해짐!
```

---

## 5. 충돌 발생 시 해결 방법

**충돌 = 같은 파일의 같은 부분을 여러 명이 수정**

```bash
git rebase origin/main
# CONFLICT (content): Merge conflict in src/auth/login.ts
```

### 충돌 해결 단계:

```bash
# 1. 충돌 파일 확인
git status
# both modified: src/auth/login.ts
```

```typescript
// 2. 파일을 열어보면 이렇게 표시됨:
<<<<<<< HEAD
// 동훈님 코드
const session = await getSession();
=======
// 지원님 코드
const session = await fetchSession();
>>>>>>> feature/jiwon-signup-improve
```

```typescript
// 3. 원하는 코드로 수정 (둘 다 합칠 수도 있음)
const session = await getSession(); // 동훈님 코드 선택
```

```bash
# 4. 수정 완료 후
git add src/auth/login.ts
git rebase --continue

# 5. 원격에 강제 푸시 (rebase 후에는 필요)
git push origin feature/jiwon-signup-improve --force-with-lease
```

---

## 6. 실수했을 때 복구

### 커밋 취소하고 싶을 때
```bash
# 마지막 커밋 취소 (파일 변경은 유지)
git reset --soft HEAD~1

# 마지막 커밋 취소 (파일 변경도 취소)
git reset --hard HEAD~1
```

### rebase 중 망했을 때
```bash
git rebase --abort  # rebase 취소하고 원래대로
```

### 브랜치 잘못 만들었을 때
```bash
# 브랜치 삭제
git branch -d feature/wrong-branch

# 강제 삭제 (병합 안 된 브랜치)
git branch -D feature/wrong-branch
```

---

## 7. 팀 협업 체크리스트

| 순서 | 할 일 | 명령어 |
|------|-------|--------|
| 1 | main에서 브랜치 생성 | `git checkout -b feature/이름-기능` |
| 2 | 작업하며 자주 커밋 | `git add . && git commit -m "메시지"` |
| 3 | 하루 1-2번 원격에 푸시 | `git push origin 브랜치명` |
| 4 | 병합 전 최신 main 반영 | `git fetch && git rebase origin/main` |
| 5 | 충돌 있으면 해결 | 파일 수정 → `git add` → `git rebase --continue` |
| 6 | PR 생성 또는 직접 병합 | GitHub PR 또는 `git merge` |
| 7 | 병합 후 브랜치 삭제 | `git branch -d 브랜치명` |

---

## 8. 자주 쓰는 명령어 요약

### 브랜치 관련
```bash
git branch                      # 브랜치 목록 보기
git branch -a                   # 원격 브랜치 포함 전체 목록
git checkout -b 브랜치명        # 새 브랜치 생성 + 이동
git checkout 브랜치명           # 브랜치 이동
git branch -d 브랜치명          # 브랜치 삭제
```

### 동기화 관련
```bash
git fetch origin               # 원격 정보 가져오기 (병합 X)
git pull origin main           # 원격 코드 가져오기 + 병합
git push origin 브랜치명       # 원격에 푸시
```

### 병합 관련
```bash
git merge 브랜치명             # 브랜치 병합
git rebase origin/main         # main 기준으로 rebase
git rebase --abort             # rebase 취소
git rebase --continue          # 충돌 해결 후 계속
```

### 상태 확인
```bash
git status                     # 현재 상태 확인
git log --oneline -10          # 최근 커밋 10개 보기
git diff                       # 변경사항 보기
```

---

## 9. 권장 브랜치 네이밍 규칙

```
feature/이름-기능설명    # 새 기능 개발
fix/이름-버그설명        # 버그 수정
hotfix/이름-긴급수정     # 긴급 수정
refactor/이름-리팩토링   # 코드 개선
```

예시:
- `feature/donghun-login-session`
- `fix/jiwon-signup-validation`
- `refactor/jiyun-editor-cleanup`
