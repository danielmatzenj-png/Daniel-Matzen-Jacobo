import { View, StyleSheet, ViewProps, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from '@/theme';

interface ScreenProps extends ViewProps {
  scroll?: boolean;
  padded?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function Screen({
  scroll,
  padded = true,
  edges = ['top', 'bottom'],
  style,
  children,
  ...rest
}: ScreenProps) {
  const content = (
    <View
      style={[styles.inner, padded && { paddingHorizontal: spacing.lg }, style]}
      {...rest}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <StatusBar style="light" />
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  inner: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
});
