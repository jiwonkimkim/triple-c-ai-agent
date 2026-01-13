'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DetailPageEditor } from '@/components/editor';
import { ProjectHeader, HistoryTab, SettingsTab, RegenerateDialog } from './_components';
import { useProjectSettings, useVersionHistory, useRegeneration } from './_hooks';
import type { ProjectData } from './_types';
import type { DevPromptInfo } from '@/components/dev/dev-prompt-viewer';

interface FetchProjectResult {
  project: ProjectData;
  devPrompts: DevPromptInfo | null;
}

async function fetchProject(id: string): Promise<FetchProjectResult> {
  const response = await fetch(`/api/projects/${id}`);
  if (!response.ok) throw new Error('Failed to fetch project');
  const data = await response.json();
  return {
    project: data.data,
    devPrompts: data.devPrompts || null,
  };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.id as string;

  const [activeTab, setActiveTab] = useState<'editor' | 'settings' | 'history'>('editor');
  const [editorKey, setEditorKey] = useState(0);

  // Fetch project data
  const { data: fetchResult, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
    enabled: !!projectId,
  });

  const project = fetchResult?.project;

  // Custom hooks
  const settingsHook = useProjectSettings(project, projectId);
  const regenerationHook = useRegeneration(
    project,
    projectId,
    settingsHook.settingsForm,
    {
      onSuccess: () => setEditorKey((prev) => prev + 1),
      onSettingsRequired: () => setActiveTab('settings'),
    }
  );
  const historyHook = useVersionHistory(projectId, activeTab === 'history', {
    onDevPromptsLoaded: (prompts) => regenerationHook.setLastDevPrompts(prompts),
  });

  // Load dev prompts from API response (DB에서 가져옴)
  useEffect(() => {
    if (!projectId) return;

    // API에서 가져온 devPrompts 사용 (DB에서 조회됨)
    const apiDevPrompts = fetchResult?.devPrompts;
    if (apiDevPrompts) {
      console.log('[DevPrompts] Loading from API (DB)');
      regenerationHook.setLastDevPrompts(apiDevPrompts);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, fetchResult?.devPrompts]);

  // Error handling
  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load project. Please try again.',
      });
    }
  }, [error, toast]);

  // Handle editor remount after restore
  const handleEditorRemount = useCallback(() => {
    setEditorKey((prev) => prev + 1);
  }, []);

  // ★ 섹션 재생성 시 프롬프트 뷰어 업데이트
  const handleSectionPromptUpdated = useCallback((update: {
    sectionIndex: number;
    sectionType: string;
    imageUrl: string;
    promptComponents?: {
      orchestrationPrompt?: string;
      categoryTemplatePrompt?: string;
      i2iSystemPrompt?: string;
      fixedPrompt?: string;
      dynamicPrompt?: string;
    };
    // ★★★ API에서 반환한 전체 devPrompts (기존 섹션 + 새 섹션 모두 포함)
    updatedDevPrompts?: {
      textGeneration: { systemPrompt: string; userPrompt: string };
      sectionImagePrompts: Array<{
        sectionType: string;
        imagePrompt: string;
        [key: string]: unknown;
      }>;
    };
  }) => {
    // ★★★ API에서 전체 devPrompts를 반환했으면 그대로 사용 (기존 섹션 유지됨)
    if (update.updatedDevPrompts) {
      console.log(`[DevPrompts] Using full devPrompts from API (${update.updatedDevPrompts.sectionImagePrompts.length} sections)`);
      regenerationHook.setLastDevPrompts(update.updatedDevPrompts as DevPromptInfo);
      return;
    }

    // 폴백: API에서 전체 devPrompts를 못 받았을 때 수동 업데이트
    const currentPrompts = regenerationHook.lastDevPrompts;

    // 최종 결합 프롬프트 생성
    const combinedPrompt = [
      update.promptComponents?.fixedPrompt,
      update.promptComponents?.dynamicPrompt,
    ].filter(Boolean).join('\n\n---\n\n');

    // 새 섹션 프롬프트 데이터
    const newSectionPrompt = {
      sectionType: update.sectionType,
      orchestrationPrompt: update.promptComponents?.orchestrationPrompt,
      categoryTemplatePrompt: update.promptComponents?.categoryTemplatePrompt,
      i2iSystemPrompt: update.promptComponents?.i2iSystemPrompt,
      fixedPrompt: update.promptComponents?.fixedPrompt,
      dynamicPrompt: update.promptComponents?.dynamicPrompt,
      imagePrompt: combinedPrompt || `${update.sectionType} section image`,
      generatedImageUrl: update.imageUrl,
    };

    // ★ 기존 devPrompts가 없으면 새로 생성
    if (!currentPrompts) {
      console.log('[DevPrompts] Creating new devPrompts structure for section regeneration');
      const newPrompts: DevPromptInfo = {
        textGeneration: {
          systemPrompt: '(이전 생성 시 저장되지 않음)',
          userPrompt: '(이전 생성 시 저장되지 않음)',
        },
        sectionImagePrompts: [newSectionPrompt],
      };
      regenerationHook.setLastDevPrompts(newPrompts);
      return;
    }

    // 기존 devPrompts가 있으면 해당 섹션만 업데이트
    const existingIndex = currentPrompts.sectionImagePrompts.findIndex(
      (prompt) => prompt.sectionType === update.sectionType
    );

    let updatedSectionImagePrompts;
    if (existingIndex >= 0) {
      updatedSectionImagePrompts = currentPrompts.sectionImagePrompts.map((prompt, idx) => {
        if (prompt.sectionType === update.sectionType || idx === update.sectionIndex) {
          return { ...prompt, ...newSectionPrompt };
        }
        return prompt;
      });
    } else {
      updatedSectionImagePrompts = [...currentPrompts.sectionImagePrompts, newSectionPrompt];
    }

    const updatedPrompts: DevPromptInfo = {
      ...currentPrompts,
      sectionImagePrompts: updatedSectionImagePrompts,
    };

    console.log(`[DevPrompts] Updated section ${update.sectionType} prompts (fallback)`);
    regenerationHook.setLastDevPrompts(updatedPrompts);
  }, [regenerationHook]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <p className="text-destructive mb-4">Failed to load project</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Get the latest version (by versionNumber, not updatedAt)
  const latestVersion = project.detailPageVersions
    .sort((a, b) => b.versionNumber - a.versionNumber)[0];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <ProjectHeader
        project={project}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isRegenerating={regenerationHook.isRegenerating}
        onRegenerateClick={regenerationHook.openDialog}
        lastDevPrompts={regenerationHook.lastDevPrompts}
      />

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'editor' && (
          <DetailPageEditor
            key={editorKey}
            projectId={projectId}
            versionId={latestVersion?.id}
            onSaveSuccess={() => {
              toast({
                title: '저장됨',
                description: '변경 사항이 저장되었습니다.',
              });
            }}
            onSectionPromptUpdated={handleSectionPromptUpdated}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            {...historyHook}
            onEditorRemount={handleEditorRemount}
            onTabChange={setActiveTab}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab {...settingsHook} />
        )}
      </div>

      {/* Regenerate Dialog */}
      <RegenerateDialog
        open={regenerationHook.dialogOpen}
        onOpenChange={regenerationHook.closeDialog}
        project={project}
        isRegenerating={regenerationHook.isRegenerating}
        selectedModel={regenerationHook.selectedModel}
        onModelChange={regenerationHook.setSelectedModel}
        onRegenerate={regenerationHook.handleRegenerate}
      />
    </div>
  );
}
