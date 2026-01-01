'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export function MouseGlowEffect() {
  const { theme } = useTheme();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hueRotation, setHueRotation] = useState(0);
  const [autoHue, setAutoHue] = useState(0);
  const [mounted, setMounted] = useState(false);

  // 클라이언트 마운트 확인
  useEffect(() => {
    setMounted(true);
  }, []);

  // 마우스 이동 감지
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      const rotation = ((e.clientX + e.clientY) / 30) % 360;
      setHueRotation(rotation);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 자동 색상 변화 (더 느리게)
  useEffect(() => {
    const interval = setInterval(() => {
      setAutoHue(prev => (prev + 0.02) % 360);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const combinedHue = (hueRotation + autoHue) % 360;

  // 마운트 전이거나 다크 테마일 때만 숨김
  if (!mounted) {
    return null;
  }

  // 다크 테마일 때만 숨김 (light, system, undefined 등에서는 표시)
  if (theme === 'dark') {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {/* 분홍색 */}
      <div
        className="pointer-events-none fixed transition-all duration-700 ease-out animate-morph-1"
        style={{
          width: 520,
          height: 680,
          left: mousePosition.x - 260,
          top: mousePosition.y - 300,
          background: 'radial-gradient(ellipse at 30% 25%, rgba(251, 150, 200, 0.35) 0%, rgba(251, 150, 200, 0.08) 50%, transparent 70%)',
          filter: `blur(65px) hue-rotate(${combinedHue}deg)`,
        }}
      />
      {/* 연한 에메랄드 */}
      <div
        className="pointer-events-none fixed transition-all duration-1000 ease-out animate-morph-2"
        style={{
          width: 500,
          height: 400,
          left: mousePosition.x - 280,
          top: mousePosition.y - 150,
          background: 'radial-gradient(ellipse at 60% 40%, rgba(167, 243, 208, 0.28) 0%, rgba(167, 243, 208, 0.06) 45%, transparent 65%)',
          filter: `blur(70px) hue-rotate(${combinedHue * 0.3}deg)`,
        }}
      />
      {/* 보라색 */}
      <div
        className="pointer-events-none fixed transition-all duration-850 ease-out animate-morph-3"
        style={{
          width: 480,
          height: 620,
          left: mousePosition.x - 260,
          top: mousePosition.y - 360,
          background: 'radial-gradient(ellipse at 25% 70%, rgba(196, 181, 253, 0.35) 0%, rgba(196, 181, 253, 0.08) 48%, transparent 68%)',
          filter: `blur(72px) hue-rotate(${combinedHue * 1.1}deg)`,
        }}
      />
      {/* 연한 노랑 */}
      <div
        className="pointer-events-none fixed transition-all duration-800 ease-out animate-morph-5"
        style={{
          width: 420,
          height: 380,
          left: mousePosition.x - 150,
          top: mousePosition.y - 200,
          background: 'radial-gradient(ellipse at 60% 35%, rgba(253, 230, 138, 0.32) 0%, rgba(253, 230, 138, 0.07) 48%, transparent 68%)',
          filter: `blur(68px) hue-rotate(${combinedHue * 0.3}deg)`,
        }}
      />
      {/* 연한 피치/살구색 */}
      <div
        className="pointer-events-none fixed transition-all duration-950 ease-out animate-morph-6"
        style={{
          width: 500,
          height: 420,
          left: mousePosition.x - 320,
          top: mousePosition.y - 180,
          background: 'radial-gradient(ellipse at 40% 55%, rgba(254, 202, 165, 0.30) 0%, rgba(254, 202, 165, 0.06) 50%, transparent 70%)',
          filter: `blur(65px) hue-rotate(${combinedHue * 0.5}deg)`,
        }}
      />
      {/* 연한 하늘색 */}
      <div
        className="pointer-events-none fixed transition-all duration-750 ease-out animate-morph-7"
        style={{
          width: 460,
          height: 520,
          left: mousePosition.x - 80,
          top: mousePosition.y - 320,
          background: 'radial-gradient(ellipse at 45% 30%, rgba(147, 197, 253, 0.33) 0%, rgba(147, 197, 253, 0.08) 46%, transparent 66%)',
          filter: `blur(70px) hue-rotate(${combinedHue * 0.9}deg)`,
        }}
      />
      {/* 연한 코랄 */}
      <div
        className="pointer-events-none fixed transition-all duration-880 ease-out animate-morph-8"
        style={{
          width: 380,
          height: 480,
          left: mousePosition.x - 200,
          top: mousePosition.y - 100,
          background: 'radial-gradient(ellipse at 50% 60%, rgba(251, 182, 182, 0.28) 0%, rgba(251, 182, 182, 0.06) 48%, transparent 68%)',
          filter: `blur(62px) hue-rotate(${combinedHue * 0.6}deg)`,
        }}
      />
    </div>
  );
}
