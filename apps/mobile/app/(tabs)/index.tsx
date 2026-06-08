// ============================================================
// Feature 1 — Home Screen
// • Affirmation: fetched from content_articles (public read)
// • Mood check-in: saved to mood_logs (requires auth — graceful fallback)
// • Quick-access tiles: navigate to all major features
// ============================================================
import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Pressable, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Colors, Spacing, FontSize, FontWeight, Radius, Shadow, TAB_BAR_HEIGHT,
} from '../../constants/theme';

// ── Types ────────────────────────────────────────────────────
type MoodEmoji = '😔' | '😐' | '🙂' | '😊' | '😄';

const MOOD_EMOJIS: MoodEmoji[] = ['😔', '😐', '🙂', '😊', '😄'];
const MOOD_LABELS = ['صعب', 'عادي', 'بخير', 'سعيدة', 'رائع'];
const MOOD_SCORE: Record<MoodEmoji, number> = {
  '😔': 1, '😐': 2, '🙂': 3, '😊': 4, '😄': 5,
};

const STATIC_AFFIRMATIONS = [
  'أنتِ قوية وقادرة على تجاوز أي تحدٍّ.',
  'صوتكِ مهم ويستحق أن يُسمع.',
  'كل يوم فرصة جديدة للنمو والتألق.',
  'أنتِ لستِ وحدكِ — نجوم معكِ دائماً.',
  'شجاعتكِ تُلهم من حولكِ.',
];

// ── Quick-access tiles ────────────────────────────────────────
const TILES = [
  { icon: '📞', label: 'خطوط الطوارئ', route: '/safety/hotlines',  bg: Colors.tileRed,    accent: '#E53E3E' },
  { icon: '📓', label: 'مذكراتي',       route: '/wellness/journal', bg: Colors.tilePurple, accent: Colors.depth },
  { icon: '🌸', label: 'دورتي',         route: '/wellness/cycle',   bg: Colors.tilePink,   accent: Colors.primary },
  { icon: '💬', label: 'المجتمع',       route: '/community',        bg: Colors.tileBlue,   accent: Colors.info },
  { icon: '⭐', label: 'الكشافة',       route: '/safety/scouts',    bg: Colors.tileYellow, accent: Colors.accent },
  { icon: '⚖️', label: 'حقوقي',        route: '/safety/legal',     bg: Colors.tileGreen,  accent: Colors.success },
] as const;

// ── Mood persistence (local until auth is wired) ─────────────
const TODAY = new Date().toISOString().split('T')[0]!;
const MOOD_KEY = `njoum_mood_${TODAY}`;

async function loadTodayMood(): Promise<MoodEmoji | null> {
  // 1. Try Supabase (works when auth session exists)
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
  // 2. Fall back to local storage
  const local = await AsyncStorage.getItem(MOOD_KEY);
  return local as MoodEmoji | null;
}

async function saveMood(emoji: MoodEmoji): Promise<void> {
  // Local always
  await AsyncStorage.setItem(MOOD_KEY, emoji);
  // Supabase when authenticated
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  await supabase.from('mood_logs').upsert({
    user_id:  session.user.id,
    log_date: TODAY,
    emoji,
    score:    MOOD_SCORE[emoji],
  }, { onConflict: 'user_id,log_date' });
}

async function fetchAffirmation(): Promise<string> {
  const { data } = await supabase
    .from('content_articles')
    .select('title, body')
    .eq('module', 'wellness')
    .eq('is_published', true)
    .limit(20);

  if (data && data.length > 0) {
    const pick = data[Math.floor(Math.random() * data.length)]!;
    // Use the body first sentence as affirmation if short
    const first = pick.body?.split('.')[0]?.trim();
    if (first && first.length > 10 && first.length < 120) return first;
    return pick.title ?? STATIC_AFFIRMATIONS[0]!;
  }
  return STATIC_AFFIRMATIONS[Math.floor(Math.random() * STATIC_AFFIRMATIONS.length)]!;
}

// ── Component ─────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();

  const [affirmation, setAffirmation] = useState<string>('');
  const [todayMood, setTodayMood] = useState<MoodEmoji | null>(null);
  const [savingMood, setSavingMood] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [text, mood] = await Promise.all([fetchAffirmation(), loadTodayMood()]);
    setAffirmation(text);
    setTodayMood(mood);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleMood = async (emoji: MoodEmoji) => {
    setSavingMood(true);
    await saveMood(emoji);
    setTodayMood(emoji);
    setSavingMood(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>مرحباً بكِ ✨</Text>
            <Text style={styles.appName}>نجوم</Text>
          </View>
          <View style={styles.starBadge}>
            <Text style={styles.starIcon}>★</Text>
          </View>
        </View>

        {/* ── Affirmation card ── */}
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.affirmCard}
        >
          <Text style={styles.affirmLabel}>تأمل اليوم</Text>
          {loading ? (
            <ActivityIndicator color="#fff" style={{ marginVertical: 12 }} />
          ) : (
            <Text style={styles.affirmText}>{affirmation}</Text>
          )}
          <Text style={styles.affirmQuoteMark}>❝</Text>
        </LinearGradient>

        {/* ── Mood check-in ── */}
        <View style={styles.card}>
          {todayMood ? (
            <View style={styles.moodDoneRow}>
              <Text style={styles.moodDoneEmoji}>{todayMood}</Text>
              <View>
                <Text style={styles.moodDoneTitle}>سجّلتِ مزاجكِ اليوم</Text>
                <Text style={styles.moodDoneSub}>شكراً على مشاركتكِ 💕</Text>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.cardTitle}>كيف حالكِ اليوم؟</Text>
              <Text style={styles.cardSub}>لمستي الأولى نحو رعاية نفسكِ</Text>
              <View style={styles.moodRow}>
                {MOOD_EMOJIS.map((emoji, i) => (
                  <Pressable
                    key={emoji}
                    style={({ pressed }) => [
                      styles.moodBtn,
                      pressed && styles.moodBtnPressed,
                    ]}
                    onPress={() => handleMood(emoji)}
                    disabled={savingMood}
                  >
                    <Text style={styles.moodEmoji}>{emoji}</Text>
                    <Text style={styles.moodLabel}>{MOOD_LABELS[i]}</Text>
                  </Pressable>
                ))}
              </View>
              {savingMood && (
                <ActivityIndicator
                  color={Colors.primary}
                  style={{ marginTop: 8 }}
                />
              )}
            </>
          )}
        </View>

        {/* ── Quick-access grid ── */}
        <Text style={styles.sectionTitle}>وصول سريع</Text>
        <View style={styles.tilesGrid}>
          {TILES.map(tile => (
            <Pressable
              key={tile.route}
              style={({ pressed }) => [
                styles.tile,
                { backgroundColor: tile.bg },
                pressed && styles.tilePressed,
              ]}
              onPress={() => router.push(tile.route as any)}
              accessibilityRole="button"
            >
              <View style={[styles.tileIconWrap, { backgroundColor: tile.accent + '22' }]}>
                <Text style={styles.tileIcon}>{tile.icon}</Text>
              </View>
              <Text style={[styles.tileLabel, { color: tile.accent }]}>
                {tile.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: Spacing.md,
    paddingBottom: TAB_BAR_HEIGHT + 90,
  },

  // Header
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   Spacing.lg,
  },
  greeting: {
    fontSize:   FontSize.sm,
    color:      Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  appName: {
    fontSize:   FontSize.h2,
    fontWeight: FontWeight.extrabold,
    color:      Colors.primary,
  },
  starBadge: {
    width:           48,
    height:          48,
    borderRadius:    Radius.full,
    backgroundColor: Colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    ...Shadow.md,
  },
  starIcon: {
    fontSize: 22,
    color:    '#fff',
  },

  // Affirmation
  affirmCard: {
    borderRadius: Radius.lg,
    padding:      Spacing.lg,
    marginBottom: Spacing.md,
    minHeight:    120,
    justifyContent: 'center',
    ...Shadow.lg,
  },
  affirmLabel: {
    fontSize:   FontSize.xs,
    color:      'rgba(255,255,255,0.7)',
    fontWeight: FontWeight.semibold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    textAlign: 'right',
  },
  affirmText: {
    fontSize:   FontSize.lg,
    color:      '#FFFFFF',
    fontWeight: FontWeight.semibold,
    lineHeight: 30,
    textAlign:  'right',
  },
  affirmQuoteMark: {
    position: 'absolute',
    bottom:   Spacing.sm,
    left:     Spacing.md,
    fontSize: 48,
    color:    'rgba(255,255,255,0.15)',
  },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    marginBottom:    Spacing.md,
    ...Shadow.sm,
  },
  cardTitle: {
    fontSize:   FontSize.lg,
    fontWeight: FontWeight.bold,
    color:      Colors.text,
    textAlign:  'right',
    marginBottom: 2,
  },
  cardSub: {
    fontSize:   FontSize.sm,
    color:      Colors.textMuted,
    textAlign:  'right',
    marginBottom: Spacing.md,
  },

  // Mood done
  moodDoneRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Spacing.md,
  },
  moodDoneEmoji: {
    fontSize: 42,
  },
  moodDoneTitle: {
    fontSize:   FontSize.md,
    fontWeight: FontWeight.semibold,
    color:      Colors.text,
    textAlign:  'right',
  },
  moodDoneSub: {
    fontSize:  FontSize.sm,
    color:     Colors.textMuted,
    textAlign: 'right',
  },

  // Mood picker
  moodRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
  },
  moodBtn: {
    alignItems:   'center',
    gap:          Spacing.xs,
    padding:      Spacing.sm,
    borderRadius: Radius.md,
    flex:         1,
  },
  moodBtnPressed: {
    backgroundColor: Colors.primaryLight,
  },
  moodEmoji: {
    fontSize: 30,
  },
  moodLabel: {
    fontSize:   FontSize.xs,
    color:      Colors.textMuted,
    fontWeight: FontWeight.medium,
  },

  // Section title
  sectionTitle: {
    fontSize:    FontSize.lg,
    fontWeight:  FontWeight.bold,
    color:       Colors.text,
    textAlign:   'right',
    marginBottom: Spacing.sm,
  },

  // Tiles
  tilesGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           Spacing.sm,
  },
  tile: {
    width:          '47.5%',
    borderRadius:   Radius.lg,
    padding:        Spacing.md,
    alignItems:     'center',
    gap:            Spacing.sm,
    minHeight:      110,
    justifyContent: 'center',
    ...Shadow.sm,
  },
  tilePressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
  tileIconWrap: {
    width:        52,
    height:       52,
    borderRadius: Radius.full,
    alignItems:   'center',
    justifyContent: 'center',
  },
  tileIcon: {
    fontSize: 26,
  },
  tileLabel: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.bold,
    textAlign:  'center',
  },
});
