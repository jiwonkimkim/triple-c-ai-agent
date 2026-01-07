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

async function fetchProject(id: string): Promise<ProjectData> {
  const response = await fetch(`/api/projects/${id}`);
  if (!response.ok) throw new Error('Failed to fetch project');
  const data = await response.json();
  return data.data;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.id as string;

  const [activeTab, setActiveTab] = useState<'editor' | 'settings' | 'history'>('editor');
  const [editorKey, setEditorKey] = useState(0);

  // Fetch project data
  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
    enabled: !!projectId,
  });

  // Custom hooks
  const settingsHook = useProjectSettings(project, projectId);
  const historyHook = useVersionHistory(projectId, activeTab === 'history');
  const regenerationHook = useRegeneration(
    project,
    projectId,
    settingsHook.settingsForm,
    {
      onSuccess: () => setEditorKey((prev) => prev + 1),
      onSettingsRequired: () => setActiveTab('settings'),
    }
  );

  // Load dev prompts from sessionStorage in development mode
  useEffect(() => {
    const devModeEnv = process.env.NEXT_PUBLIC_DEV_MODE?.toLowerCase();
    const isDev = process.env.NODE_ENV === 'development' || devModeEnv === 'true' || devModeEnv === '1';
    if (projectId && isDev) {
      try {
        const stored = sessionStorage.getItem(`devPrompts_${projectId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          regenerationHook.setLastDevPrompts(parsed);
        }
      } catch (e) {
        console.warn('Failed to load devPrompts from sessionStorage:', e);
      }
    }
  }, [projectId, regenerationHook]);

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
