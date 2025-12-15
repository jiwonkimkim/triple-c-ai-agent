/**
 * Motion/GIF generation service
 *
 * This service generates animated content (GIFs, short videos) from product images.
 * It can use multiple approaches:
 * 1. Frame interpolation between product images
 * 2. Text-to-video generation for product showcases
 * 3. Image animation using motion effects
 */

export type MotionType = 'zoom' | 'pan' | 'rotate' | 'bounce' | 'fade' | 'parallax';
export type OutputFormat = 'gif' | 'mp4' | 'webm';

export interface MotionEffect {
  type: MotionType;
  intensity: 'subtle' | 'moderate' | 'dramatic';
  duration: number; // in seconds
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface GenerateMotionOptions {
  images: string[]; // Source image URLs
  effect: MotionEffect;
  outputFormat: OutputFormat;
  outputSize?: {
    width: number;
    height: number;
  };
  fps?: number;
  loop?: boolean;
}

export interface MotionJobResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  outputUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  fileSize?: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Effect presets for common use cases
export const EFFECT_PRESETS: Record<string, MotionEffect> = {
  productShowcase: {
    type: 'rotate',
    intensity: 'moderate',
    duration: 3,
    easing: 'ease-in-out',
  },
  heroZoom: {
    type: 'zoom',
    intensity: 'subtle',
    duration: 4,
    easing: 'ease-out',
  },
  bannerPan: {
    type: 'pan',
    intensity: 'moderate',
    duration: 5,
    easing: 'linear',
  },
  attentionBounce: {
    type: 'bounce',
    intensity: 'subtle',
    duration: 2,
    easing: 'ease-in-out',
  },
  fadeTransition: {
    type: 'fade',
    intensity: 'moderate',
    duration: 3,
    easing: 'ease-in-out',
  },
  depthParallax: {
    type: 'parallax',
    intensity: 'dramatic',
    duration: 4,
    easing: 'ease-in-out',
  },
};

/**
 * Generate motion/animation from images
 * This is a simplified implementation - in production, you would
 * integrate with services like Runway, Luma, or custom video rendering
 */
export async function generateMotion(
  options: GenerateMotionOptions
): Promise<MotionJobResult> {
  const {
    images,
    effect,
    outputFormat,
    outputSize = { width: 1080, height: 1080 },
    fps = 30,
    loop = true,
  } = options;

  if (images.length === 0) {
    throw new Error('At least one image is required');
  }

  const jobId = `motion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // In a real implementation, this would:
  // 1. Upload images to processing server
  // 2. Apply motion effects using video processing
  // 3. Return the generated video/GIF URL

  // For demo purposes, we'll simulate the process
  const result: MotionJobResult = {
    id: jobId,
    status: 'processing',
    createdAt: new Date(),
  };

  // Simulate processing based on complexity
  const processingTime = calculateProcessingTime(effect, images.length, outputFormat);

  // In production, you would use a job queue and webhook callback
  // Here we simulate the async process
  setTimeout(() => {
    // Simulation of completion
    console.log(`Motion job ${jobId} completed`);
  }, processingTime);

  return result;
}

/**
 * Check status of a motion generation job
 */
export async function getMotionJobStatus(jobId: string): Promise<MotionJobResult | null> {
  // In production, query your job queue or database
  // This is a placeholder implementation

  return null;
}

/**
 * Generate CSS keyframes for client-side animation preview
 */
export function generateCSSAnimation(effect: MotionEffect): string {
  const { type, intensity, duration, easing } = effect;

  const intensityScale = {
    subtle: 1,
    moderate: 2,
    dramatic: 3,
  };

  const scale = intensityScale[intensity];

  switch (type) {
    case 'zoom':
      return `
        @keyframes motion-zoom {
          0% { transform: scale(1); }
          50% { transform: scale(${1 + 0.1 * scale}); }
          100% { transform: scale(1); }
        }
        animation: motion-zoom ${duration}s ${easing} infinite;
      `;

    case 'pan':
      return `
        @keyframes motion-pan {
          0% { transform: translateX(0); }
          50% { transform: translateX(${5 * scale}%); }
          100% { transform: translateX(0); }
        }
        animation: motion-pan ${duration}s ${easing} infinite;
      `;

    case 'rotate':
      return `
        @keyframes motion-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(${360 * scale}deg); }
        }
        animation: motion-rotate ${duration}s ${easing} infinite;
      `;

    case 'bounce':
      return `
        @keyframes motion-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-${10 * scale}px); }
        }
        animation: motion-bounce ${duration}s ${easing} infinite;
      `;

    case 'fade':
      return `
        @keyframes motion-fade {
          0%, 100% { opacity: 1; }
          50% { opacity: ${1 - 0.2 * scale}; }
        }
        animation: motion-fade ${duration}s ${easing} infinite;
      `;

    case 'parallax':
      return `
        @keyframes motion-parallax {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-${3 * scale}%) scale(${1 + 0.05 * scale}); }
          100% { transform: translateY(0) scale(1); }
        }
        animation: motion-parallax ${duration}s ${easing} infinite;
      `;

    default:
      return '';
  }
}

/**
 * Calculate estimated processing time based on parameters
 */
function calculateProcessingTime(
  effect: MotionEffect,
  imageCount: number,
  format: OutputFormat
): number {
  const basetime = 5000; // 5 seconds base

  const formatMultiplier = {
    gif: 1,
    mp4: 1.5,
    webm: 1.2,
  };

  const intensityMultiplier = {
    subtle: 1,
    moderate: 1.3,
    dramatic: 1.6,
  };

  return (
    basetime *
    imageCount *
    formatMultiplier[format] *
    intensityMultiplier[effect.intensity] *
    (effect.duration / 3)
  );
}

/**
 * Validate motion generation options
 */
export function validateMotionOptions(options: GenerateMotionOptions): string[] {
  const errors: string[] = [];

  if (!options.images || options.images.length === 0) {
    errors.push('At least one image is required');
  }

  if (options.images.length > 10) {
    errors.push('Maximum 10 images allowed');
  }

  if (options.effect.duration < 1 || options.effect.duration > 30) {
    errors.push('Duration must be between 1 and 30 seconds');
  }

  if (options.fps && (options.fps < 10 || options.fps > 60)) {
    errors.push('FPS must be between 10 and 60');
  }

  return errors;
}

/**
 * Get recommended effect for a use case
 */
export function getRecommendedEffect(
  useCase: 'product' | 'banner' | 'social' | 'showcase'
): MotionEffect {
  switch (useCase) {
    case 'product':
      return EFFECT_PRESETS.productShowcase;
    case 'banner':
      return EFFECT_PRESETS.bannerPan;
    case 'social':
      return EFFECT_PRESETS.attentionBounce;
    case 'showcase':
      return EFFECT_PRESETS.heroZoom;
    default:
      return EFFECT_PRESETS.fadeTransition;
  }
}
