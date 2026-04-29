import { View, StyleSheet, Pressable, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Button, Card, Avatar } from '@/components';
import { colors, radius, spacing } from '@/theme';
import { MOCK_CLANS, Clan } from '@/data/clans';

export default function Clans() {
  const router = useRouter();

  const renderClan = ({ item }: { item: Clan }) => (
    <Pressable onPress={() => router.push(`/clan/${item.id}`)}>
      <Card variant="elevated" style={styles.clanCard}>
        <Text style={{ fontSize: 32 }}>{item.emoji}</Text>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text variant="heading">{item.name}</Text>
          <Text variant="caption" color={colors.textMuted}>
            {item.members.length} members · code {item.code}
          </Text>
          <View style={styles.avatars}>
            {item.members.slice(0, 4).map((m, i) => (
              <Avatar key={m.id} emoji={m.emoji} size={24} style={{ marginLeft: i === 0 ? 0 : -6 }} />
            ))}
          </View>
        </View>
        <Text variant="display" color={colors.textDim}>›</Text>
      </Card>
    </Pressable>
  );

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text variant="title">Your clans</Text>
        <Text variant="caption" color={colors.textMuted}>
          {MOCK_CLANS.length} active
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="+ Create"
          variant="primary"
          size="md"
          onPress={() => {}}
          style={{ flex: 1 }}
        />
        <Button
          title="Join with code"
          variant="secondary"
          size="md"
          onPress={() => {}}
          style={{ flex: 1 }}
        />
      </View>

      <FlatList
        data={MOCK_CLANS}
        renderItem={renderClan}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    paddingBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  clanCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatars: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
});
