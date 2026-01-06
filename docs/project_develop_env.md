  런타임 환경

  - Node.js 18.17.0 이상 (LTS 20.x 권장)
  - npm 9.x / yarn 1.22.x / pnpm 8.x

  주요 패키지 버전 (16개 카테고리)

  1. 프레임워크 및 언어: TypeScript 5.6.3, Next.js 14.2.15, React 18.3.1
  2. 데이터베이스: PostgreSQL 14+, Prisma 5.22.0
  3. 인증: NextAuth.js 4.24.8, bcryptjs 2.4.3
  4. AI/ML: OpenAI 4.68.0, Anthropic 0.30.0, Pinecone 3.0.0
  5. 결제: Stripe 14.0.0
  6. 상태 관리: Zustand 5.0.0, React Query 5.59.0
  7. UI/스타일링: Tailwind CSS 3.4.14, Framer Motion 11.11.0
  8. Radix UI: 17개 컴포넌트 패키지
  9. 폼/유효성 검사: React Hook Form 7.53.0, Zod 3.23.8
  10. 유틸리티: date-fns 4.1.0, uuid 10.0.0
  11. 개발 도구: ESLint 8.57.1, Vitest 2.1.3
  12. 타입 정의: @types/node, @types/react 등

  외부 서비스 요구사항

  - PostgreSQL, Pinecone, OpenAI API (필수)
  - Stripe, Runway ML, Google OAuth (선택/프로덕션)

  환경 변수 템플릿

  - 데이터베이스, 인증, AI 서비스, 결제 등 전체 환경 변수 목록

  설치 및 실행 명령어

  - npm install, db 마이그레이션, 개발/프로덕션 서버 실행 등