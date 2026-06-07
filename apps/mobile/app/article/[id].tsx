// ============================================================
// Article Detail — full article body with rich display
// ============================================================
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Card } from '../../components/ui/Card';
import { useColorScheme } from '../../hooks/useColorScheme';
import { api } from '../../services/api';
import { Colors, Spacing, FontSize, FontWeight, TAB_BAR_HEIGHT } from '../../constants/theme';

interface Article {
  id: string;
  title: string;
  body: string;
  module: string;
  language: string;
  cover_url?: string;
  created_at: string;
  updated_at: string;
}

const MODULE_LABELS: Record<string, string> = {
  safety:        'السلامة',
  mental_health: 'الصحة النفسية',
  wellness:      'العافية',
  self_defence:  'الدفاع عن النفس',
  legal:         'القانون',
};

const MODULE_COLORS: Record<string, string> = {
  safety:        Colors.emergency,
  mental_health: Colors.depth,
  wellness:      Colors.success,
  self_defence:  Colors.primary,
  legal:         Colors.accent,
};

export default function ArticleDetailScreen() {
  const { id }     = useLocalSearchParams<{ id: string }>();
  const { colors } = useColorScheme();

  const { data, isLoading } = useQuery({
    queryKey: ['article', id],
    queryFn:  () => api.get<Article>(`/content/articles/${id}`),
    enabled:  !!id,
  });

  const article = data?.data;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <ScreenHeader title="جارٍ التحميل…" showBack />
        <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: Spacing.xl }}>جارٍ تحميل المقال…</Text>
      </SafeAreaView>
    );
  }

  if (!article) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <ScreenHeader title="غير موجود" showBack />
        <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: Spacing.xl }}>المقال غير متاح.</Text>
      </SafeAreaView>
    );
  }

  const moduleColor = MODULE_COLORS[article.module] ?? Colors.primary;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader title="مقالة" showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 80 }}>

        {/* Module badge + title */}
        <View style={[styles.header, { backgroundColor: moduleColor + '15' }]}>
          <View style={[styles.moduleBadge, { backgroundColor: moduleColor }]}>
            <Text style={styles.moduleLabel}>{MODULE_LABELS[article.module] ?? article.module}</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{article.title}</Text>
          <Text style={[styles.date, { color: colors.textMuted }]}>
            {new Date(article.updated_at).toLocaleDateString('ar-LB', { dateStyle: 'long' })}
          </Text>
        </View>

        {/* Article body */}
        <View style={{ padding: Spacing.md }}>
          <Text style={[styles.body, { color: colors.text }]}>{article.body}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1 },
  header:       { padding: Spacing.lg, paddingTop: Spacing.md },
  moduleBadge:  { alignSelf: 'flex-end', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: 20, marginBottom: Spacing.sm },
  moduleLabel:  { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  title:        { fontSize: FontSize.h2, fontWeight: FontWeight.bold, textAlign: 'right', lineHeight: 36 },
  date:         { fontSize: FontSize.xs, marginTop: Spacing.xs, textAlign: 'right' },
  body:         { fontSize: FontSize.md, lineHeight: 30, textAlign: 'right', letterSpacing: 0.3 },
});
