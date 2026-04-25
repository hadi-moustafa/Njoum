// ============================================================
// Safety Hub / Learn Screen — articles + quizzes
// ============================================================
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card } from '../../../components/ui/Card';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { api } from '../../../services/api';
import { Colors, Spacing, FontSize, FontWeight, TAB_BAR_HEIGHT } from '../../../constants/theme';

interface Article { id: string; title: string; module: string; language: string; created_at: string }
interface Quiz    { id: string; title: string; module: string; difficulty: string }

const MODULE_LABELS: Record<string,string> = {
  safety: 'السلامة', mental_health: 'الصحة النفسية',
  wellness: 'العافية', self_defence: 'الدفاع عن النفس', legal: 'القانون',
};

export default function LearnScreen() {
  const { colors } = useColorScheme();
  const router     = useRouter();

  const { data: artData }  = useQuery({ queryKey: ['articles-safety'], queryFn: () => api.get<Article[]>('/content/articles?module=safety') });
  const { data: quizData } = useQuery({ queryKey: ['quizzes'],         queryFn: () => api.get<Quiz[]>('/content/quizzes') });

  const articles = artData?.data  ?? [];
  const quizzes  = quizData?.data ?? [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader title="مركز التعلم" showBack />
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + 80 }}>

        {quizzes.length > 0 && (
          <>
            <Text style={[styles.section, { color: colors.text }]}>اختبارات السلامة</Text>
            {quizzes.slice(0, 3).map(q => (
              <Pressable key={q.id} onPress={() => router.push(`/quiz/${q.id}` as any)}>
                <Card>
                  <Text style={[styles.quizTitle, { color: colors.text }]}>{q.title}</Text>
                  <Text style={[styles.quizMeta, { color: colors.textMuted }]}>{MODULE_LABELS[q.module] ?? q.module} · {q.difficulty}</Text>
                </Card>
              </Pressable>
            ))}
          </>
        )}

        <Text style={[styles.section, { color: colors.text }]}>مقالات</Text>
        {articles.map(a => (
          <Pressable key={a.id} onPress={() => router.push(`/article/${a.id}` as any)}>
            <Card>
              <Text style={[styles.artTitle, { color: colors.text }]}>{a.title}</Text>
              <Text style={[styles.artMeta, { color: colors.textMuted }]}>{MODULE_LABELS[a.module] ?? a.module}</Text>
            </Card>
          </Pressable>
        ))}

        {articles.length === 0 && quizzes.length === 0 && (
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: Spacing.xl }}>لا يوجد محتوى متاح حالياً.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1 },
  section:   { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.sm, textAlign: 'right' },
  quizTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, textAlign: 'right' },
  quizMeta:  { fontSize: FontSize.xs, marginTop: 2, textAlign: 'right' },
  artTitle:  { fontSize: FontSize.md, fontWeight: FontWeight.semibold, textAlign: 'right' },
  artMeta:   { fontSize: FontSize.xs, marginTop: 2, color: Colors.accent, textAlign: 'right' },
});
