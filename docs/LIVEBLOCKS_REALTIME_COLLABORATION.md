# Triple C 실시간 협업 기능 구현 (Liveblocks)

## 개요

Triple C 마케팅 콘텐츠 에이전트에 Figma 스타일의 실시간 협업 기능을 추가하는 프로젝트입니다.

### 구현 기능
- **동시 편집**: 다중 사용자 실시간 커서 표시
- **코멘트/피드백**: 블록별 댓글 기능
- **실시간 동기화**: 변경 사항 즉시 반영
- **협업자 패널**: 현재 접속 중인 사용자 표시

### 기술 선택
- **Liveblocks** (권장 옵션으로 선택)
  - 관리형 서비스로 설정 간편
  - React 통합 우수
  - Presence, Storage, Comments 기능 내장

---

## 구현 단계

### Phase 1: 패키지 설치

```bash
npm install @liveblocks/client @liveblocks/react @liveblocks/node
```

### Phase 2: 환경 변수 설정

`.env` 파일에 추가:
```env
LIVEBLOCKS_SECRET_KEY="sk_dev_xxxxx"
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY="pk_dev_xxxxx"
```

### Phase 3: 파일 구조

#### 신규 생성 파일

| 파일 | 설명 |
|-----|------|
| `src/lib/liveblocks.ts` | Liveblocks 클라이언트 설정 및 타입 정의 |
| `src/lib/liveblocks-utils.ts` | 서버/클라이언트 공용 유틸리티 함수 |
| `src/app/api/liveblocks-auth/route.ts` | 인증 엔드포인트 |
| `src/components/editor/collaboration-room.tsx` | Room Provider 래퍼 |
| `src/components/editor/cursors.tsx` | 실시간 커서 컴포넌트 |
| `src/components/editor/collaborators-panel.tsx` | 협업자 패널 |
| `src/components/editor/collaborative-editor.tsx` | 협업 에디터 래퍼 |
| `src/app/api/projects/[id]/comments/route.ts` | 코멘트 API |

#### 수정 파일

| 파일 | 변경 내용 |
|-----|----------|
| `src/app/providers.tsx` | LiveblocksProvider 추가 |
| `src/components/editor/index.ts` | 새 컴포넌트 export |
| `prisma/schema.prisma` | Comment 모델 추가 |
| `src/app/(dashboard)/dashboard/projects/[id]/page.tsx` | CollaborativeEditor 사용 |

---

## 주요 코드

### 1. Liveblocks 클라이언트 설정 (`src/lib/liveblocks.ts`)

```typescript
import { createClient } from "@liveblocks/client";
import { createRoomContext, createLiveblocksContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

// Presence 타입 - 각 사용자의 실시간 상태
export type Presence = {
  cursor: { x: number; y: number } | null;
  selectedBlockId: string | null;
  selectedSectionId: string | null;
  isTyping: boolean;
};

// UserMeta 타입 - 사용자 정보
export type UserMeta = {
  id: string;
  info: {
    name: string;
    email: string;
    avatar?: string;
    color: string;
  };
};

// Room Context 생성
export const {
  suspense: {
    RoomProvider,
    useRoom,
    useMyPresence,
    useUpdateMyPresence,
    useOthers,
    useSelf,
    // ... 기타 훅들
  },
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent, ThreadMetadata>(client);
```

### 2. 유틸리티 함수 분리 (`src/lib/liveblocks-utils.ts`)

> **중요**: 서버 사이드(API Route)에서 사용하는 함수는 React 훅과 분리해야 합니다.

```typescript
export const COLLABORATION_COLORS = [
  "#E57373", "#81C784", "#64B5F6", "#FFB74D", "#BA68C8",
  "#4DB6AC", "#F06292", "#AED581", "#7986CB", "#FFD54F",
];

export function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLLABORATION_COLORS[Math.abs(hash) % COLLABORATION_COLORS.length];
}
```

### 3. 인증 API (`src/app/api/liveblocks-auth/route.ts`)

```typescript
import { Liveblocks } from "@liveblocks/node";
import { getUserColor } from "@/lib/liveblocks-utils";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const { room } = await request.json();

  // 프로젝트 접근 권한 확인
  const projectId = room.replace("project-", "");
  const project = await prisma.project.findUnique({...});

  // Liveblocks 세션 생성
  const liveblocksSession = liveblocks.prepareSession(user.id, {
    userInfo: {
      name: user.name,
      email: user.email,
      avatar: user.image,
      color: getUserColor(user.id),
    },
  });

  liveblocksSession.allow(room, liveblocksSession.FULL_ACCESS);
  const { body, status } = await liveblocksSession.authorize();

  return new NextResponse(body, { status });
}
```

### 4. 실시간 커서 컴포넌트 (`src/components/editor/cursors.tsx`)

```typescript
export function Cursors() {
  const others = useOthers();

  return (
    <>
      {others.map(({ connectionId, presence, info }) => {
        if (!presence.cursor) return null;

        return (
          <div
            key={connectionId}
            style={{
              position: "fixed",
              left: presence.cursor.x,
              top: presence.cursor.y,
              pointerEvents: "none",
            }}
          >
            <CursorIcon color={info.color} />
            <span>{info.name}</span>
          </div>
        );
      })}
    </>
  );
}
```

### 5. 협업 에디터 래퍼 (`src/components/editor/collaborative-editor.tsx`)

```typescript
export function CollaborativeEditor({ project }: Props) {
  const roomId = `project-${project.id}`;

  return (
    <CollaborationRoom roomId={roomId}>
      <div className="relative">
        <CollaboratorsPanel />
        <DetailPageEditor project={project} />
        <Cursors />
      </div>
    </CollaborationRoom>
  );
}
```

### 6. 데이터베이스 모델 (`prisma/schema.prisma`)

```prisma
model Comment {
  id        String   @id @default(cuid())
  content   String
  resolved  Boolean  @default(false)

  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  blockId   String?
  sectionId String?

  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  parentId  String?
  parent    Comment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies   Comment[] @relation("CommentReplies")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 트러블슈팅

### 1. TypeScript 오류

**문제**: `project.workspace.members.length` possibly undefined

**해결**:
```typescript
// Before
project.workspace.members.length > 0

// After
(project.workspace?.members?.length ?? 0) > 0
```

### 2. 커서가 보이지 않음

**문제**: 프로젝트 페이지에서 `UnifiedEditor` 대신 `CollaborativeEditor` 사용 필요

**해결**: `src/app/(dashboard)/dashboard/projects/[id]/page.tsx` 수정
```typescript
// Before
import { UnifiedEditor } from "@/components/editor";
<UnifiedEditor project={project} />

// After
import { CollaborativeEditor } from "@/components/editor";
<CollaborativeEditor project={project} />
```

### 3. Liveblocks 인증 500 오류 (핵심 이슈)

**오류 메시지**:
```
TypeError: (0 , react__WEBPACK_IMPORTED_MODULE_0__.createContext) is not a function
```

**원인**:
- `src/lib/liveblocks.ts`에서 React 클라이언트 훅과 유틸리티 함수가 함께 있음
- API Route(서버)에서 `getUserColor` import 시 React 훅도 함께 로드되어 오류 발생

**해결**:
1. `src/lib/liveblocks-utils.ts` 생성하여 유틸리티 함수 분리
2. `src/app/api/liveblocks-auth/route.ts`에서 utils 파일에서 직접 import

```typescript
// Before (오류 발생)
import { getUserColor } from "@/lib/liveblocks";

// After (수정됨)
import { getUserColor } from "@/lib/liveblocks-utils";
```

---

## 테스트 방법

### 로컬 테스트
```bash
npm run dev
# http://localhost:3000 접속
```

### 온라인 테스트 (ngrok)
```bash
# ngrok 설치
brew install ngrok

# 인증 토큰 설정
ngrok config add-authtoken YOUR_TOKEN

# 터널 시작
ngrok http 3000
```

### 협업 테스트
1. ngrok URL을 다른 사용자에게 공유
2. 같은 프로젝트 에디터에 접속
3. 실시간 커서 및 협업자 아바타 확인

---

## 참고 자료

- [Liveblocks 공식 문서](https://liveblocks.io/docs)
- [Liveblocks React 가이드](https://liveblocks.io/docs/get-started/react)
- [Next.js App Router 통합](https://liveblocks.io/docs/guides/nextjs-app-router)

---

## 향후 개선 사항

1. **코멘트 UI 완성**: 블록별 코멘트 스레드 UI 구현
2. **Undo/Redo 동기화**: Liveblocks History API 활용
3. **오프라인 지원**: Storage 동기화 로직 개선
4. **알림 시스템**: 코멘트 멘션 시 알림
5. **권한 세분화**: VIEWER, EDITOR, ADMIN 별 기능 제한

---

*작성일: 2025-12-22*
*프로젝트: Triple C Marketing Contents Agent*
