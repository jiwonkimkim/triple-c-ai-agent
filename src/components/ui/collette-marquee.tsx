'use client';

import { cn } from '@/lib/utils';

interface ColletteMarqueeProps {
  items: string[];
  separator?: React.ReactNode;
  className?: string;
  speed?: 'slow' | 'normal' | 'fast';
  direction?: 'left' | 'right';
  pauseOnHover?: boolean;
}

export function ColletteMarquee({
  items,
  separator = <span className="heart">❤</span>,
  className,
  speed = 'normal',
  direction = 'left',
  pauseOnHover = true,
}: ColletteMarqueeProps) {
  const speedMap = {
    slow: '30s',
    normal: '20s',
    fast: '10s',
  };

  const animationStyle = {
    animationDuration: speedMap[speed],
    animationDirection: direction === 'right' ? 'reverse' : 'normal',
  };

  // 아이템을 충분히 복제해서 끊김 없이 스크롤
  const duplicatedItems = [...items, ...items, ...items, ...items];

  return (
    <div className={cn('collette-marquee', className)}>
      <div
        className={cn(
          'collette-marquee-content',
          pauseOnHover && 'hover:animation-play-state-paused'
        )}
        style={animationStyle}
      >
        {duplicatedItems.map((item, index) => (
          <span key={index} className="collette-marquee-item">
            <span className="wave-text">{item}</span>
            {separator}
          </span>
        ))}
      </div>
    </div>
  );
}

// 웨이브 텍스트 애니메이션을 위한 컴포넌트
interface WaveTextProps {
  text: string;
  className?: string;
}

export function WaveText({ text, className }: WaveTextProps) {
  return (
    <span className={cn('inline-flex', className)}>
      {text.split('').map((char, index) => (
        <span
          key={index}
          className="wave-text"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}
