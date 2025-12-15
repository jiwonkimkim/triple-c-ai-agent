'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GenerationProgress } from './generation-progress';
import {
  useGenerationStore,
  selectActiveJob,
  type GenerationJob,
} from '@/stores/generation-store';

interface GenerationModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  jobId?: string;
  projectId?: string;
  onComplete?: (result: GenerationJob['result']) => void;
}

export function GenerationModal({
  open,
  onOpenChange,
  jobId,
  projectId,
  onComplete,
}: GenerationModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const job = useGenerationStore((state) =>
    jobId ? state.jobs[jobId] : selectActiveJob(state)
  );
  const removeJob = useGenerationStore((state) => state.removeJob);

  // Control open state
  const modalOpen = open !== undefined ? open : isOpen;
  const setModalOpen = onOpenChange || setIsOpen;

  useEffect(() => {
    if (job && !completed && !error) {
      setModalOpen(true);
    }
  }, [job, completed, error, setModalOpen]);

  const handleComplete = (result: GenerationJob['result']) => {
    setCompleted(true);
    onComplete?.(result);
  };

  const handleError = (errorMsg: string) => {
    setError(errorMsg);
  };

  const handleClose = () => {
    setModalOpen(false);
    if (job && (job.status === 'completed' || job.status === 'error')) {
      removeJob(job.id);
    }
    setCompleted(false);
    setError(null);
  };

  const handleViewResult = () => {
    if (projectId) {
      router.push(`/dashboard/projects/${projectId}`);
    }
    handleClose();
  };

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogContent
        className="sm:max-w-lg"
        onInteractOutside={(e) => {
          // Prevent closing while in progress
          if (job && job.status !== 'completed' && job.status !== 'error') {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Generation
          </DialogTitle>
          <DialogDescription>
            {job?.status === 'completed'
              ? 'Your content has been generated successfully!'
              : job?.status === 'error'
              ? 'Generation encountered an error.'
              : 'Please wait while we generate your content.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <GenerationProgress
            jobId={jobId}
            onComplete={handleComplete}
            onError={handleError}
            showCard={false}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {job?.status === 'completed' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={handleViewResult}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Result
              </Button>
            </>
          )}
          {job?.status === 'error' && (
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          )}
          {job && job.status !== 'completed' && job.status !== 'error' && (
            <p className="text-xs text-muted-foreground">
              This may take a few minutes. Please don't close this window.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
