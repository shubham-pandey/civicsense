import { runSyncOnce } from './sync';
import { schedulePushNotification } from './notifications';
import { log } from './log';
import EventSource from 'react-native-sse';

let eventSource: EventSource | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 3000; // 3 seconds

export function startRealtimeUpdates() {
  if (eventSource) {
    log('Realtime updates already started');
    return;
  }

  const apiBase = process.env.EXPO_PUBLIC_ADMIN_API_BASE || 'http://127.0.0.1:3000';
  const streamUrl = `${apiBase}/api/stream`;
  
  log('Starting realtime updates from:', streamUrl);
  
  eventSource = new EventSource(streamUrl);
  
  eventSource.onopen = () => {
    log('Realtime connection opened');
    reconnectAttempts = 0;
  };
  
  eventSource.onmessage = (event) => {
    log('Realtime message received:', event.data);
    try {
      const data = JSON.parse(event.data);
      if (data.ok) {
        // Heartbeat message
        return;
      }
    } catch (e) {
      log('Error parsing realtime message:', e);
    }
  };
  
  eventSource.addEventListener('report.created', async (event) => {
    log('Report created event:', event.data);
    try {
      const data = JSON.parse(event.data);
      await runSyncOnce();
      
      // Send notification
      await schedulePushNotification(
        'New Report Created',
        'Your report has been successfully submitted and is being reviewed.',
        { type: 'report_created', reportId: data.id }
      );
    } catch (e) {
      log('Error handling report.created:', e);
    }
  });
  
  eventSource.addEventListener('report.updated', async (event) => {
    log('Report updated event:', event.data);
    try {
      const data = JSON.parse(event.data);
      await runSyncOnce();
      
      // Get the updated report to show specific changes
      const { useAppStore } = await import('./store');
      const reports = useAppStore.getState().reports;
      const updatedReport = reports.find(r => r.id === data.id);
      
      if (updatedReport) {
        let notificationTitle = 'Report Updated';
        let notificationBody = 'Your report status has been updated.';
        
        // Customize notification based on status change
        if (data.status) {
          switch (data.status) {
            case 'acknowledged':
              notificationTitle = 'Report Acknowledged';
              notificationBody = 'Your report has been acknowledged and is being reviewed.';
              break;
            case 'in_progress':
              notificationTitle = 'Work In Progress';
              notificationBody = 'Work has started on your report.';
              break;
            case 'resolved':
              notificationTitle = 'Report Resolved';
              notificationBody = 'Your report has been resolved!';
              break;
            case 'rejected':
              notificationTitle = 'Report Update';
              notificationBody = 'Your report status has been updated.';
              break;
          }
        }
        
        await schedulePushNotification(
          notificationTitle,
          notificationBody,
          { type: 'report_updated', reportId: data.id, status: data.status }
        );
      }
    } catch (e) {
      log('Error handling report.updated:', e);
    }
  });
  
  eventSource.addEventListener('ping', (event) => {
    log('Ping received:', event.data);
  });
  
  eventSource.onerror = (error) => {
    log('Realtime connection error:', error);
    eventSource?.close();
    eventSource = null;
    
    // Attempt to reconnect
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);
      setTimeout(() => {
        startRealtimeUpdates();
      }, reconnectDelay * reconnectAttempts);
    } else {
      log('Max reconnection attempts reached. Stopping realtime updates.');
    }
  };
}

export function stopRealtimeUpdates() {
  if (eventSource) {
    log('Stopping realtime updates');
    eventSource.close();
    eventSource = null;
  }
}

export function isRealtimeConnected(): boolean {
  return eventSource?.readyState === EventSource.OPEN;
}
