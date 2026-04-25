import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import ResolveButton from './ResolveButton';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open:         { label: 'مفتوح',        color: 'bg-red-100 text-red-700 border-red-200'      },
  under_review: { label: 'قيد المراجعة', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  resolved:     { label: 'محلول',        color: 'bg-green-100 text-green-700 border-green-200' },
  dismissed:    { label: 'مرفوض',        color: 'bg-gray-100 text-gray-600 border-gray-200'   },
};

const TARGET_CONFIG: Record<string, { label: string; icon: string }> = {
  post:    { label: 'منشور',    icon: '📝' },
  comment: { label: 'تعليق',   icon: '💬' },
  user:    { label: 'مستخدمة', icon: '👤' },
};

export default async function ModerationPage({ searchParams }: { searchParams: { status?: string } }) {
  await requireAdmin();
  const status = searchParams.status ?? 'open';

  const { data: reports = [] } = await supabaseAdmin
    .from('content_reports')
    .select('id, reported_by, target_type, target_id, reason, status, created_at, reviewed_at, users!reported_by(full_name)')
    .eq('status', status)
    .order('created_at', { ascending: true });

  const STATUSES = ['open', 'under_review', 'resolved', 'dismissed'];

  const counts = await Promise.all(
    STATUSES.map(s =>
      supabaseAdmin.from('content_reports').select('id', { count: 'exact', head: true }).eq('status', s)
    )
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-njoum-text">الإشراف على المحتوى</h1>
        <p className="text-sm text-njoum-muted mt-0.5">مراجعة البلاغات المُقدَّمة من المستخدمات</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {STATUSES.map((s, i) => {
          const cfg = STATUS_CONFIG[s]!;
          const count = counts[i]?.count ?? 0;
          return (
            <a
              key={s}
              href={`/dashboard/moderation?status=${s}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                status === s ? cfg.color : 'bg-white text-njoum-muted border-njoum-border hover:border-primary hover:text-primary'
              }`}
            >
              {cfg.label}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${status === s ? 'bg-white/50' : 'bg-njoum-bg'}`}>
                  {count}
                </span>
              )}
            </a>
          );
        })}
      </div>

      {/* Reports */}
      {(reports ?? []).length === 0 ? (
        <div className="bg-white rounded-2xl border border-njoum-border py-20 text-center">
          <p className="text-5xl mb-3">✅</p>
          <p className="font-semibold text-njoum-text mb-1">
            {status === 'open' ? 'لا توجد بلاغات مفتوحة' : 'لا توجد بلاغات هنا'}
          </p>
          <p className="text-njoum-muted text-sm">المجتمع آمن وخالٍ من المشكلات</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {(reports ?? []).map((r: any) => {
            const targetCfg = TARGET_CONFIG[r.target_type] ?? { label: r.target_type, icon: '❓' };
            const statusCfg = STATUS_CONFIG[r.status]!;
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-njoum-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-lg">{targetCfg.icon}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-njoum-bg text-njoum-muted border-njoum-border">
                        {targetCfg.label}
                      </span>
                    </div>
                    <p className="text-njoum-text font-medium mb-1">{r.reason}</p>
                    <div className="flex items-center gap-3 text-xs text-njoum-muted">
                      <span>
                        مُبلَّغ بواسطة: {(r.users as any)?.full_name ?? 'مجهول'}
                      </span>
                      <span>·</span>
                      <span>{new Date(r.created_at).toLocaleDateString('ar-LB', { dateStyle: 'medium' })}</span>
                      <span>·</span>
                      <span className="font-mono text-xs opacity-60">{r.target_id?.slice(0, 8)}…</span>
                    </div>
                  </div>
                  {status === 'open' || status === 'under_review' ? (
                    <ResolveButton reportId={r.id} targetType={r.target_type} targetId={r.target_id} />
                  ) : (
                    r.reviewed_at && (
                      <span className="text-xs text-njoum-muted">
                        {new Date(r.reviewed_at).toLocaleDateString('ar-LB', { dateStyle: 'short' })}
                      </span>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
