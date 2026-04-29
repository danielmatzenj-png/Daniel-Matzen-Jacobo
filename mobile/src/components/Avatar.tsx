import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius } from '@/theme';
import { Text } from './Text';

interface AvatarProps {
  emoji?: string;
  initials?: string;
  size?: number;
  color?: string;
  ring?: boolean;
  style?: ViewStyle;
}

export function Avatar({
  emoji,
  initials,
  size = 48,
  color = colors.surfaceElevated,
  ring,
  style,
}: AvatarProps) {
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          borderWidth: ring ? 3 : 0,
          borderColor: ring ? colors.primary : 'transparent',
        },
        style,
      ]}
    >
      <Text style={{ fontSize: size * 0.5 }}>
        {emoji ?? initials ?? '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
