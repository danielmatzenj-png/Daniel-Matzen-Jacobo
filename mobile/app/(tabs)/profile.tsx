import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, Text, Card, Avatar, Button } from '@/components';
import { colors, radius, spacing } from '@/theme';
import { CURRENT_USER } from '@/data/clans';
import { PASSES } from '@/data/passes';

export default function Profile() {
  const inventory = [
    { type: 'skip' as const, count: 2 },
    { type: 'reroll' as const, count: 1 },
    { type: 'shield' as const, count: 0 },
  ];

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <LinearGradient
          colors={[`${colors.primary}33`, 'transparent']}
          style={StyleSheet.absoluteFill}
        />
        <Avatar emoji={CURRENT_USER.emoji} size={96} ring />
        <Text variant="title" style={{ marginTop: spacing.md }}>
          @{CURRENT_USER.username}
        </Text>
        <Text variant="caption" color={colors.textMuted}>Level 4 · Daredevil</Text>
      </View>

      <View style={styles.stats}>
        <Stat value="245" label="Points" />
        <View style={styles.divider} />
        <Stat value="🔥 5" label="Streak" />
        <View style={styles.divider} />
        <Stat value="12" label="Dares" />
      </View>

      <Section title="My passes">
        <View style={styles.passes}>
          {inventory.map((item) => {
            const pass = PASSES[item.type];
            return (
              <Card key={item.type} variant="default" style={styles.passItem}>
                <Text style={{ fontSize: 28 }}>{pass.emoji}</Text>
                <Text variant="caption" style={{ marginTop: spacing.xs, textAlign: 'center' }}>
                  {pass.name}
                </Text>
                <Text variant="heading" color={item.count > 0 ? colors.accentYellow : colors.textDim}>
                  ×{item.count}
                </Text>
              </Card>
            );
          })}
        </View>
      </Section>

      <Section title="Achievements">
        <View style={styles.badges}>
          <Badge emoji="🔥" label="Hot streak" unlocked />
          <Badge emoji="🥇" label="First dare" unlocked />
          <Badge emoji="💀" label="Extreme" unlocked={false} />
          <Badge emoji="👑" label="Clan leader" unlocked={false} />
        </View>
      </Section>

      <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
        <Button title="Edit profile" variant="secondary" fullWidth onPress={() => {}} />
        <Button title="Settings" variant="ghost" fullWidth onPress={() => {}} />
      </View>
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="title">{value}</Text>
      <Text variant="small" color={colors.textMuted}>{label.toUpperCase()}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: spacing.xl }}>
      <Text variant="heading" style={{ marginBottom: spacing.md }}>{title}</Text>
      {children}
    </View>
  );
}

function Badge({ emoji, label, unlocked }: { emoji: string; label: string; unlocked: boolean }) {
  return (
    <View style={[styles.badge, !unlocked && { opacity: 0.3 }]}>
      <Text style={{ fontSize: 32 }}>{emoji}</Text>
      <Text variant="small" align="center" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  passes: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  passItem: {
    flex: 1,
    alignItems: 'center',
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  badge: {
    width: 72,
    alignItems: 'center',
  },
});
