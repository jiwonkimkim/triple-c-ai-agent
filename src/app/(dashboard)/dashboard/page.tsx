'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Plus, FolderKanban, Palette, Clock, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MouseGlowEffect } from '@/components/ui/mouse-glow-effect';
import { useStyleTheme } from '@/contexts/style-theme-context';
import { cn } from '@/lib/utils';

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
  const { styleTheme, isLoaded } = useStyleTheme();
  const isSmile = isLoaded && styleTheme === 'smile';

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
    <div className="space-y-8 relative">
      {/* Mouse Glow Effect - 대시보드 페이지에서만 표시 */}
      <MouseGlowEffect />

      {/* Welcome Section */}
      <div className="flex flex-col gap-4 items-center relative z-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            환영합니다, {session?.user?.name?.split(' ')[0] || '사용자'}님!
          </h1>
          <p className="text-muted-foreground">
            오늘의 프로젝트 현황을 확인해 보세요.
          </p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button className={cn(
            "gap-2 font-medium transition-all duration-500 shimmer-btn",
            isSmile
              ? "bg-foreground text-background hover:bg-foreground/90 rounded-none uppercase text-xs tracking-wider"
              : "text-white rounded-lg shadow-[0_0_20px_#eee] bg-[length:200%_auto] bg-[linear-gradient(to_right,#83a4d4_0%,#b6fbff_51%,#83a4d4_100%)] hover:bg-[position:right_center]"
          )}>
            <Plus className="h-4 w-4" />
            새 프로젝트
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 relative z-10">
        <StatsCard
          title="총 프로젝트"
          value={isLoading ? '-' : stats.totalProjects.toString()}
          description="활성 프로젝트"
          icon={<FolderKanban className="h-4 w-4 text-muted-foreground" />}
          href="/dashboard/projects"
          isSmile={isSmile}
        />
        <StatsCard
          title="브랜드 프로필"
          value={isLoading ? '-' : stats.totalBrands.toString()}
          description="등록된 브랜드"
          icon={<Palette className="h-4 w-4 text-muted-foreground" />}
          href="/dashboard/brands"
          isSmile={isSmile}
        />
        <StatsCard
          title="생성된 페이지"
          value={isLoading ? '-' : stats.generatedPages.toString()}
          description="이번 달"
          icon={<Zap className="h-4 w-4 text-muted-foreground" />}
          isSmile={isSmile}
        />
        <StatsCard
          title="남은 크레딧"
          value={isLoading ? '-' : stats.remainingCredits.toString()}
          description="무료 체험 크레딧"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          isSmile={isSmile}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 relative z-10">
        <div className={cn(
          "p-6",
          isSmile ? "bg-background border border-border" : "glass-card"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            <h3 className={cn("font-semibold", isSmile && "uppercase tracking-tight")}>새 프로젝트 만들기</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            AI로 상품 상세페이지 생성을 시작하세요
          </p>
          <Link href="/dashboard/projects/new">
            <button className={cn(
              "w-full px-6 py-3 text-sm font-medium rounded-full transition-all duration-200",
              isSmile
                ? "bg-foreground text-background hover:bg-foreground/90 uppercase tracking-wider"
                : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30"
            )}>
              시작하기
            </button>
          </Link>
        </div>

        <div className={cn(
          "p-6",
          isSmile ? "bg-background border border-border" : "glass-card"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Palette className="h-5 w-5 text-primary" />
            <h3 className={cn("font-semibold", isSmile && "uppercase tracking-tight")}>브랜드 프로필 설정</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            일관된 콘텐츠를 위해 브랜드 보이스와 스타일을 설정하세요
          </p>
          <Link href="/dashboard/brands">
            <button className={cn(
              "w-full px-6 py-3 text-sm font-medium",
              isSmile ? "bg-foreground text-background hover:bg-foreground/90 uppercase tracking-wider" : "glass-btn"
            )}>
              브랜드 관리
            </button>
          </Link>
        </div>

        <div className={cn(
          "p-6",
          isSmile ? "bg-background border border-border" : "glass-card"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className={cn("font-semibold", isSmile && "uppercase tracking-tight")}>템플릿 둘러보기</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            빠른 시작을 위한 템플릿을 탐색해 보세요
          </p>
          <Link href="/dashboard/marketplace">
            <button className={cn(
              "w-full px-6 py-3 text-sm font-medium",
              isSmile ? "bg-foreground text-background hover:bg-foreground/90 uppercase tracking-wider" : "glass-btn"
            )}>
              템플릿 보기
            </button>
          </Link>
        </div>
      </div>

      {/* Recent Projects */}
      <div className={cn(
        "p-6 relative z-10",
        isSmile ? "bg-background border border-border" : "glass-card"
      )}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn("font-semibold text-lg", isSmile && "uppercase tracking-tight")}>최근 프로젝트</h3>
          <Link href="/dashboard/projects">
            <Button variant="ghost" size="sm" className={cn(isSmile && "uppercase text-xs tracking-wider")}>
              전체 보기
            </Button>
          </Link>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : stats.recentProjects.length > 0 ? (
          <div className="space-y-3">
            {stats.recentProjects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="block"
              >
                <div className={cn(
                  "p-4 flex items-center justify-between",
                  isSmile ? "bg-muted border border-border" : "glass-card-strong"
                )}>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 flex items-center justify-center",
                      isSmile ? "bg-foreground/10" : "rounded-xl bg-gradient-to-br from-primary/20 to-primary/40"
                    )}>
                      <FolderKanban className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{project.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {project.brandProfile?.name || '브랜드 미지정'} · 페이지 {project._count.detailPageVersions}개
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      project.status === 'ACTIVE'
                        ? 'bg-green-500/20 text-green-700'
                        : 'bg-gray-500/20 text-gray-700'
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
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  description,
  icon,
  href,
  isSmile,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  isSmile?: boolean;
}) {
  const content = (
    <div className={cn(
      "p-4",
      href && "cursor-pointer",
      isSmile ? "bg-background border border-border" : "glass-card"
    )}>
      <div className="flex items-center justify-between pb-2">
        <span className="text-sm font-medium">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
