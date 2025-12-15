/**
 * Video Generation Service
 * Integrates with Runway ML API for AI-powered video generation
 */

export type VideoStyle =
  | 'cinematic'
  | 'commercial'
  | 'social_media'
  | 'product_showcase'
  | 'lifestyle';

export type VideoAspectRatio = '16:9' | '9:16' | '1:1' | '4:5';

export type VideoDuration = 4 | 8 | 16; // seconds

export interface VideoGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  style: VideoStyle;
  aspectRatio: VideoAspectRatio;
  duration: VideoDuration;
  referenceImage?: string; // base64 or URL
  seed?: number;
  motionIntensity?: 'low' | 'medium' | 'high';
}

export interface VideoGenerationResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  error?: string;
  metadata: {
    prompt: string;
    style: VideoStyle;
    aspectRatio: VideoAspectRatio;
    generatedAt?: Date;
    processingTime?: number;
  };
}

export interface VideoJobProgress {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  currentStep?: string;
  estimatedTimeRemaining?: number; // seconds
}

// Style-specific prompt enhancements
const stylePromptEnhancements: Record<VideoStyle, string> = {
  cinematic: 'cinematic lighting, professional color grading, shallow depth of field, dramatic composition, film grain',
  commercial: 'clean and professional, bright lighting, product-focused, high production value, advertisement quality',
  social_media: 'vibrant colors, eye-catching, dynamic movement, trending aesthetic, engaging content',
  product_showcase: '360 degree rotation, studio lighting, clean background, product detail focus, premium feel',
  lifestyle: 'natural lighting, authentic moments, warm tones, aspirational lifestyle, relatable content',
};

// Aspect ratio dimensions
const aspectRatioDimensions: Record<VideoAspectRatio, { width: number; height: number }> = {
  '16:9': { width: 1280, height: 720 },
  '9:16': { width: 720, height: 1280 },
  '1:1': { width: 1024, height: 1024 },
  '4:5': { width: 1024, height: 1280 },
};

/**
 * Main video generation function
 */
export async function generateVideo(
  options: VideoGenerationOptions
): Promise<VideoGenerationResult> {
  const {
    prompt,
    negativePrompt,
    style,
    aspectRatio,
    duration,
    referenceImage,
    seed,
    motionIntensity = 'medium',
  } = options;

  // Enhance prompt with style-specific additions
  const enhancedPrompt = `${prompt}, ${stylePromptEnhancements[style]}`;

  // Get dimensions for aspect ratio
  const dimensions = aspectRatioDimensions[aspectRatio];

  try {
    // Check for Runway API key
    const apiKey = process.env.RUNWAY_API_KEY;

    if (!apiKey) {
      // Return mock result for development
      return createMockVideoResult(options);
    }

    // Initialize Runway API request
    const runwayResponse = await callRunwayAPI({
      prompt: enhancedPrompt,
      negativePrompt: negativePrompt || 'blurry, low quality, distorted, ugly, bad anatomy',
      width: dimensions.width,
      height: dimensions.height,
      duration,
      referenceImage,
      seed,
      motionIntensity,
    });

    return {
      id: runwayResponse.id,
      status: 'processing',
      metadata: {
        prompt: enhancedPrompt,
        style,
        aspectRatio,
      },
    };
  } catch (error) {
    console.error('Video generation error:', error);
    throw new Error('Failed to start video generation');
  }
}

/**
 * Check video generation job status
 */
export async function checkVideoJobStatus(jobId: string): Promise<VideoJobProgress> {
  const apiKey = process.env.RUNWAY_API_KEY;

  if (!apiKey) {
    // Mock progress for development
    return createMockProgress(jobId);
  }

  try {
    const response = await fetch(`https://api.runwayml.com/v1/tasks/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Runway API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      jobId,
      status: mapRunwayStatus(data.status),
      progress: data.progress || 0,
      currentStep: data.current_step,
      estimatedTimeRemaining: data.estimated_time_remaining,
    };
  } catch (error) {
    console.error('Check job status error:', error);
    throw error;
  }
}

/**
 * Get completed video result
 */
export async function getVideoResult(jobId: string): Promise<VideoGenerationResult> {
  const apiKey = process.env.RUNWAY_API_KEY;

  if (!apiKey) {
    // Mock result for development
    return createMockCompletedResult(jobId);
  }

  try {
    const response = await fetch(`https://api.runwayml.com/v1/tasks/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Runway API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: jobId,
      status: mapRunwayStatus(data.status),
      videoUrl: data.output?.video_url,
      thumbnailUrl: data.output?.thumbnail_url,
      duration: data.output?.duration,
      metadata: {
        prompt: data.input?.prompt,
        style: 'cinematic',
        aspectRatio: '16:9',
        generatedAt: new Date(data.completed_at),
        processingTime: data.processing_time,
      },
    };
  } catch (error) {
    console.error('Get video result error:', error);
    throw error;
  }
}

/**
 * Cancel a video generation job
 */
export async function cancelVideoJob(jobId: string): Promise<boolean> {
  const apiKey = process.env.RUNWAY_API_KEY;

  if (!apiKey) {
    return true; // Mock cancellation
  }

  try {
    const response = await fetch(`https://api.runwayml.com/v1/tasks/${jobId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Cancel job error:', error);
    return false;
  }
}

/**
 * Call Runway API for video generation
 */
async function callRunwayAPI(params: {
  prompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  duration: number;
  referenceImage?: string;
  seed?: number;
  motionIntensity: string;
}): Promise<{ id: string }> {
  const apiKey = process.env.RUNWAY_API_KEY;

  const requestBody: Record<string, any> = {
    prompt: params.prompt,
    negative_prompt: params.negativePrompt,
    width: params.width,
    height: params.height,
    num_frames: params.duration * 24, // Assuming 24fps
    motion_bucket_id: getMotionBucketId(params.motionIntensity),
  };

  if (params.referenceImage) {
    requestBody.image = params.referenceImage;
  }

  if (params.seed) {
    requestBody.seed = params.seed;
  }

  const response = await fetch('https://api.runwayml.com/v1/image-to-video', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': '2024-11-01',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Runway API request failed');
  }

  return response.json();
}

/**
 * Map motion intensity to Runway motion bucket ID
 */
function getMotionBucketId(intensity: string): number {
  switch (intensity) {
    case 'low':
      return 80;
    case 'high':
      return 200;
    case 'medium':
    default:
      return 127;
  }
}

/**
 * Map Runway status to our status
 */
function mapRunwayStatus(status: string): VideoJobProgress['status'] {
  switch (status.toLowerCase()) {
    case 'pending':
    case 'queued':
      return 'pending';
    case 'running':
    case 'processing':
      return 'processing';
    case 'succeeded':
    case 'completed':
      return 'completed';
    case 'failed':
    case 'cancelled':
    default:
      return 'failed';
  }
}

// ============================================
// Mock Functions for Development
// ============================================

function createMockVideoResult(options: VideoGenerationOptions): VideoGenerationResult {
  return {
    id: `mock-video-${Date.now()}`,
    status: 'processing',
    metadata: {
      prompt: options.prompt,
      style: options.style,
      aspectRatio: options.aspectRatio,
    },
  };
}

let mockProgressCounter = 0;

function createMockProgress(jobId: string): VideoJobProgress {
  mockProgressCounter += 10;
  if (mockProgressCounter > 100) mockProgressCounter = 100;

  const steps = [
    'Initializing generation...',
    'Analyzing prompt...',
    'Generating keyframes...',
    'Interpolating frames...',
    'Rendering video...',
    'Finalizing output...',
  ];

  const stepIndex = Math.min(Math.floor(mockProgressCounter / 20), steps.length - 1);

  return {
    jobId,
    status: mockProgressCounter >= 100 ? 'completed' : 'processing',
    progress: mockProgressCounter,
    currentStep: steps[stepIndex],
    estimatedTimeRemaining: Math.max(0, (100 - mockProgressCounter) * 2),
  };
}

function createMockCompletedResult(jobId: string): VideoGenerationResult {
  return {
    id: jobId,
    status: 'completed',
    videoUrl: '/mock-video.mp4',
    thumbnailUrl: '/mock-thumbnail.jpg',
    duration: 8,
    metadata: {
      prompt: 'Mock generated video',
      style: 'cinematic',
      aspectRatio: '16:9',
      generatedAt: new Date(),
      processingTime: 45,
    },
  };
}

/**
 * Estimate credits required for video generation
 */
export function estimateVideoCredits(options: VideoGenerationOptions): number {
  const baseCost = 10;
  const durationMultiplier = options.duration / 4; // 4 seconds = 1x
  const qualityMultiplier = options.aspectRatio === '16:9' ? 1.2 : 1;

  return Math.ceil(baseCost * durationMultiplier * qualityMultiplier);
}

/**
 * Validate video generation options
 */
export function validateVideoOptions(options: VideoGenerationOptions): string[] {
  const errors: string[] = [];

  if (!options.prompt || options.prompt.trim().length < 10) {
    errors.push('프롬프트는 최소 10자 이상이어야 합니다.');
  }

  if (options.prompt && options.prompt.length > 500) {
    errors.push('프롬프트는 500자를 초과할 수 없습니다.');
  }

  if (![4, 8, 16].includes(options.duration)) {
    errors.push('영상 길이는 4초, 8초, 16초 중 하나여야 합니다.');
  }

  const validAspectRatios: VideoAspectRatio[] = ['16:9', '9:16', '1:1', '4:5'];
  if (!validAspectRatios.includes(options.aspectRatio)) {
    errors.push('유효하지 않은 화면 비율입니다.');
  }

  const validStyles: VideoStyle[] = ['cinematic', 'commercial', 'social_media', 'product_showcase', 'lifestyle'];
  if (!validStyles.includes(options.style)) {
    errors.push('유효하지 않은 영상 스타일입니다.');
  }

  return errors;
}
