// ============================================================
// SOS Button — fixed above the tab bar on every screen.
// Tap → 10-second countdown → fires SOS.
// Tap again during countdown → cancels.
// Shake phone 3× rapidly → fires SOS immediately.
// ============================================================
import { useEffect, useRef, useState } from 'react';
import {
  Pressable, Text, StyleSheet, Animated,
  Alert, Vibration, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Accelerometer } from 'expo-sensors';
import { api } from '../services/api';
import { Colors, TAB_BAR_HEIGHT, SOS_BUTTON_SIZE, FontSize, FontWeight } from '../constants/theme';
import { SOS_GRACE_PERIOD_SECONDS } from '@njoum/shared';

const SHAKE_THRESHOLD   = 2.5;  // g-force threshold
const SHAKE_WINDOW_MS   = 1500; // detect 3 shakes within this window
const SHAKE_COUNT_NEEDED = 3;

export function SOSButton() {
  const insets   = useSafeAreaInsets();
  const [state, setState]     = useState<'idle' | 'countdown' | 'active'>('idle');
  const [countdown, setCount] = useState(SOS_GRACE_PERIOD_SECONDS);
  const [sosId, setSosId]     = useState<string | null>(null);
  const intervalRef           = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim             = useRef(new Animated.Value(1)).current;

  // Shake detection state
  const shakeTimestamps = useRef<number[]>([]);
  const lastAccel       = useRef({ x: 0, y: 0, z: 0 });

  // ── Shake detection ─────────────────────────────────────
  useEffect(() => {
    Accelerometer.setUpdateInterval(100);

    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const prev = lastAccel.current;
      const delta = Math.sqrt(
        Math.pow(x - prev.x, 2) +
        Math.pow(y - prev.y, 2) +
        Math.pow(z - prev.z, 2)
      );
      lastAccel.current = { x, y, z };

      if (delta > SHAKE_THRESHOLD) {
        const now = Date.now();
        shakeTimestamps.current = [
          ...shakeTimestamps.current.filter(t => now - t < SHAKE_WINDOW_MS),
          now,
        ];

        if (shakeTimestamps.current.length >= SHAKE_COUNT_NEEDED) {
          shakeTimestamps.current = [];
          // Only trigger if currently idle
          if (state === 'idle') {
            handleShakeTrigger();
          }
        }
      }
    });

    return () => sub.remove();
  }, [state]);

  function handleShakeTrigger() {
    Vibration.vibrate([0, 100, 50, 100]);
    Alert.alert(
      '🚨 SOS بالاهتزاز',
      'تم كشف اهتزاز مفاجئ — هل تريدين تفعيل نداء الاستغاثة؟',
      [
        { text: 'لا', style: 'cancel' },
        {
          text: 'نعم، أرسلي الاستغاثة',
          style: 'destructive',
          onPress: () => {
            setState('countdown');
            setCount(SOS_GRACE_PERIOD_SECONDS);
            // Short grace countdown then fire
            let t = SOS_GRACE_PERIOD_SECONDS;
            intervalRef.current = setInterval(() => {
              t -= 1;
              setCount(t);
              if (t <= 0) {
                clearInterval(intervalRef.current!);
                fireSOS('shake');
              }
            }, 1000);
          },
        },
      ]
    );
  }

  // ── Pulse animation ──────────────────────────────────────
  useEffect(() => {
    if (state === 'countdown') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state]);

  function startCountdown() {
    setState('countdown');
    setCount(SOS_GRACE_PERIOD_SECONDS);
    Vibration.vibrate([0, 200, 100, 200]);

    intervalRef.current = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          fireSOS('button');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function fireSOS(method: 'button' | 'shake' = 'button') {
    setState('active');
    try {
      const res = await api.post<{ sos_event_id: string }>('/sos', {
        trigger_method: method,
      });
      if (res.success && res.data) {
        setSosId(res.data.sos_event_id);
        Vibration.vibrate([0, 500, 200, 500, 200, 500]);
      }
    } catch {
      Alert.alert('خطأ', 'تعذّر إرسال نداء الاستغاثة. يرجى المحاولة مجدداً.');
      setState('idle');
    }
  }

  async function cancelSOS() {
    clearInterval(intervalRef.current!);
    if (state === 'countdown') {
      setState('idle');
      setCount(SOS_GRACE_PERIOD_SECONDS);
      return;
    }
    if (sosId) {
      await api.patch(`/sos/${sosId}/cancel`, {});
    }
    setState('idle');
    setSosId(null);
  }

  async function resolveSOS() {
    if (sosId) {
      await api.patch(`/sos/${sosId}/resolve`, {});
    }
    setState('idle');
    setSosId(null);
    Alert.alert('بأمان ✓', 'تم إخبار جهات الاتصال بأنكِ بأمان.');
  }

  function handlePress() {
    if (state === 'idle')      return startCountdown();
    if (state === 'countdown') return cancelSOS();
    Alert.alert(
      'أنتِ بأمان؟',
      'اختاري ما يناسب الوضع',
      [
        { text: 'نعم، أنا بأمان', onPress: resolveSOS },
        { text: 'إلغاء نداء الاستغاثة', onPress: cancelSOS, style: 'destructive' },
        { text: 'رجوع', style: 'cancel' },
      ]
    );
  }

  const bgColor = state === 'idle'
    ? Colors.emergency
    : state === 'countdown'
    ? '#FF6B6B'
    : '#CC0000';

  const label = state === 'idle'
    ? 'SOS'
    : state === 'countdown'
    ? `${countdown}`
    : '✓ SOS';

  return (
    <View style={[styles.wrapper, { bottom: TAB_BAR_HEIGHT + insets.bottom + 12 }]}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Pressable
          style={[styles.button, { backgroundColor: bgColor }]}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={
            state === 'idle'      ? 'زر الاستغاثة الطارئة' :
            state === 'countdown' ? `إلغاء — ${countdown} ثانية` :
            'نداء استغاثة نشط — انقري للخيارات'
          }
        >
          <Text style={styles.label}>{label}</Text>
        </Pressable>
      </Animated.View>

      {state === 'countdown' && (
        <Text style={styles.hint}>انقري للإلغاء</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position:  'absolute',
    alignSelf: 'center',
    alignItems:'center',
    zIndex:    100,
  },
  button: {
    width:          SOS_BUTTON_SIZE,
    height:         SOS_BUTTON_SIZE,
    borderRadius:   SOS_BUTTON_SIZE / 2,
    alignItems:     'center',
    justifyContent: 'center',
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 4 },
    shadowOpacity:  0.3,
    shadowRadius:   8,
    elevation:      8,
    borderWidth:    3,
    borderColor:    'rgba(255,255,255,0.4)',
  },
  label: {
    color:         '#FFFFFF',
    fontSize:      FontSize.sm,
    fontWeight:    FontWeight.extrabold,
    letterSpacing: 0.5,
  },
  hint: {
    marginTop:  4,
    fontSize:   FontSize.xs,
    color:      Colors.emergency,
    fontWeight: FontWeight.medium,
  },
});
