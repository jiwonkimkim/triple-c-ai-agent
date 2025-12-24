'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  Loader2,
  Plus,
  Layout,
  MoreVertical,
  Upload,
  Edit,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateTemplateModal } from '@/components/templates/create-template-modal';
import { TemplatePublishModal } from './template-publish-modal';

interface MyTemplate {
  id: string;
  name: string;
  category: string;
  thumbnailUrl?: string | null;
  isPublished: boolean;
  price: number;
  downloadCount: number;
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  GENERIC: '일반',
  FASHION: '패션',
  FOOD: '음식',
  BEAUTY: '뷰티',
  DIGITAL: '디지털',
};

const categoryColors: Record<string, string> = {
  GENERIC: 'bg-gray-500',
  FASHION: 'bg-pink-500',
  FOOD: 'bg-orange-500',
  BEAUTY: 'bg-purple-500',
  DIGITAL: 'bg-blue-500',
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function MyTemplatesTab() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [publishTemplate, setPublishTemplate] = useState<MyTemplate | null>(null);

  const { data, isLoading, mutate } = useSWR('/api/templates?mine=true', fetcher);
  const templates: MyTemplate[] = data?.data?.templates || [];

  const handleUnpublish = async (templateId: string) => {
    if (!confirm('마켓플레이스에서 내리시겠습니까?')) return;

    try {
      const response = await fetch(
        `/api/marketplace/templates/${templateId}/publish`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        mutate();
      } else {
        const data = await response.json();
        alert(data.error || '등록 취소에 실패했습니다.');
      }
    } catch (error) {
      alert('등록 취소에 실패했습니다.');
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        mutate();
      } else {
        const data = await response.json();
        alert(data.error || '삭제에 실패했습니다.');
      }
    } catch (error) {
      alert('삭제에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">내 템플릿</h2>
          <p className="text-sm text-muted-foreground">
            직접 만든 템플릿을 관리하고 마켓에 등록하세요
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          새 템플릿 만들기
        </Button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Layout className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">아직 만든 템플릿이 없습니다</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            첫 템플릿 만들기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="group overflow-hidden transition-all hover:shadow-lg"
            >
              {/* Thumbnail */}
              <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                {template.thumbnailUrl ? (
                  <img
                    src={template.thumbnailUrl}
                    alt={template.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                    <Layout className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}

                {/* Category badge */}
                <Badge
                  className={`absolute top-2 left-2 text-white ${
                    categoryColors[template.category]
                  }`}
                >
                  {categoryLabels[template.category] || template.category}
                </Badge>

                {/* Status badge */}
                <Badge
                  variant={template.isPublished ? 'default' : 'secondary'}
                  className="absolute top-2 right-2"
                >
                  {template.isPublished ? '판매중' : '비공개'}
                </Badge>
              </div>

              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold line-clamp-1">{template.name}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!template.isPublished ? (
                        <DropdownMenuItem
                          onClick={() => setPublishTemplate(template)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          마켓에 등록
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleUnpublish(template.id)}
                        >
                          <EyeOff className="h-4 w-4 mr-2" />
                          마켓에서 내리기
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="px-4 pb-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {template.price === 0 ? '무료' : `${template.price} 크레딧`}
                  </span>
                  {template.isPublished && (
                    <span>다운로드 {template.downloadCount}회</span>
                  )}
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-2">
                {!template.isPublished ? (
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => setPublishTemplate(template)}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    마켓에 등록하기
                  </Button>
                ) : (
                  <Button className="w-full" size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-1" />
                    마켓에서 보기
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Template Modal */}
      <CreateTemplateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => mutate()}
      />

      {/* Publish Template Modal */}
      {publishTemplate && (
        <TemplatePublishModal
          template={publishTemplate}
          open={!!publishTemplate}
          onClose={() => setPublishTemplate(null)}
          onPublish={async () => {
            setPublishTemplate(null);
            mutate();
          }}
        />
      )}
    </div>
  );
}
