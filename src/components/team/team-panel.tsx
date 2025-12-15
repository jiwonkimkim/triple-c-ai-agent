'use client';

import { useState, useEffect } from 'react';
import { Users, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MemberList, type MemberData, type OwnerData, type Role } from './member-list';
import { InviteMemberDialog } from './invite-member-dialog';

interface TeamPanelProps {
  workspaceId: string;
  currentUserId: string;
}

export function TeamPanel({ workspaceId, currentUserId }: TeamPanelProps) {
  const [owner, setOwner] = useState<OwnerData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwner = owner?.id === currentUserId;
  const currentMember = members.find((m) => m.userId === currentUserId);
  const isAdmin = currentMember?.role === 'ADMIN';

  useEffect(() => {
    fetchMembers();
  }, [workspaceId]);

  const fetchMembers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`);

      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }

      const data = await response.json();
      setOwner(data.data.owner);
      setMembers(data.data.members);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (memberId: string, role: Role) => {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/members/${memberId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update role');
      }

      // Refresh members
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/members/${memberId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove member');
      }

      // Refresh members
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          팀 관리
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={fetchMembers}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {(isOwner || isAdmin) && (
            <InviteMemberDialog
              workspaceId={workspaceId}
              onInvited={fetchMembers}
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>오류</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {owner && (
          <MemberList
            owner={owner}
            members={members}
            currentUserId={currentUserId}
            isOwner={isOwner}
            isAdmin={isAdmin}
            onUpdateRole={handleUpdateRole}
            onRemoveMember={handleRemoveMember}
          />
        )}
      </CardContent>
    </Card>
  );
}
