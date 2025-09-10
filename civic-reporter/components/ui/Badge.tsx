import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '@/constants/design';

type Props = { label: string; tone?: 'default' | 'success' | 'warning' | 'danger' };

export default function Badge({ label, tone = 'default' }: Props) {
  return (
    <View style={[styles.base, styles[tone]]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  text: { color: '#fff', fontSize: 12, fontWeight: '600' },
  default: { backgroundColor: colors.info },
  success: { backgroundColor: colors.secondary },
  warning: { backgroundColor: colors.warning },
  danger: { backgroundColor: colors.danger },
});


