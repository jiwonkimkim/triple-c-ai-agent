'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Shield,
  CreditCard,
  Palette,
  Globe,
  Users,
  Building2,
  Loader2,
  Check,
  Moon,
  Sun,
  Monitor,
  ChevronRight,
  Camera,
  Mail,
  KeyRound,
  Trash2,
  Plus,
  Crown,
  UserPlus,
  MoreHorizontal,
  Smartphone,
  Download,
  Link2,
  History,
  Laptop,
  MapPin,
  Clock,
  Zap,
  TrendingUp,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  QrCode,
  ShieldCheck,
  LogOut,
  Keyboard,
  FileDown,
  Github,
  X,
  ChevronDown,
  Receipt,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn, getInitials, formatDate, formatRelativeTime } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type SettingsTab = 'profile' | 'appearance' | 'security' | 'workspace' | 'billing' | 'data' | 'shortcuts';

interface Workspace {
  id: string;
  name: string;
  role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
  memberCount: number;
}

interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
}

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: Date;
  isCurrent: boolean;
}

interface LoginHistory {
  id: string;
  device: string;
  location: string;
  ip: string;
  timestamp: Date;
  success: boolean;
}

interface ConnectedAccount {
  id: string;
  provider: 'google' | 'github' | 'kakao' | 'naver';
  email: string;
  connectedAt: Date;
}

interface PaymentHistory {
  id: string;
  date: Date;
  amount: number;
  description: string;
  status: 'succeeded' | 'pending' | 'failed';
}

interface ShortcutKey {
  id: string;
  action: string;
  keys: string[];
  category: string;
}

const settingsTabs = [
  { id: 'profile' as const, label: '프로필', icon: User, description: '개인 정보 관리' },
  { id: 'appearance' as const, label: '테마 및 언어', icon: Palette, description: '화면 설정' },
  { id: 'security' as const, label: '보안', icon: Shield, description: '비밀번호 및 보안' },
  { id: 'workspace' as const, label: '워크스페이스', icon: Users, description: '팀 관리' },
  { id: 'billing' as const, label: '결제', icon: CreditCard, description: '구독 및 결제' },
  { id: 'data' as const, label: '데이터', icon: Download, description: '내보내기 및 연결' },
  { id: 'shortcuts' as const, label: '단축키', icon: Keyboard, description: '키보드 단축키' },
];

const roleLabels: Record<string, string> = {
  OWNER: '소유자',
  ADMIN: '관리자',
  EDITOR: '편집자',
  VIEWER: '뷰어',
};

const roleBadgeVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  OWNER: 'default',
  ADMIN: 'secondary',
  EDITOR: 'outline',
  VIEWER: 'outline',
};

const timezones = [
  { value: 'Asia/Seoul', label: '(GMT+9) 서울' },
  { value: 'Asia/Tokyo', label: '(GMT+9) 도쿄' },
  { value: 'America/New_York', label: '(GMT-5) 뉴욕' },
  { value: 'America/Los_Angeles', label: '(GMT-8) 로스앤젤레스' },
  { value: 'Europe/London', label: '(GMT+0) 런던' },
  { value: 'Europe/Paris', label: '(GMT+1) 파리' },
];

const plans = [
  {
    id: 'free',
    name: '무료',
    price: 0,
    credits: 3,
    features: ['월 3회 생성', '기본 템플릿', '워터마크 포함'],
    popular: false,
  },
  {
    id: 'starter',
    name: '스타터',
    price: 19000,
    credits: 30,
    features: ['월 30회 생성', '모든 템플릿', '워터마크 제거', '우선 지원'],
    popular: false,
  },
  {
    id: 'pro',
    name: '프로',
    price: 49000,
    credits: 100,
    features: ['월 100회 생성', '모든 템플릿', 'API 접근', '팀 협업', '우선 지원'],
    popular: true,
  },
  {
    id: 'enterprise',
    name: '엔터프라이즈',
    price: null,
    credits: null,
    features: ['무제한 생성', '전용 지원', '커스텀 통합', 'SLA 보장', '온프레미스 옵션'],
    popular: false,
  },
];

const defaultShortcuts: ShortcutKey[] = [
  { id: '1', action: '새 프로젝트', keys: ['⌘', 'N'], category: '일반' },
  { id: '2', action: '저장', keys: ['⌘', 'S'], category: '일반' },
  { id: '3', action: '실행 취소', keys: ['⌘', 'Z'], category: '편집' },
  { id: '4', action: '다시 실행', keys: ['⌘', 'Shift', 'Z'], category: '편집' },
  { id: '5', action: '복사', keys: ['⌘', 'C'], category: '편집' },
  { id: '6', action: '붙여넣기', keys: ['⌘', 'V'], category: '편집' },
  { id: '7', action: '미리보기', keys: ['⌘', 'P'], category: '보기' },
  { id: '8', action: '전체 화면', keys: ['⌘', 'Enter'], category: '보기' },
  { id: '9', action: '검색', keys: ['⌘', 'K'], category: '탐색' },
  { id: '10', action: '설정', keys: ['⌘', ','], category: '탐색' },
];

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Profile state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [timezone, setTimezone] = useState('Asia/Seoul');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);


  // Language
  const [language, setLanguage] = useState('ko');

  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);

  // Workspace
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'EDITOR' | 'VIEWER'>('EDITOR');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  // Billing
  const [currentPlan, setCurrentPlan] = useState('free');
  const [usedCredits, setUsedCredits] = useState(0);
  const [totalCredits, setTotalCredits] = useState(3);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);

  // Data
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Shortcuts
  const [shortcuts, setShortcuts] = useState<ShortcutKey[]>(defaultShortcuts);

  // Password validation
  const passwordErrors = {
    length: newPassword.length > 0 && newPassword.length < 8,
    match: confirmPassword.length > 0 && newPassword !== confirmPassword,
    hasUppercase: newPassword.length > 0 && !/[A-Z]/.test(newPassword),
    hasNumber: newPassword.length > 0 && !/[0-9]/.test(newPassword),
  };
  const isPasswordValid = newPassword.length >= 8 && !passwordErrors.match && !passwordErrors.hasUppercase && !passwordErrors.hasNumber;

  useEffect(() => {
    setMounted(true);
    if (session?.user) {
      setName(session.user.name || '');
      setEmail(session.user.email || '');
      setProfileImage(session.user.image || null);
    }

    // Simulate loading
    setTimeout(() => setIsPageLoading(false), 500);
  }, [session]);

  useEffect(() => {
    fetchWorkspaces();
    fetchMockData();
  }, []);

  const fetchMockData = () => {
    // Mock sessions
    setSessions([
      { id: '1', device: 'MacBook Pro', browser: 'Chrome 120', location: '서울, 대한민국', ip: '123.456.789.0', lastActive: new Date(), isCurrent: true },
      { id: '2', device: 'iPhone 15', browser: 'Safari Mobile', location: '서울, 대한민국', ip: '123.456.789.1', lastActive: new Date(Date.now() - 3600000), isCurrent: false },
    ]);

    // Mock login history
    setLoginHistory([
      { id: '1', device: 'MacBook Pro', location: '서울, 대한민국', ip: '123.456.789.0', timestamp: new Date(), success: true },
      { id: '2', device: 'iPhone 15', location: '서울, 대한민국', ip: '123.456.789.1', timestamp: new Date(Date.now() - 86400000), success: true },
      { id: '3', device: 'Unknown', location: '부산, 대한민국', ip: '111.222.333.4', timestamp: new Date(Date.now() - 172800000), success: false },
    ]);

    // Mock connected accounts
    setConnectedAccounts([
      { id: '1', provider: 'google', email: 'user@gmail.com', connectedAt: new Date(Date.now() - 86400000 * 30) },
    ]);

    // Mock payment history
    setPaymentHistory([
      { id: '1', date: new Date(Date.now() - 86400000 * 30), amount: 49000, description: '프로 플랜 - 월간', status: 'succeeded' },
      { id: '2', date: new Date(Date.now() - 86400000 * 60), amount: 49000, description: '프로 플랜 - 월간', status: 'succeeded' },
    ]);
  };

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch('/api/settings/workspaces');
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data.workspaces || []);
        if (data.workspaces?.length > 0 && !selectedWorkspace) {
          setSelectedWorkspace(data.workspaces[0]);
          fetchWorkspaceMembers(data.workspaces[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    }
  };

  const fetchWorkspaceMembers = async (workspaceId: string) => {
    try {
      const res = await fetch(`/api/settings/workspaces/${workspaceId}/members`);
      if (res.ok) {
        const data = await res.json();
        setWorkspaceMembers(data.members || []);
      }
    } catch (error) {
      console.error('Failed to fetch workspace members:', error);
    }
  };

  const handleSave = async (section: string) => {
    setIsLoading(true);
    try {
      let endpoint = '/api/settings/profile';
      let body: Record<string, unknown> = {};

      switch (section) {
        case 'profile':
          body = { name, bio, timezone };
          break;
        case 'password':
          endpoint = '/api/settings/password';
          body = { currentPassword, newPassword };
          break;
      }

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast({
          title: '저장 완료',
          description: '설정이 성공적으로 저장되었습니다.',
          variant: 'success',
        });
        if (section === 'profile') {
          await updateSession({ name });
        }
        if (section === 'password') {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({
        title: '저장 실패',
        description: '설정을 저장하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: '파일 크기 초과',
        description: '이미지 파일은 2MB 이하여야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      // TODO: Upload to server
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: '업로드 완료',
        description: '프로필 이미지가 변경되었습니다.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: '업로드 실패',
        description: '이미지 업로드 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    setIsCreatingWorkspace(true);
    try {
      const res = await fetch('/api/settings/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWorkspaceName }),
      });
      if (res.ok) {
        setNewWorkspaceName('');
        fetchWorkspaces();
        toast({
          title: '워크스페이스 생성',
          description: '새 워크스페이스가 생성되었습니다.',
          variant: 'success',
        });
      }
    } catch (error) {
      toast({
        title: '생성 실패',
        description: '워크스페이스 생성 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !selectedWorkspace) return;
    try {
      const res = await fetch(`/api/settings/workspaces/${selectedWorkspace.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (res.ok) {
        setInviteEmail('');
        fetchWorkspaceMembers(selectedWorkspace.id);
        toast({
          title: '초대 완료',
          description: `${inviteEmail}님에게 초대를 보냈습니다.`,
          variant: 'success',
        });
      }
    } catch (error) {
      toast({
        title: '초대 실패',
        description: '멤버 초대 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedWorkspace) return;
    try {
      await fetch(`/api/settings/workspaces/${selectedWorkspace.id}/members/${memberId}`, {
        method: 'DELETE',
      });
      fetchWorkspaceMembers(selectedWorkspace.id);
      toast({
        title: '멤버 제거',
        description: '멤버가 워크스페이스에서 제거되었습니다.',
      });
    } catch (error) {
      toast({
        title: '제거 실패',
        description: '멤버 제거 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
    toast({
      title: '세션 종료',
      description: '선택한 세션이 종료되었습니다.',
    });
  };

  const handleRevokeAllSessions = async () => {
    setSessions(sessions.filter(s => s.isCurrent));
    toast({
      title: '모든 세션 종료',
      description: '현재 세션을 제외한 모든 세션이 종료되었습니다.',
    });
  };

  const handleToggle2FA = async () => {
    if (is2FAEnabled) {
      setIs2FAEnabled(false);
      toast({
        title: '2단계 인증 비활성화',
        description: '2단계 인증이 비활성화되었습니다.',
      });
    } else {
      setShow2FADialog(true);
    }
  };

  const handleEnable2FA = async () => {
    if (twoFactorCode.length !== 6) return;
    setIs2FAEnabled(true);
    setShow2FADialog(false);
    setTwoFactorCode('');
    toast({
      title: '2단계 인증 활성화',
      description: '계정 보안이 강화되었습니다.',
      variant: 'success',
    });
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: '내보내기 완료',
        description: '데이터 파일이 다운로드됩니다.',
        variant: 'success',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleConnectAccount = async (provider: string) => {
    toast({
      title: '계정 연결',
      description: `${provider} 계정 연결을 시작합니다...`,
    });
  };

  const handleDisconnectAccount = async (accountId: string) => {
    setConnectedAccounts(connectedAccounts.filter(a => a.id !== accountId));
    toast({
      title: '연결 해제',
      description: '계정 연결이 해제되었습니다.',
    });
  };

  const handleDeleteAccount = async () => {
    try {
      await fetch('/api/settings/account', { method: 'DELETE' });
      window.location.href = '/';
    } catch (error) {
      toast({
        title: '삭제 실패',
        description: '계정 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: '복사됨',
      description: '클립보드에 복사되었습니다.',
    });
  };

  if (!mounted) return null;

  // Loading skeleton
  if (isPageLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64 flex-shrink-0 space-y-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </aside>
          <main className="flex-1 space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            설정
          </h1>
          <p className="text-muted-foreground">계정 설정 및 환경설정을 관리합니다.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1 sticky top-20">
              {settingsTabs.map((tab, index) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground hover:scale-[1.01]'
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{tab.label}</p>
                    <p className={cn(
                      'text-xs truncate',
                      activeTab === tab.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    )}>
                      {tab.description}
                    </p>
                  </div>
                  <ChevronRight className={cn(
                    'h-4 w-4 flex-shrink-0 transition-transform',
                    activeTab === tab.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                  )} />
                </motion.button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  <Card className="overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
                    <CardContent className="relative pt-0 -mt-16">
                      {/* Avatar */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                        <div className="relative group">
                          <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                            <AvatarImage src={profileImage || session?.user?.image || ''} />
                            <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                              {getInitials(session?.user?.name || session?.user?.email || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                              disabled={isUploadingImage}
                            />
                            {isUploadingImage ? (
                              <Loader2 className="h-8 w-8 text-white animate-spin" />
                            ) : (
                              <Camera className="h-8 w-8 text-white" />
                            )}
                          </label>
                        </div>
                        <div className="space-y-1 pb-2">
                          <h3 className="font-semibold text-xl">{session?.user?.name || '사용자'}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {session?.user?.email}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="gap-1">
                              <Crown className="h-3 w-3" />
                              무료 플랜
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <MapPin className="h-3 w-3" />
                              서울
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        프로필 정보
                      </CardTitle>
                      <CardDescription>공개 프로필 정보를 관리합니다.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Name */}
                      <div className="grid gap-2">
                        <Label htmlFor="name">이름</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="이름을 입력하세요"
                          className="max-w-md"
                        />
                      </div>

                      {/* Bio */}
                      <div className="grid gap-2">
                        <Label htmlFor="bio">자기소개</Label>
                        <Textarea
                          id="bio"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="간단한 자기소개를 입력하세요"
                          className="max-w-md resize-none"
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground">{bio.length}/200자</p>
                      </div>

                      {/* Timezone */}
                      <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          시간대
                        </Label>
                        <Select value={timezone} onValueChange={setTimezone}>
                          <SelectTrigger className="max-w-md">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {timezones.map((tz) => (
                              <SelectItem key={tz.value} value={tz.value}>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button onClick={() => handleSave('profile')} disabled={isLoading} className="gap-2">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        변경사항 저장
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <motion.div
                  key="appearance"
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-primary" />
                        테마
                      </CardTitle>
                      <CardDescription>앱의 테마를 선택합니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 max-w-lg">
                        {[
                          { value: 'light', icon: Sun, label: '라이트', bg: 'bg-white', iconColor: 'text-yellow-500' },
                          { value: 'dark', icon: Moon, label: '다크', bg: 'bg-slate-900', iconColor: 'text-slate-300' },
                          { value: 'system', icon: Monitor, label: '시스템', bg: 'bg-gradient-to-br from-white to-slate-900', iconColor: 'text-slate-500' },
                        ].map((t) => (
                          <motion.button
                            key={t.value}
                            onClick={() => setTheme(t.value)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                              'flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all',
                              theme === t.value
                                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                                : 'border-border hover:border-primary/50'
                            )}
                          >
                            <div className={cn('h-14 w-14 rounded-full border shadow-inner flex items-center justify-center', t.bg)}>
                              <t.icon className={cn('h-7 w-7', t.iconColor)} />
                            </div>
                            <span className="text-sm font-medium">{t.label}</span>
                            {theme === t.value && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center"
                              >
                                <Check className="h-3 w-3 text-primary-foreground" />
                              </motion.div>
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        언어
                      </CardTitle>
                      <CardDescription>앱에서 사용할 언어를 선택합니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="max-w-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ko">🇰🇷 한국어</SelectItem>
                          <SelectItem value="en">🇺🇸 English</SelectItem>
                          <SelectItem value="ja">🇯🇵 日本語</SelectItem>
                          <SelectItem value="zh">🇨🇳 中文</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  {/* 2FA */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        2단계 인증
                      </CardTitle>
                      <CardDescription>계정 보안을 강화하기 위해 2단계 인증을 설정하세요.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            'h-12 w-12 rounded-full flex items-center justify-center',
                            is2FAEnabled ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'
                          )}>
                            <Smartphone className={cn('h-6 w-6', is2FAEnabled ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground')} />
                          </div>
                          <div>
                            <p className="font-medium">인증 앱</p>
                            <p className="text-sm text-muted-foreground">
                              {is2FAEnabled ? '활성화됨' : 'Google Authenticator 또는 Authy 사용'}
                            </p>
                          </div>
                        </div>
                        <Button variant={is2FAEnabled ? 'destructive' : 'default'} onClick={handleToggle2FA}>
                          {is2FAEnabled ? '비활성화' : '활성화'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 2FA Dialog */}
                  <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>2단계 인증 설정</DialogTitle>
                        <DialogDescription>인증 앱으로 QR 코드를 스캔한 후 생성된 코드를 입력하세요.</DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col items-center gap-4 py-4">
                        <div className="h-48 w-48 bg-muted rounded-lg flex items-center justify-center">
                          <QrCode className="h-32 w-32 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="px-3 py-1 bg-muted rounded text-sm">ABCD-EFGH-IJKL-MNOP</code>
                          <Button size="icon" variant="ghost" onClick={() => copyToClipboard('ABCD-EFGH-IJKL-MNOP')}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          placeholder="6자리 코드 입력"
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="text-center text-lg tracking-widest"
                          maxLength={6}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShow2FADialog(false)}>취소</Button>
                        <Button onClick={handleEnable2FA} disabled={twoFactorCode.length !== 6}>확인</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Password Change */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-primary" />
                        비밀번호 변경
                      </CardTitle>
                      <CardDescription>계정 보안을 위해 정기적으로 비밀번호를 변경하세요.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2 max-w-md">
                        <Label htmlFor="current-password">현재 비밀번호</Label>
                        <div className="relative">
                          <Input
                            id="current-password"
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-2 max-w-md">
                        <Label htmlFor="new-password">새 비밀번호</Label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {newPassword && (
                          <div className="space-y-1 mt-2">
                            {[
                              { check: newPassword.length >= 8, label: '8자 이상' },
                              { check: /[A-Z]/.test(newPassword), label: '대문자 포함' },
                              { check: /[0-9]/.test(newPassword), label: '숫자 포함' },
                            ].map((rule) => (
                              <p key={rule.label} className={cn('text-xs flex items-center gap-1', rule.check ? 'text-green-600' : 'text-muted-foreground')}>
                                {rule.check ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                {rule.label}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="grid gap-2 max-w-md">
                        <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        {passwordErrors.match && (
                          <p className="text-xs text-destructive">비밀번호가 일치하지 않습니다.</p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleSave('password')}
                        disabled={isLoading || !currentPassword || !isPasswordValid}
                      >
                        비밀번호 변경
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Active Sessions */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Laptop className="h-5 w-5 text-primary" />
                          활성 세션
                        </CardTitle>
                        <CardDescription>현재 로그인된 기기를 관리합니다.</CardDescription>
                      </div>
                      {sessions.length > 1 && (
                        <Button variant="outline" size="sm" onClick={handleRevokeAllSessions}>
                          모두 로그아웃
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {sessions.map((s) => (
                        <div key={s.id} className="flex items-center justify-between p-4 rounded-lg border">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <Laptop className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{s.device}</p>
                                {s.isCurrent && <Badge variant="secondary" className="text-xs">현재</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground">{s.browser} · {s.location}</p>
                              <p className="text-xs text-muted-foreground">마지막 활동: {formatRelativeTime(s.lastActive)}</p>
                            </div>
                          </div>
                          {!s.isCurrent && (
                            <Button variant="ghost" size="sm" onClick={() => handleRevokeSession(s.id)}>
                              <LogOut className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Login History */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        로그인 기록
                      </CardTitle>
                      <CardDescription>최근 로그인 시도 기록입니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {loginHistory.map((log) => (
                          <div key={log.id} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'h-8 w-8 rounded-full flex items-center justify-center',
                                log.success ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                              )}>
                                {log.success ? (
                                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                                ) : (
                                  <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{log.device}</p>
                                <p className="text-xs text-muted-foreground">{log.location} · {log.ip}</p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">{formatRelativeTime(log.timestamp)}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Delete Account */}
                  <Card className="border-destructive/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="h-5 w-5" />
                        계정 삭제
                      </CardTitle>
                      <CardDescription>계정을 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">계정 삭제</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>정말 계정을 삭제하시겠습니까?</AlertDialogTitle>
                            <AlertDialogDescription>
                              이 작업은 되돌릴 수 없습니다. 모든 프로젝트, 브랜드 프로필, 데이터가 영구적으로 삭제됩니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              삭제
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Workspace Tab */}
              {activeTab === 'workspace' && (
                <motion.div
                  key="workspace"
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          워크스페이스
                        </CardTitle>
                        <CardDescription>팀과 협업할 워크스페이스를 관리합니다.</CardDescription>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            새 워크스페이스
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>새 워크스페이스 만들기</DialogTitle>
                            <DialogDescription>팀과 협업할 새 워크스페이스를 만듭니다.</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="workspace-name">워크스페이스 이름</Label>
                              <Input
                                id="workspace-name"
                                value={newWorkspaceName}
                                onChange={(e) => setNewWorkspaceName(e.target.value)}
                                placeholder="예: 마케팅 팀"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleCreateWorkspace} disabled={isCreatingWorkspace || !newWorkspaceName.trim()}>
                              {isCreatingWorkspace ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                              만들기
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      {workspaces.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="mx-auto h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Users className="h-10 w-10 text-muted-foreground" />
                          </div>
                          <p className="font-medium">아직 워크스페이스가 없습니다</p>
                          <p className="text-sm text-muted-foreground mt-1">새 워크스페이스를 만들어 팀과 협업하세요.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {workspaces.map((workspace) => (
                            <motion.div
                              key={workspace.id}
                              whileHover={{ scale: 1.01 }}
                              onClick={() => {
                                setSelectedWorkspace(workspace);
                                fetchWorkspaceMembers(workspace.id);
                              }}
                              className={cn(
                                'flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all',
                                selectedWorkspace?.id === workspace.id ? 'border-primary bg-primary/5 shadow-sm' : 'hover:border-primary/50'
                              )}
                            >
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                  <Building2 className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{workspace.name}</p>
                                  <p className="text-sm text-muted-foreground">{workspace.memberCount}명의 멤버</p>
                                </div>
                              </div>
                              <Badge variant={roleBadgeVariants[workspace.role]} className="gap-1">
                                {workspace.role === 'OWNER' && <Crown className="h-3 w-3" />}
                                {roleLabels[workspace.role]}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {selectedWorkspace && (
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            {selectedWorkspace.name} 멤버
                          </CardTitle>
                          <CardDescription>워크스페이스 멤버를 관리합니다.</CardDescription>
                        </div>
                        {(selectedWorkspace.role === 'OWNER' || selectedWorkspace.role === 'ADMIN') && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="gap-2">
                                <UserPlus className="h-4 w-4" />
                                멤버 초대
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>멤버 초대</DialogTitle>
                                <DialogDescription>이메일로 새 멤버를 초대합니다.</DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="invite-email">이메일</Label>
                                  <Input
                                    id="invite-email"
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="member@example.com"
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="invite-role">역할</Label>
                                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'ADMIN' | 'EDITOR' | 'VIEWER')}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="ADMIN">관리자</SelectItem>
                                      <SelectItem value="EDITOR">편집자</SelectItem>
                                      <SelectItem value="VIEWER">뷰어</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button onClick={handleInviteMember} disabled={!inviteEmail.trim()}>초대하기</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {workspaceMembers.map((member) => (
                            <div key={member.id} className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={member.image} />
                                  <AvatarFallback>{getInitials(member.name || member.email)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{member.name || '이름 없음'}</p>
                                  <p className="text-sm text-muted-foreground">{member.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={roleBadgeVariants[member.role]} className="gap-1">
                                  {member.role === 'OWNER' && <Crown className="h-3 w-3" />}
                                  {roleLabels[member.role]}
                                </Badge>
                                {selectedWorkspace.role === 'OWNER' && member.role !== 'OWNER' && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => handleRemoveMember(member.id)}
                                      >
                                        멤버 제거
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <motion.div
                  key="billing"
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  {/* Current Plan */}
                  <Card className="overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        현재 플랜
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl border bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-bold">무료 체험</h3>
                            <Badge>현재 플랜</Badge>
                          </div>
                          <p className="text-muted-foreground">3개의 무료 크레딧으로 시작하세요</p>
                        </div>
                        <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                          <Crown className="h-4 w-4" />
                          플랜 업그레이드
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pricing Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        플랜 비교
                      </CardTitle>
                      <CardDescription>나에게 맞는 플랜을 선택하세요.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-4 gap-4">
                        {plans.map((plan) => (
                          <div
                            key={plan.id}
                            className={cn(
                              'relative p-6 rounded-xl border-2 transition-all',
                              plan.popular ? 'border-primary shadow-lg shadow-primary/10' : 'border-border',
                              currentPlan === plan.id && 'bg-primary/5'
                            )}
                          >
                            {plan.popular && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <Badge className="bg-primary">인기</Badge>
                              </div>
                            )}
                            <div className="text-center mb-4">
                              <h4 className="font-bold text-lg">{plan.name}</h4>
                              <div className="mt-2">
                                {plan.price !== null ? (
                                  <>
                                    <span className="text-3xl font-bold">₩{plan.price.toLocaleString()}</span>
                                    <span className="text-muted-foreground">/월</span>
                                  </>
                                ) : (
                                  <span className="text-xl font-bold">문의</span>
                                )}
                              </div>
                            </div>
                            <ul className="space-y-2 mb-6">
                              {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm">
                                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                            <Button
                              className="w-full"
                              variant={currentPlan === plan.id ? 'secondary' : plan.popular ? 'default' : 'outline'}
                              disabled={currentPlan === plan.id}
                            >
                              {currentPlan === plan.id ? '현재 플랜' : '선택'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Usage */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        크레딧 사용량
                      </CardTitle>
                      <CardDescription>이번 달 크레딧 사용 현황입니다.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">사용한 크레딧</span>
                        <span className="text-2xl font-bold">{usedCredits} / {totalCredits}</span>
                      </div>
                      <Progress value={(usedCredits / totalCredits) * 100} className="h-3" />
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 rounded-lg bg-muted/50">
                          <p className="text-2xl font-bold text-primary">{usedCredits}</p>
                          <p className="text-xs text-muted-foreground">사용</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                          <p className="text-2xl font-bold">{totalCredits - usedCredits}</p>
                          <p className="text-xs text-muted-foreground">남음</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                          <p className="text-2xl font-bold">{totalCredits}</p>
                          <p className="text-xs text-muted-foreground">총 크레딧</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment History */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-primary" />
                        결제 내역
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {paymentHistory.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          결제 내역이 없습니다.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {paymentHistory.map((payment) => (
                            <div key={payment.id} className="flex items-center justify-between p-4 rounded-lg border">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Receipt className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{payment.description}</p>
                                  <p className="text-sm text-muted-foreground">{formatDate(payment.date)}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">₩{payment.amount.toLocaleString()}</p>
                                <Badge variant={payment.status === 'succeeded' ? 'secondary' : payment.status === 'pending' ? 'outline' : 'destructive'}>
                                  {payment.status === 'succeeded' ? '완료' : payment.status === 'pending' ? '대기' : '실패'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Data Tab */}
              {activeTab === 'data' && (
                <motion.div
                  key="data"
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  {/* Export Data */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileDown className="h-5 w-5 text-primary" />
                        데이터 내보내기
                      </CardTitle>
                      <CardDescription>모든 데이터를 JSON 형식으로 내보냅니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border bg-muted/50">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Download className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">전체 데이터 내보내기</p>
                            <p className="text-sm text-muted-foreground">프로젝트, 브랜드 프로필, 설정 포함</p>
                          </div>
                        </div>
                        <Button onClick={handleExportData} disabled={isExporting} className="gap-2">
                          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                          {isExporting ? '준비 중...' : '내보내기'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Connected Accounts */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5 text-primary" />
                        연결된 계정
                      </CardTitle>
                      <CardDescription>소셜 로그인 계정을 관리합니다.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { provider: 'google', name: 'Google', icon: '🔵', connected: connectedAccounts.some(a => a.provider === 'google') },
                        { provider: 'github', name: 'GitHub', icon: '⚫', connected: connectedAccounts.some(a => a.provider === 'github') },
                        { provider: 'kakao', name: 'Kakao', icon: '🟡', connected: connectedAccounts.some(a => a.provider === 'kakao') },
                        { provider: 'naver', name: 'Naver', icon: '🟢', connected: connectedAccounts.some(a => a.provider === 'naver') },
                      ].map((account) => {
                        const connectedAccount = connectedAccounts.find(a => a.provider === account.provider);
                        return (
                          <div key={account.provider} className="flex items-center justify-between p-4 rounded-lg border">
                            <div className="flex items-center gap-4">
                              <span className="text-2xl">{account.icon}</span>
                              <div>
                                <p className="font-medium">{account.name}</p>
                                {connectedAccount ? (
                                  <p className="text-sm text-muted-foreground">{connectedAccount.email}</p>
                                ) : (
                                  <p className="text-sm text-muted-foreground">연결되지 않음</p>
                                )}
                              </div>
                            </div>
                            {connectedAccount ? (
                              <Button variant="outline" size="sm" onClick={() => handleDisconnectAccount(connectedAccount.id)}>
                                연결 해제
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => handleConnectAccount(account.name)}>
                                연결
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Shortcuts Tab */}
              {activeTab === 'shortcuts' && (
                <motion.div
                  key="shortcuts"
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Keyboard className="h-5 w-5 text-primary" />
                        키보드 단축키
                      </CardTitle>
                      <CardDescription>자주 사용하는 기능의 단축키입니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {['일반', '편집', '보기', '탐색'].map((category) => (
                          <div key={category}>
                            <h4 className="text-sm font-medium text-muted-foreground mb-3">{category}</h4>
                            <div className="space-y-2">
                              {shortcuts.filter(s => s.category === category).map((shortcut) => (
                                <div key={shortcut.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
                                  <span className="text-sm">{shortcut.action}</span>
                                  <div className="flex items-center gap-1">
                                    {shortcut.keys.map((key, i) => (
                                      <kbd key={i} className="px-2 py-1 text-xs font-semibold bg-muted border rounded">
                                        {key}
                                      </kbd>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
