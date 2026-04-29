import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ScreenCapture from 'expo-screen-capture';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Text, Button } from '@/components';
import { colors, radius, spacing } from '@/theme';
import { CURRENT_USER } from '@/data/clans';

export default function Camera() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const pulse = useSharedValue(1);

  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    const sub = ScreenCapture.addScreenshotListener(() => {
      Alert.alert('Screenshots are blocked', 'Be original — record the proof.');
    });
    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (recording) {
      pulse.value = withRepeat(withTiming(1.3, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true);
      const i = setInterval(() => setElapsed((e) => e + 1), 1000);
      return () => clearInterval(i);
    }
    pulse.value = 1;
    setElapsed(0);
  }, [recording]);

  const recDot = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: recording ? 1 : 0,
  }));

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permission}>
        <Text variant="title" align="center">Camera access needed</Text>
        <Text variant="caption" color={colors.textMuted} align="center" style={{ marginVertical: spacing.lg }}>
          We use the camera so you can record dare proof. Footage stays in the app.
        </Text>
        <Button title="Grant access" onPress={requestPermission} fullWidth size="lg" />
        <Button title="Cancel" variant="ghost" onPress={() => router.back()} fullWidth />
      </View>
    );
  }

  const toggleRecord = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (recording) {
      cameraRef.current?.stopRecording();
      setRecording(false);
    } else {
      setRecording(true);
      try {
        await cameraRef.current?.recordAsync({ maxDuration: 60 });
      } catch {}
    }
  };

  const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const secs = (elapsed % 60).toString().padStart(2, '0');

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        mode="video"
      />

      <View style={styles.watermarkTL}>
        <Text variant="small" color="rgba(255,255,255,0.6)" style={styles.watermark}>
          DARED · @{CURRENT_USER.username}
        </Text>
      </View>
      <View style={styles.watermarkBR}>
        <Text variant="small" color="rgba(255,255,255,0.6)" style={styles.watermark}>
          {new Date().toLocaleString()}
        </Text>
      </View>

      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Text variant="title">×</Text>
        </Pressable>
        <View style={styles.recIndicator}>
          <Animated.View style={[styles.recDot, recDot]} />
          <Text variant="mono" color={colors.text}>
            {mins}:{secs}
          </Text>
        </View>
        <View style={styles.iconBtn}>
          <Text style={{ fontSize: 18 }}>🔒</Text>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <Pressable
          onPress={toggleRecord}
          style={[styles.recordBtn, recording && styles.recordBtnActive]}
        >
          <View style={[styles.recordInner, recording && styles.recordInnerActive]} />
        </Pressable>
        <Text variant="caption" color="rgba(255,255,255,0.6)" align="center" style={{ marginTop: spacing.md }}>
          {recording ? 'Tap to stop' : 'Tap to record · max 60s'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permission: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  recordBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBtnActive: {
    borderColor: colors.primary,
  },
  recordInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
  },
  recordInnerActive: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  watermarkTL: {
    position: 'absolute',
    top: 110,
    left: spacing.lg,
  },
  watermarkBR: {
    position: 'absolute',
    bottom: 160,
    right: spacing.lg,
  },
  watermark: {
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowRadius: 4,
  },
});
