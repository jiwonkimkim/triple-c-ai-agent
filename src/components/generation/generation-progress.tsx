'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  useGenerationStore,
  selectActiveJob,
  type GenerationJob,
  type GenerationStep,
} from '@/stores/generation-store';

interface GenerationProgressProps {
  jobId?: string;
  onComplete?: (result: GenerationJob['result']) => void;
  onError?: (error: string) => void;
  showCard?: boolean;
  compact?: boolean;
}

export function GenerationProgress({
  jobId,
  onComplete,
  onError,
  showCard = true,
  compact = false,
}: GenerationProgressProps) {
  const job = useGenerationStore((state) =>
    jobId ? state.jobs[jobId] : selectActiveJob(state)
  );

  useEffect(() => {
    if (job?.status === 'completed' && job.result) {
      onComplete?.(job.result);
    } else if (job?.status === 'error' && job.error) {
      onError?.(job.error);
    }
  }, [job?.status, job?.result, job?.error, onComplete, onError]);

  if (!job) {
    return null;
  }

  const content = (
    <div className={cn('space-y-4', compact && 'space-y-2')}>
      {/* Overall progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {job.status === 'completed'
              ? '생성 완료'
              : job.status === 'error'
              ? '생성 실패'
              : '생성 중...'}
          </span>
          <span className="text-muted-foreground">{job.overallProgress}%</span>
        </div>
        <Progress
          value={job.overallProgress}
          className={cn(
            'h-2',
            job.status === 'error' && 'bg-destructive/20'
          )}
          indicatorClassName={cn(
            job.status === 'error' && 'bg-destructive',
            job.status === 'completed' && 'bg-green-500'
          )}
        />
      </div>

      {/* Steps */}
      {!compact && (
        <div className="space-y-3">
          {job.steps.map((step, index) => (
            <StepItem
              key={step.id}
              step={step}
              isActive={index === job.currentStepIndex && job.status !== 'completed'}
              isLast={index === job.steps.length - 1}
            />
          ))}
        </div>
      )}

      {/* Error message */}
      {job.status === 'error' && job.error && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          <span className="text-destructive">{job.error}</span>
        </div>
      )}

      {/* Elapsed time */}
      {job.status !== 'idle' && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <ElapsedTime startTime={job.createdAt} endTime={job.completedAt} />
        </div>
      )}
    </div>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {job.status === 'completed' ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : job.status === 'error' ? (
            <AlertCircle className="h-5 w-5 text-destructive" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          )}
          {job.type === 'detail_page'
            ? '상세페이지 생성'
            : job.type === 'motion'
            ? '모션 생성'
            : '영상 생성'}
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}

function StepItem({
  step,
  isActive,
  isLast,
}: {
  step: GenerationStep;
  isActive: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex gap-3">
      {/* Status icon */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors',
            step.status === 'completed' && 'bg-green-500 border-green-500',
            step.status === 'in_progress' && 'border-primary bg-primary/10',
            step.status === 'error' && 'bg-destructive border-destructive',
            step.status === 'pending' && 'border-muted-foreground/30 bg-background'
          )}
        >
          {step.status === 'completed' && (
            <Check className="h-3 w-3 text-white" />
          )}
          {step.status === 'in_progress' && (
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
          )}
          {step.status === 'error' && (
            <AlertCircle className="h-3 w-3 text-white" />
          )}
        </div>
        {!isLast && (
          <div
            className={cn(
              'w-0.5 flex-1 mt-1',
              step.status === 'completed' ? 'bg-green-500' : 'bg-muted'
            )}
          />
        )}
      </div>

      {/* Step content */}
      <div className="flex-1 pb-4">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              'font-medium text-sm',
              step.status === 'pending' && 'text-muted-foreground',
              step.status === 'error' && 'text-destructive'
            )}
          >
            {step.label}
          </span>
          {step.status === 'in_progress' && step.progress > 0 && (
            <span className="text-xs text-muted-foreground">
              {step.progress}%
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {step.description}
        </p>
        {step.status === 'in_progress' && step.progress > 0 && (
          <Progress value={step.progress} className="h-1 mt-2" />
        )}
        {step.error && (
          <p className="text-xs text-destructive mt-1">{step.error}</p>
        )}
      </div>
    </div>
  );
}

function ElapsedTime({
  startTime,
  endTime,
}: {
  startTime: Date;
  endTime?: Date;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (endTime) {
      setElapsed(Math.floor((endTime.getTime() - startTime.getTime()) / 1000));
      return;
    }

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, endTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <span>
      {endTime ? '완료 시간' : '경과 시간'}: {minutes > 0 && `${minutes}분 `}
      {seconds}초
    </span>
  );
}
