# Triple C LangGraph 아키텍처 문서

## 개요

Triple C 마케팅 콘텐츠 에이전트는 **LangGraph**를 사용한 멀티에이전트 시스템입니다.
현재 **JavaScript/TypeScript 버전** (`@langchain/langgraph`)으로 구현되어 있습니다.

---

## 1. LangGraph란?

LangGraph는 LangChain에서 제공하는 **상태 기반 멀티에이전트 워크플로우** 프레임워크입니다.

### 핵심 개념

| 개념 | 설명 |
|------|------|
| **StateGraph** | 상태를 관리하는 그래프 구조 |
| **Node** | 각 에이전트 (작업 단위) |
| **Edge** | 노드 간 연결 (라우팅) |
| **Conditional Edge** | 조건에 따른 분기 |
| **Annotation** | 상태 스키마 정의 |

---

## 2. JS vs Python LangGraph

### 개발 언어 차이

```
┌─────────────────────────────────────────────────────────┐
│  LangGraph (개념/구조)                                   │
│  - 노드, 엣지, 상태 관리, 조건부 라우팅                   │
│  - JS든 Python이든 동일한 개념                           │
└─────────────────────────────────────────────────────────┘
          ↓                              ↓
   ┌─────────────┐                ┌─────────────┐
   │  JS 버전     │                │  Python 버전 │
   │  (현재)      │                │             │
   ├─────────────┤                ├─────────────┤
   │ Next.js 내장 │                │ 별도 서버    │
   │ Studio ❌    │                │ Studio ✅   │
   └─────────────┘                └─────────────┘
```

### 기능 비교

| 기능 | Python | JS | 비고 |
|------|--------|-----|------|
| StateGraph | ✅ | ✅ | 동일 |
| Conditional Edges | ✅ | ✅ | 동일 |
| Checkpointing | ✅ | ⚠️ 제한적 | 메모리만 지원 |
| **LangGraph Studio** | ✅ | ❌ | 미지원 |
| Human-in-the-loop | ✅ | ✅ | 지원 |
| Streaming | ✅ | ✅ | 지원 |
| Subgraphs | ✅ | ✅ | 지원 |
| **Time Travel** | ✅ | ❌ | 미지원 |
| **Persistence (DB)** | ✅ | ⚠️ 제한적 | 커스텀 필요 |

### JS LangGraph 장점

| 장점 | 설명 |
|------|------|
| **단일 코드베이스** | Python 서버 따로 관리 불필요 |
| **배포 간편** | Vercel에 그냥 배포 |
| **네트워크 지연 없음** | 같은 프로세스에서 실행 |
| **타입 안정성** | TypeScript 통합 |

### 성능 관련

LLM 호출은 외부 API(OpenAI, Anthropic, Google AI)에서 처리하므로, JS든 Python이든 **성능 차이 거의 없음**.

```
┌─────────────────────────────────────────────────────────┐
│  LangGraph (JS)                                         │
│  → 그래프 라우팅 로직만 담당 (가벼움)                      │
│                                                         │
│         ↓ API 호출                                      │
│                                                         │
│  OpenAI / Anthropic / Google AI (외부 서버)             │
│  → 실제 LLM 연산 (무거움)                                │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 현재 Triple C 구현 구조

### 사용 라이브러리

```json
// package.json
"@langchain/langgraph": "^1.0.15"
```

### 파일 구조

```
src/services/chat-agents/
├── graph.ts                 ← 그래프 정의 (노드/엣지)
├── types.ts                 ← 상태 타입 정의
└── agents/
    ├── coordinator.ts       ← 중앙 라우터
    ├── intent-parser.ts     ← 의도 파악
    ├── product-detector.ts  ← 제품 감지
    ├── intake.ts            ← 정보 수집
    ├── clarifier.ts         ← 질문 응답
    ├── suggester.ts         ← 선택지 제시
    ├── discovery.ts         ← 추천/탐색
    ├── beauty-specialist.ts ← 뷰티 전문
    ├── planner.ts           ← 일반 기획
    ├── planning-consultant.ts ← 뷰티 기획
    ├── brand-context.ts     ← 브랜드 정보
    ├── generator.ts         ← 상세페이지 생성
    └── feedback.ts          ← 피드백 처리
```

### 그래프 정의 코드

```typescript
// graph.ts
import { StateGraph, END, START, Annotation } from '@langchain/langgraph';

// 상태 스키마 정의
const ChatAgentAnnotation = Annotation.Root({
  conversationId: Annotation<string>,
  userId: Annotation<string>,
  messages: Annotation<ChatMessage[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
  collectedData: Annotation<ProjectCollectedData>({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({}),
  }),
  currentAgent: Annotation<AgentType>,
  nextAction: Annotation<NextAction | undefined>,
  // ...
});

// 그래프 생성
const workflow = new StateGraph(ChatAgentAnnotation);

// 노드 추가 (11개)
workflow.addNode('COORDINATOR', coordinatorAgent);
workflow.addNode('INTAKE', intakeAgent);
workflow.addNode('CLARIFIER', clarifierAgent);
// ... 나머지 노드들

// 엣지 추가
workflow.addEdge(START, 'COORDINATOR');

// 조건부 엣지 (라우팅)
workflow.addConditionalEdges('COORDINATOR', routeFromCoordinator, {
  INTAKE: 'INTAKE',
  CLARIFIER: 'CLARIFIER',
  // ... 59개 엣지 정의
  __end__: END,
});

// 컴파일
return workflow.compile();
```

---

## 4. 에이전트 구조 (11개 노드)

### 노드 목록

| 노드 | 역할 | 한글명 |
|------|------|--------|
| **COORDINATOR** | 중앙 라우터, 의도 파악 | 중앙 라우터 |
| **INTAKE** | 정보 수집 | 정보 수집 |
| **DISCOVERY** | 추천/탐색 | 추천/탐색 |
| **CLARIFIER** | 질문 응답 | 질문 응답 |
| **SUGGESTER** | 선택지 제시 | 선택지 제시 |
| **BEAUTY_SPECIALIST** | 뷰티 전문 지식 | 뷰티 전문 |
| **PLANNER** | 일반 기획 | 일반 기획 |
| **PLANNING_CONSULTANT** | 뷰티 기획 | 뷰티 기획 |
| **BRAND_CONTEXT** | 브랜드 정보 로드 | 브랜드 정보 |
| **GENERATOR** | 상세페이지 생성 | 상세페이지 생성 |
| **FEEDBACK** | 피드백 처리 | 피드백 처리 |

### 메인 플로우 (뷰티 제품)

```
START → COORDINATOR → INTAKE → SUGGESTER → PLANNING_CONSULTANT → GENERATOR → END
```

### 그래프 시각화

```
        ┌─────────┐
        │  START  │
        └────┬────┘
             ↓
     ┌───────────────┐
     │  COORDINATOR  │ ←──────────────────────────┐
     │  (중앙 라우터)  │                            │
     └───────┬───────┘                            │
             ↓                                    │
    ┌────────┴────────┬─────────┬─────────┐      │
    ↓                 ↓         ↓         ↓      │
┌────────┐      ┌─────────┐ ┌────────┐ ┌──────┐  │
│DISCOVERY│     │ INTAKE  │ │CLARIFIER│ │ ...  │  │
└────┬───┘      └────┬────┘ └────┬───┘ └──────┘  │
     │               ↓           │               │
     │          ┌─────────┐      │               │
     │          │SUGGESTER│      │               │
     │          └────┬────┘      │               │
     │               ↓           │               │
     │     ┌─────────────────┐   │               │
     │     │PLANNING_CONSULTANT│  │               │
     │     └────────┬────────┘   │               │
     │              ↓            │               │
     │         ┌─────────┐       │               │
     │         │GENERATOR│       │               │
     │         └────┬────┘       │               │
     │              ↓            │               │
     │         ┌─────────┐       │               │
     └────────→│   END   │←──────┘               │
               └─────────┘                       │
                    ↑                            │
               ┌─────────┐                       │
               │FEEDBACK │───────────────────────┘
               └─────────┘
```

---

## 5. 의도 파악 (Intent Detection)

### 위치

`src/services/chat-agents/agents/intent-parser.ts`

### 2단계 의도 감지

```
사용자 메시지
     ↓
┌─────────────────────────────────────┐
│  1단계: 빠른 키워드 감지            │  ← 즉시 (LLM 호출 X)
│  quickIntentDetection()             │
│  - "[선택]" → SELECT_OPTION         │
│  - "안녕" → GREETING                │
│  - "네", "좋아" → CONFIRM            │
│  - "립스틱" → PROVIDE_INFO          │
└─────────────────────────────────────┘
     ↓ (confidence < 0.85면)
┌─────────────────────────────────────┐
│  2단계: LLM 분석                    │  ← Gemini 2.0 Flash
│  - 시스템 프롬프트 + 대화 컨텍스트   │
│  - JSON 형식으로 응답               │
└─────────────────────────────────────┘
```

### Intent 종류

| Intent | 예시 | 라우팅 |
|--------|------|--------|
| `CREATE` | "만들어줘" | INTAKE → PLANNER |
| `PROVIDE_INFO` | "립스틱이야" | INTAKE |
| `SELECT_OPTION` | "[선택] beauty" | SUGGESTER |
| `CONFIRM` | "네", "좋아" | GENERATOR |
| `MODIFY` | "수정해줘" | FEEDBACK |
| `CANCEL` | "취소" | 초기화 |
| `QUESTION` | "어떻게 해?" | CLARIFIER |
| `GREETING` | "안녕" | 환영 메시지 |
| `UNCLEAR` | 불명확 | CLARIFIER |

### LLM 응답 형식

```json
{
  "intent": "PROVIDE_INFO",
  "confidence": 0.9,
  "extractedInfo": {
    "productName": "비타민C 세럼",
    "category": "BEAUTY"
  },
  "reasoning": "제품명과 카테고리 정보 제공"
}
```

---

## 6. LangGraph Studio

### Studio란?

LangGraph Studio는 **개발/디버깅 도구**로, 그래프를 시각화하고 실시간으로 상태를 확인할 수 있습니다.

### 현재 상황

- **JS LangGraph는 Studio 미지원**
- Studio를 사용하려면 **Python LangGraph**로 전환 필요

### Studio 사용을 위한 아키텍처

```
┌──────────────┐        API 호출        ┌──────────────────┐
│  Next.js     │  ──────────────────→   │  Python FastAPI  │
│  (프론트)     │                        │  + LangGraph     │
└──────────────┘                        └──────────────────┘
                                               ↑
                                        Studio 연결 (개발용)
```

### Studio 설치/사용 방법 (Python 필요)

```bash
# 1. LangGraph CLI 설치
pip install langgraph-cli

# 2. .env 파일 생성
echo "LANGSMITH_API_KEY=your_api_key_here" > .env

# 3. langgraph.json 설정
{
  "graphs": {
    "chat_agent": "./graph.py:create_chat_agent_graph"
  },
  "env": ".env"
}

# 4. 서버 실행
langgraph dev

# 5. Studio 접속
# https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024
```

---

## 7. 결론

### 현재 아키텍처 평가

| 항목 | 상태 |
|------|------|
| LangGraph 핵심 기능 | ✅ 모두 사용 중 |
| 고급 기능 (Studio, Time Travel) | ❌ JS 미지원 |
| 운영 문제 | ❌ 없음 |
| 배포 편의성 | ✅ 우수 (Vercel) |

### 언제 Python 전환 고려?

1. **복잡한 디버깅** 필요 시 (Studio 필요)
2. **Time Travel** (상태 되돌리기) 필요 시
3. **영구 저장소** 통합 필요 시
4. **로컬 ML 모델** 서빙 필요 시

### 현재 권장

현재 JS LangGraph 구조로 **운영에 문제없음**.
Studio 디버깅이 꼭 필요한 경우에만 Python 백엔드 분리 고려.

---

*문서 작성일: 2025-01-21*
