import { View, ViewProps, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'glow';
  padding?: keyof typeof spacing | number;
}

export function Card({ variant = 'default', padding = 'base', style, children, ...rest }: CardProps) {
  const padValue = typeof padding === 'number' ? padding : spacing[padding];
  return (
    <View style={[styles.base, variants[variant], { padding: padValue }, style]} {...rest}>
      {children}
    </View>
  );
}

const variants: Record<NonNullable<CardProps['variant']>, ViewStyle> = {
  default: {
    backgroundColor: colors.surface,
  },
  elevated: {
    backgroundColor: colors.surfaceElevated,
  },
  outlined: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  glow: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
  },
});
