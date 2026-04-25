// ============================================================
// Emergency Contacts Screen — add, edit, reorder (max 5)
// ============================================================
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { api } from '../../../services/api';
import { Colors, Spacing, FontSize, FontWeight, Radius, TAB_BAR_HEIGHT } from '../../../constants/theme';

interface Contact { id: string; name: string; phone: string; relationship?: string; notify_order: number; notify_on_sos: boolean }

export default function ContactsScreen() {
  const { colors }  = useColorScheme();
  const qc          = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ name: '', phone: '', relationship: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['emergency-contacts'],
    queryFn:  () => api.get<Contact[]>('/users/me/emergency-contacts'),
  });

  const contacts = data?.data ?? [];

  const addMutation = useMutation({
    mutationFn: (body: object) => api.post('/users/me/emergency-contacts', body),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['emergency-contacts'] }); setShowForm(false); setForm({ name:'', phone:'', relationship:'' }); },
    onError:    () => Alert.alert('خطأ', 'تعذّر إضافة جهة الاتصال.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/me/emergency-contacts/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['emergency-contacts'] }),
  });

  function handleAdd() {
    if (!form.name.trim() || !form.phone.trim()) {
      Alert.alert('بيانات ناقصة', 'الرجاء إدخال الاسم ورقم الهاتف.');
      return;
    }
    addMutation.mutate({ ...form, notify_order: contacts.length + 1, notify_on_sos: true });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader title="جهات الاتصال الطارئة" showBack />
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + 100 }}>

        <Text style={[styles.hint, { color: colors.textMuted }]}>
          سيتم إخبار هؤلاء الأشخاص فوراً عند تفعيل نداء الاستغاثة. (الحد الأقصى ٥ جهات)
        </Text>

        {contacts.map(c => (
          <Card key={c.id}>
            <View style={styles.contactRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{c.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.contactName, { color: colors.text }]}>{c.name}</Text>
                <Text style={[styles.contactPhone, { color: colors.textMuted }]}>{c.phone}</Text>
                {c.relationship ? <Text style={[styles.contactRel, { color: colors.textMuted }]}>{c.relationship}</Text> : null}
              </View>
              <Pressable
                onPress={() => Alert.alert('حذف', `حذف ${c.name}؟`, [
                  { text: 'إلغاء', style: 'cancel' },
                  { text: 'حذف', style: 'destructive', onPress: () => deleteMutation.mutate(c.id) },
                ])}
                hitSlop={10}
              >
                <Text style={{ fontSize: 20, color: Colors.emergency }}>✕</Text>
              </Pressable>
            </View>
          </Card>
        ))}

        {isLoading && <Text style={[styles.hint, { textAlign: 'center' }]}>جارٍ التحميل…</Text>}

        {contacts.length < 5 && !showForm && (
          <Button label="+ إضافة جهة اتصال" variant="secondary" onPress={() => setShowForm(true)} />
        )}

        {showForm && (
          <Card>
            <Text style={[styles.formTitle, { color: colors.text }]}>جهة اتصال جديدة</Text>
            {(['name','phone','relationship'] as const).map(field => (
              <TextInput
                key={field}
                placeholder={field === 'name' ? 'الاسم *' : field === 'phone' ? 'رقم الهاتف *' : 'الصلة (اختياري)'}
                placeholderTextColor={colors.textMuted}
                value={form[field]}
                onChangeText={v => setForm(prev => ({ ...prev, [field]: v }))}
                keyboardType={field === 'phone' ? 'phone-pad' : 'default'}
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              />
            ))}
            <View style={styles.formActions}>
              <Button label="إلغاء"  variant="ghost"   size="sm" onPress={() => setShowForm(false)} style={{ flex: 1 }} />
              <Button label="حفظ"    variant="primary"  size="sm" loading={addMutation.isPending} onPress={handleAdd} style={{ flex: 1 }} />
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1 },
  hint:         { fontSize: FontSize.sm, marginBottom: Spacing.md, textAlign: 'right', lineHeight: 20 },
  contactRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar:       { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.lg },
  contactName:  { fontSize: FontSize.md, fontWeight: FontWeight.semibold, textAlign: 'right' },
  contactPhone: { fontSize: FontSize.sm, textAlign: 'right' },
  contactRel:   { fontSize: FontSize.xs, textAlign: 'right' },
  formTitle:    { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.sm, textAlign: 'right' },
  input:        { borderWidth: 1, borderRadius: Radius.sm, padding: Spacing.sm, marginBottom: Spacing.sm, fontSize: FontSize.md, textAlign: 'right' },
  formActions:  { flexDirection: 'row', gap: Spacing.sm },
});
