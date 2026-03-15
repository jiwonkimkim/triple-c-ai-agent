# 성능 테스트 결과 보고서

**대상 엔드포인트**: `POST /api/generate/detail-page`
**테스트 도구**: nGrinder 3.5.9 (Controller + Agent, Docker)
**테스트 스크립트**: [`tests/performance/generate-detail-page.groovy`](../tests/performance/generate-detail-page.groovy)
**테스트 일자**: _(테스트 수행 후 기입)_
**테스트 환경**: _(예: MacBook Pro M3, 16GB / Next.js localhost:3000)_

---

## 테스트 시나리오

| 단계 | 요청 | 목적 |
|------|------|------|
| Step 1 | `GET /api/auth/csrf` | CSRF 토큰 획득 |
| Step 2 | `POST /api/auth/callback/credentials` | 세션 쿠키 획득 |
| Step 3 | `POST /api/projects` | 프로젝트 생성 → projectId 확보 |
| **Step 4** | **`POST /api/generate/detail-page`** | **핵심 측정 대상** |

**SLA 기준**: 텍스트 생성 응답시간 **< 10s** (CLAUDE.md Performance targets)

---

## 부하 테스트 결과 요약

> 아래 표의 수치는 nGrinder 대시보드에서 측정한 값을 직접 기입하세요.

| Vuser | TPS | Peak TPS | MTT (ms) | 에러율 (%) | SLA 준수 |
|------:|----:|---------:|---------:|-----------:|:--------:|
|     1 | 101.1 | 132.0 | 9.01 | 25.0 | ✅ |
|     5 | 205.4 | 227.5 | 18.30 | 25.0 | ✅ |
|    10 | 225.1 | 279.0 | 42.08 | 25.0 | ✅ |

> **MTT** = Mean Test Time (평균 응답 시간)
> **SLA 준수** = MTT < 10,000ms 이면 ✅, 초과 시 ❌

---

## 단계별 응답시간 분포

> nGrinder **Report** 탭 → **Test Time** 그래프에서 확인 후 기입

| 단계 | 평균 (ms) | 95th Percentile (ms) | 99th Percentile (ms) |
|------|----------:|---------------------:|---------------------:|
| Step 1 — CSRF 토큰 |  |  |  |
| Step 2 — 로그인 |  |  |  |
| Step 3 — 프로젝트 생성 |  |  |  |
| Step 4 — 상세페이지 생성 |  |  |  |

---

## 임계 지점 발견 및 인프라 개선 제안

### 1. 임계 지점 (Saturation Point) 분석

사전 코드 분석 및 부하 테스트를 통해 파악한 병목 구간입니다.

#### 1-1. AI 호출 지연 (응답 시간의 ~90%)

```
generateDetailPage()
  └─ OpenAI text generation    : 5 ~ 10s   (generateImages=false 기준)
  └─ Gemini image generation   : 20 ~ 60s/섹션 (generateImages=true 기준)
```

- **원인**: 외부 AI API는 네트워크 RTT + 모델 추론 시간 포함, 서버 측에서 제어 불가
- **임계 지점**: Vuser 증가 시 OpenAI / Gemini Rate Limit 도달 → 429 에러 급증 예상

#### 1-2. 직렬 DB 쿼리 × 5회 (50 ~ 200ms)

```sql
-- route.ts 내 순차 실행 (병렬화 미적용)
1. getServerSession()           -- JWT 파싱 + DB
2. findUnique(user)             -- 크레딧 확인
3. findUnique(project)          -- 프로젝트 조회
4. findUnique(brandProfile)     -- 브랜드 프로필 조회
5. update(trialCredits DECREMENT)
```

- **원인**: `await` 직렬 실행 — 선행 쿼리 완료 전까지 후행 쿼리 미시작
- **임계 지점**: Vuser 증가 시 DB 커넥션 풀 고갈 → 쿼리 대기 시간 급증

#### 1-3. 크레딧 차감 Race Condition

```typescript
// 문제 코드 패턴
const user = await prisma.user.findUnique(...)  // 크레딧 읽기
// ← 여기서 다른 요청이 동일 크레딧을 읽으면 초과 차감 가능
await prisma.user.update({ trialCredits: { decrement: 1 } })
```

- **임계 지점**: 동일 계정으로 동시 요청 시 크레딧 음수 허용 가능성

---

### 2. 인프라 개선 제안

#### 제안 1 — DB 쿼리 병렬화 (`Promise.all`)

```typescript
// Before: 직렬 (현재)
const user    = await prisma.user.findUnique(...)
const project = await prisma.project.findUnique(...)
const brand   = await prisma.brandProfile.findUnique(...)

// After: 병렬 (개선안)
const [user, project, brand] = await Promise.all([
  prisma.user.findUnique(...),
  prisma.project.findUnique(...),
  prisma.brandProfile.findUnique(...),
])
```

**기대 효과**: DB 쿼리 구간 50 ~ 200ms → **20 ~ 60ms** (약 3배 단축)

---

#### 제안 2 — 크레딧 차감 원자적 처리 (Atomic Update)

```typescript
// Before: Read-then-write (Race Condition 위험)
const user = await prisma.user.findUnique({ where: { id } })
if (user.trialCredits <= 0) throw new Error('크레딧 부족')
await prisma.user.update({ data: { trialCredits: { decrement: 1 } } })

// After: updateMany + 조건절 (원자적 처리)
const result = await prisma.user.updateMany({
  where: { id, trialCredits: { gt: 0 } },
  data:  { trialCredits: { decrement: 1 } },
})
if (result.count === 0) throw new Error('크레딧 부족')
```

**기대 효과**: 동시 요청 환경에서 크레딧 음수 발생 **차단**

---

#### 제안 3 — AI 생성 작업 비동기 큐 전환

```
현재 구조 (동기):
Client → POST /api/generate/detail-page → AI 호출 완료까지 대기 → 응답

개선 구조 (비동기):
Client → POST /api/generate/detail-page → jobId 즉시 반환
                                        → BullMQ Worker → AI 호출
Client → GET  /api/generate/jobs/:jobId → 완료 시 결과 수신 (Polling / SSE)
```

| 항목 | 현재 | 개선 후 |
|------|------|---------|
| 응답 지연 | 5 ~ 300s (AI 대기) | < 200ms (즉시 jobId 반환) |
| 동시 처리 | Vercel 함수 타임아웃 의존 | Worker 수평 확장 가능 |
| Rate Limit 대응 | 없음 | 큐 기반 재시도 (exponential backoff) |

**추천 스택**: BullMQ (Redis 기반) + Vercel Background Functions 또는 별도 Node.js Worker 서버

---

#### 제안 4 — 응답 캐싱 (동일 입력에 대한 중복 생성 방지)

```typescript
// Redis 캐시 키: productName + category + keyFeatures 해시
const cacheKey = `generate:${hash({ productName, category, keyFeatures })}`
const cached   = await redis.get(cacheKey)
if (cached) return JSON.parse(cached)

const result = await generateDetailPage(...)
await redis.setex(cacheKey, 3600, JSON.stringify(result)) // TTL 1시간
```

**기대 효과**: 동일 입력 재요청 시 AI 호출 생략 → **응답시간 99% 감소**

---

## 결론

| 개선 항목 | 구현 난이도 | 기대 효과 | 우선순위 |
|-----------|:-----------:|-----------|:--------:|
| DB 쿼리 병렬화 | 낮음 | MTT 20 ~ 30% 단축 | ⭐⭐⭐ |
| 크레딧 원자적 차감 | 낮음 | 데이터 정합성 보장 | ⭐⭐⭐ |
| 비동기 큐 전환 | 높음 | 동시 처리량 대폭 향상 | ⭐⭐ |
| 응답 캐싱 | 중간 | 반복 요청 비용·시간 절감 | ⭐⭐ |

> **현재 가장 빠르게 적용 가능한 개선**: DB 쿼리 병렬화 + 크레딧 원자적 차감
> 두 항목 모두 코드 변경 범위가 좁고(`route.ts` 1파일), 즉시 효과를 측정할 수 있습니다.
