// ============================================================
// Journey Tracker — start a trip, receive safety alert if late
// ============================================================
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { StarField } from '../../../components/home/StarField';
import { api } from '../../../services/api';
import { Colors, Spacing, FontSize, FontWeight, TAB_BAR_HEIGHT } from '../../../constants/theme';

interface Journey {
  id: string;
  destination?: string;
  expected_arrival: string;
  marked_safe: boolean;
  marked_safe_at?: string;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ar-LB', { dateStyle: 'short', timeStyle: 'short' });
}

function minutesUntil(isoStr: string): number {
  return Math.round((new Date(isoStr).getTime() - Date.now()) / 60_000);
}

export default function JourneyScreen() {
  const { isDark, colors } = useColorScheme();
  const qc         = useQueryClient();
  const [dest, setDest]    = useState('');
  const [minutes, setMins] = useState('30');

  const { data, isLoading } = useQuery({
    queryKey: ['journeys'],
    queryFn:  () => api.get<Journey[]>('/journey'),
  });

  const startMutation = useMutation({
    mutationFn: () => {
      const arrival = new Date(Date.now() + parseInt(minutes, 10) * 60_000).toISOString();
      return api.post('/journey', {
        destination: dest || undefined,
        expected_arrival: arrival,
        share_with_contacts: true,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journeys'] });
      setDest('');
      setMins('30');
    },
    onError: (err: any) => Alert.alert('خطأ', err?.message ?? 'تعذّر بدء تتبع الرحلة.'),
  });

  const safeMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/journey/${id}/safe`, {}),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['journeys'] });
      Alert.alert('وصلتِ بأمان ✓', 'تم إخبار جهات اتصالكِ بوصولكِ بسلام.');
    },
  });

  const active  = (data?.data ?? []).find(j => !j.marked_safe);
  const recent  = (data?.data ?? []).filter(j => j.marked_safe).slice(0, 5);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {isDark && <StarField />}
      <ScreenHeader title="تتبّع رحلتي" showBack />
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + 80 }}>

        {/* Active journey banner */}
        {active && (
          <Card style={{ borderColor: Colors.primary, borderWidth: 2, marginBottom: Spacing.lg }}>
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={[styles.activeLabel, { color: Colors.primary }]}>رحلة نشطة</Text>
            </View>
            <Text style={[styles.dest, { color: colors.text }]}>
              {active.destination ?? 'وجهة غير محددة'}
            </Text>
            <Text style={[styles.arrival, { color: colors.textMuted }]}>
              الوصول المتوقع: {formatDate(active.expected_arrival)}
            </Text>
            {minutesUntil(active.expected_arrival) > 0 && (
              <Text style={[styles.countdown, { color: Colors.accent }]}>
                ⏱ متبقٍ {minutesUntil(active.expected_arrival)} دقيقة
              </Text>
            )}
            <Button
              label="✓ وصلتُ بأمان"
              variant="primary"
              onPress={() => safeMutation.mutate(active.id)}
              loading={safeMutation.isPending}
              style={{ marginTop: Spacing.sm }}
            />
          </Card>
        )}

        {/* New journey form (only if no active) */}
        {!active && (
          <Card style={{ marginBottom: Spacing.lg }}>
            <Text style={[styles.formTitle, { color: colors.text }]}>سجّلي رحلة جديدة</Text>
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              سيتم تنبيه جهات اتصالكِ إن لم تؤكدي وصولكِ في الوقت المحدد.
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>الوجهة (اختياري)</Text>
            <TextInput
              value={dest}
              onChangeText={setDest}
              placeholder="مثال: منزل أمي، المدرسة…"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              textAlign="right"
            />

            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>الوقت المتوقع للوصول (دقائق)</Text>
            <View style={styles.minuteRow}>
              {['15', '30', '60', '90', '120'].map(m => (
                <View
                  key={m}
                  style={[styles.minChip, {
                    backgroundColor: minutes === m ? Colors.primary : colors.surface,
                    borderColor: minutes === m ? Colors.primary : colors.border,
                  }]}
                >
                  <Text
                    style={{ color: minutes === m ? '#fff' : colors.text, fontSize: FontSize.sm, fontWeight: FontWeight.semibold }}
                    onPress={() => setMins(m)}
                  >{m}</Text>
                </View>
              ))}
            </View>

            <Button
              label="ابدئي تتبع الرحلة"
              onPress={() => startMutation.mutate()}
              loading={startMutation.isPending}
              style={{ marginTop: Spacing.md }}
            />
          </Card>
        )}

        {/* Recent safe journeys */}
        {recent.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>رحلات سابقة</Text>
            {recent.map(j => (
              <Card key={j.id} style={{ marginBottom: Spacing.xs, opacity: 0.75 }}>
                <Text style={[styles.dest, { color: colors.text, fontSize: FontSize.sm }]}>
                  ✓ {j.destination ?? 'رحلة'} — {formatDate(j.created_at)}
                </Text>
              </Card>
            ))}
          </>
        )}

        {isLoading && (
          <Text style={{ color: colors.textMuted, textAlign: 'center' }}>جارٍ التحميل…</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1 },
  activeBadge:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  activeDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  activeLabel:  { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  dest:         { fontSize: FontSize.xl, fontWeight: FontWeight.bold, textAlign: 'right' },
  arrival:      { fontSize: FontSize.sm, marginTop: 4, textAlign: 'right' },
  countdown:    { fontSize: FontSize.sm, marginTop: 2, textAlign: 'right' },
  formTitle:    { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.xs, textAlign: 'right' },
  hint:         { fontSize: FontSize.sm, marginBottom: Spacing.md, lineHeight: 20, textAlign: 'right' },
  fieldLabel:   { fontSize: FontSize.sm, marginBottom: 4, textAlign: 'right' },
  input:        { borderWidth: 1, borderRadius: 8, padding: Spacing.sm, marginBottom: Spacing.md, fontSize: FontSize.md },
  minuteRow:    { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginBottom: Spacing.sm },
  minChip:      { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: 20, borderWidth: 1 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.sm, textAlign: 'right' },
});
