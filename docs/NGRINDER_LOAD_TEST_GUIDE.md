# nGrinder 로드 테스트 가이드

`/api/generate/detail-page` 엔드포인트 부하 테스트를 위한 nGrinder Controller/Agent 로컬 실행 및 Groovy 스크립트 등록 방법입니다.

---

## 파일 구성

| 파일 | 설명 |
|------|------|
| `docker-compose.ngrinder.yml` | Controller + Agent 컨테이너 설정 |
| `tests/performance/generate-detail-page.groovy` | nGrinder 용 Groovy 테스트 스크립트 |

---

## 1단계: 컨테이너 실행

```bash
# 프로젝트 루트에서 실행
docker compose -f docker-compose.ngrinder.yml up -d

# 상태 확인 (Controller가 먼저 올라와야 Agent가 연결됨)
docker compose -f docker-compose.ngrinder.yml ps
```

> Controller 초기 기동에 30~60초 소요. Agent는 그 이후 자동 연결됩니다.

---

## 2단계: 브라우저 접속

```
http://localhost:8080
```

| 항목 | 값 |
|------|----|
| ID   | `admin` |
| PW   | `admin` |

로그인 후 좌측 메뉴 **Agent Management** 에서 Agent 1개가 `Approved` 상태인지 확인.

---

## 3단계: Groovy 스크립트 등록

1. 상단 메뉴 **Script** 클릭
2. 우측 상단 **Create** → **Create a Script** 클릭
3. 아래와 같이 입력:

| 필드 | 값 |
|------|----|
| Script Name | `generate-detail-page` |
| Script Type | `Groovy` |
| Base URL | `http://host.docker.internal:3000` |

4. **Create** 버튼 클릭 → 에디터 열림
5. 에디터 전체 내용을 지우고 `tests/performance/generate-detail-page.groovy` 파일 내용을 붙여넣기
6. 상단 **BASE_URL** 값 확인:

```groovy
// 로컬 Next.js 앱이 3000 포트에 떠 있을 때
static final String BASE_URL = "http://host.docker.internal:3000"
//                                    ↑ localhost 대신 이걸 써야 컨테이너에서 호스트에 접근 가능
```

7. **Save** → **Validate** 버튼으로 문법 오류 확인

---

## 4단계: 테스트 실행

1. 상단 메뉴 **Performance Test** → **Create Test**
2. 설정:

| 항목 | 권장값 |
|------|--------|
| Test Name | `detail-page-load-test` |
| Script | 방금 등록한 `generate-detail-page` |
| Agent | 1 |
| Vuser per agent | 1 (먼저 단건 검증) |
| Duration | 1분 |

3. **Save and Start** → 실시간 TPS, 응답시간, 에러율 대시보드 확인

---

## 5단계: 종료

```bash
docker compose -f docker-compose.ngrinder.yml down
# 데이터(스크립트·결과)는 볼륨에 보존됨 — 다음 실행 시 그대로 유지
```

---

## 주의사항

- **`host.docker.internal`**: 컨테이너에서 맥 로컬호스트(Next.js 앱)에 접근할 때 `localhost` 대신 반드시 이 주소를 사용해야 합니다.
- Next.js 앱이 `docker-compose.yml`로 실행 중이라면 같은 네트워크에 붙이거나, `http://host.docker.internal:3002`로 포트를 맞춰주세요.
- `admin / admin` 비밀번호는 **Admin** → **User Management** 에서 변경 가능합니다.
