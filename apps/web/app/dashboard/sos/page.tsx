// ============================================================
// /dashboard/sos — Admin SOS management page.
// Shows all SOS events with status, trigger method, location,
// and contacts alerted. Links to the live tracking page.
// ============================================================
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const TRIGGER_LABELS: Record<string, string> = {
  button:    'زر',
  shake:     'اهتزاز',
  volume:    'صوت',
  safe_word: 'كلمة آمنة',
};

function StatusBadge({ cancelled, resolvedAt }: { cancelled: boolean; resolvedAt: string | null }) {
  if (cancelled) {
    return (
      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
        ملغى
      </span>
    );
  }
  if (resolvedAt) {
    return (
      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
        محلول
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
      نشط
    </span>
  );
}

export default async function SOSAdminPage() {
  await requireAdmin();

  const [eventsRes, notifRes] = await Promise.all([
    supabaseAdmin
      .from('sos_events')
      .select('id, user_id, trigger_method, cancelled, resolved_at, created_at, lat, lng, users(full_name)')
      .order('created_at', { ascending: false })
      .limit(100),
    supabaseAdmin
      .from('sos_notifications')
      .select('sos_event_id, status')
  ]);

  const events  = (eventsRes.data ?? []) as any[];
  const notifs  = (notifRes.data ?? []) as any[];

  // Build a quick map: sos_event_id → { sent, failed, pending }
  const notifMap: Record<string, { sent: number; failed: number; pending: number }> = {};
  for (const n of notifs) {
    if (!notifMap[n.sos_event_id]) notifMap[n.sos_event_id] = { sent: 0, failed: 0, pending: 0 };
    notifMap[n.sos_event_id][n.status as 'sent' | 'failed' | 'pending']++;
  }

  const active    = events.filter(e => !e.cancelled && !e.resolved_at);
  const resolved  = events.filter(e =>  e.resolved_at);
  const cancelled = events.filter(e =>  e.cancelled);

  function EventTable({ rows }: { rows: any[] }) {
    if (!rows.length) {
      return (
        <div className="py-10 text-center text-njoum-muted text-sm">لا توجد بيانات</div>
      );
    }
    return (
      <table className="w-full text-sm">
        <thead className="bg-njoum-bg">
          <tr>
            <th className="text-right px-4 py-3 text-njoum-muted font-medium">المستخدمة</th>
            <th className="text-right px-4 py-3 text-njoum-muted font-medium">التفعيل</th>
            <th className="text-right px-4 py-3 text-njoum-muted font-medium">الوقت</th>
            <th className="text-right px-4 py-3 text-njoum-muted font-medium">الموقع</th>
            <th className="text-right px-4 py-3 text-njoum-muted font-medium">الإشعارات</th>
            <th className="text-right px-4 py-3 text-njoum-muted font-medium">الحالة</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-njoum-border">
          {rows.map((e: any) => {
            const n = notifMap[e.id] ?? { sent: 0, failed: 0, pending: 0 };
            const hasLocation = e.lat && e.lng;
            return (
              <tr key={e.id} className="hover:bg-njoum-bg/50 transition-colors">
                <td className="px-4 py-3 font-medium text-njoum-text">
                  {(e.users as any)?.full_name ?? 'مجهول'}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full bg-njoum-bg border border-njoum-border text-njoum-muted text-xs">
                    {TRIGGER_LABELS[e.trigger_method] ?? e.trigger_method}
                  </span>
                </td>
                <td className="px-4 py-3 text-njoum-muted text-xs">
                  {new Date(e.created_at).toLocaleString('ar-LB', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="px-4 py-3 text-xs font-mono text-njoum-muted">
                  {hasLocation ? `${e.lat.toFixed(4)}, ${e.lng.toFixed(4)}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 text-xs">
                    {n.sent    > 0 && <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700">{n.sent} أُرسل</span>}
                    {n.failed  > 0 && <span className="px-1.5 py-0.5 rounded bg-red-100   text-red-700  ">{n.failed} فشل</span>}
                    {n.pending > 0 && <span className="px-1.5 py-0.5 rounded bg-gray-100   text-gray-500 ">{n.pending} معلق</span>}
                    {n.sent + n.failed + n.pending === 0 && <span className="text-njoum-muted">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge cancelled={e.cancelled} resolvedAt={e.resolved_at} />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/track/${e.id}`}
                    target="_blank"
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    تتبع
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-njoum-text">نداءات SOS</h1>
        <p className="text-njoum-muted text-sm mt-1">جميع نداءات الاستغاثة مع حالة الإشعارات والموقع</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-njoum-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-xl">🆘</div>
          <div>
            <p className="text-xs text-njoum-muted">نشط الآن</p>
            <p className="text-2xl font-bold text-red-600">{active.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-njoum-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl">✅</div>
          <div>
            <p className="text-xs text-njoum-muted">محلول</p>
            <p className="text-2xl font-bold text-green-700">{resolved.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-njoum-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl">❌</div>
          <div>
            <p className="text-xs text-njoum-muted">ملغى</p>
            <p className="text-2xl font-bold text-gray-600">{cancelled.length}</p>
          </div>
        </div>
      </div>

      {/* Active events (always shown first) */}
      {active.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-red-200 overflow-hidden mb-4">
          <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
            <h2 className="font-semibold text-red-700">نداءات نشطة</h2>
          </div>
          <EventTable rows={active} />
        </div>
      )}

      {/* All events */}
      <div className="bg-white rounded-2xl border border-njoum-border overflow-hidden">
        <div className="px-6 py-4 border-b border-njoum-border">
          <h2 className="font-semibold text-njoum-text">السجل الكامل</h2>
        </div>
        <EventTable rows={events} />
      </div>
    </div>
  );
}
