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
import { StarField } from '../../../components/home/StarField';
import { api } from '../../../services/api';
import { Colors, Spacing, FontSize, FontWeight, Radius, TAB_BAR_HEIGHT } from '../../../constants/theme';

interface Contact { id: string; name: string; phone: string; relationship?: string; notify_order: number; notify_on_sos: boolean }

export default function ContactsScreen() {
  const { isDark, colors }  = useColorScheme();
  const qc          = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ name: '', phone: '', relationship: '' });
  const [phoneError, setPhoneError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['emergency-contacts'],
    queryFn:  () => api.get<Contact[]>('/users/me/emergency-contacts'),
  });

  const contacts = data?.data ?? [];

  const addMutation = useMutation({
    mutationFn: (body: object) => api.post('/users/me/emergency-contacts', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emergency-contacts'] });
      setShowForm(false);
      setForm({ name: '', phone: '', relationship: '' });
      setPhoneError('');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? 'تعذّر إضافة جهة الاتصال.';
      Alert.alert('خطأ', msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/me/emergency-contacts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['emergency-contacts'] }),
  });

  function handlePhoneChange(text: string) {
    // Allow only digits (the + prefix is shown separately as a label)
    setForm(prev => ({ ...prev, phone: text.replace(/\D/g, '') }));
    setPhoneError('');
  }

  function handleAdd() {
    if (!form.name.trim()) {
      Alert.alert('بيانات ناقصة', 'الرجاء إدخال الاسم.');
      return;
    }

    const digits = form.phone.replace(/\D/g, '');
    if (!digits) {
      setPhoneError('أدخل رقم الهاتف — مثال: 96181234567');
      return;
    }
    // E.164 with + prepended: 7–15 digits
    const e164 = '+' + digits;
    if (!/^\+\d{7,15}$/.test(e164)) {
      setPhoneError('الرقم غير صحيح — يجب أن يكون بين 7 و 15 رقم');
      return;
    }

    setPhoneError('');
    addMutation.mutate({
      name:          form.name.trim(),
      phone:         e164,
      relationship:  form.relationship.trim() || undefined,
      notify_order:  contacts.length + 1,
      notify_on_sos: true,
    });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {isDark && <StarField />}
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

            {/* Name field */}
            <TextInput
              placeholder="الاسم *"
              placeholderTextColor={colors.textMuted}
              value={form.name}
              onChangeText={v => setForm(prev => ({ ...prev, name: v }))}
              keyboardType="default"
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />

            {/* Phone field — digits only, + prefix shown as label */}
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
              رقم الهاتف * (رمز الدولة + الرقم)
            </Text>
            <View style={[
              styles.phoneRow,
              { borderColor: phoneError ? Colors.emergency : colors.border },
            ]}>
              <Text style={[styles.phonePlus, { color: colors.text }]}>+</Text>
              <TextInput
                placeholder="96181234567"
                placeholderTextColor={colors.textMuted}
                value={form.phone}
                onChangeText={handlePhoneChange}
                keyboardType="number-pad"
                maxLength={15}
                style={[styles.phoneInput, { color: colors.text }]}
              />
            </View>
            {phoneError ? (
              <Text style={styles.phoneErrorText}>{phoneError}</Text>
            ) : (
              <Text style={[styles.phoneHint, { color: colors.textMuted }]}>
                مثال: 96181234567 (لبنان) أو 966501234567 (السعودية)
              </Text>
            )}

            {/* Relationship field */}
            <TextInput
              placeholder="الصلة (اختياري) — أم، أب، صديقة…"
              placeholderTextColor={colors.textMuted}
              value={form.relationship}
              onChangeText={v => setForm(prev => ({ ...prev, relationship: v }))}
              keyboardType="default"
              style={[styles.input, { color: colors.text, borderColor: colors.border, marginTop: Spacing.sm }]}
            />

            <View style={styles.formActions}>
              <Button label="إلغاء" variant="ghost"   size="sm" onPress={() => { setShowForm(false); setPhoneError(''); }} style={{ flex: 1 }} />
              <Button label="حفظ"   variant="primary" size="sm" loading={addMutation.isPending} onPress={handleAdd} style={{ flex: 1 }} />
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1 },
  hint:           { fontSize: FontSize.sm, marginBottom: Spacing.md, textAlign: 'right', lineHeight: 20 },
  contactRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar:         { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText:     { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.lg },
  contactName:    { fontSize: FontSize.md, fontWeight: FontWeight.semibold, textAlign: 'right' },
  contactPhone:   { fontSize: FontSize.sm, textAlign: 'right' },
  contactRel:     { fontSize: FontSize.xs, textAlign: 'right' },
  formTitle:      { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.sm, textAlign: 'right' },
  input:          { borderWidth: 1, borderRadius: Radius.sm, padding: Spacing.sm, marginBottom: Spacing.sm, fontSize: FontSize.md, textAlign: 'right' },
  fieldLabel:     { fontSize: FontSize.xs, textAlign: 'right', marginBottom: 4 },
  phoneRow:       { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, marginBottom: 4 },
  phonePlus:      { fontSize: FontSize.md, fontWeight: FontWeight.bold, paddingRight: 4 },
  phoneInput:     { flex: 1, padding: Spacing.sm, fontSize: FontSize.md, textAlign: 'left' },
  phoneErrorText: { fontSize: FontSize.xs, color: Colors.emergency, textAlign: 'right', marginBottom: Spacing.sm },
  phoneHint:      { fontSize: FontSize.xs, textAlign: 'right', marginBottom: Spacing.sm },
  formActions:    { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
});
