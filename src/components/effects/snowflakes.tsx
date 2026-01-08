'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStyleTheme } from '@/contexts/style-theme-context';

// Sapporo 테마 전용 눈송이 컴포넌트
export function Snowflakes() {
  const { styleTheme } = useStyleTheme();

  const snowflakes = useMemo(() => Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: (i * 17 + 7) % 100,
    delay: (i * 0.3) % 5,
    duration: 8 + (i % 7),
    size: i % 3 === 0 ? 'w-1 h-1' : i % 3 === 1 ? 'w-1.5 h-1.5' : 'w-2 h-2',
  })), []);

  // sapporo 테마가 아니면 렌더링하지 않음
  if (styleTheme !== 'sapporo') {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      {snowflakes.map((snow) => (
        <motion.div
          key={snow.id}
          initial={{ y: -20, opacity: 0 }}
          animate={{
            y: '100vh',
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: snow.duration,
            repeat: Infinity,
            delay: snow.delay,
            ease: 'linear',
          }}
          className={`absolute ${snow.size} bg-white rounded-full`}
          style={{
            left: `${snow.left}%`,
            boxShadow: '0 0 4px rgba(255, 255, 255, 0.8)',
          }}
        />
      ))}
    </div>
  );
}
