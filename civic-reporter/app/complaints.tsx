import { View, StyleSheet, Text, FlatList, Image, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeReports } from '@/lib/useSafeStore';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { statusLabel } from '@/lib/statusLabels';
import { runSyncOnce } from '@/lib/sync';
import { useState, useEffect } from 'react';
import { isRealtimeConnected } from '@/lib/realtime';

export default function ComplaintsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState(false);
  
  const { reports, isReady } = useSafeReports();
  
  console.log('Complaints screen - reports:', reports.length, reports, 'isReady:', isReady);
  
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
    
    // Check real-time connection status
    const checkRealtimeStatus = () => {
      setRealtimeStatus(isRealtimeConnected());
    };
    
    checkRealtimeStatus();
    const interval = setInterval(checkRealtimeStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await runSyncOnce();
    } finally {
      setRefreshing(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Complaints' }} />
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>My Complaints</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: realtimeStatus ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.statusText}>
              {realtimeStatus ? 'Live Updates' : 'Offline'}
            </Text>
          </View>
        </View>
        <Button 
          title={refreshing ? "Refreshing..." : "Refresh"} 
          onPress={handleRefresh}
          disabled={refreshing}
        />
      </View>
      <FlatList
        data={reports}
        keyExtractor={(item, index) => item.id ? String(item.id) : `temp-${index}-${Date.now()}`}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {item.imageUrl ? (
                <Image 
                  source={{ uri: item.imageUrl }} 
                  style={{ width: 64, height: 64, borderRadius: 8 }} 
                  resizeMode="cover"
                  onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                />
              ) : (
                <View style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#9CA3AF', fontSize: 12 }}>No Image</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: '#0F172A' }}>{item.description || 'No description'}</Text>
                <View style={{ height: 6 }} />
                <Badge label={statusLabel(item.status)} tone={item.status === 'resolved' ? 'success' : item.status === 'in_progress' ? 'warning' : 'default'} />
                {item.location && item.location.lat && item.location.lng && (
                  <Text style={{ color: '#475569', marginTop: 6 }}>Lat {item.location.lat.toFixed(4)}, Lng {item.location.lng.toFixed(4)}</Text>
                )}
                <Text style={{ color: '#64748B', marginTop: 4 }}>{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
            </View>
            <View style={{ height: 8 }} />
            <Button 
              title="Expand" 
              onPress={() => {
                if (item.id) {
                  router.push(`/report/${item.id}`);
                } else {
                  console.log('Cannot expand report without ID');
                }
              }} 
              disabled={!item.id}
            />
          </Card>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            {loading || refreshing || !isReady ? (
              <ActivityIndicator size="large" color="#6366F1" />
            ) : (
              <Text style={{ color: '#0F172A', fontSize: 16 }}>No complaints yet.</Text>
            )}
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titleContainer: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  statusContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  body: { color: '#0F172A' },
});


