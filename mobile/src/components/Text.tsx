import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { colors, typography, TypographyKey } from '@/theme';

interface TextProps extends RNTextProps {
  variant?: TypographyKey;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export function Text({
  variant = 'body',
  color = colors.text,
  align = 'left',
  style,
  children,
  ...rest
}: TextProps) {
  return (
    <RNText
      style={[typography[variant], { color, textAlign: align }, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

export const styles = StyleSheet.create({});
