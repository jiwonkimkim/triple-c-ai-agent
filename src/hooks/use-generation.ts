import { useCallback, useRef } from 'react';
import {
  useGenerationStore,
  DETAIL_PAGE_STEPS,
  MOTION_STEPS,
  type GenerationJob,
} from '@/stores/generation-store';

interface GenerateOptions {
  projectId: string;
  type: 'detail_page' | 'motion' | 'video';
  options: {
    productName: string;
    productDescription?: string;
    category: string;
    keyFeatures?: string[];
    targetAudience?: string;
    copyLength?: 'short' | 'medium' | 'long';
    imageQuality?: 'draft' | 'hd';
    brandProfileId?: string;
    productImages?: string[];
  };
}

interface UseGenerationReturn {
  generate: (options: GenerateOptions) => Promise<void>;
  cancel: () => void;
  isGenerating: boolean;
}

export function useGeneration(): UseGenerationReturn {
  const abortControllerRef = useRef<AbortController | null>(null);

  const { startJob, updateStep, completeJob, failJob, jobs } = useGenerationStore();

  const isGenerating = Object.values(jobs).some(
    (job) => job.status !== 'completed' && job.status !== 'error'
  );

  const generate = useCallback(
    async ({ projectId, type, options }: GenerateOptions) => {
      // Create abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Generate job ID
      const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Get steps based on type
      const steps = type === 'detail_page' ? DETAIL_PAGE_STEPS : MOTION_STEPS;

      // Start job in store
      startJob({
        id: jobId,
        projectId,
        type,
        status: 'initializing',
        steps: steps.map((s) => ({ ...s, status: 'pending', progress: 0 })),
        currentStepIndex: 0,
        overallProgress: 0,
      });

      try {
        const response = await fetch('/api/generate/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ projectId, type, options }),
          signal,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Generation failed');
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let eventType = '';
          let eventData = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7);
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6);
            } else if (line === '' && eventType && eventData) {
              // Process event
              try {
                const data = JSON.parse(eventData);
                handleSSEEvent(jobId, eventType, data);
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
              }
              eventType = '';
              eventData = '';
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          failJob(jobId, 'Generation cancelled');
        } else {
          failJob(jobId, error instanceof Error ? error.message : 'Generation failed');
        }
      }
    },
    [startJob, failJob]
  );

  const handleSSEEvent = useCallback(
    (jobId: string, eventType: string, data: any) => {
      switch (eventType) {
        case 'progress':
          updateStep(jobId, data.step, {
            status: data.status,
            progress: data.progress,
            startedAt: data.status === 'in_progress' ? new Date() : undefined,
            completedAt: data.status === 'completed' ? new Date() : undefined,
          });
          break;

        case 'complete':
          completeJob(jobId, {
            versionIds: data.versionIds,
            outputUrls: data.outputUrls,
          });
          break;

        case 'error':
          failJob(jobId, data.message);
          break;
      }
    },
    [updateStep, completeJob, failJob]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    generate,
    cancel,
    isGenerating,
  };
}
