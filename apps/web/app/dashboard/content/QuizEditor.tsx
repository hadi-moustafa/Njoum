'use client';

import { useState } from 'react';
import { createQuiz, saveQuizQuestions } from '@/app/actions/quizzes';

interface QuizFormData {
  title:      string;
  module:     string;
  difficulty: string;
  language:   string;
}

interface QuestionFormData {
  question_text:        string;
  options:              string[];
  correct_option_index: number;
  explanation:          string;
  sort_order:           number;
}

const MODULES     = ['safety', 'mental_health', 'wellness', 'self_defence', 'legal'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const LANGUAGES   = ['ar', 'en', 'fr'];

const MODULE_LABELS: Record<string, string> = {
  safety: 'السلامة', mental_health: 'الصحة النفسية',
  wellness: 'العافية', self_defence: 'الدفاع عن النفس', legal: 'القانون',
};
const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم',
};

export default function QuizEditor({ onClose }: { onClose: () => void }) {
  const [step,   setStep]   = useState<'meta' | 'questions' | 'done'>('meta');
  const [quizId, setQuizId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const [meta, setMeta] = useState<QuizFormData>({
    title: '', module: 'safety', difficulty: 'beginner', language: 'ar',
  });

  const [questions, setQuestions] = useState<QuestionFormData[]>([
    { question_text: '', options: ['', '', '', ''], correct_option_index: 0, explanation: '', sort_order: 0 },
  ]);

  // ── Step 1: create quiz meta ───────────────────────────────
  async function saveMeta() {
    if (!meta.title.trim()) { setError('العنوان مطلوب'); return; }
    setSaving(true); setError(null);

    const result = await createQuiz(meta);

    setSaving(false);
    if ('error' in result) { setError(result.error); return; }
    setQuizId(result.quizId);
    setStep('questions');
  }

  // ── Step 2: save questions ─────────────────────────────────
  async function saveQuestionsHandler() {
    const invalid = questions.find(q => !q.question_text.trim() || q.options.some(o => !o.trim()));
    if (invalid) { setError('يرجى ملء جميع الأسئلة والخيارات'); return; }

    setSaving(true); setError(null);

    const result = await saveQuizQuestions(quizId!, questions);

    setSaving(false);
    if ('error' in result) { setError(result.error); return; }
    setStep('done');
  }

  function addQuestion() {
    setQuestions(prev => [
      ...prev,
      { question_text: '', options: ['', '', '', ''], correct_option_index: 0, explanation: '', sort_order: prev.length },
    ]);
  }

  function removeQuestion(idx: number) {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  }

  function updateQuestion(idx: number, field: keyof QuestionFormData, value: unknown) {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  }

  function updateOption(qIdx: number, oIdx: number, value: string) {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const options = [...q.options];
      options[oIdx] = value;
      return { ...q, options };
    }));
  }

  if (step === 'done') {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-xl font-bold text-njoum-text mb-2">تم نشر الاختبار!</h3>
        <p className="text-njoum-muted mb-6">الاختبار متاح الآن للمستخدمات.</p>
        <button onClick={onClose} className="btn-primary px-6">إغلاق</button>
      </div>
    );
  }

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {(['meta', 'questions'] as const).map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-full ${step === s || (step === 'questions' && s === 'meta') ? 'bg-primary' : 'bg-gray-200'}`} />
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>
      )}

      {/* Step 1: Quiz metadata */}
      {step === 'meta' && (
        <div className="space-y-4">
          <h3 className="font-bold text-njoum-text text-lg text-right">معلومات الاختبار</h3>
          <div>
            <label className="block text-sm text-njoum-muted text-right mb-1">عنوان الاختبار *</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-right text-sm"
              placeholder="مثال: اختبار السلامة الشخصية"
              value={meta.title}
              onChange={e => setMeta(m => ({ ...m, title: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-njoum-muted text-right mb-1">القسم</label>
              <select className="w-full border rounded-lg px-2 py-2 text-sm" value={meta.module}
                onChange={e => setMeta(m => ({ ...m, module: e.target.value }))}>
                {MODULES.map(m => <option key={m} value={m}>{MODULE_LABELS[m] ?? m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-njoum-muted text-right mb-1">الصعوبة</label>
              <select className="w-full border rounded-lg px-2 py-2 text-sm" value={meta.difficulty}
                onChange={e => setMeta(m => ({ ...m, difficulty: e.target.value }))}>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{DIFFICULTY_LABELS[d] ?? d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-njoum-muted text-right mb-1">اللغة</label>
              <select className="w-full border rounded-lg px-2 py-2 text-sm" value={meta.language}
                onChange={e => setMeta(m => ({ ...m, language: e.target.value }))}>
                {LANGUAGES.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 border rounded-lg px-4 py-2 text-sm">إلغاء</button>
            <button onClick={saveMeta} disabled={saving}
              className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50">
              {saving ? 'جارٍ الحفظ…' : 'التالي: الأسئلة'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Questions */}
      {step === 'questions' && (
        <div>
          <h3 className="font-bold text-njoum-text text-lg text-right mb-4">أسئلة الاختبار</h3>
          {questions.map((q, qIdx) => (
            <div key={qIdx} className="border rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <button onClick={() => removeQuestion(qIdx)} className="text-red-500 text-sm" disabled={questions.length <= 1}>
                  حذف
                </button>
                <span className="text-sm font-semibold text-njoum-text">سؤال {qIdx + 1}</span>
              </div>

              <textarea
                className="w-full border rounded-lg px-3 py-2 text-right text-sm mb-3 resize-none"
                rows={2}
                placeholder="نص السؤال *"
                value={q.question_text}
                onChange={e => updateQuestion(qIdx, 'question_text', e.target.value)}
              />

              <p className="text-xs text-njoum-muted text-right mb-2">الخيارات (اختر الصحيح بالنقر عليه)</p>
              {q.options.map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => updateQuestion(qIdx, 'correct_option_index', oIdx)}
                    className={`w-6 h-6 rounded-full border-2 flex-shrink-0 ${q.correct_option_index === oIdx ? 'bg-primary border-primary' : 'border-gray-300'}`}
                  />
                  <input
                    className="flex-1 border rounded-lg px-3 py-1.5 text-right text-sm"
                    placeholder={`الخيار ${oIdx + 1} *`}
                    value={opt}
                    onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                  />
                </div>
              ))}

              <input
                className="w-full border rounded-lg px-3 py-2 text-right text-sm mt-2"
                placeholder="شرح الإجابة (اختياري)"
                value={q.explanation}
                onChange={e => updateQuestion(qIdx, 'explanation', e.target.value)}
              />
            </div>
          ))}

          <button onClick={addQuestion}
            className="w-full border-2 border-dashed border-primary text-primary rounded-xl py-3 text-sm mb-4 hover:bg-primary/5">
            + إضافة سؤال
          </button>

          <div className="flex gap-3">
            <button onClick={() => setStep('meta')} className="flex-1 border rounded-lg px-4 py-2 text-sm">رجوع</button>
            <button onClick={saveQuestionsHandler} disabled={saving}
              className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50">
              {saving ? 'جارٍ النشر…' : `نشر الاختبار (${questions.length} أسئلة)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
