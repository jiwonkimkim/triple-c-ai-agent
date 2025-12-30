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
  { name: '마켓플레이스', href: '/dashboard/marketplace', icon: Store },
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { styleTheme, isLoaded } = useStyleTheme();
  const isSmile = isLoaded && styleTheme === 'smile';

  // 에디터 페이지 진입 시 사이드바 자동 닫기
  useEffect(() => {
    if (isEditorPage(pathname)) {
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(false);
    }
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-background transition-all duration-300 overflow-hidden',
          isSmile ? 'border-r-2 border-border' : 'border-r border-border',
          // 모바일: sidebarOpen으로 제어
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          // 데스크톱: sidebarCollapsed로 제어 - 완전히 숨김
          sidebarCollapsed
            ? 'lg:w-0 lg:opacity-0 lg:invisible lg:border-r-0'
            : 'lg:translate-x-0 lg:static lg:z-auto lg:opacity-100 lg:visible'
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex h-16 items-center justify-between px-4 min-w-[256px]",
          isSmile ? "border-b-2 border-border" : "border-b border-border"
        )}>
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className={cn(
              "text-xl font-bold",
              isSmile && "font-black tracking-tighter uppercase"
            )}>Triple C</span>
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
            const isActive = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 text-sm transition-colors',
                  isSmile
                    ? 'font-bold uppercase tracking-wider border-2 rounded-[var(--radius)]'
                    : 'font-medium rounded-lg',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  isActive && isSmile && 'border-primary',
                  !isActive && isSmile && 'border-transparent hover:border-border'
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
        <div className={cn(
          "p-4",
          isSmile ? "border-t-2 border-border" : "border-t border-border"
        )}>
          <div className={cn(
            "flex items-center gap-3 bg-muted p-3",
            isSmile ? "border-2 border-border rounded-[var(--radius)]" : "rounded-lg"
          )}>
            <Avatar className={cn(
              "h-9 w-9",
              isSmile && "border-2 border-border"
            )}>
              <AvatarImage src={session?.user?.image || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                {getInitials(session?.user?.name || session?.user?.email || 'U')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 truncate">
              <p className={cn(
                "truncate text-sm font-medium",
                isSmile && "font-bold uppercase tracking-wider"
              )}>
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
        <header className={cn(
          "sticky top-0 z-30 flex h-16 items-center gap-4 bg-background px-4 lg:px-6",
          isSmile ? "border-b-2 border-border" : "border-b border-border"
        )}>
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
              <Button variant="ghost" className={cn(
                "flex items-center gap-2",
                isSmile && "uppercase text-xs tracking-wider font-bold"
              )}>
                <Avatar className={cn(
                  "h-8 w-8",
                  isSmile && "border-2 border-border"
                )}>
                  <AvatarImage src={session?.user?.image || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                    {getInitials(session?.user?.name || session?.user?.email || 'U')}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline-block">
                  {session?.user?.name || '사용자'}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={cn(
              "w-56",
              isSmile && "border-2 border-border"
            )}>
              <DropdownMenuLabel className={cn(
                isSmile && "uppercase text-xs tracking-wider"
              )}>내 계정</DropdownMenuLabel>
              <DropdownMenuSeparator className={isSmile ? "bg-border" : ""} />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className={cn(
                  "cursor-pointer",
                  isSmile && "uppercase text-xs tracking-wider font-medium"
                )}>
                  <User className="mr-2 h-4 w-4" />
                  프로필 설정
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className={isSmile ? "bg-border" : ""} />
              <DropdownMenuItem
                className={cn(
                  "cursor-pointer text-destructive focus:text-destructive",
                  isSmile && "uppercase text-xs tracking-wider font-medium"
                )}
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 bg-secondary">{children}</main>
      </div>
    </div>
  );
}
