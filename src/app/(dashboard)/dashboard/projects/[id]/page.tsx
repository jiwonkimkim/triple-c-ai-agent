'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Settings, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DetailPageEditor } from '@/components/editor';
import type { Section } from '@/stores/editor-store';

interface ProjectData {
  id: string;
  title: string;
  description?: string;
  status: string;
  brandProfile?: {
    id: string;
    name: string;
  };
  detailPageVersions: Array<{
    id: string;
    versionNumber: number;
    status: string;
    contentJson: Section[] | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

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

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
    enabled: !!projectId,
  });

  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load project. Please try again.',
      });
    }
  }, [error, toast]);

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

  // Get the latest version or draft
  const latestVersion = project.detailPageVersions
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

  const initialSections = latestVersion?.contentJson as Section[] | undefined;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold">{project.title}</h1>
            {project.brandProfile && (
              <p className="text-sm text-muted-foreground">{project.brandProfile.name}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-md border">
            <Button
              variant={activeTab === 'editor' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-r-none"
              onClick={() => setActiveTab('editor')}
            >
              Editor
            </Button>
            <Button
              variant={activeTab === 'history' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-none border-x"
              onClick={() => setActiveTab('history')}
            >
              <History className="h-4 w-4 mr-1" />
              History
            </Button>
            <Button
              variant={activeTab === 'settings' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-l-none"
              onClick={() => setActiveTab('settings')}
            >
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'editor' && (
          <DetailPageEditor
            projectId={projectId}
            versionId={latestVersion?.id}
            initialSections={initialSections}
            onSaveSuccess={() => {
              toast({
                title: 'Saved',
                description: 'Your changes have been saved.',
              });
            }}
          />
        )}

        {activeTab === 'history' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Version History</h2>
            {project.detailPageVersions.length === 0 ? (
              <p className="text-muted-foreground">No versions yet. Start editing to create your first version.</p>
            ) : (
              <div className="space-y-3">
                {project.detailPageVersions
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .map((version) => (
                    <div
                      key={version.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">Version {version.versionNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(version.updatedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            version.status === 'PUBLISHED'
                              ? 'bg-green-100 text-green-700'
                              : version.status === 'DRAFT'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {version.status}
                        </span>
                        <Button variant="outline" size="sm">
                          Restore
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-6 max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Project Settings</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Project Title</label>
                <input
                  type="text"
                  defaultValue={project.title}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  defaultValue={project.description || ''}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Brand Profile</label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option value="">No brand profile</option>
                  {project.brandProfile && (
                    <option value={project.brandProfile.id} selected>
                      {project.brandProfile.name}
                    </option>
                  )}
                </select>
              </div>
              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium text-destructive mb-4">Danger Zone</h3>
                <Button variant="destructive">Delete Project</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
