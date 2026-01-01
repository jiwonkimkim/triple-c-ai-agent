'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Plus, FolderKanban, Palette, Clock, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RecentProject {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  brandProfile: { name: string } | null;
  _count: { detailPageVersions: number };
}

interface DashboardStats {
  totalProjects: number;
  totalBrands: number;
  generatedPages: number;
  remainingCredits: number;
  recentProjects: RecentProject[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalBrands: 0,
    generatedPages: 0,
    remainingCredits: 3,
    recentProjects: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();

        if (data.success) {
          setStats({
            totalProjects: data.data.totalProjects,
            totalBrands: data.data.totalBrands,
            generatedPages: data.data.generatedPages,
            remainingCredits: data.data.remainingCredits,
            recentProjects: data.data.recentProjects || [],
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            환영합니다, {session?.user?.name?.split(' ')[0] || '사용자'}님!
          </h1>
          <p className="text-muted-foreground">
            오늘의 프로젝트 현황을 확인해 보세요.
          </p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button className="gap-2 text-white font-medium rounded-xl shadow-[0_0_20px_#eee] transition-all duration-500 bg-[length:200%_auto] bg-[linear-gradient(to_right,#83a4d4_0%,#b6fbff_51%,#83a4d4_100%)] hover:bg-[position:right_center]">
            <Plus className="h-4 w-4" />
            새 프로젝트
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="총 프로젝트"
          value={isLoading ? '-' : stats.totalProjects.toString()}
          description="활성 프로젝트"
          icon={<FolderKanban className="h-4 w-4 text-muted-foreground" />}
          href="/dashboard/projects"
        />
        <StatsCard
          title="브랜드 프로필"
          value={isLoading ? '-' : stats.totalBrands.toString()}
          description="등록된 브랜드"
          icon={<Palette className="h-4 w-4 text-muted-foreground" />}
          href="/dashboard/brands"
        />
        <StatsCard
          title="생성된 페이지"
          value={isLoading ? '-' : stats.generatedPages.toString()}
          description="이번 달"
          icon={<Zap className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="남은 크레딧"
          value={isLoading ? '-' : stats.remainingCredits.toString()}
          description="무료 체험 크레딧"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-primary" />
              새 프로젝트 만들기
            </CardTitle>
            <CardDescription>
              AI로 상품 상세페이지 생성을 시작하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/projects/new">
              <Button className="w-full">시작하기</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              브랜드 프로필 설정
            </CardTitle>
            <CardDescription>
              일관된 콘텐츠를 위해 브랜드 보이스와 스타일을 설정하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/brands">
              <Button variant="outline" className="w-full">
                브랜드 관리
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              템플릿 둘러보기
            </CardTitle>
            <CardDescription>
              빠른 시작을 위한 템플릿을 탐색해 보세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/marketplace">
              <Button variant="outline" className="w-full">
                템플릿 보기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>최근 프로젝트</CardTitle>
            <Link href="/dashboard/projects">
              <Button variant="ghost" size="sm">
                전체 보기
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : stats.recentProjects.length > 0 ? (
            <div className="space-y-4">
              {stats.recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FolderKanban className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{project.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {project.brandProfile?.name || '브랜드 미지정'} · 페이지 {project._count.detailPageVersions}개
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        project.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {project.status === 'ACTIVE' ? '활성' : project.status === 'ARCHIVED' ? '보관됨' : project.status}
                      </span>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(project.updatedAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderKanban className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">아직 프로젝트가 없습니다</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                첫 번째 프로젝트를 만들어 AI 콘텐츠 생성을 시작해 보세요.
              </p>
              <Link href="/dashboard/projects/new" className="mt-4">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  프로젝트 만들기
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCard({
  title,
  value,
  description,
  icon,
  href,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
}) {
  const content = (
    <Card className={href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
