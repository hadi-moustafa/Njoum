// Mood check-in with 5 gradient orbs, spring scale + glow ring animation.
// Uses only React Native's built-in Animated (no Reanimated) for compatibility.
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../services/supabase';
import { strings, type Lang } from '../../constants/i18n';
import type { ThemeColors } from '../../constants/theme';

type MoodEmoji = '😔' | '😐' | '🙂' | '😊' | '😄';

const MOODS: Array<{
  emoji: MoodEmoji;
  score: number;
  gradient: [string, string];
  glow: string;
}> = [
  { emoji: '😔', score: 1, gradient: ['#536189', '#7891BF'], glow: 'rgba(83,97,137,0.55)'  },
  { emoji: '😐', score: 2, gradient: ['#7A6FA8', '#A897D8'], glow: 'rgba(122,111,168,0.55)' },
  { emoji: '🙂', score: 3, gradient: ['#C8956A', '#F5B07A'], glow: 'rgba(200,149,106,0.55)' },
  { emoji: '😊', score: 4, gradient: ['#B5586A', '#E87CA0'], glow: 'rgba(181,88,106,0.55)'  },
  { emoji: '😄', score: 5, gradient: ['#C8A040', '#EDCA60'], glow: 'rgba(200,160,64,0.6)'   },
];

const TODAY    = new Date().toISOString().split('T')[0]!;
const MOOD_KEY = `njoum_mood_${TODAY}`;

async function loadTodayMood(): Promise<MoodEmoji | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const { data } = await supabase
      .from('mood_logs')
      .select('emoji')
      .eq('user_id', session.user.id)
      .eq('log_date', TODAY)
      .maybeSingle();
    if (data?.emoji) return data.emoji as MoodEmoji;
  }
  const local = await AsyncStorage.getItem(MOOD_KEY);
  return local as MoodEmoji | null;
}

async function saveMood(emoji: MoodEmoji, score: number): Promise<void> {
  await AsyncStorage.setItem(MOOD_KEY, emoji);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  await supabase.from('mood_logs').upsert(
    { user_id: session.user.id, log_date: TODAY, emoji, score },
    { onConflict: 'user_id,log_date' },
  );
}

// ── MoodOrb sub-component ─────────────────────────────────────
interface OrbProps {
  emoji: MoodEmoji;
  label: string;
  gradient: [string, string];
  glow: string;
  isSelected: boolean;
  onPress: () => void;
  isDark: boolean;
}

const ORB_SIZE = 52;

function MoodOrb({ emoji, label, gradient, glow, isSelected, onPress, isDark }: OrbProps) {
  const scale       = useRef(new Animated.Value(1)).current;
  const glowOp      = useRef(new Animated.Value(0)).current;
  const pulseFactor = useRef(new Animated.Value(1)).current;
  const pulseAnim   = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Scale the orb on select
    Animated.spring(scale, {
      toValue: isSelected ? 1.22 : 1,
      friction: 7,
      tension: 120,
      useNativeDriver: true,
    }).start();

    // Fade glow ring in/out
    Animated.timing(glowOp, {
      toValue: isSelected ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();

    // Pulse the glow ring when selected
    if (isSelected) {
      pulseAnim.current?.stop();
      pulseAnim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseFactor, { toValue: 1.15, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseFactor, { toValue: 1,    duration: 900, useNativeDriver: true }),
        ]),
      );
      pulseAnim.current.start();
    } else {
      pulseAnim.current?.stop();
      Animated.timing(pulseFactor, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }

    return () => { pulseAnim.current?.stop(); };
  }, [isSelected]);

  return (
    <Pressable onPress={onPress} style={styles.orbWrap}>
      <View style={styles.orbContainer}>
        {/* Pulsing glow ring */}
        <Animated.View
          style={[
            styles.glowRing,
            { borderColor: glow, shadowColor: glow },
            { opacity: glowOp, transform: [{ scale: pulseFactor }] },
          ]}
        />
        {/* Orb with scale animation */}
        <Animated.View style={{ transform: [{ scale }] }}>
          <LinearGradient colors={gradient} style={styles.orb}>
            <Text style={styles.orbEmoji}>{emoji}</Text>
          </LinearGradient>
        </Animated.View>
      </View>
      <Text
        style={[
          styles.orbLabel,
          { color: isSelected ? gradient[1] : isDark ? '#9B89C4' : '#8A6070' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ── Main component ────────────────────────────────────────────
interface Props {
  lang: Lang;
  isDark: boolean;
  colors: ThemeColors;
}

export function MoodMeter({ lang, isDark, colors }: Props) {
  const [selected, setSelected] = useState<MoodEmoji | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [loading,  setLoading]  = useState(true);
  const s     = strings[lang];
  const isRTL = lang === 'ar';

  useEffect(() => {
    loadTodayMood().then(m => { setSelected(m); setLoading(false); });
  }, []);

  const handleSelect = useCallback(async (mood: typeof MOODS[0]) => {
    setSaving(true);
    setSelected(mood.emoji);
    await saveMood(mood.emoji, mood.score);
    setSaving(false);
  }, []);

  return (
    <View style={[styles.card, {
      backgroundColor: isDark ? colors.card : colors.surface,
      borderColor:     isDark ? '#2C1C48' : '#F0E4E0',
      borderWidth: 1,
      shadowColor:     isDark ? '#A480FF' : '#B5586A',
      shadowOffset: { width: 0, height: isDark ? 4 : 3 },
      shadowOpacity:   isDark ? 0.15 : 0.08,
      shadowRadius:    isDark ? 12 : 8,
      elevation:       isDark ? 5 : 3,
    }]}>
      {loading ? (
        <ActivityIndicator color={isDark ? '#A480FF' : '#B5586A'} style={{ marginVertical: 20 }} />
      ) : (
        <View>
          <Text style={[styles.title, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
            {selected ? s.moodDoneTitle : s.moodTitle}
          </Text>
          <Text style={[styles.sub, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
            {selected ? s.moodDoneSub : s.moodSub}
          </Text>
          <View style={[styles.orbRow, { flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: 14 }]}>
            {MOODS.map(m => (
              <MoodOrb
                key={m.emoji}
                emoji={m.emoji}
                label={s.moodLabels[m.score - 1] ?? ''}
                gradient={m.gradient}
                glow={m.glow}
                isSelected={m.emoji === selected}
                onPress={() => handleSelect(m)}
                isDark={isDark}
              />
            ))}
          </View>
          {saving && (
            <ActivityIndicator color={isDark ? '#A480FF' : '#B5586A'} style={{ marginTop: 10 }} />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  sub: {
    fontSize: 12,
    marginBottom: 2,
  },
  orbRow: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orbWrap: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  orbContainer: {
    width: ORB_SIZE + 14,
    height: ORB_SIZE + 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: ORB_SIZE + 14,
    height: ORB_SIZE + 14,
    borderRadius: (ORB_SIZE + 14) / 2,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbEmoji: {
    fontSize: 26,
  },
  orbLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
