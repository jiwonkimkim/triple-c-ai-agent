'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  FolderKanban,
  MoreVertical,
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
  LayoutGrid,
  List,
  Check,
  X,
  RotateCcw,
  Eye,
  FileText,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatRelativeTime } from '@/lib/utils';

interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  category?: string;
  productImages?: string[];
  brandProfile?: {
    id: string;
    name: string;
  };
  detailPageVersions?: {
    id: string;
    sections: unknown;
  }[];
  _count: {
    detailPageVersions: number;
    histories: number;
  };
  createdAt: string;
  updatedAt: string;
}

async function fetchProjects(): Promise<{ items: Project[] }> {
  const response = await fetch('/api/projects?includeDeleted=true');
  if (!response.ok) throw new Error('Failed to fetch projects');
  const data = await response.json();
  return data.data;
}

type StatusFilter = 'all' | 'ACTIVE' | 'ARCHIVED' | 'DELETED';
type ViewMode = 'grid' | 'list';

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  const projects = data?.items || [];

  // 필터링: 검색어 + 상태 (전체 = ACTIVE만 표시)
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === 'all') {
      return matchesSearch && project.status === 'ACTIVE';
    }
    return matchesSearch && project.status === statusFilter;
  });

  // 각 상태별 개수 계산
  const activeCount = projects.filter((p) => p.status === 'ACTIVE').length;
  const archivedCount = projects.filter((p) => p.status === 'ARCHIVED').length;
  const deletedCount = projects.filter((p) => p.status === 'DELETED').length;

  // 선택 관련 함수
  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredProjects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProjects.map((p) => p.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // 일괄 작업 Mutations
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: 'ACTIVE' | 'ARCHIVED' | 'DELETED' }) => {
      const promises = ids.map((id) =>
        fetch(`/api/projects/${id}`, {
          method: status === 'DELETED' ? 'DELETE' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: status === 'DELETED' ? undefined : JSON.stringify({ status }),
        })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      clearSelection();
    },
  });

  const handleBulkArchive = () => {
    bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), status: 'ARCHIVED' });
  };

  const handleBulkActivate = () => {
    bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), status: 'ACTIVE' });
  };

  const handleBulkDelete = () => {
    bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), status: 'DELETED' });
    setBulkDeleteDialogOpen(false);
  };

  const handleBulkRestore = () => {
    bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), status: 'ACTIVE' });
  };

  const hasSelection = selectedIds.size > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">프로젝트</h1>
          <p className="text-muted-foreground">상품 상세페이지 프로젝트를 관리하세요</p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button className="gap-2 text-white font-medium rounded-lg shadow-[0_0_20px_#eee] transition-all duration-500 bg-[length:200%_auto] bg-[linear-gradient(to_right,#83a4d4_0%,#b6fbff_51%,#83a4d4_100%)] hover:bg-[position:right_center]">
            <Plus className="h-4 w-4" />
            새 프로젝트
          </Button>
        </Link>
      </div>

      {/* Search & Filter & View Toggle */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="프로젝트 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 rounded-lg border p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="카드 뷰"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="리스트 뷰"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            <button
              onClick={() => {
                setStatusFilter('all');
                clearSelection();
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                statusFilter === 'all'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              전체 ({activeCount})
            </button>
            <button
              onClick={() => {
                setStatusFilter('ACTIVE');
                clearSelection();
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                statusFilter === 'ACTIVE'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              활성 ({activeCount})
            </button>
            <button
              onClick={() => {
                setStatusFilter('ARCHIVED');
                clearSelection();
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                statusFilter === 'ARCHIVED'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              보관됨 ({archivedCount})
            </button>
            <button
              onClick={() => {
                setStatusFilter('DELETED');
                clearSelection();
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                statusFilter === 'DELETED'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              삭제됨 ({deletedCount})
            </button>
          </div>

          {/* Select All */}
          {filteredProjects.length > 0 && (
            <button
              onClick={selectAll}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {selectedIds.size === filteredProjects.length ? '전체 해제' : '전체 선택'}
            </button>
          )}
        </div>

        {/* Bulk Action Bar */}
        {hasSelection && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">{selectedIds.size}개 선택됨</span>
            <div className="flex-1" />
            {statusFilter === 'DELETED' ? (
              <Button size="sm" variant="outline" onClick={handleBulkRestore} disabled={bulkUpdateMutation.isPending}>
                <RotateCcw className="mr-2 h-4 w-4" />
                복원
              </Button>
            ) : (
              <>
                {statusFilter !== 'ACTIVE' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkActivate}
                    disabled={bulkUpdateMutation.isPending}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    활성화
                  </Button>
                )}
                {statusFilter !== 'ARCHIVED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkArchive}
                    disabled={bulkUpdateMutation.isPending}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    보관
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setBulkDeleteDialogOpen(true)}
                  disabled={bulkUpdateMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Projects */}
      {isLoading ? (
        <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-2'}>
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-3/4 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive">프로젝트를 불러오는데 실패했습니다</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              다시 시도
            </Button>
          </CardContent>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            {statusFilter === 'ARCHIVED' ? (
              <Archive className="h-12 w-12 text-muted-foreground/50" />
            ) : statusFilter === 'DELETED' ? (
              <Trash2 className="h-12 w-12 text-muted-foreground/50" />
            ) : (
              <FolderKanban className="h-12 w-12 text-muted-foreground/50" />
            )}
            <h3 className="mt-4 text-lg font-medium">
              {searchQuery
                ? '프로젝트를 찾을 수 없습니다'
                : statusFilter === 'ARCHIVED'
                ? '보관된 프로젝트가 없습니다'
                : statusFilter === 'DELETED'
                ? '삭제된 프로젝트가 없습니다'
                : statusFilter === 'ACTIVE'
                ? '활성 프로젝트가 없습니다'
                : '아직 프로젝트가 없습니다'}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery
                ? '다른 검색어를 시도해 보세요'
                : statusFilter === 'ARCHIVED'
                ? '프로젝트를 보관하면 여기에 표시됩니다'
                : statusFilter === 'DELETED'
                ? '삭제된 프로젝트는 여기에 표시됩니다'
                : statusFilter === 'ACTIVE'
                ? '새 프로젝트를 만들거나 보관된 프로젝트를 복원하세요'
                : '첫 번째 프로젝트를 만들어 콘텐츠 생성을 시작하세요'}
            </p>
            {!searchQuery && statusFilter !== 'ARCHIVED' && statusFilter !== 'DELETED' && (
              <Link href="/dashboard/projects/new" className="mt-4">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  프로젝트 만들기
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isSelected={selectedIds.has(project.id)}
              onToggleSelect={() => toggleSelect(project.id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProjects.map((project) => (
            <ProjectListItem
              key={project.id}
              project={project}
              isSelected={selectedIds.has(project.id)}
              onToggleSelect={() => toggleSelect(project.id)}
            />
          ))}
        </div>
      )}

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>프로젝트 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {selectedIds.size}개의 프로젝트를 삭제하시겠습니까?
              <br />
              삭제된 프로젝트는 &apos;삭제됨&apos; 탭에서 복원할 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  isSelected: boolean;
  onToggleSelect: () => void;
}

const categoryLabels: Record<string, string> = {
  Fashion: '패션',
  Food: '음식',
  Beauty: '뷰티',
  Digital: '디지털',
  Living: '리빙',
  Sports: '스포츠',
  Other: '기타',
};

const categoryColors: Record<string, string> = {
  Fashion: 'bg-pink-500',
  Food: 'bg-orange-500',
  Beauty: 'bg-purple-500',
  Digital: 'bg-blue-500',
  Living: 'bg-green-500',
  Sports: 'bg-red-500',
  Other: 'bg-gray-500',
};

function ProjectCard({ project, isSelected, onToggleSelect }: ProjectCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '프로젝트 삭제에 실패했습니다');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: string; status: 'ACTIVE' | 'ARCHIVED' }) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '프로젝트 상태 변경에 실패했습니다');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate(project.id);
    setIsDeleteDialogOpen(false);
  };

  const handleStatusChange = (status: 'ACTIVE' | 'ARCHIVED') => {
    statusMutation.mutate({ projectId: project.id, status });
  };

  const isArchived = project.status === 'ARCHIVED';
  const isDeleted = project.status === 'DELETED';

  // 썸네일 이미지 결정: 상세페이지 섹션의 이미지 > productImages > 기본 아이콘
  const getFirstImageFromSections = (): string | undefined => {
    const sections = project.detailPageVersions?.[0]?.sections;
    if (!sections || !Array.isArray(sections)) return undefined;

    for (const section of sections) {
      // Section 타입 (blocks 배열 포함)
      if (section.blocks && Array.isArray(section.blocks)) {
        for (const block of section.blocks) {
          if (block.type === 'image' && block.src) {
            return block.src;
          }
        }
      }
      // DetailPageSection 타입 (imageUrls 배열 우선)
      if (section.imageUrls && Array.isArray(section.imageUrls) && section.imageUrls.length > 0) {
        return section.imageUrls[0];
      }
      // DetailPageSection 타입 (imageUrl 필드)
      if (section.imageUrl) {
        return section.imageUrl;
      }
    }
    return undefined;
  };

  const thumbnailUrl = getFirstImageFromSections() || project.productImages?.[0];
  const hasVersions = project._count.detailPageVersions > 0;

  return (
    <>
      <Card
        onClick={onToggleSelect}
        className={`group overflow-hidden transition-all hover:shadow-lg cursor-pointer ${
          isArchived ? 'opacity-60' : ''
        } ${isDeleted ? 'opacity-50 border-dashed' : ''} ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}`}
      >
        {/* Thumbnail */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={project.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
              <FolderKanban className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}

          {/* Overlay on hover */}
          {!isDeleted && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Link href={`/dashboard/projects/${project.id}`} onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="secondary">
                  <Pencil className="h-4 w-4 mr-1" />
                  편집하기
                </Button>
              </Link>
            </div>
          )}

          {/* Selection indicator - 선택 시에만 표시 */}
          {isSelected && (
            <div className="absolute top-2 left-2 z-10">
              <div className="w-5 h-5 rounded border-2 flex items-center justify-center bg-primary border-primary text-primary-foreground">
                <Check className="h-3 w-3" />
              </div>
            </div>
          )}

          {/* Category badge */}
          {project.category && (
            <Badge
              className="absolute top-2 right-2 bg-white/5 text-white font-medium border-0"
            >
              {categoryLabels[project.category] || project.category}
            </Badge>
          )}

          {/* Status badges */}
          <div className="absolute bottom-2 left-2 flex gap-1">
            {isArchived && (
              <Badge variant="secondary" className="bg-yellow-500/90 text-white border-0">
                보관됨
              </Badge>
            )}
            {isDeleted && (
              <Badge variant="destructive">
                삭제됨
              </Badge>
            )}
          </div>

          {/* Version count badge */}
          {hasVersions && (
            <Badge variant="outline" className="absolute bottom-2 right-2 bg-white/90 text-foreground">
              <FileText className="h-3 w-3 mr-1" />
              {project._count.detailPageVersions}
            </Badge>
          )}
        </div>

        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {!isDeleted ? (
                <Link href={`/dashboard/projects/${project.id}`}>
                  <CardTitle className="text-base hover:text-primary transition-colors cursor-pointer line-clamp-1">
                    {project.title}
                  </CardTitle>
                </Link>
              ) : (
                <CardTitle className="text-base text-muted-foreground line-clamp-1">{project.title}</CardTitle>
              )}
              <CardDescription className="text-xs mt-1 line-clamp-1">
                {project.brandProfile?.name || '브랜드 미지정'}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isDeleted ? (
                  <DropdownMenuItem onClick={() => handleStatusChange('ACTIVE')} disabled={statusMutation.isPending}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {statusMutation.isPending ? '복원 중...' : '복원'}
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/projects/${project.id}`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        편집
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(isArchived ? 'ACTIVE' : 'ARCHIVED')}
                      disabled={statusMutation.isPending}
                    >
                      {isArchived ? (
                        <>
                          <ArchiveRestore className="mr-2 h-4 w-4" />
                          {statusMutation.isPending ? '복원 중...' : '보관 해제'}
                        </>
                      ) : (
                        <>
                          <Archive className="mr-2 h-4 w-4" />
                          {statusMutation.isPending ? '보관 중...' : '보관'}
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      삭제
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 pt-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatRelativeTime(project.updatedAt)}</span>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>프로젝트 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{project.title}&quot; 프로젝트를 삭제하시겠습니까?
              <br />
              삭제된 프로젝트는 &apos;삭제됨&apos; 탭에서 복원할 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ProjectListItem({ project, isSelected, onToggleSelect }: ProjectCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '프로젝트 삭제에 실패했습니다');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: string; status: 'ACTIVE' | 'ARCHIVED' }) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '프로젝트 상태 변경에 실패했습니다');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate(project.id);
    setIsDeleteDialogOpen(false);
  };

  const handleStatusChange = (status: 'ACTIVE' | 'ARCHIVED') => {
    statusMutation.mutate({ projectId: project.id, status });
  };

  const isArchived = project.status === 'ARCHIVED';
  const isDeleted = project.status === 'DELETED';

  return (
    <>
      <div
        onClick={onToggleSelect}
        className={`group flex items-center gap-4 p-4 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer ${
          isArchived ? 'opacity-60' : ''
        } ${isDeleted ? 'opacity-50 border-dashed' : ''} ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}`}
      >
        {/* Selection indicator - 선택 시에만 표시 */}
        {isSelected && (
          <div className="w-5 h-5 rounded border-2 flex items-center justify-center bg-primary border-primary text-primary-foreground shrink-0">
            <Check className="h-3 w-3" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {!isDeleted ? (
              <Link
                href={`/dashboard/projects/${project.id}`}
                onClick={(e) => e.stopPropagation()}
                className="font-medium hover:text-primary transition-colors truncate"
              >
                {project.title}
              </Link>
            ) : (
              <span className="font-medium text-muted-foreground truncate">{project.title}</span>
            )}
            {isArchived && (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground shrink-0">
                보관됨
              </span>
            )}
            {isDeleted && (
              <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive shrink-0">
                삭제됨
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{project.brandProfile?.name || '브랜드 프로필 없음'}</p>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground shrink-0">
          <span>{project._count.detailPageVersions}개 버전</span>
          <span>{formatRelativeTime(project.updatedAt)}</span>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isDeleted ? (
              <DropdownMenuItem onClick={() => handleStatusChange('ACTIVE')} disabled={statusMutation.isPending}>
                <RotateCcw className="mr-2 h-4 w-4" />
                {statusMutation.isPending ? '복원 중...' : '복원'}
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/projects/${project.id}`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    편집
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange(isArchived ? 'ACTIVE' : 'ARCHIVED')}
                  disabled={statusMutation.isPending}
                >
                  {isArchived ? (
                    <>
                      <ArchiveRestore className="mr-2 h-4 w-4" />
                      {statusMutation.isPending ? '복원 중...' : '보관 해제'}
                    </>
                  ) : (
                    <>
                      <Archive className="mr-2 h-4 w-4" />
                      {statusMutation.isPending ? '보관 중...' : '보관'}
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>프로젝트 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{project.title}&quot; 프로젝트를 삭제하시겠습니까?
              <br />
              삭제된 프로젝트는 &apos;삭제됨&apos; 탭에서 복원할 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
