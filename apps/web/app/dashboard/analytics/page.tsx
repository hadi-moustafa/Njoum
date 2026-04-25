import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import MoodChart from './MoodChart';

interface MoodStat   { date: string; avg_score: number; count: number }
interface ModuleStat { module: string; article_count: number; quiz_attempts: number }
interface SosStat    { month: string; total: number; cancelled: number; resolved: number }

const MODULE_LABELS: Record<string, string> = {
  safety: 'السلامة', mental_health: 'الصحة النفسية', legal: 'القانون',
  wellness: 'العافية', self_defence: 'الدفاع عن النفس',
};
const MODULE_ICONS: Record<string, string> = {
  safety: '🛡️', mental_health: '🧠', legal: '⚖️', wellness: '💚', self_defence: '🥊',
};
const ALL_MODULES = ['safety', 'mental_health', 'legal', 'wellness', 'self_defence'];

export default async function AnalyticsPage() {
  await requireAdmin();

  // ── date boundaries ──────────────────────────────────────────
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(now.getMonth() - 6);

  const [moodRes, articlesRes, attemptsRes, sosRes, totalUsersRes, newUsersRes] = await Promise.all([
    supabaseAdmin
      .from('mood_logs')
      .select('date, score')
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date'),
    supabaseAdmin
      .from('content_articles')
      .select('module')
      .is('deleted_at', null),
    supabaseAdmin
      .from('quiz_attempts')
      .select('quiz_id, safety_quizzes!quiz_id(module)'),
    supabaseAdmin
      .from('sos_events')
      .select('created_at, cancelled, resolved_at')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at'),
    supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null),
    supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())
      .is('deleted_at', null),
  ]);

  // ── mood trend aggregation ───────────────────────────────────
  const moodByDate = new Map<string, { sum: number; count: number }>();
  (moodRes.data ?? []).forEach((m: any) => {
    const e = moodByDate.get(m.date) ?? { sum: 0, count: 0 };
    e.sum += m.score; e.count += 1;
    moodByDate.set(m.date, e);
  });
  const moods: MoodStat[] = Array.from(moodByDate.entries()).map(([date, { sum, count }]) => ({
    date,
    avg_score: Math.round((sum / count) * 10) / 10,
    count,
  }));

  // ── module engagement aggregation ───────────────────────────
  const articlesByModule = new Map<string, number>();
  (articlesRes.data ?? []).forEach((a: any) => {
    articlesByModule.set(a.module, (articlesByModule.get(a.module) ?? 0) + 1);
  });
  const attemptsByModule = new Map<string, number>();
  (attemptsRes.data ?? []).forEach((a: any) => {
    const mod = (a.safety_quizzes as any)?.module;
    if (mod) attemptsByModule.set(mod, (attemptsByModule.get(mod) ?? 0) + 1);
  });
  const modules: ModuleStat[] = ALL_MODULES.map(m => ({
    module: m,
    article_count:  articlesByModule.get(m)  ?? 0,
    quiz_attempts:  attemptsByModule.get(m)  ?? 0,
  }));
  const maxAttempts = Math.max(...modules.map(m => m.quiz_attempts), 1);

  // ── SOS monthly aggregation ──────────────────────────────────
  const sosByMonth = new Map<string, { total: number; cancelled: number; resolved: number }>();
  (sosRes.data ?? []).forEach((s: any) => {
    const key = (s.created_at as string).slice(0, 7);
    const e = sosByMonth.get(key) ?? { total: 0, cancelled: 0, resolved: 0 };
    e.total += 1;
    if (s.cancelled) e.cancelled += 1;
    if (s.resolved_at) e.resolved += 1;
    sosByMonth.set(key, e);
  });
  const sos: SosStat[] = Array.from(sosByMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, counts]) => ({
      month: new Date(key + '-02').toLocaleDateString('ar-LB', { month: 'long', year: 'numeric' }),
      ...counts,
    }));

  const totalSos = sos.reduce((s, r) => s + r.total, 0);
  const avgMood  = moods.length ? (moods.reduce((s, m) => s + m.avg_score, 0) / moods.length).toFixed(1) : '—';

  const SUMMARY = [
    { label: 'إجمالي المستخدمات', value: totalUsersRes.count ?? 0,  icon: '👩', color: 'bg-primary/10 text-primary' },
    { label: 'مستخدمات جديدات (30 يوم)', value: newUsersRes.count ?? 0, icon: '✨', color: 'bg-accent/10 text-accent' },
    { label: 'أحداث SOS (6 أشهر)', value: totalSos, icon: '🆘', color: 'bg-red-50 text-red-600' },
    { label: 'متوسط المزاج (30 يوم)', value: avgMood, icon: '😊', color: 'bg-green-50 text-green-700' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-njoum-text">الإحصائيات والتحليلات</h1>
        <p className="text-sm text-njoum-muted mt-0.5">نظرة عامة على نشاط التطبيق وصحة المجتمع</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {SUMMARY.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-njoum-border p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${s.color}`}>
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-njoum-text">{s.value}</p>
            <p className="text-xs text-njoum-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Mood trend chart */}
      <div className="bg-white rounded-2xl border border-njoum-border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-njoum-text">متوسط المزاج اليومي — آخر 30 يوماً</h2>
          <span className="text-xs text-njoum-muted bg-njoum-bg px-3 py-1 rounded-full border border-njoum-border">
            {moods.length} يوم بيانات
          </span>
        </div>
        {moods.length > 0 ? (
          <MoodChart data={moods} />
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-3xl mb-2">😐</p>
            <p className="text-njoum-muted text-sm">لا توجد بيانات مزاج بعد.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module engagement */}
        <div className="bg-white rounded-2xl border border-njoum-border p-6">
          <h2 className="font-semibold text-njoum-text mb-5">تفاعل المحتوى حسب القسم</h2>
          <div className="space-y-4">
            {modules.map(m => (
              <div key={m.module}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium text-njoum-text flex items-center gap-2">
                    <span>{MODULE_ICONS[m.module]}</span>
                    {MODULE_LABELS[m.module] ?? m.module}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-njoum-muted">
                    <span>{m.article_count} مقالة</span>
                    <span className="font-semibold text-primary">{m.quiz_attempts} محاولة</span>
                  </div>
                </div>
                <div className="h-2 bg-njoum-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                    style={{ width: `${Math.max(Math.round((m.quiz_attempts / maxAttempts) * 100), m.quiz_attempts > 0 ? 4 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
            {modules.every(m => m.article_count === 0 && m.quiz_attempts === 0) && (
              <p className="text-center text-njoum-muted py-6 text-sm">لا توجد بيانات تفاعل بعد.</p>
            )}
          </div>
        </div>

        {/* SOS monthly */}
        <div className="bg-white rounded-2xl border border-njoum-border p-6">
          <h2 className="font-semibold text-njoum-text mb-5">إحصائيات SOS — آخر 6 أشهر</h2>
          {sos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-3xl mb-2">🆘</p>
              <p className="text-njoum-muted text-sm">لا توجد بيانات طوارئ.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-njoum-muted text-xs border-b border-njoum-border">
                  <th className="text-right pb-3 font-medium">الشهر</th>
                  <th className="text-right pb-3 font-medium">إجمالي</th>
                  <th className="text-right pb-3 font-medium">ملغى</th>
                  <th className="text-right pb-3 font-medium">محلول</th>
                  <th className="text-right pb-3 font-medium">نشط</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-njoum-border">
                {sos.map(s => {
                  const active = s.total - s.cancelled - s.resolved;
                  return (
                    <tr key={s.month} className="hover:bg-njoum-bg/50 transition-colors">
                      <td className="py-3 font-medium text-njoum-text">{s.month}</td>
                      <td className="py-3 font-semibold text-njoum-text">{s.total}</td>
                      <td className="py-3 text-amber-600">{s.cancelled}</td>
                      <td className="py-3 text-green-600">{s.resolved}</td>
                      <td className="py-3">
                        {active > 0
                          ? <span className="inline-flex items-center gap-1 text-red-600 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />{active}</span>
                          : <span className="text-njoum-muted">—</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
