import { StyleSheet, View } from 'react-native';
import Button from '@/components/ui/Button';
import { router } from 'expo-router';

export default function TabTwoScreen() {
  return (
    <View style={styles.container}>
      <Button title="Go to Home" onPress={() => router.push('/')} full />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
});
