'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RegenerateSectionImageParams {
  projectId: string;
  versionId: string;
  sectionId: string;
  sectionType: 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ';
  productName: string;
  category: string;
  keyFeatures?: string[];
  targetAudience?: string;
  imageModel?: string;
}

interface UseSectionRegenerationReturn {
  isRegenerating: boolean;
  regenerateSectionImage: (params: RegenerateSectionImageParams) => Promise<string | null>;
}

export function useSectionRegeneration(): UseSectionRegenerationReturn {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();

  const regenerateSectionImage = async (params: RegenerateSectionImageParams): Promise<string | null> => {
    setIsRegenerating(true);

    try {
      const response = await fetch('/api/generate/section-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to regenerate image');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Image regeneration failed');
      }

      toast({
        title: '이미지 재생성 완료',
        description: `${params.sectionType} 섹션의 이미지가 새로 생성되었습니다.`,
      });

      return data.data.imageUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        variant: 'destructive',
        title: '이미지 재생성 실패',
        description: errorMessage,
      });
      return null;
    } finally {
      setIsRegenerating(false);
    }
  };

  return {
    isRegenerating,
    regenerateSectionImage,
  };
}
