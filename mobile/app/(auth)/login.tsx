import { View, StyleSheet, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, Text, Button } from '@/components';
import { colors, radius, spacing, typography } from '@/theme';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleAuth = () => {
    router.replace('/(tabs)');
  };

  return (
    <Screen scroll>
      <LinearGradient
        colors={[`${colors.primary}22`, 'transparent']}
        style={styles.glow}
        pointerEvents="none"
      />
      <View style={styles.header}>
        <Text variant="hero" style={styles.brand}>DARED</Text>
        <View style={styles.slash} />
        <Text variant="caption" color={colors.textMuted} align="center">
          Welcome back. Or first time?
        </Text>
      </View>

      <View style={{ gap: spacing.md, marginTop: spacing.xxl }}>
        <SocialButton label="Continue with Apple" emoji="" onPress={handleAuth} />
        <SocialButton label="Continue with Google" emoji="🇬" onPress={handleAuth} />
      </View>

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text variant="small" color={colors.textDim}>OR</Text>
        <View style={styles.line} />
      </View>

      <View style={{ gap: spacing.md }}>
        <TextInput
          placeholder="email@you.com"
          placeholderTextColor={colors.textDim}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <Button title="Continue with email" onPress={handleAuth} fullWidth size="lg" />
      </View>

      <Text variant="small" color={colors.textDim} align="center" style={{ marginTop: spacing.xxl }}>
        By continuing you agree to our{' '}
        <Text variant="small" color={colors.textMuted} style={{ textDecorationLine: 'underline' }}>
          Terms
        </Text>
        {' '}and{' '}
        <Text variant="small" color={colors.textMuted} style={{ textDecorationLine: 'underline' }}>
          Privacy
        </Text>
        . You must be 13+.
      </Text>
    </Screen>
  );
}

function SocialButton({ label, emoji, onPress }: { label: string; emoji: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.social, pressed && { opacity: 0.7 }]}>
      <Text style={{ fontSize: 18 }}>{emoji || ''}</Text>
      <Text variant="heading">{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: -100,
    left: -100,
    right: -100,
    height: 400,
    borderRadius: 400,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  brand: {
    color: colors.text,
  },
  slash: {
    position: 'absolute',
    top: '40%',
    left: -8,
    right: -8,
    height: 5,
    backgroundColor: colors.primary,
    transform: [{ rotate: '-8deg' }],
    opacity: 0.9,
  },
  social: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.base,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xl,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    color: colors.text,
    fontSize: 15,
    fontFamily: 'Inter',
  },
});
