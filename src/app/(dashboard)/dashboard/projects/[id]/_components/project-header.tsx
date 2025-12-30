'use client';

import Link from 'next/link';
import { ArrowLeft, Loader2, Settings, History, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DevPromptViewer, type DevPromptInfo } from '@/components/dev/dev-prompt-viewer';
import type { ProjectData } from '../_types';

type TabType = 'editor' | 'settings' | 'history';

interface ProjectHeaderProps {
  project: ProjectData;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isRegenerating: boolean;
  onRegenerateClick: () => void;
  lastDevPrompts: DevPromptInfo | null;
}

export function ProjectHeader({
  project,
  activeTab,
  onTabChange,
  isRegenerating,
  onRegenerateClick,
  lastDevPrompts,
}: ProjectHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <Link href="/dashboard/projects" className="flex-shrink-0">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold truncate">{project.title}</h1>
          {project.brandProfile && (
            <p className="text-sm text-muted-foreground truncate">
              {project.brandProfile.name}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Dev Prompt Viewer */}
        <DevPromptViewer prompts={lastDevPrompts} />

        {/* Regenerate Button */}
        <Button
          variant="default"
          size="sm"
          onClick={onRegenerateClick}
          disabled={isRegenerating}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {isRegenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-1" />
              재생성
            </>
          )}
        </Button>

        {/* Tab Navigation */}
        <div className="flex rounded-md border">
          <Button
            variant={activeTab === 'editor' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-r-none"
            onClick={() => onTabChange('editor')}
          >
            Editor
          </Button>
          <Button
            variant={activeTab === 'history' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-none border-x"
            onClick={() => onTabChange('history')}
          >
            <History className="h-4 w-4 mr-1" />
            History
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-l-none"
            onClick={() => onTabChange('settings')}
          >
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
