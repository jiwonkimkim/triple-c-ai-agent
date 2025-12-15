'use client';

import { create } from 'zustand';

export interface VersionSnapshot {
  id: string;
  versionNumber: number;
  createdAt: Date;
  createdBy: string;
  action: 'CREATE' | 'UPDATE' | 'GENERATE' | 'RESTORE' | 'AUTO_SAVE';
  description: string;
  thumbnail?: string;
  content: {
    sections: any[];
    metadata?: Record<string, any>;
  };
  changes?: {
    added: number;
    modified: number;
    deleted: number;
  };
}

export interface HistoryEntry {
  id: string;
  action: string;
  timestamp: Date;
  userId: string;
  userName: string;
  details: Record<string, any>;
  snapshotId?: string;
}

interface HistoryState {
  versions: VersionSnapshot[];
  history: HistoryEntry[];
  selectedVersion: VersionSnapshot | null;
  compareVersions: [VersionSnapshot | null, VersionSnapshot | null];
  isLoading: boolean;
  error: string | null;

  // Actions
  setVersions: (versions: VersionSnapshot[]) => void;
  setHistory: (history: HistoryEntry[]) => void;
  selectVersion: (version: VersionSnapshot | null) => void;
  setCompareVersions: (versions: [VersionSnapshot | null, VersionSnapshot | null]) => void;
  addVersion: (version: VersionSnapshot) => void;
  addHistoryEntry: (entry: HistoryEntry) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  versions: [],
  history: [],
  selectedVersion: null,
  compareVersions: [null, null] as [VersionSnapshot | null, VersionSnapshot | null],
  isLoading: false,
  error: null,
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  ...initialState,

  setVersions: (versions) => set({ versions }),

  setHistory: (history) => set({ history }),

  selectVersion: (version) => set({ selectedVersion: version }),

  setCompareVersions: (versions) => set({ compareVersions: versions }),

  addVersion: (version) =>
    set((state) => ({
      versions: [version, ...state.versions],
    })),

  addHistoryEntry: (entry) =>
    set((state) => ({
      history: [entry, ...state.history],
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));

// Helper functions
export function formatVersionDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    CREATE: '생성',
    UPDATE: '수정',
    GENERATE: 'AI 생성',
    RESTORE: '복원',
    AUTO_SAVE: '자동 저장',
    GENERATE_IMAGE: '이미지 생성',
    GENERATE_MOTION: '모션 생성',
    EXPORT: '내보내기',
  };
  return labels[action] || action;
}

export function getActionColor(action: string): string {
  const colors: Record<string, string> = {
    CREATE: 'bg-green-500',
    UPDATE: 'bg-blue-500',
    GENERATE: 'bg-purple-500',
    RESTORE: 'bg-orange-500',
    AUTO_SAVE: 'bg-gray-500',
    GENERATE_IMAGE: 'bg-pink-500',
    GENERATE_MOTION: 'bg-indigo-500',
    EXPORT: 'bg-teal-500',
  };
  return colors[action] || 'bg-gray-500';
}
