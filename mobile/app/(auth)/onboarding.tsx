import { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, FlatList, ListRenderItem } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Screen, Text, Button } from '@/components';
import { colors, spacing, typography } from '@/theme';

const { width } = Dimensions.get('window');

interface Slide {
  emoji: string;
  title: string;
  body: string;
  accent: string;
}

const SLIDES: Slide[] = [
  {
    emoji: '👥',
    title: 'Join your crew',
    body: 'Form a clan with your closest friends. Up to 20 members per clan.',
    accent: colors.accentBlue,
  },
  {
    emoji: '🎰',
    title: 'Spin daily',
    body: 'Once a day, the roulette picks one member at random for the dare.',
    accent: colors.primary,
  },
  {
    emoji: '🎬',
    title: 'Prove it',
    body: 'Record video proof in-app. Screenshots blocked. Receipts only.',
    accent: colors.accentGreen,
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  const next = () => {
    if (index < SLIDES.length - 1) {
      const nextIndex = index + 1;
      listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setIndex(nextIndex);
    } else {
      router.replace('/(auth)/login');
    }
  };

  const renderItem: ListRenderItem<Slide> = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <LinearGradient
        colors={[`${item.accent}33`, 'transparent']}
        style={styles.glow}
      />
      <Text style={styles.emoji}>{item.emoji}</Text>
      <Text variant="display" align="center" style={{ marginBottom: spacing.base }}>
        {item.title}
      </Text>
      <Text
        variant="body"
        color={colors.textMuted}
        align="center"
        style={{ paddingHorizontal: spacing.xl }}
      >
        {item.body}
      </Text>
    </View>
  );

  return (
    <Screen padded={false}>
      <View style={styles.skip}>
        <Text
          variant="caption"
          color={colors.textMuted}
          onPress={() => router.replace('/(auth)/login')}
        >
          Skip
        </Text>
      </View>
      <FlatList
        ref={listRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(s) => s.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(i);
        }}
      />
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === index && { backgroundColor: colors.primary, width: 28 },
            ]}
          />
        ))}
      </View>
      <View style={styles.cta}>
        <Button
          title={index === SLIDES.length - 1 ? "Let's go" : 'Continue'}
          onPress={next}
          size="lg"
          fullWidth
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emoji: {
    fontSize: 96,
    marginBottom: spacing.lg,
  },
  glow: {
    position: 'absolute',
    top: '20%',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.5,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  cta: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  skip: {
    position: 'absolute',
    top: spacing.base,
    right: spacing.lg,
    zIndex: 10,
  },
});
