// ============================================================
// Home Screen — daily affirmation, mood prompt, quick tiles
// ============================================================
import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Pressable, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Card } from '../../components/ui/Card';
import { api } from '../../services/api';
import { Colors, Spacing, FontSize, FontWeight, Radius, TAB_BAR_HEIGHT } from '../../constants/theme';

const AFFIRMATIONS = [
  'أنتِ قوية وقادرة على تجاوز أي تحدٍّ.',
  'صوتكِ مهم ويستحق أن يُسمع.',
  'كل يوم هو فرصة جديدة للنمو والتألق.',
  'أنتِ لستِ وحدكِ — نجوم معكِ دائماً.',
  'شجاعتكِ تُلهم من حولكِ.',
];

const QUICK_TILES = [
  { emoji: '🆘', label: 'خطوط الطوارئ', route: '/safety/hotlines',   color: '#FFE5E5' },
  { emoji: '📓', label: 'مذكراتي',       route: '/wellness/journal',  color: '#EEE5FF' },
  { emoji: '🌸', label: 'دورتي',         route: '/wellness/cycle',    color: '#FFE8F0' },
  { emoji: '💬', label: 'المجتمع',       route: '/community',         color: '#E5F4FF' },
  { emoji: '⭐', label: 'الكشافة',       route: '/safety/scouts',     color: '#FFF5E5' },
  { emoji: '⚖️', label: 'حقوقي القانونية', route: '/safety/legal',   color: '#E5FFE5' },
];

export default function HomeScreen() {
  const { profile } = useAuthStore();
  const { colors }  = useColorScheme();
  const router      = useRouter();
  const [affirmation] = useState(() =>
    AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]!
  );

  const { data: moodData, refetch, isRefetching } = useQuery({
    queryKey: ['mood-today'],
    queryFn:  () => api.get<{ score: number }[]>('/mood-logs?days=1'),
  });

  const todayMood = moodData?.data?.[0];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: TAB_BAR_HEIGHT + 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={[styles.hello, { color: colors.textMuted }]}>مرحباً،</Text>
          <Text style={[styles.name, { color: colors.text }]}>
            {profile?.display_name ?? profile?.full_name ?? 'صديقتي'}  ✨
          </Text>
        </View>

        {/* Affirmation card */}
        <Card style={[styles.affirmCard, { backgroundColor: Colors.primary }]}>
          <Text style={styles.affirmQuote}>"</Text>
          <Text style={styles.affirmText}>{affirmation}</Text>
        </Card>

        {/* Mood check-in */}
        {!todayMood ? (
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>كيف حالكِ اليوم؟</Text>
            <View style={styles.moodRow}>
              {(['😔','😐','🙂','😊','😄'] as const).map((emoji, i) => (
                <Pressable
                  key={emoji}
                  style={({ pressed }) => [styles.moodBtn, pressed && { opacity: 0.6 }]}
                  onPress={() => {
                    api.post('/mood-logs', { score: i + 1, emoji });
                    router.push('/wellness');
                  }}
                >
                  <Text style={styles.moodEmoji}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          </Card>
        ) : (
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>سجّلتِ مزاجكِ اليوم</Text>
            <Text style={styles.moodDone}>شكراً على مشاركتك! 💕</Text>
          </Card>
        )}

        {/* Quick access tiles */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: Spacing.sm }]}>
          وصول سريع
        </Text>
        <View style={styles.tilesGrid}>
          {QUICK_TILES.map(tile => (
            <Pressable
              key={tile.route}
              style={({ pressed }) => [
                styles.tile,
                { backgroundColor: tile.color, opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={() => router.push(tile.route as any)}
            >
              <Text style={styles.tileEmoji}>{tile.emoji}</Text>
              <Text style={[styles.tileLabel, { color: Colors.text }]}>{tile.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1 },
  scroll:      { padding: Spacing.md },
  greeting:    { marginBottom: Spacing.md },
  hello:       { fontSize: FontSize.md },
  name:        { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold },
  affirmCard:  { marginBottom: Spacing.md },
  affirmQuote: { fontSize: 40, color: 'rgba(255,255,255,0.4)', lineHeight: 32, marginBottom: -8 },
  affirmText:  { fontSize: FontSize.md, color: '#FFFFFF', lineHeight: 26, fontWeight: FontWeight.medium, textAlign: 'right' },
  sectionTitle:{ fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  moodRow:     { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: Spacing.sm },
  moodBtn:     { padding: Spacing.sm },
  moodEmoji:   { fontSize: 32 },
  moodDone:    { fontSize: FontSize.md, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.sm },
  tilesGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tile: {
    width:          '47%',
    borderRadius:   Radius.md,
    padding:        Spacing.md,
    alignItems:     'center',
    gap:            Spacing.xs,
    minHeight:      96,
    justifyContent: 'center',
  },
  tileEmoji: { fontSize: 32 },
  tileLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, textAlign: 'center' },
});
