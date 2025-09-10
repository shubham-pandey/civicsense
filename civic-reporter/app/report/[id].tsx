import { View, StyleSheet, Text, ActivityIndicator, Image, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '@/lib/store';
import { getServerReport } from '@/lib/api';
import { useState, useEffect } from 'react';
import { statusLabel } from '@/lib/statusLabels';

export default function ReportDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReport = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const fullReport = await getServerReport(id);
        setReport(fullReport);
      } catch (e) {
        setError('Failed to load report details');
        console.error('Error loading report:', e);
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Report Detail' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading report details...</Text>
        </View>
      </View>
    );
  }

  if (error || !report) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Report Detail' }} />
        <Text style={styles.errorText}>{error || 'Report not found.'}</Text>
      </View>
    );
  }

  const steps: Array<{ key: 'new' | 'acknowledged' | 'in_progress' | 'resolved'; label: string }> = [
    { key: 'new', label: 'Submitted' },
    { key: 'acknowledged', label: 'Acknowledged' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
  ];

  // Convert server activity to timeline format
  const timeline = (report.activity || []).map((activity: any) => ({
    status: activity.text.includes('Status changed to') ? 
      activity.text.replace('Status changed to ', '').replace('_', '') : 
      'new',
    at: new Date(activity.ts).getTime(),
    note: activity.text
  }));

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Report Detail' }} />
      
      {/* Report Image */}
      {report.attachments && report.attachments[0] && (
        <Image 
          source={{ uri: `http://192.168.1.2:3000${report.attachments[0]}` }} 
          style={styles.reportImage}
          resizeMode="cover"
        />
      )}
      
      {/* Report Info */}
      <View style={styles.reportInfo}>
        <Text style={styles.title}>{report.description || 'No description'}</Text>
        <Text style={styles.category}>Category: {report.category}</Text>
        <Text style={styles.priority}>Priority: {report.priority}</Text>
        <Text style={styles.department}>Department: {report.department?.replace('_', ' ')}</Text>
        <Text style={styles.status}>Status: {statusLabel(report.status)}</Text>
        <Text style={styles.date}>Created: {new Date(report.createdAt).toLocaleString()}</Text>
        
        {report.location && (
          <Text style={styles.location}>
            Location: {report.location.lat.toFixed(6)}, {report.location.lng.toFixed(6)}
          </Text>
        )}
        
        {report.reporter && (
          <View style={styles.reporterInfo}>
            <Text style={styles.reporterTitle}>Reporter Information:</Text>
            <Text style={styles.reporterText}>Name: {report.reporter.name}</Text>
            {report.reporter.phone && <Text style={styles.reporterText}>Phone: {report.reporter.phone}</Text>}
            {report.reporter.email && <Text style={styles.reporterText}>Email: {report.reporter.email}</Text>}
          </View>
        )}
      </View>

      {/* Tracker */}
      <Text style={styles.subtitle}>Progress Tracker</Text>
      <View style={styles.tracker}>
        {steps.map((step, idx) => {
          const reached = timeline.some((t: any) => t.status === step.key);
          const current = report.status === step.key;
          const nextIdx = idx + 1;
          const showLine = nextIdx < steps.length;
          return (
            <View key={step.key} style={styles.stepRow}>
              <View style={styles.stepColIcon}>
                <View style={[styles.circle, reached && styles.circleDone, current && styles.circleCurrent]} />
                {showLine && <View style={[styles.line, timeline.some((t: any) => t.status === steps[nextIdx].key) && styles.lineDone]} />}
              </View>
              <View style={styles.stepColText}>
                <Text style={[styles.stepLabel, current && styles.stepLabelCurrent]}>{step.label}</Text>
                {reached && (
                  <Text style={styles.stepTime}>
                    {new Date(timeline.find((t: any) => t.status === step.key)!.at).toLocaleString()}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
      
      {/* Activity Log */}
      {timeline.length > 0 && (
        <>
          <Text style={styles.subtitle}>Activity Log</Text>
          <View style={styles.activityLog}>
            {timeline.map((activity: any, idx: number) => (
              <View key={idx} style={styles.activityItem}>
                <Text style={styles.activityText}>{activity.note}</Text>
                <Text style={styles.activityTime}>{new Date(activity.at).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </>
      )}
      
      <Text style={styles.footerText}>Updates are managed by municipal authority.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { color: '#6B7280', fontSize: 16 },
  errorText: { color: '#DC2626', fontSize: 16, textAlign: 'center' },
  reportImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 16 },
  reportInfo: { gap: 8, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  category: { color: '#6B7280', fontSize: 14 },
  priority: { color: '#6B7280', fontSize: 14 },
  department: { color: '#6B7280', fontSize: 14 },
  status: { color: '#6B7280', fontSize: 14 },
  date: { color: '#6B7280', fontSize: 14 },
  location: { color: '#6B7280', fontSize: 14 },
  reporterInfo: { marginTop: 12, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 8 },
  reporterTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 8 },
  reporterText: { color: '#475569', fontSize: 14, marginBottom: 4 },
  subtitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginTop: 16, marginBottom: 8 },
  tracker: { marginTop: 6 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepColIcon: { width: 24, alignItems: 'center' },
  stepColText: { flex: 1, paddingBottom: 14 },
  circle: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF' },
  circleDone: { borderColor: '#10B981', backgroundColor: '#10B981' },
  circleCurrent: { borderColor: '#2563EB', backgroundColor: '#2563EB' },
  line: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginTop: 2, marginBottom: 2 },
  lineDone: { backgroundColor: '#10B981' },
  stepLabel: { color: '#0F172A', fontWeight: '600' },
  stepLabelCurrent: { color: '#2563EB' },
  stepTime: { color: '#64748B', marginTop: 2 },
  activityLog: { marginTop: 8, gap: 8 },
  activityItem: { padding: 12, backgroundColor: '#F8FAFC', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#3B82F6' },
  activityText: { color: '#0F172A', fontSize: 14, fontWeight: '500' },
  activityTime: { color: '#64748B', fontSize: 12, marginTop: 4 },
  footerText: { color: '#64748B', marginTop: 16, textAlign: 'center', fontStyle: 'italic' },
});


