'use client';

import {
  Play,
  Pause,
  CheckCircle,
  MoreVertical,
  Eye,
  MousePointer,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ABTestVariant {
  id: string;
  name: string;
  isControl: boolean;
  weight: number;
}

interface ABTest {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  variants: ABTestVariant[];
  _count: {
    events: number;
  };
}

interface ABTestCardProps {
  test: ABTest;
  onStatusChange: (testId: string, status: string) => void;
  onViewDetails: (testId: string) => void;
  onDelete: (testId: string) => void;
}

export function ABTestCard({
  test,
  onStatusChange,
  onViewDetails,
  onDelete,
}: ABTestCardProps) {
  const getStatusBadge = () => {
    switch (test.status) {
      case 'RUNNING':
        return <Badge className="bg-green-600">실행 중</Badge>;
      case 'PAUSED':
        return <Badge variant="secondary">일시정지</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline">완료</Badge>;
      default:
        return <Badge variant="outline">초안</Badge>;
    }
  };

  return (
    <div className="rounded-xl border p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{test.name}</h3>
            {getStatusBadge()}
          </div>
          {test.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {test.description}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(test.id)}>
              상세 보기
            </DropdownMenuItem>
            {test.status === 'DRAFT' && (
              <DropdownMenuItem
                onClick={() => onStatusChange(test.id, 'RUNNING')}
              >
                테스트 시작
              </DropdownMenuItem>
            )}
            {test.status === 'RUNNING' && (
              <DropdownMenuItem
                onClick={() => onStatusChange(test.id, 'PAUSED')}
              >
                일시정지
              </DropdownMenuItem>
            )}
            {test.status === 'PAUSED' && (
              <DropdownMenuItem
                onClick={() => onStatusChange(test.id, 'RUNNING')}
              >
                재개
              </DropdownMenuItem>
            )}
            {(test.status === 'RUNNING' || test.status === 'PAUSED') && (
              <DropdownMenuItem
                onClick={() => onStatusChange(test.id, 'COMPLETED')}
              >
                테스트 완료
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => onDelete(test.id)}
            >
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Variants */}
      <div className="mt-4 flex flex-wrap gap-2">
        {test.variants.map((variant) => (
          <div
            key={variant.id}
            className={cn(
              'rounded-lg px-3 py-1 text-xs',
              variant.isControl
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                : 'bg-muted'
            )}
          >
            {variant.name} ({variant.weight}%)
            {variant.isControl && ' - 컨트롤'}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-4 flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{test._count.events} 이벤트</span>
          </div>
          {test.startedAt && (
            <div>
              시작:{' '}
              {format(new Date(test.startedAt), 'PP', { locale: ko })}
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(test.id)}
        >
          결과 보기
        </Button>
      </div>
    </div>
  );
}
