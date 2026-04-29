import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography } from '@/theme';
import { Text } from '@/components';

export default function Splash() {
  const router = useRouter();
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    const t = setTimeout(() => router.replace('/(auth)/onboarding'), 1800);
    return () => clearTimeout(t);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A0511', '#0A0A0F']}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View entering={FadeIn.duration(600)} style={[styles.logoWrap, pulseStyle]}>
        <Text style={[typography.hero, { color: colors.text }]}>DARED</Text>
        <View style={styles.slash} />
      </Animated.View>
      <Animated.View entering={FadeIn.delay(400).duration(600)}>
        <Text variant="caption" color={colors.textMuted} align="center">
          spin. dare. prove.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  slash: {
    position: 'absolute',
    top: '50%',
    left: -8,
    right: -8,
    height: 6,
    backgroundColor: colors.primary,
    transform: [{ rotate: '-8deg' }],
    opacity: 0.95,
    shadowColor: colors.primary,
    shadowRadius: 12,
    shadowOpacity: 0.9,
    shadowOffset: { width: 0, height: 0 },
  },
});
