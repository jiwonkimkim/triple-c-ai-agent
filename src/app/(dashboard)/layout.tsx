'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  FolderKanban,
  Palette,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  User,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';
import { useStyleTheme } from '@/contexts/style-theme-context';

const navigation = [
  { name: '대시보드', href: '/dashboard', icon: LayoutDashboard },
  { name: '프로젝트', href: '/dashboard/projects', icon: FolderKanban },
  { name: '브랜드 프로필', href: '/dashboard/brands', icon: Palette },
  { name: '템플릿 마켓플레이스', href: '/dashboard/marketplace', icon: Store },
  { name: '설정', href: '/dashboard/settings', icon: Settings },
];

// 에디터 페이지 경로 패턴 (사이드바 자동 숨김)
const isEditorPage = (pathname: string) => {
  // /dashboard/projects/[id] 형식 (new 제외)
  return /^\/dashboard\/projects\/(?!new)[^/]+$/.test(pathname);
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { styleTheme, isLoaded } = useStyleTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isSmile = isLoaded && styleTheme === 'smile';
  const isSapporo = isLoaded && styleTheme === 'sapporo';

  // 에디터 페이지 진입 시 사이드바 자동 닫기
  useEffect(() => {
    if (isEditorPage(pathname)) {
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(false);
    }
  }, [pathname]);

  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white/40 backdrop-blur-[20px] border-r border-white/40 transition-all duration-300 overflow-hidden',
          // 모바일: sidebarOpen으로 제어
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          // 데스크톱: sidebarCollapsed로 제어 - 완전히 숨김
          sidebarCollapsed
            ? 'lg:w-0 lg:opacity-0 lg:invisible lg:border-r-0'
            : 'lg:translate-x-0 lg:static lg:z-auto lg:opacity-100 lg:visible'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-white/40 px-4 min-w-[256px]">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="text-2xl font-black tracking-tight text-primary">Triple C</span>
          </Link>
          <div className="flex items-center gap-1">
            {/* 데스크톱: 사이드바 닫기 버튼 - 모던 스타일 */}
            <button
              className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors"
              onClick={() => setSidebarCollapsed(true)}
              title="사이드바 닫기"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            {/* 모바일: 사이드바 닫기 버튼 */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            // 대시보드는 정확히 /dashboard일 때만 활성화
            const isActive = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all duration-500',
                  isSmile ? 'rounded-none' : 'rounded-lg',
                  isActive
                    ? isSmile
                      ? 'bg-foreground text-background'
                      : isSapporo
                        ? 'bg-amber-500/90 text-white shadow-md'
                        : 'text-white shadow-[0_0_20px_#eee] bg-[length:200%_auto] bg-[linear-gradient(to_right,#77A1D3_0%,#79CBCA_51%,#77A1D3_100%)]'
                    : isSapporo
                      ? 'text-amber-800 dark:text-amber-100 font-medium hover:bg-amber-100/50 dark:hover:bg-amber-800/30 hover:text-amber-900 dark:hover:text-amber-50'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-white/40 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-white/30 p-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={session?.user?.image || ''} />
              <AvatarFallback>
                {getInitials(session?.user?.name || session?.user?.email || 'U')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium">
                {session?.user?.name || '사용자'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {session?.user?.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 bg-transparent px-4 lg:px-6">
          {/* 모바일: 사이드바 열기 버튼 */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* 데스크톱: 사이드바 열기 버튼 (닫혀있을 때만 표시) */}
          {sidebarCollapsed && (
            <button
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-md border bg-background hover:bg-muted transition-colors shadow-sm"
              onClick={() => setSidebarCollapsed(false)}
              title="사이드바 열기"
            >
              <Menu className="h-4 w-4" />
            </button>
          )}

          <div className="flex-1" />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image || ''} />
                  <AvatarFallback>
                    {getInitials(session?.user?.name || session?.user?.email || 'U')}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline-block">
                  {session?.user?.name || '사용자'}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>내 계정</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  프로필 설정
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
