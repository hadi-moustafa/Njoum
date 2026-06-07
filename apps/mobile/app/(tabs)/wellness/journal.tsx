// ============================================================
// Journal — private encrypted entries
// Actual schema: no title, no mood_score, no deleted_at.
// ============================================================
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { api } from '../../../services/api';
import { Colors, Spacing, FontSize, FontWeight, TAB_BAR_HEIGHT } from '../../../constants/theme';

interface JournalEntry { id: string; created_at: string; updated_at: string }
interface EntryDetail  { id: string; content: string; created_at: string }

type ViewMode = 'list' | 'compose' | 'read';

export default function JournalScreen() {
  const { colors } = useColorScheme();
  const qc         = useQueryClient();

  const [view,    setView]    = useState<ViewMode>('list');
  const [reading, setReading] = useState<EntryDetail | null>(null);
  const [content, setContent] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['journal'],
    queryFn:  () => api.get<JournalEntry[]>('/journal'),
  });

  const entries = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: () => api.post('/journal', { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal'] });
      setContent(''); setView('list');
    },
    onError: () => Alert.alert('خطأ', 'تعذّر حفظ المذكرة.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/journal/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal'] });
      setView('list'); setReading(null);
    },
    onError: () => Alert.alert('خطأ', 'تعذّر حذف المذكرة.'),
  });

  async function openEntry(entry: JournalEntry) {
    try {
      const res = await api.get<EntryDetail>(`/journal/${entry.id}`);
      if (res.data) { setReading(res.data); setView('read'); }
    } catch {
      Alert.alert('خطأ', 'تعذّر فتح المذكرة.');
    }
  }

  function confirmDelete(id: string) {
    Alert.alert('حذف المذكرة', 'هل أنتِ متأكدة؟ لا يمكن التراجع.', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  }

  if (view === 'compose') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <ScreenHeader title="مذكرة جديدة" showBack onBack={() => setView('list')} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + 80 }}>
            <TextInput
              style={[styles.bodyInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="اكتبي ما يجول في خاطركِ…"
              placeholderTextColor={colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              textAlign="right"
              textAlignVertical="top"
            />
            <Text style={[styles.privacyNote, { color: colors.textMuted }]}>
              🔒 مذكراتكِ مشفّرة ولا يراها أحد سواكِ.
            </Text>
            <Button
              label="احفظي المذكرة"
              onPress={() => createMutation.mutate()}
              loading={createMutation.isPending}
              style={{ marginTop: Spacing.sm }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (view === 'read' && reading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <ScreenHeader
          title={new Date(reading.created_at).toLocaleDateString('ar-LB', { dateStyle: 'medium' })}
          showBack onBack={() => { setView('list'); setReading(null); }}
        />
        <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + 80 }}>
          <Text style={[styles.readDate, { color: colors.textMuted }]}>
            {new Date(reading.created_at).toLocaleDateString('ar-LB', { dateStyle: 'full' })}
          </Text>
          <Text style={[styles.readBody, { color: colors.text }]}>{reading.content ?? ''}</Text>
          <Button
            label="حذف هذه المذكرة"
            variant="outline"
            onPress={() => confirmDelete(reading.id)}
            loading={deleteMutation.isPending}
            style={{ marginTop: Spacing.xl, borderColor: Colors.emergency }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader title="يومياتي" showBack />
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + 80 }}>

        <Button
          label="＋ مذكرة جديدة"
          onPress={() => setView('compose')}
          style={{ marginBottom: Spacing.lg }}
        />

        <Text style={[styles.privacyNote, { color: colors.textMuted, marginBottom: Spacing.md }]}>
          🔒 مشفّرة بالكامل — لا يراها أحد سواكِ.
        </Text>

        {isLoading && <Text style={{ color: colors.textMuted, textAlign: 'center' }}>جارٍ التحميل…</Text>}

        {entries.map(e => (
          <Pressable key={e.id} onPress={() => openEntry(e)}>
            <Card style={{ marginBottom: Spacing.xs }}>
              <Text style={[styles.entryDate, { color: colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold }]}>
                {new Date(e.created_at).toLocaleDateString('ar-LB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
              <Text style={[styles.entryDate, { color: colors.textMuted }]}>
                {new Date(e.created_at).toLocaleTimeString('ar-LB', { timeStyle: 'short' })}
              </Text>
            </Card>
          </Pressable>
        ))}

        {entries.length === 0 && !isLoading && (
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: Spacing.lg }}>
            لا توجد مذكرات بعد. ابدئي كتابة أولى مذكراتكِ!
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1 },
  bodyInput:   { borderWidth: 1, borderRadius: 10, padding: Spacing.sm, fontSize: FontSize.md, minHeight: 220, marginBottom: Spacing.sm },
  privacyNote: { fontSize: FontSize.xs, textAlign: 'center' },
  readDate:    { fontSize: FontSize.sm, textAlign: 'right', marginBottom: Spacing.md },
  readBody:    { fontSize: FontSize.md, lineHeight: 26, textAlign: 'right' },
  entryDate:   { fontSize: FontSize.xs, marginTop: 2, textAlign: 'right' },
});
