import { listServerReports } from '@/lib/api';
import { log } from '@/lib/log';

let syncing = false;

export async function runSyncOnce() {
  if (syncing) return;
  syncing = true;
  try {
    // Fetch all reports from server
    const serverReports = await listServerReports();
    log('Fetched server reports:', serverReports.length);
    
    // Convert server reports to the format expected by the UI
    const formattedReports = serverReports.map(report => ({
      id: report.id,
      imageUrl: report.imageUrl || undefined,
      description: report.description || undefined,
      category: report.category || undefined,
      priority: report.priority as any || undefined,
      location: report.location && report.location.lat && report.location.lng ? {
        lat: report.location.lat,
        lng: report.location.lng,
        address: report.location.address || undefined
      } : undefined,
      status: report.status as any,
      createdAt: typeof report.createdAt === 'string' ? new Date(report.createdAt).getTime() : report.createdAt,
      timeline: undefined, // Will be populated from detail endpoint if needed
    }));
    
    // Update store with server data
    const { useAppStore } = await import('@/lib/store');
    useAppStore.getState().setReports(formattedReports);
    useAppStore.getState().setLastSyncedAt(Date.now());
    
    log('Updated local store with server reports:', formattedReports.length);
  } catch (e) {
    log('Server fetch failed', e);
  } finally {
    syncing = false;
  }
}

let intervalHandle: any;
export function startPeriodicSync(intervalMs = 30000) {
  if (intervalHandle) return;
  // Kick an immediate sync, then periodic
  runSyncOnce();
  intervalHandle = setInterval(runSyncOnce, intervalMs);
}

export function stopPeriodicSync() {
  if (intervalHandle) clearInterval(intervalHandle);
  intervalHandle = undefined;
}


