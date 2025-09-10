import { ReportStatus } from '@/lib/store';

export const statusLabel = (s: ReportStatus): string => {
  switch (s) {
    case 'submitted':
      return 'Submitted';
    case 'acknowledged':
      return 'Acknowledged';
    case 'in_progress':
      return 'In Progress';
    case 'resolved':
      return 'Resolved';
    default:
      return s;
  }
};


