import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { ProjectData, SettingsFormState } from '../_types';

const initialSettingsForm: SettingsFormState = {
  title: '',
  description: '',
  brandProfileId: null,
  productName: '',
  category: '',
  subCategory: '',  // 뷰티 서브카테고리
  keyFeatures: [''],
  targetAudience: '',
  copyLength: 'medium',
  productUrl: '',
  productImages: [],
  imageModel: 'gemini-2.5-flash-image',
};

export function useProjectSettings(project: ProjectData | undefined, projectId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [settingsForm, setSettingsForm] = useState<SettingsFormState>(initialSettingsForm);

  // Initialize form when project loads
  useEffect(() => {
    if (project) {
      setSettingsForm({
        title: project.title || '',
        description: project.description || '',
        brandProfileId: project.brandProfile?.id || null,
        productName: project.productName || '',
        category: project.category || '',
        subCategory: project.subCategory || '',  // 뷰티 서브카테고리
        keyFeatures: project.keyFeatures?.length ? project.keyFeatures : [''],
        targetAudience: project.targetAudience || '',
        copyLength: project.copyLength || 'medium',
        productUrl: project.productUrl || '',
        productImages: project.productImages || [],
        imageModel: project.imageModel || 'gemini-2.5-flash-image',
      });
    }
  }, [project]);

  const updateForm = useCallback((updates: Partial<SettingsFormState>) => {
    setSettingsForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const addFeature = useCallback(() => {
    if (settingsForm.keyFeatures.length < 5) {
      setSettingsForm((prev) => ({
        ...prev,
        keyFeatures: [...prev.keyFeatures, ''],
      }));
    }
  }, [settingsForm.keyFeatures.length]);

  const updateFeature = useCallback((index: number, value: string) => {
    setSettingsForm((prev) => {
      const newFeatures = [...prev.keyFeatures];
      newFeatures[index] = value;
      return { ...prev, keyFeatures: newFeatures };
    });
  }, []);

  const removeFeature = useCallback((index: number) => {
    setSettingsForm((prev) => {
      if (prev.keyFeatures.length > 1) {
        return {
          ...prev,
          keyFeatures: prev.keyFeatures.filter((_, i) => i !== index),
        };
      }
      return prev;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!settingsForm.title.trim()) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '프로젝트 제목은 필수입니다.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: settingsForm.title,
          description: settingsForm.description,
          brandProfileId: settingsForm.brandProfileId,
          productName: settingsForm.productName,
          category: settingsForm.category,
          subCategory: settingsForm.subCategory || undefined,  // 뷰티 서브카테고리
          keyFeatures: settingsForm.keyFeatures.filter((f) => f.trim()),
          targetAudience: settingsForm.targetAudience,
          copyLength: settingsForm.copyLength,
          productUrl: settingsForm.productUrl,
          productImages: settingsForm.productImages,
          imageModel: settingsForm.imageModel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      queryClient.invalidateQueries({ queryKey: ['project', projectId] });

      toast({
        title: '저장 완료',
        description: '프로젝트 설정이 저장되었습니다.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: '저장 실패',
        description: '설정을 저장할 수 없습니다.',
      });
    } finally {
      setIsSaving(false);
    }
  }, [settingsForm, projectId, queryClient, toast]);

  return {
    settingsForm,
    isSaving,
    updateForm,
    addFeature,
    updateFeature,
    removeFeature,
    handleSave,
  };
}
