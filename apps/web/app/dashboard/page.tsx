import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

const TRIGGER_LABELS: Record<string, string> = {
  button: 'زر', shake: 'اهتزاز', volume: 'صوت', safe_word: 'كلمة آمنة',
};

function StatCard({ label, value, icon, color, bg }: {
  label: string; value: number; icon: string; color: string; bg: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-njoum-border p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center text-2xl flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-njoum-muted">{label}</p>
        <p className={`text-3xl font-bold mt-0.5 ${color}`}>{value.toLocaleString('ar-LB')}</p>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  await requireAdmin();

  const [usersRes, sosRes, reportsRes, articlesRes, recentSosRes] = await Promise.all([
    supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabaseAdmin.from('sos_events').select('id', { count: 'exact', head: true }).is('resolved_at', null).eq('cancelled', false),
    supabaseAdmin.from('content_reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabaseAdmin.from('content_articles').select('id', { count: 'exact', head: true }).eq('is_published', true),
    supabaseAdmin
      .from('sos_events')
      .select('id, user_id, trigger_method, cancelled, resolved_at, created_at, users(full_name)')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const stats = {
    total_users:    usersRes.count    ?? 0,
    active_sos:     sosRes.count      ?? 0,
    open_reports:   reportsRes.count  ?? 0,
    total_articles: articlesRes.count ?? 0,
  };
  const events = (recentSosRes.data ?? []) as any[];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-njoum-text">لوحة التحكم</h1>
        <p className="text-njoum-muted text-sm mt-1">مرحباً — إليكِ نظرة عامة على حالة التطبيق</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="إجمالي المستخدمات"  value={stats.total_users}    icon="👥" color="text-primary"         bg="bg-primary/10"       />
        <StatCard label="نداءات SOS نشطة"    value={stats.active_sos}     icon="🆘" color="text-red-600"         bg="bg-red-50"           />
        <StatCard label="بلاغات مفتوحة"       value={stats.open_reports}   icon="🛡️" color="text-amber-600"       bg="bg-amber-50"         />
        <StatCard label="مقالات منشورة"       value={stats.total_articles} icon="📖" color="text-depth"           bg="bg-depth/10"         />
      </div>

      {/* Recent SOS */}
      <div className="bg-white rounded-2xl border border-njoum-border overflow-hidden">
        <div className="px-6 py-4 border-b border-njoum-border flex items-center justify-between">
          <h2 className="font-semibold text-njoum-text">نداءات SOS الأخيرة</h2>
          {stats.active_sos > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
              {stats.active_sos} نشط
            </span>
          )}
        </div>
        {events.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-2">✅</p>
            <p className="text-njoum-muted text-sm">لا توجد نداءات SOS حديثة</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-njoum-bg">
              <tr>
                <th className="text-right px-6 py-3 text-njoum-muted font-medium">المستخدمة</th>
                <th className="text-right px-6 py-3 text-njoum-muted font-medium">طريقة التفعيل</th>
                <th className="text-right px-6 py-3 text-njoum-muted font-medium">الوقت</th>
                <th className="text-right px-6 py-3 text-njoum-muted font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-njoum-border">
              {events.map((e: any) => (
                <tr key={e.id} className="hover:bg-njoum-bg/50 transition-colors">
                  <td className="px-6 py-3 font-medium text-njoum-text">
                    {(e.users as any)?.full_name ?? 'مجهول'}
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-njoum-bg text-njoum-muted text-xs font-medium border border-njoum-border">
                      {TRIGGER_LABELS[e.trigger_method] ?? e.trigger_method}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-njoum-muted">
                    {new Date(e.created_at).toLocaleString('ar-LB', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-6 py-3">
                    {e.cancelled ? (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">ملغى</span>
                    ) : e.resolved_at ? (
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">محلول</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                        نشط
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
