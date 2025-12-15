'use client';

import { useState } from 'react';
import {
  ZoomIn,
  ArrowRight,
  RotateCw,
  ArrowUpDown,
  Layers,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MotionEffect, MotionType, OutputFormat } from '@/services/motion/motion-generator';

interface MotionSelectorProps {
  effect: MotionEffect;
  outputFormat: OutputFormat;
  onChange: (effect: MotionEffect, format: OutputFormat) => void;
  disabled?: boolean;
  showPreview?: boolean;
}

const motionTypes: {
  value: MotionType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'zoom',
    label: 'Zoom',
    description: 'Gradual zoom in/out effect',
    icon: <ZoomIn className="h-4 w-4" />,
  },
  {
    value: 'pan',
    label: 'Pan',
    description: 'Horizontal sliding motion',
    icon: <ArrowRight className="h-4 w-4" />,
  },
  {
    value: 'rotate',
    label: 'Rotate',
    description: '360° rotation showcase',
    icon: <RotateCw className="h-4 w-4" />,
  },
  {
    value: 'bounce',
    label: 'Bounce',
    description: 'Attention-grabbing bounce',
    icon: <ArrowUpDown className="h-4 w-4" />,
  },
  {
    value: 'parallax',
    label: 'Parallax',
    description: 'Depth and movement effect',
    icon: <Layers className="h-4 w-4" />,
  },
  {
    value: 'fade',
    label: 'Fade',
    description: 'Smooth fade transition',
    icon: <Eye className="h-4 w-4" />,
  },
];

const intensityOptions = [
  { value: 'subtle', label: 'Subtle', description: 'Gentle, minimal motion' },
  { value: 'moderate', label: 'Moderate', description: 'Balanced motion' },
  { value: 'dramatic', label: 'Dramatic', description: 'Bold, eye-catching' },
] as const;

const formatOptions = [
  { value: 'gif', label: 'GIF', description: 'Universal, loops automatically' },
  { value: 'mp4', label: 'MP4', description: 'Smaller file, better quality' },
  { value: 'webm', label: 'WebM', description: 'Modern, efficient' },
] as const;

export function MotionSelector({
  effect,
  outputFormat,
  onChange,
  disabled = false,
  showPreview = true,
}: MotionSelectorProps) {
  const [previewActive, setPreviewActive] = useState(false);

  const handleEffectChange = (updates: Partial<MotionEffect>) => {
    onChange({ ...effect, ...updates }, outputFormat);
  };

  const handleFormatChange = (format: OutputFormat) => {
    onChange(effect, format);
  };

  const getPreviewStyle = (): React.CSSProperties => {
    if (!previewActive) return {};

    const intensity = effect.intensity === 'subtle' ? 1 : effect.intensity === 'moderate' ? 2 : 3;
    const duration = effect.duration;
    const easing = effect.easing;

    switch (effect.type) {
      case 'zoom':
        return {
          animation: `motion-zoom ${duration}s ${easing} infinite`,
        };
      case 'pan':
        return {
          animation: `motion-pan ${duration}s ${easing} infinite`,
        };
      case 'rotate':
        return {
          animation: `motion-rotate ${duration}s ${easing} infinite`,
        };
      case 'bounce':
        return {
          animation: `motion-bounce ${duration}s ${easing} infinite`,
        };
      case 'fade':
        return {
          animation: `motion-fade ${duration}s ${easing} infinite`,
        };
      case 'parallax':
        return {
          animation: `motion-parallax ${duration}s ${easing} infinite`,
        };
      default:
        return {};
    }
  };

  return (
    <div className="space-y-6">
      {/* Effect Type Selection */}
      <div className="space-y-3">
        <Label>Effect Type</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {motionTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              disabled={disabled}
              onClick={() => handleEffectChange({ type: type.value })}
              className={cn(
                'flex flex-col items-center p-3 rounded-lg border-2 transition-all text-center',
                effect.type === type.value
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div
                className={cn(
                  'p-2 rounded-md mb-2',
                  effect.type === type.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {type.icon}
              </div>
              <span className="text-sm font-medium">{type.label}</span>
              <span className="text-xs text-muted-foreground mt-0.5">
                {type.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Intensity */}
      <div className="space-y-3">
        <Label>Intensity</Label>
        <div className="grid grid-cols-3 gap-2">
          {intensityOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => handleEffectChange({ intensity: option.value })}
              className={cn(
                'p-3 rounded-lg border-2 transition-all text-center',
                effect.intensity === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className="text-sm font-medium">{option.label}</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {option.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Duration</Label>
          <span className="text-sm text-muted-foreground">{effect.duration}s</span>
        </div>
        <Slider
          value={[effect.duration]}
          onValueChange={([value]) => handleEffectChange({ duration: value })}
          min={1}
          max={10}
          step={0.5}
          disabled={disabled}
        />
      </div>

      {/* Easing */}
      <div className="space-y-3">
        <Label>Easing</Label>
        <Select
          value={effect.easing}
          onValueChange={(value: any) => handleEffectChange({ easing: value })}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="linear">Linear (constant speed)</SelectItem>
            <SelectItem value="ease-in">Ease In (slow start)</SelectItem>
            <SelectItem value="ease-out">Ease Out (slow end)</SelectItem>
            <SelectItem value="ease-in-out">Ease In-Out (smooth)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Output Format */}
      <div className="space-y-3">
        <Label>Output Format</Label>
        <div className="grid grid-cols-3 gap-2">
          {formatOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => handleFormatChange(option.value)}
              className={cn(
                'p-3 rounded-lg border-2 transition-all text-center',
                outputFormat === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className="text-sm font-medium">{option.label}</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {option.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Preview</Label>
            <button
              type="button"
              onClick={() => setPreviewActive(!previewActive)}
              className="text-sm text-primary hover:underline"
            >
              {previewActive ? 'Stop' : 'Play'} Preview
            </button>
          </div>
          <div className="relative aspect-square max-w-[200px] mx-auto bg-muted rounded-lg overflow-hidden">
            <div
              className="absolute inset-4 bg-primary/20 rounded-md flex items-center justify-center"
              style={getPreviewStyle()}
            >
              <span className="text-sm text-muted-foreground">Preview</span>
            </div>
          </div>
        </div>
      )}

      {/* CSS Keyframes for preview */}
      <style jsx global>{`
        @keyframes motion-zoom {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes motion-pan {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(10%); }
        }
        @keyframes motion-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes motion-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes motion-fade {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes motion-parallax {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-3%) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
