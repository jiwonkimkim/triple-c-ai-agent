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
      const rotation = ((e.clientX + e.clientY) / 8) % 360;
      setHueRotation(rotation);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 자동 색상 변화
  useEffect(() => {
    const interval = setInterval(() => {
      setAutoHue(prev => (prev + 0.08) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const combinedHue = (hueRotation + autoHue) % 360;

  // 라이트 테마에서만 표시, 마운트 전에는 숨김
  if (!mounted || theme === 'dark') {
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
      {/* 에메랄드색 */}
      <div
        className="pointer-events-none fixed transition-all duration-1000 ease-out animate-morph-2"
        style={{
          width: 580,
          height: 380,
          left: mousePosition.x - 300,
          top: mousePosition.y - 120,
          background: 'radial-gradient(ellipse at 70% 45%, rgba(110, 231, 183, 0.38) 0%, rgba(110, 231, 183, 0.1) 45%, transparent 68%)',
          filter: `blur(70px) hue-rotate(${combinedHue * 0.4}deg)`,
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
      {/* 청록색 */}
      <div
        className="pointer-events-none fixed transition-all duration-900 ease-out animate-morph-4"
        style={{
          width: 350,
          height: 450,
          left: mousePosition.x - 100,
          top: mousePosition.y - 280,
          background: 'radial-gradient(ellipse at 55% 40%, rgba(153, 246, 228, 0.3) 0%, rgba(153, 246, 228, 0.06) 45%, transparent 65%)',
          filter: `blur(60px) hue-rotate(${combinedHue * 0.7}deg)`,
        }}
      />
    </div>
  );
}
