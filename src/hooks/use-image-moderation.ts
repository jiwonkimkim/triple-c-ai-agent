'use client';

import { useState, useCallback, useRef } from 'react';
import * as nsfwjs from 'nsfwjs';

// NSFW.js prediction result type
interface NSFWPrediction {
  className: 'Porn' | 'Sexy' | 'Hentai' | 'Neutral' | 'Drawing';
  probability: number;
}

interface ModerationResult {
  isApproved: boolean;
  reason?: string;
  scores: {
    porn: number;
    sexy: number;
    hentai: number;
    neutral: number;
    drawing: number;
  };
}

// Thresholds for blocking content
const THRESHOLDS = {
  porn: 0.3,    // Block if > 30%
  sexy: 0.5,    // Block if > 50%
  hentai: 0.3,  // Block if > 30%
};

export function useImageModeration() {
  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const modelRef = useRef<nsfwjs.NSFWJS | null>(null);

  // Load the NSFW model
  const loadModel = useCallback(async () => {
    if (modelRef.current) return modelRef.current;

    setIsLoading(true);
    try {
      // Load model from default CDN (or can use custom path)
      const model = await nsfwjs.load();
      modelRef.current = model;
      setIsModelLoaded(true);
      return model;
    } catch (error) {
      console.error('Failed to load NSFW model:', error);
      throw new Error('이미지 검증 모델을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Validate an image
  const validateImage = useCallback(async (
    imageElement: HTMLImageElement
  ): Promise<ModerationResult> => {
    setIsLoading(true);

    try {
      const model = await loadModel();
      if (!model) {
        throw new Error('모델을 불러올 수 없습니다.');
      }

      // Classify the image
      const predictions = await model.classify(imageElement);

      // Convert predictions to scores object
      const scores = {
        porn: 0,
        sexy: 0,
        hentai: 0,
        neutral: 0,
        drawing: 0,
      };

      predictions.forEach((pred: NSFWPrediction) => {
        const key = pred.className.toLowerCase() as keyof typeof scores;
        scores[key] = pred.probability;
      });

      // Check against thresholds
      const violations: string[] = [];

      if (scores.porn > THRESHOLDS.porn) {
        violations.push('성인 콘텐츠');
      }
      if (scores.sexy > THRESHOLDS.sexy) {
        violations.push('선정적 콘텐츠');
      }
      if (scores.hentai > THRESHOLDS.hentai) {
        violations.push('부적절한 일러스트');
      }

      const isApproved = violations.length === 0;

      return {
        isApproved,
        reason: isApproved ? undefined : `부적절한 이미지: ${violations.join(', ')}`,
        scores,
      };
    } catch (error) {
      console.error('Image validation error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadModel]);

  // Validate from file
  const validateFile = useCallback(async (file: File): Promise<ModerationResult> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = async () => {
        try {
          const result = await validateImage(img);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('이미지를 불러올 수 없습니다.'));
      };

      img.src = URL.createObjectURL(file);
    });
  }, [validateImage]);

  return {
    validateImage,
    validateFile,
    loadModel,
    isLoading,
    isModelLoaded,
  };
}
