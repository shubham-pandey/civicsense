import { View, StyleSheet, Text } from 'react-native';
import { Stack } from 'expo-router';

export default function AdvisoriesScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Advisories' }} />
      <Text style={styles.title}>Advisories</Text>
      <Text style={styles.body}>Public notices and updates will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  body: { color: '#0F172A' },
});


