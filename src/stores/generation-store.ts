import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type GenerationStatus =
  | 'idle'
  | 'initializing'
  | 'analyzing_brand'
  | 'generating_content'
  | 'generating_images'
  | 'finalizing'
  | 'completed'
  | 'error';

export interface GenerationStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  progress: number; // 0-100
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface GenerationJob {
  id: string;
  projectId: string;
  type: 'detail_page' | 'motion' | 'video';
  status: GenerationStatus;
  steps: GenerationStep[];
  currentStepIndex: number;
  overallProgress: number; // 0-100
  createdAt: Date;
  completedAt?: Date;
  error?: string;
  result?: {
    versionIds?: string[];
    outputUrls?: string[];
  };
}

interface GenerationState {
  // Active jobs
  jobs: Record<string, GenerationJob>;
  activeJobId: string | null;

  // Actions
  startJob: (job: Omit<GenerationJob, 'createdAt'>) => void;
  updateJob: (jobId: string, updates: Partial<GenerationJob>) => void;
  updateStep: (jobId: string, stepId: string, updates: Partial<GenerationStep>) => void;
  completeJob: (jobId: string, result?: GenerationJob['result']) => void;
  failJob: (jobId: string, error: string) => void;
  removeJob: (jobId: string) => void;
  setActiveJob: (jobId: string | null) => void;
  clearCompletedJobs: () => void;
}

// Default steps for detail page generation
export const DETAIL_PAGE_STEPS: Omit<GenerationStep, 'status' | 'progress'>[] = [
  {
    id: 'init',
    label: 'Initializing',
    description: 'Setting up generation environment',
  },
  {
    id: 'brand_analysis',
    label: 'Analyzing Brand',
    description: 'Retrieving brand context and style guidelines',
  },
  {
    id: 'content_generation',
    label: 'Generating Content',
    description: 'Creating product copy and descriptions',
  },
  {
    id: 'image_generation',
    label: 'Generating Images',
    description: 'Creating product visuals and banners',
  },
  {
    id: 'layout_assembly',
    label: 'Assembling Layout',
    description: 'Building the final page structure',
  },
  {
    id: 'finalize',
    label: 'Finalizing',
    description: 'Saving and optimizing output',
  },
];

// Default steps for motion/GIF generation
export const MOTION_STEPS: Omit<GenerationStep, 'status' | 'progress'>[] = [
  {
    id: 'init',
    label: 'Initializing',
    description: 'Preparing motion generation',
  },
  {
    id: 'image_prep',
    label: 'Preparing Images',
    description: 'Processing source images',
  },
  {
    id: 'motion_gen',
    label: 'Generating Motion',
    description: 'Creating animation frames',
  },
  {
    id: 'render',
    label: 'Rendering',
    description: 'Encoding final output',
  },
];

export const useGenerationStore = create<GenerationState>()(
  devtools(
    (set, get) => ({
      jobs: {},
      activeJobId: null,

      startJob: (job) => {
        const newJob: GenerationJob = {
          ...job,
          createdAt: new Date(),
          steps: job.steps.map((step) => ({
            ...step,
            status: 'pending' as const,
            progress: 0,
          })),
        };

        set((state) => ({
          jobs: { ...state.jobs, [job.id]: newJob },
          activeJobId: job.id,
        }));
      },

      updateJob: (jobId, updates) => {
        set((state) => {
          const job = state.jobs[jobId];
          if (!job) return state;

          return {
            jobs: {
              ...state.jobs,
              [jobId]: { ...job, ...updates },
            },
          };
        });
      },

      updateStep: (jobId, stepId, updates) => {
        set((state) => {
          const job = state.jobs[jobId];
          if (!job) return state;

          const stepIndex = job.steps.findIndex((s) => s.id === stepId);
          if (stepIndex === -1) return state;

          const newSteps = [...job.steps];
          newSteps[stepIndex] = { ...newSteps[stepIndex], ...updates };

          // Calculate overall progress
          const totalProgress = newSteps.reduce((sum, step) => sum + step.progress, 0);
          const overallProgress = Math.round(totalProgress / newSteps.length);

          return {
            jobs: {
              ...state.jobs,
              [jobId]: {
                ...job,
                steps: newSteps,
                overallProgress,
                currentStepIndex: updates.status === 'in_progress' ? stepIndex : job.currentStepIndex,
              },
            },
          };
        });
      },

      completeJob: (jobId, result) => {
        set((state) => {
          const job = state.jobs[jobId];
          if (!job) return state;

          return {
            jobs: {
              ...state.jobs,
              [jobId]: {
                ...job,
                status: 'completed',
                overallProgress: 100,
                completedAt: new Date(),
                result,
                steps: job.steps.map((step) => ({
                  ...step,
                  status: 'completed' as const,
                  progress: 100,
                })),
              },
            },
          };
        });
      },

      failJob: (jobId, error) => {
        set((state) => {
          const job = state.jobs[jobId];
          if (!job) return state;

          const currentStep = job.steps[job.currentStepIndex];

          return {
            jobs: {
              ...state.jobs,
              [jobId]: {
                ...job,
                status: 'error',
                error,
                steps: job.steps.map((step, index) => {
                  if (index === job.currentStepIndex) {
                    return { ...step, status: 'error' as const, error };
                  }
                  return step;
                }),
              },
            },
          };
        });
      },

      removeJob: (jobId) => {
        set((state) => {
          const { [jobId]: removed, ...rest } = state.jobs;
          return {
            jobs: rest,
            activeJobId: state.activeJobId === jobId ? null : state.activeJobId,
          };
        });
      },

      setActiveJob: (jobId) => {
        set({ activeJobId: jobId });
      },

      clearCompletedJobs: () => {
        set((state) => {
          const activeJobs: Record<string, GenerationJob> = {};
          for (const [id, job] of Object.entries(state.jobs)) {
            if (job.status !== 'completed' && job.status !== 'error') {
              activeJobs[id] = job;
            }
          }
          return { jobs: activeJobs };
        });
      },
    }),
    { name: 'generation-store' }
  )
);

// Selectors
export const selectActiveJob = (state: GenerationState) =>
  state.activeJobId ? state.jobs[state.activeJobId] : null;

export const selectJobById = (state: GenerationState, jobId: string) =>
  state.jobs[jobId];

export const selectActiveJobs = (state: GenerationState) =>
  Object.values(state.jobs).filter(
    (job) => job.status !== 'completed' && job.status !== 'error'
  );
