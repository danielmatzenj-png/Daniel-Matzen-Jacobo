import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, Text, Card, Button, Tag } from '@/components';
import { colors, radius, spacing } from '@/theme';
import { PASSES, SPARK_PACKS, Pass, PassType, SparkPack } from '@/data/passes';

const RARITY_COLORS: Record<Pass['rarity'], string> = {
  common: colors.textMuted,
  rare: colors.accentBlue,
  epic: colors.accentPurple,
  legendary: colors.accentYellow,
};

export default function Shop() {
  const passList = Object.values(PASSES);

  return (
    <Screen padded={false} scroll>
      <View style={styles.header}>
        <View>
          <Text variant="title">Shop</Text>
          <Text variant="caption" color={colors.textMuted}>
            Bend the rules with passes
          </Text>
        </View>
        <View style={styles.balance}>
          <Text style={{ fontSize: 18 }}>🔥</Text>
          <Text variant="heading" color={colors.accentYellow}>1,240</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="heading" style={styles.sectionTitle}>⚡ Daily deal</Text>
        <Card variant="glow" padding="lg">
          <LinearGradient
            colors={[`${colors.primary}33`, 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 56 }}>🎯</Text>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Tag label="-50% OFF" bg={colors.primary} color={colors.text} />
              <Text variant="title" style={{ marginTop: spacing.xs }}>
                Spotlight Pass
              </Text>
              <Text variant="caption" color={colors.textMuted}>
                Pick who gets dared today
              </Text>
            </View>
          </View>
          <Button
            title="Buy for 🔥 500"
            onPress={() => {}}
            fullWidth
            style={{ marginTop: spacing.base }}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <Text variant="heading" style={styles.sectionTitle}>🎟️ Passes</Text>
        <View style={styles.passes}>
          {passList.map((pass) => (
            <PassCard key={pass.type} pass={pass} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="heading" style={styles.sectionTitle}>🔥 Sparks</Text>
        <View style={styles.packs}>
          {SPARK_PACKS.map((pack) => (
            <SparkPackCard key={pack.id} pack={pack} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="heading" style={styles.sectionTitle}>🏆 Battle Pass</Text>
        <Card variant="elevated" padding="lg">
          <LinearGradient
            colors={[`${colors.accentPurple}22`, 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <Text variant="title">April Season</Text>
          <Text variant="caption" color={colors.textMuted} style={{ marginBottom: spacing.md }}>
            12 days left · Tier 4 / 30
          </Text>
          <View style={styles.progress}>
            <View style={[styles.progressFill, { width: '13%' }]} />
          </View>
          <Button
            title="Unlock Premium · $4.99"
            onPress={() => {}}
            variant="secondary"
            fullWidth
            style={{ marginTop: spacing.base }}
          />
        </Card>
      </View>
    </Screen>
  );
}

function PassCard({ pass }: { pass: Pass }) {
  return (
    <Card variant="outlined" padding="base" style={styles.passCard}>
      <Text style={{ fontSize: 36 }}>{pass.emoji}</Text>
      <Text variant="heading" style={{ marginTop: spacing.xs }}>{pass.name}</Text>
      <Text variant="small" color={colors.textMuted} style={{ marginVertical: spacing.xs }}>
        {pass.description}
      </Text>
      <View style={styles.passFooter}>
        <Tag
          label={pass.rarity}
          bg={`${RARITY_COLORS[pass.rarity]}22`}
          color={RARITY_COLORS[pass.rarity]}
        />
        <View style={styles.priceTag}>
          <Text style={{ fontSize: 14 }}>🔥</Text>
          <Text variant="heading" color={colors.accentYellow}>{pass.cost}</Text>
        </View>
      </View>
    </Card>
  );
}

function SparkPackCard({ pack }: { pack: SparkPack }) {
  return (
    <Card variant={pack.popular ? 'glow' : 'default'} padding="base" style={styles.pack}>
      {pack.popular && (
        <View style={styles.popular}>
          <Text variant="small" color={colors.text} style={{ fontWeight: '700' }}>
            POPULAR
          </Text>
        </View>
      )}
      <Text style={{ fontSize: 32 }}>🔥</Text>
      <Text variant="title" color={colors.accentYellow}>
        {pack.amount.toLocaleString()}
      </Text>
      {pack.bonus > 0 && (
        <Text variant="small" color={colors.accentGreen}>
          +{pack.bonus} bonus
        </Text>
      )}
      <Pressable style={styles.priceBtn}>
        <Text variant="heading">{pack.price}</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    paddingBottom: spacing.lg,
  },
  balance: {
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
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  passes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  passCard: {
    width: '47%',
  },
  passFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  packs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  pack: {
    width: '47%',
    alignItems: 'center',
    gap: spacing.xs,
  },
  popular: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  priceBtn: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  progress: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accentPurple,
    borderRadius: radius.full,
  },
});
