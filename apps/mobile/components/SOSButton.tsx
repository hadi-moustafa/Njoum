// ============================================================
// SOS Button — fixed above the tab bar on every screen.
//
// Full SOS flow:
//  1. Tap (or shake 3×) → 10-second grace countdown
//  2. If not cancelled → fireSOS():
//     a. Capture GPS location
//     b. POST /sos  (API sends WhatsApp message + logs event)
//     c. Start Supabase Realtime broadcast of live location (every 5 s)
//     d. Prompt user to call first emergency contact
//  3. "I'm safe" → resolve, stops broadcast
//  4. Cancel during countdown → no action taken
// ============================================================
import { useEffect, useRef, useState } from 'react';
import {
  Pressable, Text, StyleSheet, Animated,
  Alert, Vibration, View, Linking,
} from 'react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Accelerometer } from 'expo-sensors';
import { api } from '../services/api';
import { startSOSBroadcast, stopSOSBroadcast, SOSLocationPayload } from '../services/sosRealtime';
import { Colors, TAB_BAR_HEIGHT, SOS_BUTTON_SIZE, FontSize, FontWeight } from '../constants/theme';
import { SOS_GRACE_PERIOD_SECONDS } from '@njoum/shared';

const SHAKE_THRESHOLD    = 2.5;
const SHAKE_WINDOW_MS    = 1500;
const SHAKE_COUNT_NEEDED = 3;

type EmergencyContact = { name: string; phone: string };

export function SOSButton() {
  const insets = useSafeAreaInsets();

  const [state, setState]     = useState<'idle' | 'countdown' | 'active'>('idle');
  const [countdown, setCount] = useState(SOS_GRACE_PERIOD_SECONDS);
  const [sosId, setSosId]     = useState<string | null>(null);

  const intervalRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim          = useRef(new Animated.Value(1)).current;
  const shakeTimestamps    = useRef<number[]>([]);
  const lastAccel          = useRef({ x: 0, y: 0, z: 0 });
  const contactsRef        = useRef<EmergencyContact[]>([]);
  const locationGrantedRef = useRef(false);

  // ── Pre-fetch contacts + request location permission on mount ─
  useEffect(() => {
    (async () => {
      // Location permission — ask once at startup so fireSOS() is instant
      const { status } = await Location.requestForegroundPermissionsAsync();
      locationGrantedRef.current = status === 'granted';
    })();

    api.get<EmergencyContact[]>('/users/me/emergency-contacts').then((res) => {
      if (res.success && res.data) {
        contactsRef.current = res.data.filter((c: any) => c.notify_on_sos !== false);
      }
    });
  }, []);

  // ── Shake detection ──────────────────────────────────────────
  useEffect(() => {
    Accelerometer.setUpdateInterval(100);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const prev  = lastAccel.current;
      const delta = Math.sqrt((x-prev.x)**2 + (y-prev.y)**2 + (z-prev.z)**2);
      lastAccel.current = { x, y, z };

      if (delta > SHAKE_THRESHOLD) {
        const now = Date.now();
        shakeTimestamps.current = [
          ...shakeTimestamps.current.filter(t => now - t < SHAKE_WINDOW_MS),
          now,
        ];
        if (shakeTimestamps.current.length >= SHAKE_COUNT_NEEDED) {
          shakeTimestamps.current = [];
          if (state === 'idle') handleShakeTrigger();
        }
      }
    });
    return () => sub.remove();
  }, [state]);

  // ── Pulse animation ──────────────────────────────────────────
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

  // ── Helpers ──────────────────────────────────────────────────
  async function getCurrentLocation(): Promise<SOSLocationPayload | null> {
    if (!locationGrantedRef.current) return null;
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return {
        lat:       pos.coords.latitude,
        lng:       pos.coords.longitude,
        accuracy:  pos.coords.accuracy ?? 0,
        timestamp: pos.timestamp,
      };
    } catch {
      return null;
    }
  }

  function offerToCallContact() {
    const contact = contactsRef.current[0];
    if (!contact) return;
    Alert.alert(
      'اتصلي بـ ' + contact.name,
      'هل تريدين الاتصال بجهة الطوارئ الأولى؟',
      [
        { text: 'تجاهل', style: 'cancel' },
        {
          text: 'اتصلي الآن',
          onPress: () => Linking.openURL(`tel:${contact.phone}`),
        },
      ]
    );
  }

  function handleShakeTrigger() {
    Vibration.vibrate([0, 100, 50, 100]);
    Alert.alert(
      'SOS بالاهتزاز',
      'تم كشف اهتزاز — هل تريدين تفعيل نداء الاستغاثة؟',
      [
        { text: 'لا', style: 'cancel' },
        { text: 'نعم', style: 'destructive', onPress: startCountdown },
      ]
    );
  }

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

    // Grab location before the network call so it goes in the DB row
    const loc = await getCurrentLocation();

    try {
      const res = await api.post<{ sos_event_id: string }>('/sos', {
        trigger_method: method,
        lat: loc?.lat,
        lng: loc?.lng,
      });

      if (!res.success || !res.data) throw new Error('SOS failed');

      const eventId = res.data.sos_event_id;
      setSosId(eventId);

      Vibration.vibrate([0, 500, 200, 500, 200, 500]);

      // Start live location broadcast to Supabase Realtime
      startSOSBroadcast(eventId, getCurrentLocation);

      // Prompt to call the first contact
      offerToCallContact();
    } catch {
      Alert.alert('خطأ', 'تعذّر إرسال نداء الاستغاثة. يرجى المحاولة مجدداً.');
      setState('idle');
    }
  }

  async function cancelSOS() {
    clearInterval(intervalRef.current!);
    stopSOSBroadcast();

    if (state === 'countdown') {
      setState('idle');
      setCount(SOS_GRACE_PERIOD_SECONDS);
      return;
    }
    if (sosId) await api.patch(`/sos/${sosId}/cancel`, {});
    setState('idle');
    setSosId(null);
  }

  async function resolveSOS() {
    stopSOSBroadcast();
    if (sosId) await api.patch(`/sos/${sosId}/resolve`, {});
    setState('idle');
    setSosId(null);
    Alert.alert('بأمان', 'تم إخبار جهات الاتصال بأنكِ بأمان.');
  }

  function handlePress() {
    if (state === 'idle')      return startCountdown();
    if (state === 'countdown') return cancelSOS();
    Alert.alert(
      'أنتِ بأمان؟',
      '',
      [
        { text: 'نعم، أنا بأمان', onPress: resolveSOS },
        { text: 'إلغاء نداء الاستغاثة', onPress: cancelSOS, style: 'destructive' },
        { text: 'رجوع', style: 'cancel' },
      ]
    );
  }

  const bgColor = state === 'idle'      ? Colors.emergency
               : state === 'countdown' ? '#FF6B6B'
               : '#CC0000';

  const label = state === 'idle'      ? 'SOS'
              : state === 'countdown' ? `${countdown}`
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
            'نداء استغاثة نشط'
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
