'use client';

import { useState } from 'react';
import {
  Users,
  Crown,
  Shield,
  Edit,
  Eye,
  MoreVertical,
  Trash2,
  UserMinus,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

export type Role = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface MemberData {
  id: string;
  userId: string;
  role: Role;
  joinedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export interface OwnerData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface MemberListProps {
  owner: OwnerData;
  members: MemberData[];
  currentUserId: string;
  isOwner: boolean;
  isAdmin: boolean;
  onUpdateRole: (memberId: string, role: Role) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
}

const roleConfig: Record<Role, { label: string; icon: React.ReactNode; color: string }> = {
  OWNER: {
    label: '소유자',
    icon: <Crown className="h-3 w-3" />,
    color: 'bg-yellow-500 text-white',
  },
  ADMIN: {
    label: '관리자',
    icon: <Shield className="h-3 w-3" />,
    color: 'bg-blue-500 text-white',
  },
  EDITOR: {
    label: '편집자',
    icon: <Edit className="h-3 w-3" />,
    color: 'bg-green-500 text-white',
  },
  VIEWER: {
    label: '뷰어',
    icon: <Eye className="h-3 w-3" />,
    color: 'bg-gray-500 text-white',
  },
};

export function MemberList({
  owner,
  members,
  currentUserId,
  isOwner,
  isAdmin,
  onUpdateRole,
  onRemoveMember,
}: MemberListProps) {
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<MemberData | null>(null);

  const handleRoleChange = async (memberId: string, newRole: Role) => {
    setUpdatingMemberId(memberId);
    try {
      await onUpdateRole(memberId, newRole);
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!confirmRemove) return;

    setRemovingMemberId(confirmRemove.id);
    try {
      await onRemoveMember(confirmRemove.id);
    } finally {
      setRemovingMemberId(null);
      setConfirmRemove(null);
    }
  };

  const canManage = isOwner || isAdmin;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">팀 멤버</h3>
        <Badge variant="secondary">{members.length + 1}명</Badge>
      </div>

      {/* Member List */}
      <div className="space-y-2">
        {/* Owner */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={owner.image || undefined} />
              <AvatarFallback>
                {owner.name?.[0] || owner.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {owner.name || owner.email}
                {owner.id === currentUserId && (
                  <span className="text-xs text-muted-foreground ml-2">(나)</span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">{owner.email}</p>
            </div>
          </div>
          <Badge className={roleConfig.OWNER.color}>
            {roleConfig.OWNER.icon}
            <span className="ml-1">{roleConfig.OWNER.label}</span>
          </Badge>
        </div>

        {/* Members */}
        {members.map((member) => {
          const isSelf = member.userId === currentUserId;
          const canEditRole = isOwner || (isAdmin && member.role !== 'ADMIN');
          const canRemove = isOwner || (isAdmin && member.role !== 'ADMIN') || isSelf;

          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={member.user.image || undefined} />
                  <AvatarFallback>
                    {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {member.user.name || member.user.email}
                    {isSelf && (
                      <span className="text-xs text-muted-foreground ml-2">(나)</span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">{member.user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canEditRole && !isSelf ? (
                  <Select
                    value={member.role}
                    onValueChange={(value) => handleRoleChange(member.id, value as Role)}
                    disabled={updatingMemberId === member.id}
                  >
                    <SelectTrigger className="w-32">
                      {updatingMemberId === member.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <SelectValue />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">
                        <div className="flex items-center gap-2">
                          {roleConfig.ADMIN.icon}
                          {roleConfig.ADMIN.label}
                        </div>
                      </SelectItem>
                      <SelectItem value="EDITOR">
                        <div className="flex items-center gap-2">
                          {roleConfig.EDITOR.icon}
                          {roleConfig.EDITOR.label}
                        </div>
                      </SelectItem>
                      <SelectItem value="VIEWER">
                        <div className="flex items-center gap-2">
                          {roleConfig.VIEWER.icon}
                          {roleConfig.VIEWER.label}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={cn(roleConfig[member.role].color)}>
                    {roleConfig[member.role].icon}
                    <span className="ml-1">{roleConfig[member.role].label}</span>
                  </Badge>
                )}

                {canRemove && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setConfirmRemove(member)}
                      >
                        {isSelf ? (
                          <>
                            <UserMinus className="h-4 w-4 mr-2" />
                            워크스페이스 떠나기
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            멤버 제거
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!confirmRemove} onOpenChange={() => setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmRemove?.userId === currentUserId
                ? '워크스페이스를 떠나시겠습니까?'
                : '멤버를 제거하시겠습니까?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmRemove?.userId === currentUserId
                ? '이 워크스페이스의 프로젝트에 더 이상 접근할 수 없습니다.'
                : `${confirmRemove?.user.name || confirmRemove?.user.email}님을 이 워크스페이스에서 제거합니다.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!removingMemberId}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!!removingMemberId}
            >
              {removingMemberId ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {confirmRemove?.userId === currentUserId ? '떠나기' : '제거'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
