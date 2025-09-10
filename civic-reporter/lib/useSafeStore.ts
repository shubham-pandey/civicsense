import { useAppStore } from './store';
import { useState, useEffect } from 'react';

export function useSafeReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const storeReports = useAppStore.getState().reports || [];
      setReports(storeReports);
      setIsReady(true);
    } catch (error) {
      console.error('Error accessing store:', error);
      setReports([]);
      setIsReady(true);
    }
  }, []);

  // Subscribe to store changes
  useEffect(() => {
    const unsubscribe = useAppStore.subscribe((state) => {
      setReports(state.reports || []);
    });

    return unsubscribe;
  }, []);

  return { reports, isReady };
}
