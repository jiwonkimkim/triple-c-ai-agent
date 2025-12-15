'use client';

import { Zap, Sparkles, Clock, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import type { ImageQuality } from '@/services/image/image-generator';

interface QualitySelectorProps {
  value: ImageQuality;
  onChange: (quality: ImageQuality) => void;
  disabled?: boolean;
  showEstimate?: boolean;
  imageCount?: number;
}

const qualityOptions: {
  value: ImageQuality;
  label: string;
  description: string;
  icon: React.ReactNode;
  timeMultiplier: number;
  features: string[];
}[] = [
  {
    value: 'draft',
    label: 'Draft',
    description: 'Fast generation for quick previews',
    icon: <Zap className="h-5 w-5" />,
    timeMultiplier: 1,
    features: ['Standard quality', '~10 seconds per image', 'Good for iteration'],
  },
  {
    value: 'hd',
    label: 'HD',
    description: 'High quality for final production',
    icon: <Sparkles className="h-5 w-5" />,
    timeMultiplier: 2,
    features: ['Enhanced detail', '~20 seconds per image', 'Production ready'],
  },
];

export function QualitySelector({
  value,
  onChange,
  disabled = false,
  showEstimate = true,
  imageCount = 1,
}: QualitySelectorProps) {
  const selectedOption = qualityOptions.find((opt) => opt.value === value);
  const estimatedTime = selectedOption
    ? Math.ceil(10 * selectedOption.timeMultiplier * imageCount)
    : 0;

  return (
    <div className="space-y-3">
      <Label>Image Quality</Label>

      <div className="grid gap-3 sm:grid-cols-2">
        {qualityOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative flex flex-col items-start p-4 rounded-lg border-2 transition-all text-left',
              value === option.value
                ? 'border-primary bg-primary/5'
                : 'border-muted hover:border-muted-foreground/50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {/* Selected indicator */}
            {value === option.value && (
              <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
            )}

            {/* Icon and label */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className={cn(
                  'p-1.5 rounded-md',
                  value === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {option.icon}
              </div>
              <span className="font-semibold">{option.label}</span>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-3">
              {option.description}
            </p>

            {/* Features */}
            <ul className="space-y-1">
              {option.features.map((feature, index) => (
                <li
                  key={index}
                  className="text-xs text-muted-foreground flex items-center gap-1.5"
                >
                  <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                  {feature}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* Time estimate */}
      {showEstimate && imageCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">
          <Clock className="h-4 w-4" />
          <span>
            Estimated time: ~{estimatedTime} seconds for {imageCount} image
            {imageCount > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

// Compact version for inline use
export function QualitySelectorCompact({
  value,
  onChange,
  disabled = false,
}: Omit<QualitySelectorProps, 'showEstimate' | 'imageCount'>) {
  return (
    <div className="flex gap-2">
      {qualityOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            value === option.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
