'use client';

import { useState } from 'react';
import { UserPlus, Loader2, Mail, Shield, Edit, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Role } from './member-list';

interface InviteMemberDialogProps {
  workspaceId: string;
  onInvited: () => void;
}

const roleDescriptions: Record<Exclude<Role, 'OWNER'>, { icon: React.ReactNode; description: string }> = {
  ADMIN: {
    icon: <Shield className="h-4 w-4" />,
    description: '멤버 관리 및 모든 프로젝트 접근',
  },
  EDITOR: {
    icon: <Edit className="h-4 w-4" />,
    description: '프로젝트 생성 및 편집',
  },
  VIEWER: {
    icon: <Eye className="h-4 w-4" />,
    description: '프로젝트 보기만 가능',
  },
};

export function InviteMemberDialog({
  workspaceId,
  onInvited,
}: InviteMemberDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Exclude<Role, 'OWNER'>>('EDITOR');
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setIsInviting(true);
    setError(null);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite member');
      }

      // Success
      setIsOpen(false);
      setEmail('');
      setRole('EDITOR');
      onInvited();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite member');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          멤버 초대
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>멤버 초대</DialogTitle>
          <DialogDescription>
            이메일 주소로 새 멤버를 워크스페이스에 초대합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                disabled={isInviting}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              초대할 사용자는 먼저 가입되어 있어야 합니다.
            </p>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>역할</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as Exclude<Role, 'OWNER'>)}
              disabled={isInviting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(roleDescriptions) as [Exclude<Role, 'OWNER'>, typeof roleDescriptions['ADMIN']][]).map(
                  ([value, config]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        {config.icon}
                        <div>
                          <p className="font-medium">
                            {value === 'ADMIN'
                              ? '관리자'
                              : value === 'EDITOR'
                              ? '편집자'
                              : '뷰어'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {config.description}
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isInviting}
          >
            취소
          </Button>
          <Button onClick={handleInvite} disabled={isInviting}>
            {isInviting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                초대 중...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                초대
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
