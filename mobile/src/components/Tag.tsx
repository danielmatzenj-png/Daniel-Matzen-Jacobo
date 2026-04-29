import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { Text } from './Text';

interface TagProps {
  label: string;
  color?: string;
  bg?: string;
  style?: ViewStyle;
}

export function Tag({ label, color = colors.text, bg = colors.surfaceElevated, style }: TagProps) {
  return (
    <View style={[styles.tag, { backgroundColor: bg }, style]}>
      <Text variant="small" color={color} style={{ fontWeight: '700' }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
});
