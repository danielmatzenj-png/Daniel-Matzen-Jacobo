import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Screen, Text, Button, Card, Avatar, Tag } from '@/components';
import { colors, radius, spacing } from '@/theme';
import { MOCK_CLANS, CURRENT_USER } from '@/data/clans';

function useCountdown(targetHour: number) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(targetHour, 0, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      const diff = target.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      );
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [targetHour]);
  return remaining;
}

export default function Today() {
  const router = useRouter();
  const clan = MOCK_CLANS[0];
  const countdown = useCountdown(20);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View>
          <Text variant="small" color={colors.textMuted}>HEY @{CURRENT_USER.username.toUpperCase()}</Text>
          <Text variant="title">Today's spin</Text>
        </View>
        <View style={styles.sparks}>
          <Text style={{ fontSize: 18 }}>🔥</Text>
          <Text variant="heading" color={colors.accentYellow}>1,240</Text>
        </View>
      </View>

      <Animated.View entering={FadeIn.delay(100)}>
        <Card variant="glow" padding="lg" style={styles.heroCard}>
          <LinearGradient
            colors={[`${colors.primary}33`, 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <Text variant="small" color={colors.primary}>NEXT ROULETTE IN</Text>
          <Text style={styles.countdown}>{countdown}</Text>
          <Text variant="caption" color={colors.textMuted}>
            Spinning at 8:00 PM in {clan.name}
          </Text>
          <Button
            title="Spin now (preview)"
            onPress={() => router.push('/roulette')}
            style={{ marginTop: spacing.lg }}
            fullWidth
            size="lg"
          />
        </Card>
      </Animated.View>

      <View style={styles.section}>
        <Text variant="heading" style={{ marginBottom: spacing.md }}>Your clan</Text>
        <Pressable onPress={() => router.push(`/clan/${clan.id}`)}>
          <Card variant="elevated">
            <View style={styles.clanRow}>
              <Text style={{ fontSize: 32 }}>{clan.emoji}</Text>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text variant="heading">{clan.name}</Text>
                <Text variant="caption" color={colors.textMuted}>
                  {clan.members.length} members · spins at {clan.spinTime}
                </Text>
              </View>
              <Text variant="display" color={colors.textDim}>›</Text>
            </View>
            <View style={styles.avatarRow}>
              {clan.members.slice(0, 5).map((m, i) => (
                <Avatar
                  key={m.id}
                  emoji={m.emoji}
                  size={36}
                  style={{ marginLeft: i === 0 ? 0 : -10 }}
                />
              ))}
            </View>
          </Card>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text variant="heading" style={{ marginBottom: spacing.md }}>Recent dares</Text>
        <Card variant="default" style={styles.recent}>
          <Avatar emoji="🐯" size={40} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text variant="caption" color={colors.textMuted}>YESTERDAY</Text>
            <Text variant="heading">@kairo did 50 push-ups 💪</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
              <Tag label="Hard" bg={colors.surfaceElevated} color={colors.accentGreen} />
              <Tag label="+50 pts" bg={colors.surfaceElevated} color={colors.accentYellow} />
            </View>
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.base,
    paddingBottom: spacing.lg,
  },
  sparks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroCard: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  countdown: {
    fontFamily: 'SpaceMono',
    fontSize: 56,
    color: colors.text,
    letterSpacing: 2,
    marginVertical: spacing.sm,
  },
  section: {
    marginTop: spacing.xl,
  },
  clanRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    marginTop: spacing.base,
  },
  recent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
