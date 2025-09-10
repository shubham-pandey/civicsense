import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radii, spacing, shadows } from '@/constants/design';

export default function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
});


