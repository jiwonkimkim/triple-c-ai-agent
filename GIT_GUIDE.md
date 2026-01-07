# Git 형상관리 가이드 (초보자용)

3명의 협업자를 위한 Git 사용 가이드입니다.

---

## 1. 초기 설정 (최초 1회)

### Git 사용자 정보 설정
```bash
git config --global user.name "본인이름"
git config --global user.email "본인이메일@example.com"
```

### 저장소 클론 (프로젝트 처음 받기)
```bash
git clone <저장소URL>
cd Triple_C
```

---

## 2. 기본 작업 흐름

### 매일 작업 시작 전 (필수!)
```bash
# 1. 원격 저장소의 최신 변경사항 가져오기
git pull origin main
```

### 작업 후 변경사항 저장
```bash
# 1. 변경된 파일 확인
git status

# 2. 변경사항 스테이징 (저장 준비)
git add 파일명           # 특정 파일만
git add .               # 모든 변경 파일

# 3. 커밋 (로컬에 저장)
git commit -m "작업 내용 설명"

# 4. 푸시 (원격 저장소에 업로드)
git push origin main
```

---

## 3. 브랜치 사용하기

### 브랜치란?
- 독립적인 작업 공간
- main 브랜치를 건드리지 않고 안전하게 작업 가능
- 작업 완료 후 main에 병합(merge)

### 브랜치 명령어
```bash
# 브랜치 목록 확인
git branch              # 로컬 브랜치
git branch -a           # 모든 브랜치 (원격 포함)

# 새 브랜치 생성 및 이동
git checkout -b feature/기능이름

# 브랜치 이동
git checkout main
git checkout feature/기능이름

# 브랜치 삭제 (병합 완료 후)
git branch -d feature/기능이름
```

### 브랜치 네이밍 규칙 (권장)
- `feature/기능명` : 새 기능 개발
- `fix/버그명` : 버그 수정
- `docs/문서명` : 문서 작업

---

## 4. 브랜치 작업 흐름 (권장)

```bash
# 1. main 브랜치에서 최신 코드 받기
git checkout main
git pull origin main

# 2. 새 브랜치 생성 및 이동
git checkout -b feature/my-feature

# 3. 작업 수행...

# 4. 변경사항 커밋
git add .
git commit -m "기능 구현 완료"

# 5. 원격에 브랜치 푸시
git push origin feature/my-feature

# 6. GitHub에서 Pull Request 생성 후 리뷰
# 7. 승인 후 main에 병합
```

---

## 5. 동기화 (Sync)

### 원격 변경사항 가져오기
```bash
# fetch: 원격 변경사항 확인만 (병합X)
git fetch origin

# pull: 원격 변경사항 가져와서 병합
git pull origin main
```

### 내 브랜치에 main 최신 내용 반영
```bash
git checkout feature/my-feature
git pull origin main
# 또는
git merge main
```

---

## 6. 충돌(Conflict) 해결

### 충돌 발생 시
```bash
# 1. 충돌 파일 확인
git status

# 2. 충돌 파일 열어서 수동 수정
# <<<<<<< HEAD
# 내 코드
# =======
# 다른 사람 코드
# >>>>>>> branch-name

# 3. 충돌 해결 후
git add 충돌해결한파일
git commit -m "충돌 해결"
```

### 충돌 예방법
- 작업 시작 전 항상 `git pull`
- 같은 파일을 동시에 수정하지 않도록 작업 분담
- 자주 커밋하고 푸시하기

---

## 7. 자주 쓰는 명령어 요약

| 명령어 | 설명 |
|--------|------|
| `git status` | 현재 상태 확인 |
| `git log --oneline` | 커밋 히스토리 간단히 보기 |
| `git diff` | 변경 내용 확인 |
| `git pull origin main` | 원격 최신 코드 가져오기 |
| `git push origin 브랜치명` | 원격에 푸시 |
| `git checkout 브랜치명` | 브랜치 이동 |
| `git checkout -b 브랜치명` | 브랜치 생성 및 이동 |
| `git stash` | 작업 임시 저장 |
| `git stash pop` | 임시 저장한 작업 복원 |

---

## 8. 실수 복구

### 커밋 전 변경사항 취소
```bash
# 특정 파일 변경 취소
git checkout -- 파일명

# 스테이징 취소 (add 취소)
git reset HEAD 파일명
```

### 커밋 메시지 수정 (푸시 전)
```bash
git commit --amend -m "새로운 메시지"
```

### 직전 커밋 취소 (푸시 전)
```bash
git reset --soft HEAD~1   # 변경사항 유지
git reset --hard HEAD~1   # 변경사항 삭제 (주의!)
```

---

## 9. 협업 규칙 (3인 팀 권장)

1. **작업 전 항상 pull**: 충돌 방지의 첫걸음
2. **의미 있는 커밋 메시지**: "수정" (X) → "로그인 버그 수정" (O)
3. **작은 단위로 자주 커밋**: 하루치 작업을 한 번에 커밋하지 않기
4. **main 직접 푸시 자제**: 브랜치에서 작업 후 PR로 병합
5. **작업 영역 분담**: 같은 파일 동시 수정 최소화

---

## 10. 일반적인 하루 작업 순서

```
1. git pull origin main          # 최신 코드 받기
2. git checkout -b feature/xxx   # 브랜치 생성
3. (코딩 작업)
4. git add .                     # 스테이징
5. git commit -m "메시지"        # 커밋
6. git push origin feature/xxx   # 푸시
7. GitHub에서 PR 생성            # 코드 리뷰 요청
8. 리뷰 후 main에 병합           # 완료
```

---

## 도움이 필요할 때

```bash
# 명령어 도움말
git help <명령어>
git <명령어> --help
```
