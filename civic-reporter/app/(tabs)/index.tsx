import { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { spacing, typography, colors, radii, shadows } from '@/constants/design';
import { log } from '@/lib/log';

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.appTitle}>Civic Sense</Text>

      <LinearGradient
        colors={["#6366F1", "#8B5CF6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroTitle}>Welcome to Civic Sense</Text>
        <Text style={styles.heroSubtitle}>Help improve your community</Text>
        <Text style={styles.heroBody}>
          Report civic issues like potholes, broken streetlights, or sanitation problems to help your municipality respond quickly.
        </Text>
      </LinearGradient>

      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.gridRow}>
        <QuickAction title="Report Issue" icon="plus-square" tint="#10B981" onPress={() => { log('QuickAction press', { action: 'report' }); router.push('/report'); }} />
        <QuickAction title="View Map" icon="map" tint="#60A5FA" onPress={() => { log('QuickAction press', { action: 'map' }); router.push('/map'); }} />
      </View>
      <View style={styles.gridRow}>
        <QuickAction title="Advisories" icon="bullhorn" tint="#A78BFA" onPress={() => { log('QuickAction press', { action: 'advisories' }); router.push('/advisories'); }} />
        <QuickAction title="Complaints" icon="exclamation-triangle" tint="#FCA5A5" onPress={() => { log('QuickAction press', { action: 'complaints' }); router.push('/complaints'); }} />
      </View>
      <View style={styles.gridRow}>
  {/* Notifications tab removed. File deleted. */}
        <QuickAction title="Settings" icon="cog" tint="#6B7280" onPress={() => { log('QuickAction press', { action: 'settings' }); }} />
      </View>

      <View style={styles.trackCard}>
        <Text style={styles.trackTitle}>Track Your Reports</Text>
        <Text style={styles.trackSubtitle}>Check the status of your submitted complaints</Text>
        <Pressable style={styles.trackButton} onPress={() => { log('Track Status press'); router.push('/status'); }}>
          <Text style={styles.trackButtonText}>Check Status</Text>
        </Pressable>
      </View>
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  appTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  hero: {
    borderRadius: radii.lg,
    padding: 20,
    ...shadows.card,
  },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '800', marginBottom: 6 },
  heroSubtitle: { color: '#E9D5FF', fontSize: 16, fontWeight: '600', marginBottom: 10 },
  heroBody: { color: '#F3E8FF', fontSize: 14, lineHeight: 20 },
  sectionTitle: { fontSize: 22, fontWeight: '700', marginTop: 8, color: '#0F172A' },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quick: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  quickIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  trackCard: {
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...shadows.card,
  },
  trackTitle: { fontSize: 20, fontWeight: '700' },
  trackSubtitle: { color: '#6B7280', marginTop: 4 },
  trackButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  trackButtonText: { fontSize: 16, color: '#0F172A' },
});

function QuickAction({ title, icon, tint, onPress }: { title: string; icon: React.ComponentProps<typeof FontAwesome>['name']; tint: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.quick} onPress={onPress}>
      <View style={[styles.quickIconWrap, { backgroundColor: `${tint}22` }]}>
        <FontAwesome name={icon} size={24} color={tint} />
      </View>
      <Text style={styles.quickTitle}>{title}</Text>
    </Pressable>
  );
}
