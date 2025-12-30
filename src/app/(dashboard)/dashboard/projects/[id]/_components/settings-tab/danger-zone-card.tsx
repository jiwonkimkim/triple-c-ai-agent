'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DangerZoneCardProps {
  onDelete?: () => void;
}

export function DangerZoneCard({ onDelete }: DangerZoneCardProps) {
  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">위험 구역</CardTitle>
        <CardDescription>
          프로젝트를 삭제하면 복구할 수 없습니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" onClick={onDelete}>
          프로젝트 삭제
        </Button>
      </CardContent>
    </Card>
  );
}
