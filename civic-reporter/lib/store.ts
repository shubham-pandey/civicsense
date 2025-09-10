import { create } from 'zustand';
import type { ServerReport } from '@/lib/api';

export type ReportStatus = 'submitted' | 'acknowledged' | 'in_progress' | 'resolved';

// Server-only reports - no local storage
export interface ServerOnlyReport {
  id: string | number;
  imageUri?: string;
  description?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  location?: { lat: number; lng: number; address?: string };
  status: ReportStatus;
  createdAt: number | string;
  timeline?: Array<{ status: ReportStatus; at: number; note?: string }>;
}

interface AppState {
  reports: ServerOnlyReport[];
  setReports: (reports: ServerOnlyReport[]) => void;
  // sync state
  lastSyncedAt?: number;
  setLastSyncedAt: (timestamp: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  reports: [],
  lastSyncedAt: undefined,
  setReports: (reports) => {
    set({ reports });
  },
  setLastSyncedAt: (timestamp) => {
    set({ lastSyncedAt: timestamp });
  },
}));


