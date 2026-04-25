import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import Link from 'next/link';
import ContentActions from './ContentActions';

const MODULE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  safety:       { label: 'السلامة',          icon: '🛡️', color: 'bg-blue-50 text-blue-700 border-blue-200'     },
  mental_health:{ label: 'الصحة النفسية',    icon: '🧠', color: 'bg-depth/10 text-depth border-depth/20'       },
  legal:        { label: 'القانون',          icon: '⚖️', color: 'bg-amber-50 text-amber-700 border-amber-200'  },
  wellness:     { label: 'العافية',          icon: '💚', color: 'bg-green-50 text-green-700 border-green-200'  },
  self_defence: { label: 'الدفاع عن النفس',  icon: '🥊', color: 'bg-orange-50 text-orange-700 border-orange-200' },
};

const LANG_LABELS: Record<string, string> = { ar: 'العربية', en: 'English', fr: 'Français' };
const DIFF_LABELS: Record<string, string> = { beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم' };

function ModuleBadge({ module }: { module: string }) {
  const cfg = MODULE_CONFIG[module] ?? { label: module, icon: '📄', color: 'bg-gray-100 text-gray-600 border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

export default async function ContentPage({ searchParams }: { searchParams: { tab?: string } }) {
  await requireAdmin();
  const tab = searchParams.tab ?? 'articles';

  const [articlesRes, quizzesRes, videosRes] = await Promise.all([
    supabaseAdmin
      .from('content_articles')
      .select('id, title, module, language, is_published, created_at')
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('safety_quizzes')
      .select('id, title, module, difficulty, created_at')
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('self_defence_videos')
      .select('id, title, scenario_category, is_published, duration_seconds, created_at')
      .order('created_at', { ascending: false }),
  ]);

  const articles = articlesRes.data ?? [];
  const quizzes  = quizzesRes.data  ?? [];
  const videos   = videosRes.data   ?? [];

  const TABS = [
    { key: 'articles', label: 'المقالات',   count: articles.length, icon: '📖' },
    { key: 'quizzes',  label: 'الاختبارات', count: quizzes.length,  icon: '❓' },
    { key: 'videos',   label: 'الفيديوهات', count: videos.length,   icon: '🎬' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-njoum-text">إدارة المحتوى</h1>
          <p className="text-sm text-njoum-muted mt-0.5">
            {articles.filter((a: any) => a.is_published).length} مقالة منشورة من {articles.length}
          </p>
        </div>
        <Link
          href="/dashboard/content/new"
          className="flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2 text-sm font-semibold hover:opacity-90 transition"
        >
          <span className="text-lg leading-none">+</span>
          مقالة جديدة
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-njoum-bg rounded-xl p-1 mb-6 w-fit border border-njoum-border">
        {TABS.map(t => (
          <a
            key={t.key}
            href={`/dashboard/content?tab=${t.key}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.key
                ? 'bg-white text-njoum-text shadow-sm border border-njoum-border'
                : 'text-njoum-muted hover:text-njoum-text'
            }`}
          >
            {t.icon} {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-primary/10 text-primary' : 'bg-njoum-border text-njoum-muted'}`}>
              {t.count}
            </span>
          </a>
        ))}
      </div>

      {/* Articles tab */}
      {tab === 'articles' && (
        <div className="bg-white rounded-2xl border border-njoum-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-njoum-bg">
              <tr>
                <th className="text-right px-6 py-3 text-njoum-muted font-medium">العنوان</th>
                <th className="text-right px-6 py-3 text-njoum-muted font-medium">القسم</th>
                <th className="text-right px-6 py-3 text-njoum-muted font-medium">اللغة</th>
                <th className="text-right px-6 py-3 text-njoum-muted font-medium">الحالة</th>
                <th className="text-right px-6 py-3 text-njoum-muted font-medium">التاريخ</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-njoum-border">
              {articles.map((a: any) => (
                <tr key={a.id} className="hover:bg-njoum-bg/40 transition-colors">
                  <td className="px-6 py-3 font-medium text-njoum-text max-w-xs truncate">{a.title}</td>
                  <td className="px-6 py-3"><ModuleBadge module={a.module} /></td>
                  <td className="px-6 py-3 text-xs text-njoum-muted font-mono">{LANG_LABELS[a.language] ?? a.language}</td>
                  <td className="px-6 py-3">
                    {a.is_published
                      ? <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">منشور</span>
                      : <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">مسودة</span>}
                  </td>
                  <td className="px-6 py-3 text-njoum-muted text-xs">
                    {new Date(a.created_at).toLocaleDateString('ar-LB', { dateStyle: 'short' })}
                  </td>
                  <td className="px-6 py-3"><ContentActions id={a.id} isPublished={a.is_published} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {articles.length === 0 && (
            <div className="py-16 text-center"><p className="text-4xl mb-2">📖</p><p className="text-njoum-muted text-sm">لا توجد مقالات بعد.</p></div>
          )}
        </div>
      )}

      {/* Quizzes tab */}
      {tab === 'quizzes' && (
        <div className="bg-white rounded-2xl border border-njoum-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-njoum-bg">
              <tr>
                <th className="text-right px-6 py-3 text-njoum-muted font-medium">العنوان</th>
                <th className="text-right px-6 py-3 text-njoum-muted font-medium">القسم</th>
                <th className="text-right px-6 py-3 text-njoum-muted font-medium">الصعوبة</th>
                <th className="text-right px-6 py-3 text-njoum-muted font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-njoum-border">
              {quizzes.map((q: any) => (
                <tr key={q.id} className="hover:bg-njoum-bg/40 transition-colors">
                  <td className="px-6 py-3 font-medium text-njoum-text">{q.title}</td>
                  <td className="px-6 py-3"><ModuleBadge module={q.module} /></td>
                  <td className="px-6 py-3 text-xs text-njoum-muted">{DIFF_LABELS[q.difficulty] ?? q.difficulty}</td>
                  <td className="px-6 py-3 text-njoum-muted text-xs">
                    {new Date(q.created_at).toLocaleDateString('ar-LB', { dateStyle: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {quizzes.length === 0 && (
            <div className="py-16 text-center"><p className="text-4xl mb-2">❓</p><p className="text-njoum-muted text-sm">لا توجد اختبارات بعد.</p></div>
          )}
        </div>
      )}

      {/* Videos tab */}
      {tab === 'videos' && (
        <div className="bg-white rounded-2xl border border-njoum-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-njoum-bg"><tr>
              <th className="text-right px-6 py-3 text-njoum-muted font-medium">العنوان</th>
              <th className="text-right px-6 py-3 text-njoum-muted font-medium">الفئة</th>
              <th className="text-right px-6 py-3 text-njoum-muted font-medium">المدة</th>
              <th className="text-right px-6 py-3 text-njoum-muted font-medium">الحالة</th>
            </tr></thead>
            <tbody className="divide-y divide-njoum-border">
              {videos.map((v: any) => (
                <tr key={v.id} className="hover:bg-njoum-bg/40 transition-colors">
                  <td className="px-6 py-3 font-medium text-njoum-text">{v.title}</td>
                  <td className="px-6 py-3 text-njoum-muted text-xs">{v.scenario_category}</td>
                  <td className="px-6 py-3 text-njoum-muted text-xs">
                    {v.duration_seconds ? `${Math.floor(v.duration_seconds / 60)} دقيقة` : '—'}
                  </td>
                  <td className="px-6 py-3">
                    {v.is_published
                      ? <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">منشور</span>
                      : <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">مسودة</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {videos.length === 0 && (
            <div className="py-16 text-center"><p className="text-4xl mb-2">🎬</p><p className="text-njoum-muted text-sm">لا توجد فيديوهات بعد.</p></div>
          )}
        </div>
      )}
    </div>
  );
}
