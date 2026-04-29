import { Pressable, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, shadows } from '@/theme';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  style,
  fullWidth,
  icon,
}: ButtonProps) {
  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  const sizeStyle = sizeStyles[size];
  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.base,
          sizeStyle.container,
          fullWidth && styles.fullWidth,
          shadows.glow,
          { opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1 },
          style,
        ]}
      >
        <LinearGradient
          colors={['#FF2D55', '#B81E3D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.full }]}
        />
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <>
            {icon}
            <Text variant={sizeStyle.text} color={colors.text} style={styles.label}>
              {title}
            </Text>
          </>
        )}
      </Pressable>
    );
  }

  const variantStyle = variantStyles[variant];

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyle.container,
        variantStyle,
        fullWidth && styles.fullWidth,
        { opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <>
          {icon}
          <Text variant={sizeStyle.text} color={colors.text} style={styles.label}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const sizeStyles = {
  sm: { container: { paddingVertical: spacing.sm, paddingHorizontal: spacing.base }, text: 'caption' as const },
  md: { container: { paddingVertical: spacing.md + 2, paddingHorizontal: spacing.lg }, text: 'heading' as const },
  lg: { container: { paddingVertical: spacing.base + 2, paddingHorizontal: spacing.xl }, text: 'title' as const },
};

const variantStyles: Record<Exclude<Variant, 'primary'>, ViewStyle> = {
  secondary: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.danger,
  },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    textAlign: 'center',
  },
});
