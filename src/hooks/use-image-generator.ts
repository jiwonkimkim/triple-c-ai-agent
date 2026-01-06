'use client';

import { useState, useEffect, useCallback } from 'react';

export type ImageGeneratorType = 'auto' | 'gemini' | 'sdxl-base' | 'sd35-medium';

interface GenerateImageOptions {
  prompt: string;
  style?: string;
  aspectRatio?: string;
  enhanceWithAI?: boolean;
}

interface GenerateImageResult {
  success: boolean;
  data?: {
    imageUrl: string;
    generator: string;
    executionTime?: number;
    enhancedPrompt?: string;
  };
  error?: string;
}

export function useImageGenerator() {
  const [generator, setGenerator] = useState<ImageGeneratorType>('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [comfyUIAvailable, setComfyUIAvailable] = useState(false);

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem('imageGenerator');
    if (saved) {
      setGenerator(saved as ImageGeneratorType);
    }
  }, []);

  // Check ComfyUI status
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/generate/image');
      if (res.ok) {
        const data = await res.json();
        setComfyUIAvailable(data.generators?.['sdxl-base'] || data.generators?.['sd35-medium'] || false);
        return data;
      }
    } catch {
      setComfyUIAvailable(false);
    }
    return null;
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Update generator preference
  const updateGenerator = useCallback((value: ImageGeneratorType) => {
    setGenerator(value);
    localStorage.setItem('imageGenerator', value);
  }, []);

  // Generate image with current generator preference
  const generateImage = useCallback(async (options: GenerateImageOptions): Promise<GenerateImageResult> => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...options,
          generator,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    } finally {
      setIsLoading(false);
    }
  }, [generator]);

  return {
    generator,
    setGenerator: updateGenerator,
    generateImage,
    isLoading,
    comfyUIAvailable,
    checkStatus,
  };
}

// Helper to get generator name in Korean
export function getGeneratorDisplayName(generator: ImageGeneratorType): string {
  const names: Record<ImageGeneratorType, string> = {
    'auto': '자동',
    'gemini': 'Gemini',
    'sdxl-base': 'SDXL Base',
    'sd35-medium': 'SD 3.5 Medium',
  };
  return names[generator] || generator;
}
