'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Plus, FolderKanban, Palette, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { data: session } = useSession();

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
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            새 프로젝트
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="총 프로젝트"
          value="0"
          description="활성 프로젝트"
          icon={<FolderKanban className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="브랜드 프로필"
          value="0"
          description="등록된 브랜드"
          icon={<Palette className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="생성된 페이지"
          value="0"
          description="이번 달"
          icon={<Zap className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="남은 크레딧"
          value="3"
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
            <Link href="/dashboard/brands/new">
              <Button variant="outline" className="w-full">
                브랜드 추가
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
            <Link href="/dashboard/templates">
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
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
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
}
