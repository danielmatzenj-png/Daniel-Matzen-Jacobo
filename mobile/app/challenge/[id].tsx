import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, Text, Card, Button, Tag } from '@/components';
import { colors, radius, spacing } from '@/theme';
import { CHALLENGES, CATEGORY_META, DIFFICULTY_META } from '@/data/challenges';

export default function ChallengeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const challenge = CHALLENGES.find((c) => c.id === id) ?? CHALLENGES[0];
  const cat = CATEGORY_META[challenge.category];
  const diff = DIFFICULTY_META[challenge.difficulty];

  const [remaining, setRemaining] = useState(7200);

  useEffect(() => {
    const i = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(i);
  }, []);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  return (
    <Screen scroll>
      <LinearGradient
        colors={[`${cat.color}33`, 'transparent']}
        style={styles.glow}
      />

      <View style={styles.header}>
        <Text variant="small" color={colors.textMuted} onPress={() => router.back()}>
          ‹ BACK
        </Text>
        <View style={styles.timer}>
          <Text variant="small" color={colors.primary}>TIME LEFT</Text>
          <Text style={styles.countdown}>
            {h.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}
          </Text>
        </View>
      </View>

      <Card variant="glow" padding="lg" style={{ marginTop: spacing.lg }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
          <Tag label={cat.label} bg={`${cat.color}33`} color={cat.color} />
          <Tag label={diff.label} bg={colors.surfaceElevated} color={colors.accentYellow} />
          <Tag label={`+${diff.points} pts`} bg={colors.surfaceElevated} color={colors.accentGreen} />
        </View>
        <Text style={styles.emoji}>{challenge.emoji}</Text>
        <Text variant="display" align="center" style={{ marginTop: spacing.md }}>
          {challenge.title}
        </Text>
        <Text variant="body" color={colors.textMuted} align="center" style={{ marginTop: spacing.md }}>
          {challenge.description}
        </Text>
      </Card>

      <View style={styles.rules}>
        <Text variant="heading" style={{ marginBottom: spacing.md }}>Rules</Text>
        <Rule emoji="🎬" text="Record proof using the in-app camera only" />
        <Rule emoji="🔒" text="Screenshots and recording are blocked" />
        <Rule emoji="⏱️" text="You have 2h to submit from when the dare drops" />
        <Rule emoji="🗳️" text="Your clan votes if you actually did it" />
      </View>

      <View style={{ gap: spacing.sm, marginTop: spacing.xl }}>
        <Button
          title="🎬 Record proof"
          onPress={() => router.push('/camera')}
          fullWidth
          size="lg"
        />
        <Button
          title="Use Skip Pass (×2)"
          variant="secondary"
          fullWidth
          onPress={() => {}}
        />
      </View>
    </Screen>
  );
}

function Rule({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.rule}>
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
      <Text variant="caption" color={colors.textMuted} style={{ flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: -50,
    left: -100,
    right: -100,
    height: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.base,
  },
  timer: {
    alignItems: 'flex-end',
  },
  countdown: {
    fontFamily: 'SpaceMono',
    fontSize: 18,
    color: colors.text,
    letterSpacing: 1,
  },
  emoji: {
    fontSize: 96,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  rules: {
    marginTop: spacing.xl,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
});
