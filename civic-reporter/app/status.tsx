import { View, StyleSheet, Text, FlatList, ActivityIndicator } from 'react-native';
import { useMemo, useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { useAppStore } from '@/lib/store';
import Button from '@/components/ui/Button';
import { statusLabel } from '@/lib/statusLabels';
import { runSyncOnce } from '@/lib/sync';

export default function StatusScreen() {
  const reports = useAppStore(s => s.reports);
  const [loading, setLoading] = useState(true);
  const activeReports = useMemo(() => reports.filter(r => r.status !== 'resolved'), [reports]);
  
  // Load data when component mounts
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await runSyncOnce();
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);
  
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Status' }} />
      <Text style={styles.title}>Track Your Reports</Text>
      <FlatList
        data={activeReports}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={{ color: '#0F172A', fontWeight: '700' }}>{item.description || 'No description'}</Text>
            <Text style={{ color: '#475569' }}>{new Date(item.createdAt).toLocaleString()} — {statusLabel(item.status)}</Text>
            <View style={{ height: 8 }} />
            <Button title="Expand" onPress={() => router.push(`/report/${item.id}`)} />
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            {loading ? (
              <ActivityIndicator size="large" color="#6366F1" />
            ) : (
              <Text style={{ color: '#0F172A', fontSize: 16 }}>No reports yet.</Text>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  body: { color: '#0F172A' },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
});


