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
    const devModeEnv = process.env.NEXT_PUBLIC_DEV_MODE?.toLowerCase();
    const isDev = process.env.NODE_ENV === 'development' || devModeEnv === 'true' || devModeEnv === '1';

    if (!projectId || !isDev) return;

    // API에서 가져온 devPrompts 사용 (DB에서 조회됨)
    const apiDevPrompts = fetchResult?.devPrompts;
    if (apiDevPrompts) {
      console.log('[DevPrompts] Loading from API (DB)');
      regenerationHook.setLastDevPrompts(apiDevPrompts);
    } else {
      console.log('[DevPrompts] No prompts found in DB');
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
  }) => {
    const currentPrompts = regenerationHook.lastDevPrompts;
    if (!currentPrompts) {
      console.log('[DevPrompts] No existing prompts to update');
      return;
    }

    // sectionImagePrompts 배열에서 해당 섹션 찾아 업데이트
    const updatedPrompts: DevPromptInfo = {
      ...currentPrompts,
      sectionImagePrompts: currentPrompts.sectionImagePrompts.map((prompt, idx) => {
        // sectionType이 매칭되거나 index가 매칭되면 업데이트
        if (prompt.sectionType === update.sectionType || idx === update.sectionIndex) {
          // 최종 결합 프롬프트 생성
          const combinedPrompt = [
            update.promptComponents?.fixedPrompt,
            update.promptComponents?.dynamicPrompt,
          ].filter(Boolean).join('\n\n---\n\n');

          return {
            ...prompt,
            orchestrationPrompt: update.promptComponents?.orchestrationPrompt || prompt.orchestrationPrompt,
            categoryTemplatePrompt: update.promptComponents?.categoryTemplatePrompt || prompt.categoryTemplatePrompt,
            i2iSystemPrompt: update.promptComponents?.i2iSystemPrompt || prompt.i2iSystemPrompt,
            fixedPrompt: update.promptComponents?.fixedPrompt || prompt.fixedPrompt,
            dynamicPrompt: update.promptComponents?.dynamicPrompt || prompt.dynamicPrompt,
            imagePrompt: combinedPrompt || prompt.imagePrompt,
            generatedImageUrl: update.imageUrl,
          };
        }
        return prompt;
      }),
    };

    console.log(`[DevPrompts] Updated section ${update.sectionType} prompts`);
    regenerationHook.setLastDevPrompts(updatedPrompts);
    // DB는 섹션 재생성 API에서 자동으로 업데이트됨
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

  // Get the latest version
  const latestVersion = project.detailPageVersions
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

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
