// ============================================================
// Mood Log — daily check-in + 7-day history
// ============================================================
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { api } from '../../../services/api';
import { Colors, Spacing, FontSize, FontWeight, TAB_BAR_HEIGHT } from '../../../constants/theme';

interface MoodLog { id: string; score: number; emoji: string; note?: string; logged_at: string }

const MOODS: { score: number; emoji: string; label: string }[] = [
  { score: 1, emoji: '😔', label: 'حزينة'    },
  { score: 2, emoji: '😐', label: 'عادي'     },
  { score: 3, emoji: '🙂', label: 'بخير'     },
  { score: 4, emoji: '😊', label: 'سعيدة'   },
  { score: 5, emoji: '😄', label: 'رائعة!'   },
];

function scoreColor(score: number): string {
  if (score <= 1) return '#E53E3E';
  if (score <= 2) return '#D69E2E';
  if (score <= 3) return Colors.accent;
  if (score <= 4) return Colors.primary;
  return Colors.success;
}

export default function MoodScreen() {
  const { colors } = useColorScheme();
  const qc         = useQueryClient();
  const [selected, setSelected] = useState<number | null>(null);

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['mood-logs'],
    queryFn:  () => api.get<MoodLog[]>('/mood-logs'),
  });

  const { data: streakData } = useQuery({
    queryKey: ['mood-streak'],
    queryFn:  () => api.get<{ streak: number }>('/mood-logs/streak'),
  });

  const logs   = logsData?.data  ?? [];
  const streak = streakData?.data?.streak ?? 0;

  const todayLog = logs.find(l => {
    const d = new Date(l.logged_at);
    const t = new Date();
    return d.toDateString() === t.toDateString();
  });

  const mutation = useMutation({
    mutationFn: (score: number) => {
      const mood = MOODS.find(m => m.score === score)!;
      return api.post('/mood-logs', { score, emoji: mood.emoji });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mood-logs'] });
      qc.invalidateQueries({ queryKey: ['mood-streak'] });
      setSelected(null);
    },
    onError: () => Alert.alert('خطأ', 'تعذّر حفظ المزاج.'),
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader title="مزاجي اليومي" showBack />
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + 80 }}>

        {/* Streak */}
        {streak > 0 && (
          <Card style={{ backgroundColor: Colors.primary, marginBottom: Spacing.md }}>
            <Text style={styles.streakLabel}>🔥 سلسلة {streak} يوم متواصل</Text>
          </Card>
        )}

        {/* Today's check-in */}
        <Card style={{ marginBottom: Spacing.lg }}>
          {todayLog ? (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 48 }}>{todayLog.emoji}</Text>
              <Text style={[styles.doneLabel, { color: Colors.success }]}>سجّلتِ مزاجك اليوم ✓</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.question, { color: colors.text }]}>كيف حالكِ اليوم؟</Text>
              <View style={styles.moodRow}>
                {MOODS.map(m => (
                  <Pressable
                    key={m.score}
                    style={[
                      styles.moodBtn,
                      selected === m.score && { backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
                      { borderColor: colors.border },
                    ]}
                    onPress={() => setSelected(m.score)}
                  >
                    <Text style={{ fontSize: 28 }}>{m.emoji}</Text>
                    <Text style={[styles.moodLabel, { color: colors.textMuted }]}>{m.label}</Text>
                  </Pressable>
                ))}
              </View>
              <Button
                label="احفظي"
                onPress={() => selected && mutation.mutate(selected)}
                loading={mutation.isPending}
                style={{ marginTop: Spacing.sm }}
              />
            </>
          )}
        </Card>

        {/* History */}
        <Text style={[styles.section, { color: colors.text }]}>السجل الأخير</Text>
        {isLoading && <Text style={{ color: colors.textMuted, textAlign: 'center' }}>جارٍ التحميل…</Text>}
        {logs.slice(0, 14).map(log => {
          const date = new Date(log.logged_at);
          return (
            <Card key={log.id} style={styles.histCard}>
              <View style={[styles.scoreDot, { backgroundColor: scoreColor(log.score) }]}>
                <Text style={{ fontSize: 18 }}>{log.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.histDate, { color: colors.textMuted }]}>
                  {date.toLocaleDateString('ar-LB', { weekday: 'long', day: 'numeric', month: 'short' })}
                </Text>
                {log.note && <Text style={[styles.histNote, { color: colors.text }]} numberOfLines={1}>{log.note}</Text>}
              </View>
              <Text style={[styles.histScore, { color: scoreColor(log.score) }]}>{log.score}/5</Text>
            </Card>
          );
        })}
        {logs.length === 0 && !isLoading && (
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: Spacing.md }}>لا توجد سجلات بعد.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  streakLabel:{ color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.md, textAlign: 'center' },
  question:   { fontSize: FontSize.lg, fontWeight: FontWeight.bold, textAlign: 'center', marginBottom: Spacing.md },
  moodRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  moodBtn:    { alignItems: 'center', padding: Spacing.sm, borderRadius: 12, borderWidth: 1.5, flex: 1, marginHorizontal: 2 },
  moodLabel:  { fontSize: FontSize.xs, marginTop: 2 },
  doneLabel:  { fontSize: FontSize.md, fontWeight: FontWeight.semibold, marginTop: Spacing.sm },
  section:    { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.sm, textAlign: 'right' },
  histCard:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  scoreDot:   { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', opacity: 0.85 },
  histDate:   { fontSize: FontSize.sm, textAlign: 'right' },
  histNote:   { fontSize: FontSize.xs, textAlign: 'right', marginTop: 2 },
  histScore:  { fontSize: FontSize.md, fontWeight: FontWeight.bold },
});
