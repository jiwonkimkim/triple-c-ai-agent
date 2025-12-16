'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrandForm, BrandRagPanel } from '@/components/brands';
import { useToast } from '@/hooks/use-toast';

interface Brand {
  id: string;
  name: string;
  identity: string;
  toneAndManner: string;
  imageKeywords: string[];
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  updatedAt: string;
  _count: {
    projects: number;
    documentChunks: number;
  };
  workspace?: {
    id: string;
    name: string;
  } | null;
}

interface Project {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  updatedAt: string;
}

export default function BrandDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const res = await fetch(`/api/brands/${params.id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch brand');
        }

        setBrand(data.data);

        // Fetch connected projects
        const projectsRes = await fetch(`/api/projects?brandProfileId=${params.id}`);
        const projectsData = await projectsRes.json();
        if (projectsData.success && projectsData.data?.items) {
          setProjects(projectsData.data.items);
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: '오류',
          description: '브랜드 정보를 불러오는 데 실패했습니다.',
        });
        router.push('/dashboard/brands');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrand();
  }, [params.id, router, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!brand) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/brands">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{brand.name}</h1>
          <p className="text-muted-foreground">
            {brand.workspace ? `${brand.workspace.name} 워크스페이스` : '개인 브랜드'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">기본 정보</TabsTrigger>
          <TabsTrigger value="rag">
            지식베이스 ({brand._count.documentChunks})
          </TabsTrigger>
          <TabsTrigger value="projects">
            프로젝트 ({brand._count.projects})
          </TabsTrigger>
        </TabsList>

        {/* 기본 정보 탭 */}
        <TabsContent value="info" className="mt-6">
          <BrandForm
            mode="edit"
            initialData={brand}
            onSuccess={() => {
              toast({
                title: '저장 완료',
                description: '브랜드 정보가 업데이트되었습니다.',
              });
            }}
          />
        </TabsContent>

        {/* 지식베이스(RAG) 탭 */}
        <TabsContent value="rag" className="mt-6">
          <BrandRagPanel
            brandId={brand.id}
            websiteUrl={brand.websiteUrl}
            instagramUrl={brand.instagramUrl}
          />
        </TabsContent>

        {/* 연결된 프로젝트 탭 */}
        <TabsContent value="projects" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>연결된 프로젝트</CardTitle>
              <CardDescription>
                이 브랜드를 사용하는 프로젝트 목록입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FolderKanban className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">연결된 프로젝트가 없습니다</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    프로젝트 생성 시 이 브랜드를 선택하면 여기에 표시됩니다.
                  </p>
                  <Link href="/dashboard/projects/new" className="mt-4">
                    <Button variant="outline">
                      새 프로젝트 만들기
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/dashboard/projects/${project.id}`}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <h4 className="font-medium">{project.title}</h4>
                        {project.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(project.updatedAt).toLocaleDateString('ko-KR')}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
