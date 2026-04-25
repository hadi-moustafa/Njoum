// ============================================================
// Journey Tracker — log a trip, mark safe on arrival
// ============================================================
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { api } from '../../../services/api';
import { Colors, Spacing, FontSize, FontWeight, TAB_BAR_HEIGHT } from '../../../constants/theme';

interface Journey { id: string; destination?: string; expected_arrival: string; marked_safe: boolean; created_at: string }

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ar-LB', { dateStyle: 'short', timeStyle: 'short' });
}

export default function JourneyScreen() {
  const { colors } = useColorScheme();
  const qc         = useQueryClient();
  const [dest, setDest]     = useState('');
  const [minutes, setMins]  = useState('30');

  const { data } = useQuery({
    queryKey: ['journeys'],
    queryFn:  () => api.get<Journey[]>('/journey'), // placeholder — not yet a route
  });

  const startMutation = useMutation({
    mutationFn: () => {
      const arrival = new Date(Date.now() + parseInt(minutes, 10) * 60_000).toISOString();
      return api.post('/journey', { destination: dest, expected_arrival: arrival });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journeys'] }); setDest(''); setMins('30'); },
    onError:   () => Alert.alert('خطأ', 'تعذّر بدء تتبع الرحلة.'),
  });

  const safeMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/journey/${id}/safe`, {}),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['journeys'] }),
  });

  const active = (data?.data ?? []).find(j => !j.marked_safe);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader title="تتبّع رحلتي" showBack />
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + 80 }}>

        {active ? (
          <Card style={{ borderColor: Colors.primary, borderWidth: 2 }}>
            <Text style={[styles.activeLabel, { color: Colors.primary }]}>رحلة نشطة</Text>
            <Text style={[styles.dest, { color: colors.text }]}>{active.destination ?? 'وجهة غير محددة'}</Text>
            <Text style={[styles.arrival, { color: colors.textMuted }]}>
              الوصول المتوقع: {formatDate(active.expected_arrival)}
            </Text>
            <Button
              label="✓ وصلتُ بأمان"
              variant="primary"
              onPress={() => safeMutation.mutate(active.id)}
              loading={safeMutation.isPending}
              style={{ marginTop: Spacing.sm }}
            />
          </Card>
        ) : (
          <Card>
            <Text style={[styles.formTitle, { color: colors.text }]}>سجّلي رحلة جديدة</Text>
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              سيتم تنبيه جهات اتصالكِ إن لم تؤكدي وصولكِ في الوقت المحدد.
            </Text>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>الوجهة (اختياري)</Text>
            <View style={[styles.input, { borderColor: colors.border }]}>
              <Text style={{ color: colors.textMuted, fontSize: FontSize.sm }}>{dest || 'مثال: منزل أمي'}</Text>
            </View>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>الوقت المتوقع للوصول (دقائق)</Text>
            <View style={styles.minuteRow}>
              {['15','30','60','90','120'].map(m => (
                <View
                  key={m}
                  style={[styles.minChip, { backgroundColor: minutes === m ? Colors.primary : colors.surface, borderColor: colors.border }]}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1 },
  activeLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginBottom: 4, textAlign: 'right' },
  dest:        { fontSize: FontSize.xl, fontWeight: FontWeight.bold, textAlign: 'right' },
  arrival:     { fontSize: FontSize.sm, marginTop: 4, textAlign: 'right' },
  formTitle:   { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.xs, textAlign: 'right' },
  hint:        { fontSize: FontSize.sm, marginBottom: Spacing.md, lineHeight: 20, textAlign: 'right' },
  fieldLabel:  { fontSize: FontSize.sm, marginBottom: 4, textAlign: 'right' },
  input:       { borderWidth: 1, borderRadius: 8, padding: Spacing.sm, marginBottom: Spacing.md },
  minuteRow:   { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginBottom: Spacing.sm },
  minChip:     { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: 20, borderWidth: 1 },
});
