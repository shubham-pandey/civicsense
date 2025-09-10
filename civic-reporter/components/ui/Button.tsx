import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { log } from '@/lib/log';
import { colors, radii, spacing } from '@/constants/design';

type Props = {
  title: string;
  onPress?: () => void;
  kind?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
};

export default function Button({ title, onPress, kind = 'primary', loading, disabled, full }: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={() => {
        log('Button press', { title });
        onPress && onPress();
      }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        full && { width: '100%' },
        styles[kind],
        isDisabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.label}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: '#fff', fontWeight: '700' },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.secondary },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  disabled: { opacity: 0.6 },
  pressed: { transform: [{ scale: 0.98 }] },
});


