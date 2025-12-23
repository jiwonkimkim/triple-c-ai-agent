'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Settings, History, RefreshCw, Eye, RotateCcw, GitCompare, Pencil, X, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandSelect } from '@/components/brands';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { UnifiedEditor } from '@/components/editor';
import { VersionCompare } from '@/components/history/version-compare';
import { VersionSnapshot, formatVersionDate, getActionLabel, getActionColor } from '@/stores/history-store';

interface ProjectData {
  id: string;
  title: string;
  description?: string;
  status: string;
  brandProfile?: {
    id: string;
    name: string;
  };
  // 제품 정보 (재생성 시 사용)
  productName?: string;
  category?: string;
  keyFeatures?: string[];
  targetAudience?: string;
  copyLength?: 'short' | 'medium' | 'long';
  productUrl?: string;
  productImages?: string[];
  detailPageVersions: Array<{
    id: string;
    versionNumber: number;
    status: string;
    contentJson: unknown;
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
  const queryClient = useQueryClient();
  const projectId = params.id as string;

  const [activeTab, setActiveTab] = useState<'editor' | 'settings' | 'history'>('editor');

  // History state
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<VersionSnapshot[]>([]);
  const [compareVersions, setCompareVersions] = useState<[VersionSnapshot, VersionSnapshot] | null>(null);
  const [previewVersion, setPreviewVersion] = useState<VersionSnapshot | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState<VersionSnapshot | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [editorKey, setEditorKey] = useState(0); // 에디터 리마운트용 key

  // 재생성 state
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);

  // 버전 이름 수정 state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [versionToRename, setVersionToRename] = useState<VersionSnapshot | null>(null);
  const [newVersionName, setNewVersionName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Settings state
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    title: '',
    description: '',
    brandProfileId: null as string | null,
    productName: '',
    category: '',
    keyFeatures: [''] as string[],
    targetAudience: '',
    copyLength: 'medium' as 'short' | 'medium' | 'long',
    productUrl: '',
    productImages: [] as string[],
    imageModel: 'gemini-2.5-flash-image' as 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview',
  });

  const categories = [
    { value: 'Fashion', label: '패션' },
    { value: 'Food & Beverage', label: '식품/음료' },
    { value: 'Beauty & Skincare', label: '뷰티/스킨케어' },
    { value: 'Electronics', label: '전자제품' },
    { value: 'Home & Living', label: '홈/리빙' },
    { value: 'Sports & Fitness', label: '스포츠/피트니스' },
    { value: 'Other', label: '기타' },
  ];

  const copyLengthOptions = [
    { value: 'short', label: '짧게', description: '간결하고 임팩트 있게' },
    { value: 'medium', label: '보통', description: '균형 잡힌 정보 전달' },
    { value: 'long', label: '길게', description: '상세하고 포괄적으로' },
  ];

  const imageModelOptions = [
    { value: 'gemini-2.5-flash-image', label: '기본 (Flash)', description: '빠른 이미지 생성' },
    { value: 'gemini-3-pro-image-preview', label: '프로 (Pro)', description: '고품질 이미지 생성' },
  ];

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
    enabled: !!projectId,
  });

  // Fetch versions when History tab is active
  const fetchVersions = useCallback(async () => {
    if (!projectId) return;
    setIsLoadingVersions(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/versions`);
      if (!response.ok) throw new Error('Failed to fetch versions');
      const data = await response.json();
      setVersions(data.versions || []);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '버전 히스토리를 불러올 수 없습니다.',
      });
    } finally {
      setIsLoadingVersions(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchVersions();
    }
  }, [activeTab, fetchVersions]);

  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load project. Please try again.',
      });
    }
  }, [error, toast]);

  // Initialize settings form when project loads
  useEffect(() => {
    if (project) {
      setSettingsForm({
        title: project.title || '',
        description: project.description || '',
        brandProfileId: project.brandProfile?.id || null,
        productName: project.productName || '',
        category: project.category || '',
        keyFeatures: project.keyFeatures?.length ? project.keyFeatures : [''],
        targetAudience: project.targetAudience || '',
        copyLength: project.copyLength || 'medium',
        productUrl: project.productUrl || '',
        productImages: project.productImages || [],
      });
    }
  }, [project]);

  // Settings handlers
  const addFeature = () => {
    if (settingsForm.keyFeatures.length < 5) {
      setSettingsForm((prev) => ({
        ...prev,
        keyFeatures: [...prev.keyFeatures, ''],
      }));
    }
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...settingsForm.keyFeatures];
    newFeatures[index] = value;
    setSettingsForm((prev) => ({ ...prev, keyFeatures: newFeatures }));
  };

  const removeFeature = (index: number) => {
    if (settingsForm.keyFeatures.length > 1) {
      setSettingsForm((prev) => ({
        ...prev,
        keyFeatures: prev.keyFeatures.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSaveSettings = async () => {
    if (!settingsForm.title.trim()) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '프로젝트 제목은 필수입니다.',
      });
      return;
    }

    setIsSavingSettings(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: settingsForm.title,
          description: settingsForm.description,
          brandProfileId: settingsForm.brandProfileId,
          // 제품 정보도 함께 저장
          productName: settingsForm.productName,
          category: settingsForm.category,
          keyFeatures: settingsForm.keyFeatures.filter((f) => f.trim()),
          targetAudience: settingsForm.targetAudience,
          copyLength: settingsForm.copyLength,
          productUrl: settingsForm.productUrl,
          productImages: settingsForm.productImages,
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
    } catch (err) {
      toast({
        variant: 'destructive',
        title: '저장 실패',
        description: '설정을 저장할 수 없습니다.',
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // 재생성 핸들러
  const handleRegenerate = async () => {
    if (!project) return;

    // 제품 정보가 없으면 설정 탭으로 이동
    if (!project.productName || !project.category || !project.keyFeatures?.length) {
      toast({
        variant: 'destructive',
        title: '제품 정보 필요',
        description: '재생성을 위해 Settings 탭에서 제품 정보를 먼저 입력해주세요.',
      });
      setActiveTab('settings');
      return;
    }

    setIsRegenerating(true);
    setRegenerateDialogOpen(false);

    try {
      const response = await fetch('/api/generate/detail-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          productImages: project.productImages || [],
          productName: project.productName,
          category: project.category,
          keyFeatures: project.keyFeatures,
          targetAudience: project.targetAudience || '일반 소비자',
          copyLength: project.copyLength || 'medium',
          productUrl: project.productUrl || '',
          generateImages: true,
          imageModel: settingsForm.imageModel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to regenerate');
      }

      // 성공 시 프로젝트 데이터 새로고침
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });

      // 에디터 리마운트
      setEditorKey((prev) => prev + 1);

      toast({
        title: '재생성 완료',
        description: '새로운 상세페이지가 생성되었습니다.',
      });
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
  };

  // Handle compare selection
  const handleCompareSelect = (version: VersionSnapshot) => {
    if (selectedForCompare.length === 0) {
      setSelectedForCompare([version]);
    } else if (selectedForCompare.length === 1) {
      if (selectedForCompare[0].id !== version.id) {
        const [older, newer] =
          new Date(selectedForCompare[0].createdAt) < new Date(version.createdAt)
            ? [selectedForCompare[0], version]
            : [version, selectedForCompare[0]];
        setCompareVersions([older, newer]);
        setSelectedForCompare([]);
        setCompareMode(false);
      }
    }
  };

  // Handle restore
  const handleRestore = async () => {
    if (!versionToRestore) return;
    setIsRestoring(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/versions/${versionToRestore.id}/restore`,
        { method: 'POST' }
      );
      if (!response.ok) throw new Error('Failed to restore');

      await fetchVersions();
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });

      // 에디터 리마운트를 위해 key 변경
      setEditorKey((prev) => prev + 1);

      toast({
        title: '복원 완료',
        description: `v${versionToRestore.versionNumber} 버전으로 복원되었습니다.`,
      });
      setRestoreDialogOpen(false);
      setVersionToRestore(null);

      // 에디터 탭으로 자동 전환
      setActiveTab('editor');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: '복원 실패',
        description: '버전을 복원할 수 없습니다.',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle rename
  const openRenameDialog = (version: VersionSnapshot) => {
    setVersionToRename(version);
    setNewVersionName(version.description || `버전 ${version.versionNumber}`);
    setRenameDialogOpen(true);
  };

  const handleRename = async () => {
    if (!versionToRename || !newVersionName.trim()) return;
    setIsRenaming(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/versions/${versionToRename.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: newVersionName.trim() }),
        }
      );
      if (!response.ok) throw new Error('Failed to rename');

      // Update local state
      setVersions((prev) =>
        prev.map((v) =>
          v.id === versionToRename.id
            ? { ...v, description: newVersionName.trim() }
            : v
        )
      );

      toast({
        title: '이름 변경 완료',
        description: `v${versionToRename.versionNumber} 이름이 변경되었습니다.`,
      });
      setRenameDialogOpen(false);
      setVersionToRename(null);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: '이름 변경 실패',
        description: '버전 이름을 변경할 수 없습니다.',
      });
    } finally {
      setIsRenaming(false);
    }
  };

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

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
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
              <p className="text-sm text-muted-foreground truncate">{project.brandProfile.name}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 재생성 버튼 */}
          <Button
            variant="default"
            size="sm"
            onClick={() => setRegenerateDialogOpen(true)}
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
          <UnifiedEditor
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
          <div className="flex flex-col h-full">
            {/* Compare View */}
            {compareVersions ? (
              <VersionCompare
                versionA={compareVersions[0]}
                versionB={compareVersions[1]}
                onClose={() => setCompareVersions(null)}
                onRestoreVersion={(version) => {
                  setVersionToRestore(version);
                  setRestoreDialogOpen(true);
                  setCompareVersions(null);
                }}
              />
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-3">
                    <History className="h-5 w-5" />
                    <h2 className="text-lg font-semibold">버전 히스토리</h2>
                    <Badge variant="secondary">{versions.length}개</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {!compareMode ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCompareMode(true)}
                        disabled={isLoadingVersions || versions.length < 2}
                      >
                        <GitCompare className="h-4 w-4 mr-1" />
                        비교
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {selectedForCompare.length === 0 ? '첫 번째 버전 선택' : '두 번째 버전 선택'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCompareMode(false);
                            setSelectedForCompare([]);
                          }}
                        >
                          취소
                        </Button>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={fetchVersions}
                      disabled={isLoadingVersions}
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoadingVersions ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>

                {/* Version List */}
                <ScrollArea className="flex-1 p-4">
                  {isLoadingVersions ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : versions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <History className="h-12 w-12 mb-4 opacity-50" />
                      <p className="text-sm">버전 히스토리가 없습니다</p>
                      <p className="text-xs mt-1">변경사항이 저장되면 여기에 표시됩니다</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                      {/* Version items */}
                      <div className="space-y-4">
                        {versions.map((version, index) => {
                          const isCurrent = index === 0;
                          const isSelectedForCompare = selectedForCompare.some(v => v.id === version.id);

                          return (
                            <div
                              key={version.id}
                              className={`relative pl-10 ${
                                compareMode ? 'cursor-pointer hover:bg-muted/50 rounded-lg p-2 -ml-2' : ''
                              } ${isSelectedForCompare ? 'bg-primary/10 rounded-lg p-2 -ml-2' : ''}`}
                              onClick={() => compareMode && handleCompareSelect(version)}
                            >
                              {/* Timeline dot */}
                              <div
                                className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-background ${
                                  isCurrent ? 'bg-primary' : getActionColor(version.action)
                                }`}
                              />

                              {/* Version card */}
                              <div
                                className={`border rounded-lg p-4 transition-all ${
                                  isCurrent ? 'border-primary bg-primary/5' : ''
                                } ${!compareMode ? 'hover:border-muted-foreground/50' : ''}`}
                              >
                                {/* Version header */}
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge
                                        variant={isCurrent ? 'default' : 'secondary'}
                                        className="text-xs cursor-pointer hover:opacity-80 flex items-center gap-1"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openRenameDialog(version);
                                        }}
                                      >
                                        {version.description &&
                                        !['수동 저장', '자동 저장', `v${version.versionNumber}에서 복원됨`].some(d => version.description?.includes(d))
                                          ? version.description
                                          : `v${version.versionNumber}`}
                                        <Pencil className="h-3 w-3 ml-0.5 opacity-60" />
                                      </Badge>
                                      <span
                                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white ${getActionColor(version.action)}`}
                                      >
                                        {getActionLabel(version.action)}
                                      </span>
                                      {isCurrent && (
                                        <Badge variant="outline" className="text-xs">현재</Badge>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                      <span>{formatVersionDate(version.createdAt)}</span>
                                      <span>{version.createdBy}</span>
                                    </div>

                                    {/* Changes summary */}
                                    {version.changes && (
                                      <div className="flex items-center gap-3 mt-2 text-xs">
                                        {version.changes.added > 0 && (
                                          <span className="text-green-600">+{version.changes.added} 추가</span>
                                        )}
                                        {version.changes.modified > 0 && (
                                          <span className="text-blue-600">~{version.changes.modified} 수정</span>
                                        )}
                                        {version.changes.deleted > 0 && (
                                          <span className="text-red-600">-{version.changes.deleted} 삭제</span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Thumbnail */}
                                  {version.thumbnail && (
                                    <div className="ml-4 w-16 h-16 rounded border bg-muted overflow-hidden flex-shrink-0">
                                      <img
                                        src={version.thumbnail}
                                        alt={`Version ${version.versionNumber}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Actions */}
                                {!compareMode && (
                                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewVersion(version);
                                      }}
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      미리보기
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openRenameDialog(version);
                                      }}
                                    >
                                      <Pencil className="h-4 w-4 mr-1" />
                                      이름 변경
                                    </Button>
                                    {!isCurrent && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setVersionToRestore(version);
                                          setRestoreDialogOpen(true);
                                        }}
                                      >
                                        <RotateCcw className="h-4 w-4 mr-1" />
                                        복원
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </>
            )}

            {/* Restore Confirmation Dialog */}
            <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>버전 복원</DialogTitle>
                  <DialogDescription>
                    {versionToRestore && (
                      <>
                        <strong>v{versionToRestore.versionNumber}</strong> 버전으로 복원하시겠습니까?
                        <br /><br />
                        현재 작업 중인 내용이 저장되고, 선택한 버전의 내용으로 교체됩니다.
                        이 작업은 새로운 버전으로 기록됩니다.
                      </>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setRestoreDialogOpen(false)}
                    disabled={isRestoring}
                  >
                    취소
                  </Button>
                  <Button onClick={handleRestore} disabled={isRestoring}>
                    {isRestoring ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        복원 중...
                      </>
                    ) : (
                      '복원'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={!!previewVersion} onOpenChange={() => setPreviewVersion(null)}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>
                    v{previewVersion?.versionNumber} 미리보기
                  </DialogTitle>
                  <DialogDescription>
                    {previewVersion?.description} - {previewVersion && formatVersionDate(previewVersion.createdAt)}
                  </DialogDescription>
                </DialogHeader>
                <div className="border rounded-lg bg-white min-h-[300px] max-h-[500px] overflow-auto">
                  {previewVersion?.content?.sections && previewVersion.content.sections.length > 0 ? (
                    <div className="p-6 space-y-4">
                      {previewVersion.content.sections.map((element: any, index: number) => (
                        <PreviewElement key={element.id || index} element={element} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      콘텐츠가 없습니다.
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPreviewVersion(null)}>
                    닫기
                  </Button>
                  {previewVersion && versions[0]?.id !== previewVersion.id && (
                    <Button
                      onClick={() => {
                        setVersionToRestore(previewVersion);
                        setPreviewVersion(null);
                        setRestoreDialogOpen(true);
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      이 버전으로 복원
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Rename Dialog */}
            <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>버전 이름 변경</DialogTitle>
                  <DialogDescription>
                    {versionToRename && (
                      <>v{versionToRename.versionNumber} 버전의 이름을 변경합니다.</>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    value={newVersionName}
                    onChange={(e) => setNewVersionName(e.target.value)}
                    placeholder="버전 이름 입력"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRename();
                      }
                    }}
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setRenameDialogOpen(false)}
                    disabled={isRenaming}
                  >
                    취소
                  </Button>
                  <Button onClick={handleRename} disabled={isRenaming || !newVersionName.trim()}>
                    {isRenaming ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      '저장'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === 'settings' && (
          <ScrollArea className="h-full">
            <div className="max-w-3xl space-y-6 p-6">
              {/* 1단계: 프로젝트 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle>프로젝트 정보</CardTitle>
                  <CardDescription>
                    프로젝트의 기본 정보를 설정합니다
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="settings-title">프로젝트 제목 *</Label>
                    <Input
                      id="settings-title"
                      value={settingsForm.title}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="프로젝트 제목"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="settings-description">설명</Label>
                    <Textarea
                      id="settings-description"
                      value={settingsForm.description}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="프로젝트에 대한 간단한 설명..."
                      rows={3}
                    />
                  </div>

                  <BrandSelect
                    value={settingsForm.brandProfileId}
                    onChange={(value) =>
                      setSettingsForm((prev) => ({ ...prev, brandProfileId: value }))
                    }
                  />
                </CardContent>
              </Card>

              {/* 2단계: 제품 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle>제품 정보</CardTitle>
                  <CardDescription>
                    AI 콘텐츠 생성을 위한 제품 정보를 설정합니다
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>제품명</Label>
                      <Input
                        placeholder="예: 프리미엄 가죽 핸드백"
                        value={settingsForm.productName}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({ ...prev, productName: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>카테고리</Label>
                      <Select
                        value={settingsForm.category}
                        onValueChange={(value) =>
                          setSettingsForm((prev) => ({ ...prev, category: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="카테고리 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>주요 특징</Label>
                    <div className="space-y-2">
                      {settingsForm.keyFeatures.map((feature, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder={`특징 ${index + 1}`}
                            value={feature}
                            onChange={(e) => updateFeature(index, e.target.value)}
                          />
                          {settingsForm.keyFeatures.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFeature(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    {settingsForm.keyFeatures.length < 5 && (
                      <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                        특징 추가
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>타겟 고객</Label>
                    <Input
                      placeholder="예: 25-40세 패션에 관심 있는 여성"
                      value={settingsForm.targetAudience}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({ ...prev, targetAudience: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>상품 URL</Label>
                    <Input
                      placeholder="예: https://www.coupang.com/... 또는 https://smartstore.naver.com/..."
                      value={settingsForm.productUrl}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({ ...prev, productUrl: e.target.value }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      쿠팡, 네이버 스마트스토어 등의 상품 URL을 입력하면 상품 정보를 참고하여 콘텐츠를 생성합니다.
                    </p>
                  </div>

                  {/* 제품 이미지 표시 */}
                  {settingsForm.productImages.length > 0 && (
                    <div className="space-y-2">
                      <Label>등록된 제품 이미지</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {settingsForm.productImages.map((img, index) => (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                            <img
                              src={img}
                              alt={`제품 이미지 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        제품 이미지는 새 프로젝트 생성 시에만 업로드할 수 있습니다.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>카피 길이</Label>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {copyLengthOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                            settingsForm.copyLength === option.value
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-muted-foreground/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="copyLength"
                            value={option.value}
                            checked={settingsForm.copyLength === option.value}
                            onChange={(e) =>
                              setSettingsForm((prev) => ({
                                ...prev,
                                copyLength: e.target.value as 'short' | 'medium' | 'long',
                              }))
                            }
                            className="sr-only"
                          />
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {option.description}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>이미지 생성 모델</Label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {imageModelOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                            settingsForm.imageModel === option.value
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-muted-foreground/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="imageModel"
                            value={option.value}
                            checked={settingsForm.imageModel === option.value}
                            onChange={(e) =>
                              setSettingsForm((prev) => ({
                                ...prev,
                                imageModel: e.target.value as 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview',
                              }))
                            }
                            className="sr-only"
                          />
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {option.description}
                          </div>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      재생성 시 사용할 이미지 생성 모델을 선택합니다.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* 저장 버튼 */}
              <div className="flex justify-end gap-4">
                <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
                  {isSavingSettings ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      설정 저장
                    </>
                  )}
                </Button>
              </div>

              {/* Danger Zone */}
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive">위험 구역</CardTitle>
                  <CardDescription>
                    프로젝트를 삭제하면 복구할 수 없습니다
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive">프로젝트 삭제</Button>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        )}
      </div>

      {/* 재생성 확인 다이얼로그 */}
      <Dialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>상세페이지 재생성</DialogTitle>
            <DialogDescription>
              기존에 입력한 제품 정보를 바탕으로 새로운 상세페이지를 생성합니다.
              <br /><br />
              {project?.productName ? (
                <div className="text-left space-y-1 mt-2 p-3 bg-muted rounded-lg">
                  <p><strong>제품명:</strong> {project.productName}</p>
                  <p><strong>카테고리:</strong> {project.category}</p>
                  <p><strong>주요 특징:</strong> {project.keyFeatures?.join(', ')}</p>
                  <p><strong>타겟 고객:</strong> {project.targetAudience || '일반 소비자'}</p>
                </div>
              ) : (
                <div className="text-destructive mt-2">
                  제품 정보가 없습니다. Settings 탭에서 먼저 입력해주세요.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRegenerateDialogOpen(false)}
              disabled={isRegenerating}
            >
              취소
            </Button>
            <Button
              onClick={handleRegenerate}
              disabled={isRegenerating || !project?.productName}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  재생성하기
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 미리보기용 요소 렌더링 컴포넌트
function PreviewElement({ element }: { element: any }) {
  const styles: React.CSSProperties = element.styles || {};

  if (element.type === 'heading') {
    const HeadingTag = `h${element.level || 2}` as keyof JSX.IntrinsicElements;
    return (
      <HeadingTag style={styles} className="whitespace-pre-wrap">
        {element.content || '제목'}
      </HeadingTag>
    );
  }

  if (element.type === 'text') {
    return (
      <p style={styles} className="whitespace-pre-wrap">
        {element.content || '텍스트'}
      </p>
    );
  }

  if (element.type === 'image') {
    return element.content ? (
      <img
        src={element.content}
        alt={element.alt || '이미지'}
        style={styles}
        className="max-w-full h-auto rounded"
      />
    ) : (
      <div className="w-full h-32 bg-muted flex items-center justify-center rounded border-2 border-dashed">
        <span className="text-muted-foreground text-sm">이미지</span>
      </div>
    );
  }

  // 기타 타입은 텍스트로 표시
  return (
    <div className="p-2 bg-muted/50 rounded text-sm">
      {element.content || `[${element.type}]`}
    </div>
  );
}
