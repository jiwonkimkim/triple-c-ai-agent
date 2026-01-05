'use client';

import * as Sentry from "@sentry/nextjs";

export default function SentryTestPage() {
  const throwError = () => {
    throw new Error("Sentry 테스트 에러입니다!");
  };

  const captureError = () => {
    Sentry.captureException(new Error("수동 Sentry 테스트 에러"));
    alert("에러가 Sentry로 전송되었습니다!");
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '1rem',
    }}>
      <h1>Sentry 테스트 페이지</h1>
      <button
        onClick={captureError}
        style={{
          padding: '1rem 2rem',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
        }}
      >
        테스트 에러 전송 (안전)
      </button>
      <button
        onClick={throwError}
        style={{
          padding: '1rem 2rem',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
        }}
      >
        진짜 에러 발생 (페이지 깨짐)
      </button>
    </div>
  );
}
