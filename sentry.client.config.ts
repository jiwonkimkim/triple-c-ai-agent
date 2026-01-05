import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 프로덕션에서만 에러 전송
  enabled: process.env.NODE_ENV === "production",

  // 성능 모니터링 (10% 샘플링)
  tracesSampleRate: 0.1,

  // 세션 리플레이 (에러 발생 시 100%, 일반 1%)
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
  ],

  // 무시할 에러
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Network request failed",
  ],
});
