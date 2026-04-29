import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { Screen, Text, Card, Avatar, Tag } from '@/components';
import { colors, radius, spacing } from '@/theme';
import { CATEGORY_META } from '@/data/challenges';

interface FeedItem {
  id: string;
  user: { name: string; emoji: string };
  challenge: string;
  category: keyof typeof CATEGORY_META;
  reactions: number;
  votes: { yes: number; no: number };
  timeAgo: string;
}

const FEED: FeedItem[] = [
  {
    id: 'f1',
    user: { name: 'kairo', emoji: '🐯' },
    challenge: '50 push-ups',
    category: 'physical',
    reactions: 12,
    votes: { yes: 8, no: 1 },
    timeAgo: '2h',
  },
  {
    id: 'f2',
    user: { name: 'lola', emoji: '🐱' },
    challenge: 'Sing in public',
    category: 'social',
    reactions: 23,
    votes: { yes: 15, no: 0 },
    timeAgo: '1d',
  },
  {
    id: 'f3',
    user: { name: 'maxie', emoji: '🐶' },
    challenge: 'Compliment a stranger',
    category: 'social',
    reactions: 8,
    votes: { yes: 6, no: 2 },
    timeAgo: '2d',
  },
];

export default function Feed() {
  const renderItem = ({ item }: { item: FeedItem }) => {
    const cat = CATEGORY_META[item.category];
    return (
      <Card variant="default" padding={0} style={styles.post}>
        <View style={styles.postHeader}>
          <Avatar emoji={item.user.emoji} size={36} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text variant="heading">@{item.user.name}</Text>
            <Text variant="small" color={colors.textMuted}>{item.timeAgo} ago</Text>
          </View>
          <Tag label={cat.label} bg={`${cat.color}22`} color={cat.color} />
        </View>

        <View style={styles.video}>
          <Text style={{ fontSize: 64 }}>{cat.emoji}</Text>
          <Text variant="caption" color={colors.textDim} style={{ marginTop: spacing.sm }}>
            🔒 protected video
          </Text>
        </View>

        <View style={styles.postBody}>
          <Text variant="heading">{item.challenge}</Text>
          <View style={styles.actions}>
            <Pressable style={styles.action}>
              <Text style={{ fontSize: 18 }}>🔥</Text>
              <Text variant="caption">{item.reactions}</Text>
            </Pressable>
            <Pressable style={styles.action}>
              <Text style={{ fontSize: 18 }}>✅</Text>
              <Text variant="caption" color={colors.success}>{item.votes.yes}</Text>
            </Pressable>
            <Pressable style={styles.action}>
              <Text style={{ fontSize: 18 }}>❌</Text>
              <Text variant="caption" color={colors.danger}>{item.votes.no}</Text>
            </Pressable>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text variant="title">Feed</Text>
        <Text variant="caption" color={colors.textMuted}>
          Watch your clan's dares — captures blocked
        </Text>
      </View>
      <FlatList
        data={FEED}
        renderItem={renderItem}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
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
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  post: {
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
  },
  video: {
    height: 320,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBody: {
    padding: spacing.base,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
