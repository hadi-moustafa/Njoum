// ============================================================
// Quiz Player — loads quiz questions, lets user answer,
// submits attempt, shows results with explanations.
// ============================================================
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useColorScheme } from '../../hooks/useColorScheme';
import { StarField } from '../../components/home/StarField';
import { api } from '../../services/api';
import { Colors, Spacing, FontSize, FontWeight, Radius, TAB_BAR_HEIGHT } from '../../constants/theme';

interface Question {
  id: string;
  question_text: string;
  options: string[];
  sort_order: number;
}

interface Quiz {
  id: string;
  title: string;
  module: string;
  difficulty: string;
  questions: Question[];
}

interface AttemptResult {
  attempt_id: string;
  score: number;
  total: number;
  percentage: number;
  answers: { question_id: string; chosen_index: number; correct: boolean }[];
  explanations: Record<string, { correct_index: number; explanation?: string }>;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner:     'مبتدئ',
  intermediate: 'متوسط',
  advanced:     'متقدم',
};

export default function QuizPlayerScreen() {
  const { id }      = useLocalSearchParams<{ id: string }>();
  const { isDark, colors }  = useColorScheme();
  const router      = useRouter();

  const [answers,    setAnswers]   = useState<Record<string, number>>({});
  const [result,     setResult]    = useState<AttemptResult | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['quiz', id],
    queryFn:  () => api.get<Quiz>(`/content/quizzes/${id}`),
    enabled:  !!id,
  });

  const quiz      = data?.data;
  const questions = quiz?.questions ?? [];
  const current   = questions[currentIdx];
  const isLast    = currentIdx === questions.length - 1;

  const submitMutation = useMutation({
    mutationFn: () => {
      const payload = Object.entries(answers).map(([question_id, chosen_index]) => ({
        question_id,
        chosen_index,
      }));
      return api.post<AttemptResult>(`/content/quizzes/${id}/attempt`, { answers: payload });
    },
    onSuccess: (res) => {
      if (res.data) setResult(res.data);
    },
    onError: () => Alert.alert('خطأ', 'تعذّر إرسال الإجابات.'),
  });

  function selectAnswer(questionId: string, idx: number) {
    setAnswers(prev => ({ ...prev, [questionId]: idx }));
  }

  function goNext() {
    if (isLast) {
      if (Object.keys(answers).length < questions.length) {
        Alert.alert('تنبيه', 'لم تجيبي على جميع الأسئلة بعد.');
        return;
      }
      submitMutation.mutate();
    } else {
      setCurrentIdx(i => i + 1);
    }
  }

  // ── Results screen ────────────────────────────────────────
  if (result) {
    const passed = result.percentage >= 70;
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        {isDark && <StarField />}
        <ScreenHeader title="نتيجة الاختبار" />
        <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + 80 }}>

          <Card style={{ alignItems: 'center', backgroundColor: passed ? Colors.success : Colors.primary, marginBottom: Spacing.lg }}>
            <Text style={styles.resultEmoji}>{passed ? '🌟' : '💪'}</Text>
            <Text style={styles.resultScore}>{result.score} / {result.total}</Text>
            <Text style={styles.resultPct}>{result.percentage}%</Text>
            <Text style={styles.resultMsg}>
              {passed ? 'ممتاز! اجتزتِ الاختبار' : 'حاولي مجدداً — أنتِ قادرة!'}
            </Text>
          </Card>

          <Text style={[styles.section, { color: colors.text }]}>مراجعة الإجابات</Text>

          {questions.map((q, idx) => {
            const ans  = result.answers.find(a => a.question_id === q.id);
            const exp  = result.explanations[q.id];
            const correct = ans?.correct ?? false;
            return (
              <Card key={q.id} style={{ marginBottom: Spacing.sm, borderLeftWidth: 4, borderLeftColor: correct ? Colors.success : Colors.emergency }}>
                <Text style={[styles.qNum, { color: colors.textMuted }]}>سؤال {idx + 1}</Text>
                <Text style={[styles.qText, { color: colors.text }]}>{q.question_text}</Text>
                {q.options.map((opt, i) => {
                  const isChosen  = ans?.chosen_index === i;
                  const isCorrect = exp?.correct_index === i;
                  let bg = 'transparent';
                  if (isCorrect) bg = Colors.success + '20';
                  if (isChosen && !isCorrect) bg = Colors.emergency + '20';
                  return (
                    <View key={i} style={[styles.optionReview, { backgroundColor: bg, borderColor: isCorrect ? Colors.success : colors.border }]}>
                      <Text style={{ color: colors.text, fontSize: FontSize.sm, textAlign: 'right', flex: 1 }}>
                        {isCorrect ? '✓ ' : isChosen ? '✗ ' : '  '}{opt}
                      </Text>
                    </View>
                  );
                })}
                {exp?.explanation && (
                  <Text style={[styles.explanation, { color: colors.textMuted }]}>💡 {exp.explanation}</Text>
                )}
              </Card>
            );
          })}

          <Button label="العودة للمحتوى" onPress={() => router.back()} style={{ marginTop: Spacing.md }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Loading ───────────────────────────────────────────────
  if (isLoading || !quiz || !current) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        {isDark && <StarField />}
        <ScreenHeader title="جارٍ التحميل…" showBack />
        <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: Spacing.xl }}>
          {isLoading ? 'جارٍ تحميل الاختبار…' : 'الاختبار غير موجود.'}
        </Text>
      </SafeAreaView>
    );
  }

  const selectedIdx = answers[current.id] ?? -1;

  // ── Quiz question view ────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {isDark && <StarField />}
      <ScreenHeader title={quiz.title} showBack />
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + 100 }}>

        {/* Progress bar */}
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: `${((currentIdx + 1) / questions.length) * 100}%` }]} />
        </View>
        <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
          {currentIdx + 1} من {questions.length} · {DIFFICULTY_LABELS[quiz.difficulty] ?? quiz.difficulty}
        </Text>

        {/* Question */}
        <Card style={{ marginBottom: Spacing.lg }}>
          <Text style={[styles.questionText, { color: colors.text }]}>{current.question_text}</Text>
        </Card>

        {/* Options */}
        {current.options.map((opt, i) => {
          const selected = selectedIdx === i;
          return (
            <Pressable
              key={i}
              style={[
                styles.option,
                {
                  borderColor: selected ? Colors.primary : colors.border,
                  backgroundColor: selected ? Colors.primary + '15' : colors.surface,
                },
              ]}
              onPress={() => selectAnswer(current.id, i)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <View style={[styles.optionCircle, { borderColor: selected ? Colors.primary : colors.border }]}>
                {selected && <View style={styles.optionDot} />}
              </View>
              <Text style={[styles.optionText, { color: colors.text }]}>{opt}</Text>
            </Pressable>
          );
        })}

        {/* Navigation */}
        <View style={styles.navRow}>
          {currentIdx > 0 && (
            <Button
              label="السابق"
              variant="outline"
              onPress={() => setCurrentIdx(i => i - 1)}
              style={{ flex: 1 }}
            />
          )}
          <Button
            label={isLast ? 'إرسال الإجابات' : 'التالي'}
            onPress={goNext}
            loading={submitMutation.isPending}
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1 },
  progressBar:   { height: 6, borderRadius: 3, marginBottom: Spacing.xs, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  progressLabel: { fontSize: FontSize.xs, textAlign: 'right', marginBottom: Spacing.lg },
  questionText:  { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, textAlign: 'right', lineHeight: 28 },
  option:        { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm, borderWidth: 1.5, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  optionCircle:  { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  optionDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  optionText:    { fontSize: FontSize.md, textAlign: 'right', flex: 1 },
  navRow:        { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  // Results
  resultEmoji:   { fontSize: 48, marginBottom: Spacing.sm },
  resultScore:   { fontSize: 40, fontWeight: FontWeight.extrabold, color: '#fff' },
  resultPct:     { fontSize: FontSize.lg, color: 'rgba(255,255,255,0.85)', marginBottom: Spacing.xs },
  resultMsg:     { fontSize: FontSize.md, color: '#fff', textAlign: 'center' },
  section:       { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.sm, textAlign: 'right' },
  qNum:          { fontSize: FontSize.xs, marginBottom: 4, textAlign: 'right' },
  qText:         { fontSize: FontSize.md, fontWeight: FontWeight.semibold, textAlign: 'right', marginBottom: Spacing.sm },
  optionReview:  { borderWidth: 1, borderRadius: Radius.sm, padding: Spacing.xs, marginBottom: 4, flexDirection: 'row-reverse' },
  explanation:   { fontSize: FontSize.xs, marginTop: Spacing.sm, textAlign: 'right', lineHeight: 18 },
});
