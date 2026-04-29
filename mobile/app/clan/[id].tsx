import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, Text, Card, Avatar, Button, Tag } from '@/components';
import { colors, radius, spacing } from '@/theme';
import { MOCK_CLANS } from '@/data/clans';

export default function ClanDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const clan = MOCK_CLANS.find((c) => c.id === id) ?? MOCK_CLANS[0];

  const ranking = [...clan.members].sort((a, b) => b.points - a.points);

  return (
    <Screen scroll>
      <LinearGradient
        colors={[`${colors.primary}33`, 'transparent']}
        style={styles.glow}
      />

      <View style={styles.header}>
        <Text variant="small" color={colors.textMuted} onPress={() => router.back()}>
          ‹ BACK
        </Text>
        <Text variant="small" color={colors.textMuted}>⋯</Text>
      </View>

      <View style={styles.hero}>
        <Text style={{ fontSize: 80 }}>{clan.emoji}</Text>
        <Text variant="display" align="center">{clan.name}</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
          <Tag label={`Code ${clan.code}`} bg={colors.surfaceElevated} color={colors.accentYellow} />
          <Tag label={`Spins ${clan.spinTime}`} bg={colors.surfaceElevated} color={colors.accentBlue} />
        </View>
      </View>

      <Button
        title="📤 Invite friends"
        variant="secondary"
        fullWidth
        onPress={() => {}}
        style={{ marginVertical: spacing.lg }}
      />

      <Text variant="heading" style={{ marginBottom: spacing.md }}>🏆 Ranking</Text>
      <Card variant="default" padding={0}>
        {ranking.map((m, i) => (
          <View key={m.id} style={[styles.row, i < ranking.length - 1 && styles.rowDivider]}>
            <Text variant="title" color={i === 0 ? colors.accentYellow : colors.textDim} style={{ width: 32 }}>
              {i + 1}
            </Text>
            <Avatar emoji={m.emoji} size={40} ring={i === 0} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text variant="heading">@{m.username}</Text>
              <Text variant="small" color={colors.textMuted}>🔥 {m.streak} day streak</Text>
            </View>
            <Text variant="heading" color={colors.accentYellow}>{m.points}</Text>
          </View>
        ))}
      </Card>

      <Text variant="heading" style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>
        ⚙️ Clan settings
      </Text>
      <Card variant="default" padding={0}>
        <Setting label="Roulette time" value={clan.spinTime} />
        <Setting label="Members limit" value={`${clan.members.length} / 20`} />
        <Setting label="Categories" value="All" />
        <Setting label="Min difficulty" value="Easy" last />
      </Card>
    </Screen>
  );
}

function Setting({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.setting, !last && styles.settingDivider]}>
      <Text variant="body">{label}</Text>
      <Text variant="body" color={colors.textMuted}>{value}</Text>
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
  hero: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.base,
  },
  settingDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
