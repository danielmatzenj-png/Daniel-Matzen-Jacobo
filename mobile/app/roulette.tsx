import { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Text, Button, Avatar } from '@/components';
import { colors, radius, spacing, typography } from '@/theme';
import { MOCK_CLANS } from '@/data/clans';
import { randomChallenge, CATEGORY_META } from '@/data/challenges';

const { width } = Dimensions.get('window');
const WHEEL_SIZE = width * 0.85;

type Phase = 'ready' | 'spinning' | 'result';

export default function Roulette() {
  const router = useRouter();
  const clan = MOCK_CLANS[0];
  const [phase, setPhase] = useState<Phase>('ready');
  const [winnerIndex, setWinnerIndex] = useState(0);
  const [challenge] = useState(() => randomChallenge());

  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const startSpin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPhase('spinning');

    const winner = Math.floor(Math.random() * clan.members.length);
    const slice = 360 / clan.members.length;
    const finalAngle = 360 * 6 + (360 - winner * slice - slice / 2);

    rotation.value = withTiming(
      finalAngle,
      { duration: 4500, easing: Easing.out(Easing.cubic) },
      () => {
        runOnJS(setWinnerIndex)(winner);
        runOnJS(setPhase)('result');
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
      }
    );

    // ticking haptics during spin
    const interval = setInterval(() => {
      Haptics.selectionAsync();
    }, 200);
    setTimeout(() => clearInterval(interval), 4400);
  };

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const winner = clan.members[winnerIndex];
  const cat = CATEGORY_META[challenge.category];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A0511', colors.bg, colors.bg]}
        style={StyleSheet.absoluteFill}
      />

      <Pressable onPress={() => router.back()} style={styles.close}>
        <Text variant="title" color={colors.textMuted}>×</Text>
      </Pressable>

      <View style={styles.top}>
        <Text variant="small" color={colors.primary}>{clan.name.toUpperCase()} · DAILY SPIN</Text>
        <Text variant="display" align="center">
          {phase === 'ready' && 'TAP TO SPIN'}
          {phase === 'spinning' && '...'}
          {phase === 'result' && 'YOU GOT'}
        </Text>
      </View>

      <View style={styles.wheelContainer}>
        <View style={styles.pointer}>
          <Text style={{ fontSize: 32 }}>▼</Text>
        </View>
        <Animated.View style={[styles.wheel, wheelStyle, phase === 'ready' && pulseStyle]}>
          {clan.members.map((m, i) => {
            const angle = (360 / clan.members.length) * i;
            const slice = 360 / clan.members.length;
            const isHighlighted = phase === 'result' && i === winnerIndex;
            return (
              <View
                key={m.id}
                style={[
                  styles.slice,
                  {
                    transform: [{ rotate: `${angle}deg` }],
                  },
                ]}
              >
                <View
                  style={[
                    styles.sliceInner,
                    {
                      backgroundColor: isHighlighted ? colors.primary : i % 2 === 0 ? colors.surface : colors.surfaceElevated,
                      borderColor: isHighlighted ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <View style={{ transform: [{ rotate: `${slice / 2}deg` }], alignItems: 'center', marginTop: 24 }}>
                    <Avatar emoji={m.emoji} size={36} />
                    <Text variant="small" style={{ marginTop: 4 }}>@{m.username}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </Animated.View>
        <View style={styles.center}>
          <Text style={{ fontSize: 24 }}>🎯</Text>
        </View>
      </View>

      <View style={styles.bottom}>
        {phase === 'ready' && (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <Button title="Spin the wheel" onPress={startSpin} size="lg" fullWidth />
          </Animated.View>
        )}

        {phase === 'spinning' && (
          <Animated.View entering={FadeIn} style={{ alignItems: 'center' }}>
            <Text variant="caption" color={colors.textMuted}>Spinning...</Text>
          </Animated.View>
        )}

        {phase === 'result' && winner && (
          <Animated.View entering={FadeIn.duration(500)} style={styles.resultCard}>
            <View style={styles.winner}>
              <Avatar emoji={winner.emoji} size={64} ring />
              <View style={{ marginLeft: spacing.md, flex: 1 }}>
                <Text variant="small" color={colors.primary}>DARED</Text>
                <Text variant="title">@{winner.username}</Text>
              </View>
            </View>

            <View style={[styles.challenge, { borderColor: cat.color }]}>
              <Text style={{ fontSize: 40 }}>{challenge.emoji}</Text>
              <Text variant="heading" align="center" style={{ marginTop: spacing.sm }}>
                {challenge.title}
              </Text>
              <Text variant="caption" color={colors.textMuted} align="center" style={{ marginTop: spacing.xs }}>
                {challenge.description}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.base }}>
              <Button
                title="Use pass 🎲"
                variant="secondary"
                onPress={() => {}}
                style={{ flex: 1 }}
              />
              <Button
                title="Accept"
                onPress={() => router.replace(`/challenge/${challenge.id}`)}
                style={{ flex: 1 }}
              />
            </View>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  close: {
    position: 'absolute',
    top: 60,
    right: spacing.lg,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  top: {
    alignItems: 'center',
    paddingTop: 100,
    gap: spacing.sm,
  },
  wheelContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointer: {
    position: 'absolute',
    top: -8,
    zIndex: 10,
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.primary,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowRadius: 24,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
  },
  slice: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  sliceInner: {
    width: '50%',
    height: '50%',
    borderWidth: 1,
  },
  center: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  bottom: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  resultCard: {
    gap: spacing.base,
  },
  winner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  challenge: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
    alignItems: 'center',
  },
});
