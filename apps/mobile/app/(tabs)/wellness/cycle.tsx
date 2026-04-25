// ============================================================
// Cycle Tracker — log cycles + view prediction
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

interface Cycle {
  id: string;
  start_date: string;
  end_date?: string;
  flow_intensity?: string;
  symptoms?: string[];
  notes?: string;
}

interface Prediction {
  next_period_date: string;
  cycle_length_days: number;
  period_length_days: number;
}

const FLOW_OPTIONS = [
  { value: 'spotting', label: 'بقع خفيفة' },
  { value: 'light',    label: 'خفيف'     },
  { value: 'medium',   label: 'متوسط'    },
  { value: 'heavy',    label: 'غزير'     },
];

const SYMPTOM_OPTIONS = [
  { value: 'cramps',       label: 'تقلصات' },
  { value: 'bloating',     label: 'انتفاخ' },
  { value: 'mood_swings',  label: 'تقلب مزاج' },
  { value: 'fatigue',      label: 'تعب'    },
  { value: 'headache',     label: 'صداع'   },
  { value: 'back_pain',    label: 'ألم ظهر' },
];

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const today  = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export default function CycleScreen() {
  const { colors } = useColorScheme();
  const qc         = useQueryClient();

  const [showForm,   setShowForm]   = useState(false);
  const [startDate,  setStartDate]  = useState(new Date().toISOString().split('T')[0]!);
  const [flow,       setFlow]       = useState('medium');
  const [symptoms,   setSymptoms]   = useState<string[]>([]);

  const { data: cyclesData, isLoading } = useQuery({
    queryKey: ['cycles'],
    queryFn:  () => api.get<Cycle[]>('/cycles'),
  });

  const { data: predData } = useQuery({
    queryKey: ['cycle-prediction'],
    queryFn:  () => api.get<Prediction>('/cycles/prediction'),
    enabled:  (cyclesData?.data?.length ?? 0) >= 2,
  });

  const cycles     = cyclesData?.data ?? [];
  const prediction = predData?.data;

  function toggleSymptom(s: string) {
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  const logMutation = useMutation({
    mutationFn: () => api.post('/cycles', { start_date: startDate, flow_intensity: flow, symptoms }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cycles'] });
      qc.invalidateQueries({ queryKey: ['cycle-prediction'] });
      setShowForm(false); setSymptoms([]); setFlow('medium');
    },
    onError: () => Alert.alert('خطأ', 'تعذّر حفظ الدورة.'),
  });

  const days = prediction ? daysUntil(prediction.next_period_date) : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader title="دورتي الشهرية" showBack />
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + 80 }}>

        {/* Prediction card */}
        {prediction && (
          <Card style={{ backgroundColor: Colors.depth, marginBottom: Spacing.lg }}>
            <Text style={styles.predTitle}>الدورة القادمة المتوقعة</Text>
            <Text style={styles.predDate}>
              {new Date(prediction.next_period_date).toLocaleDateString('ar-LB', { dateStyle: 'long' })}
            </Text>
            <Text style={styles.predSub}>
              {days !== null && days >= 0
                ? `بعد ${days} يوم`
                : days !== null
                ? `قبل ${Math.abs(days!)} يوم (ربما بدأت)'`
                : ''}
              {'  ·  '}دورة {prediction.cycle_length_days} يوم
            </Text>
          </Card>
        )}

        {/* Log button */}
        {!showForm && (
          <Button
            label="تسجيل دورة جديدة"
            onPress={() => setShowForm(true)}
            style={{ marginBottom: Spacing.lg }}
          />
        )}

        {/* Log form */}
        {showForm && (
          <Card style={{ marginBottom: Spacing.lg }}>
            <Text style={[styles.formTitle, { color: colors.text }]}>دورة جديدة</Text>

            {/* Date — simple text display (date picker would require native module) */}
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>تاريخ البداية</Text>
            <View style={[styles.dateBox, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text }}>{startDate}</Text>
            </View>

            {/* Flow */}
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>شدة النزيف</Text>
            <View style={styles.chipRow}>
              {FLOW_OPTIONS.map(f => (
                <Pressable
                  key={f.value}
                  style={[styles.chip, { borderColor: flow === f.value ? Colors.primary : colors.border, backgroundColor: flow === f.value ? Colors.primary + '20' : 'transparent' }]}
                  onPress={() => setFlow(f.value)}
                >
                  <Text style={{ color: flow === f.value ? Colors.primary : colors.textMuted, fontSize: FontSize.sm }}>{f.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Symptoms */}
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>الأعراض</Text>
            <View style={styles.chipRow}>
              {SYMPTOM_OPTIONS.map(s => (
                <Pressable
                  key={s.value}
                  style={[styles.chip, { borderColor: symptoms.includes(s.value) ? Colors.depth : colors.border, backgroundColor: symptoms.includes(s.value) ? Colors.depth + '20' : 'transparent' }]}
                  onPress={() => toggleSymptom(s.value)}
                >
                  <Text style={{ color: symptoms.includes(s.value) ? Colors.depth : colors.textMuted, fontSize: FontSize.sm }}>{s.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
              <Button label="إلغاء" variant="outline" onPress={() => setShowForm(false)} style={{ flex: 1 }} />
              <Button label="احفظي" onPress={() => logMutation.mutate()} loading={logMutation.isPending} style={{ flex: 1 }} />
            </View>
          </Card>
        )}

        {/* History */}
        <Text style={[styles.section, { color: colors.text }]}>السجل</Text>
        {isLoading && <Text style={{ color: colors.textMuted, textAlign: 'center' }}>جارٍ التحميل…</Text>}

        {cycles.map(c => (
          <Card key={c.id} style={{ marginBottom: Spacing.xs }}>
            <Text style={[styles.cycleDate, { color: colors.text }]}>
              🌙 {new Date(c.start_date).toLocaleDateString('ar-LB', { dateStyle: 'medium' })}
              {c.end_date ? ` — ${new Date(c.end_date).toLocaleDateString('ar-LB', { dateStyle: 'medium' })}` : '  (جارية)'}
            </Text>
            {c.flow_intensity && (
              <Text style={[styles.cycleMeta, { color: colors.textMuted }]}>
                {FLOW_OPTIONS.find(f => f.value === c.flow_intensity)?.label ?? c.flow_intensity}
                {c.symptoms && c.symptoms.length > 0 && ` · ${c.symptoms.map(s => SYMPTOM_OPTIONS.find(o => o.value === s)?.label ?? s).join('، ')}`}
              </Text>
            )}
          </Card>
        ))}

        {cycles.length === 0 && !isLoading && (
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: Spacing.md }}>
            سجّلي دورتين على الأقل لتفعيل التنبؤات.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  predTitle:  { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm, textAlign: 'center', marginBottom: 4 },
  predDate:   { color: '#fff', fontSize: FontSize.xl, fontWeight: FontWeight.bold, textAlign: 'center' },
  predSub:    { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.sm, textAlign: 'center', marginTop: 4 },
  formTitle:  { fontSize: FontSize.lg, fontWeight: FontWeight.bold, textAlign: 'right', marginBottom: Spacing.md },
  fieldLabel: { fontSize: FontSize.sm, textAlign: 'right', marginBottom: Spacing.xs },
  dateBox:    { borderWidth: 1, borderRadius: 8, padding: Spacing.sm, marginBottom: Spacing.md, alignItems: 'flex-end' },
  chipRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.md, justifyContent: 'flex-end' },
  chip:       { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  section:    { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.sm, textAlign: 'right' },
  cycleDate:  { fontSize: FontSize.md, fontWeight: FontWeight.semibold, textAlign: 'right' },
  cycleMeta:  { fontSize: FontSize.xs, marginTop: 2, textAlign: 'right' },
});
