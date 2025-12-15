'use client';

import { Monitor, Smartphone, Square, RectangleVertical, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { VideoAspectRatio, VideoDuration } from '@/services/video';

interface VideoOptionsProps {
  aspectRatio: VideoAspectRatio;
  duration: VideoDuration;
  motionIntensity: 'low' | 'medium' | 'high';
  onAspectRatioChange: (ratio: VideoAspectRatio) => void;
  onDurationChange: (duration: VideoDuration) => void;
  onMotionIntensityChange: (intensity: 'low' | 'medium' | 'high') => void;
  disabled?: boolean;
}

const aspectRatioOptions: {
  value: VideoAspectRatio;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: '16:9',
    label: '16:9',
    description: 'YouTube, 웹사이트',
    icon: <Monitor className="h-4 w-4" />,
  },
  {
    value: '9:16',
    label: '9:16',
    description: 'TikTok, Reels, Shorts',
    icon: <Smartphone className="h-4 w-4" />,
  },
  {
    value: '1:1',
    label: '1:1',
    description: 'Instagram, 피드',
    icon: <Square className="h-4 w-4" />,
  },
  {
    value: '4:5',
    label: '4:5',
    description: 'Instagram, 포트폴리오',
    icon: <RectangleVertical className="h-4 w-4" />,
  },
];

const durationOptions: { value: VideoDuration; label: string; credits: number }[] = [
  { value: 4, label: '4초', credits: 10 },
  { value: 8, label: '8초', credits: 20 },
  { value: 16, label: '16초', credits: 40 },
];

const motionOptions: { value: 'low' | 'medium' | 'high'; label: string; description: string }[] = [
  { value: 'low', label: '부드러움', description: '미세한 움직임' },
  { value: 'medium', label: '보통', description: '자연스러운 움직임' },
  { value: 'high', label: '역동적', description: '강렬한 움직임' },
];

export function VideoOptions({
  aspectRatio,
  duration,
  motionIntensity,
  onAspectRatioChange,
  onDurationChange,
  onMotionIntensityChange,
  disabled = false,
}: VideoOptionsProps) {
  return (
    <div className="space-y-6">
      {/* Aspect Ratio */}
      <div className="space-y-3">
        <Label>화면 비율</Label>
        <div className="grid grid-cols-4 gap-2">
          {aspectRatioOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onAspectRatioChange(option.value)}
              className={cn(
                'flex flex-col items-center p-3 rounded-lg border-2 transition-all',
                aspectRatio === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div
                className={cn(
                  'p-2 rounded mb-1',
                  aspectRatio === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {option.icon}
              </div>
              <span className="text-sm font-medium">{option.label}</span>
              <span className="text-[10px] text-muted-foreground">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>영상 길이</Label>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {duration}초
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {durationOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onDurationChange(option.value)}
              className={cn(
                'p-3 rounded-lg border-2 transition-all text-center',
                duration === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className="text-sm font-medium">{option.label}</span>
              <p className="text-xs text-muted-foreground mt-1">
                {option.credits} 크레딧
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Motion Intensity */}
      <div className="space-y-3">
        <Label>모션 강도</Label>
        <div className="grid grid-cols-3 gap-2">
          {motionOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onMotionIntensityChange(option.value)}
              className={cn(
                'p-3 rounded-lg border-2 transition-all text-center',
                motionIntensity === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className="text-sm font-medium">{option.label}</span>
              <p className="text-xs text-muted-foreground mt-1">
                {option.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
