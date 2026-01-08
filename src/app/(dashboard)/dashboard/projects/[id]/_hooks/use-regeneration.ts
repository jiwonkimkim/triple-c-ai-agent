import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { ProjectData, SettingsFormState } from '../_types';
import type { DevPromptInfo } from '@/components/dev/dev-prompt-viewer';

interface UseRegenerationOptions {
  onSuccess?: () => void;
  onSettingsRequired?: () => void;
}

export function useRegeneration(
  project: ProjectData | undefined,
  projectId: string,
  settingsForm: SettingsFormState,
  options?: UseRegenerationOptions
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lastDevPrompts, setLastDevPrompts] = useState<DevPromptInfo | null>(null);
  const [selectedModel, setSelectedModel] = useState<'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview'>(
    settingsForm.imageModel || 'gemini-2.5-flash-image'
  );

  // settingsForm.imageModel이 변경되면 selectedModel도 업데이트
  useEffect(() => {
    if (settingsForm.imageModel) {
      setSelectedModel(settingsForm.imageModel);
    }
  }, [settingsForm.imageModel]);

  const openDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleRegenerate = useCallback(async () => {
    if (!project) return;

    // Check if product info is available
    if (!project.productName || !project.category || !project.keyFeatures?.length) {
      toast({
        variant: 'destructive',
        title: '제품 정보 필요',
        description: '재생성을 위해 Settings 탭에서 제품 정보를 먼저 입력해주세요.',
      });
      options?.onSettingsRequired?.();
      return;
    }

    setIsRegenerating(true);
    setDialogOpen(false);

    try {
      const response = await fetch('/api/generate/detail-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          productImages: project.productImages || [],
          productName: project.productName,
          category: project.category,
          subCategory: project.subCategory || undefined,  // 뷰티 서브카테고리 전달
          keyFeatures: project.keyFeatures,
          targetAudience: project.targetAudience || '일반 소비자',
          copyLength: project.copyLength || 'medium',
          productUrl: project.productUrl || '',
          generateImages: true,
          imageModel: selectedModel,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to regenerate');
      }

      // Store dev prompts in development mode
      if (responseData.data?.devPrompts) {
        setLastDevPrompts(responseData.data.devPrompts);
      }

      // Refresh project data
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });

      toast({
        title: '재생성 완료',
        description: '새로운 상세페이지가 생성되었습니다.',
      });

      options?.onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      toast({
        variant: 'destructive',
        title: '재생성 실패',
        description: errorMessage,
      });
    } finally {
      setIsRegenerating(false);
    }
  }, [project, projectId, selectedModel, queryClient, toast, options]);

  return {
    isRegenerating,
    dialogOpen,
    lastDevPrompts,
    selectedModel,
    setSelectedModel,
    openDialog,
    closeDialog,
    handleRegenerate,
    setLastDevPrompts,
  };
}
