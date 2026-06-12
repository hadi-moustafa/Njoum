import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import EventForm from './EventForm';
import DeleteEventButton from './DeleteEventButton';
import EditEventButton from './EditEventButton';

const TYPE_LABELS: Record<string, string> = {
  workshop:          'ورشة عمل',
  webinar:           'ندوة إلكترونية',
  meetup:            'لقاء',
  troop_meeting:     'اجتماع كشافة',
  community_service: 'خدمة مجتمعية',
};

const TYPE_EMOJIS: Record<string, string> = {
  workshop: '🔧', webinar: '💻', meetup: '🤝', troop_meeting: '⭐', community_service: '❤️',
};

export default async function EventsPage({ searchParams }: { searchParams: { tab?: string } }) {
  await requireAdmin();
  const now = new Date().toISOString();

  const [upcomingRes, pastRes] = await Promise.all([
    supabaseAdmin
      .from('events')
      .select('id, title, description, event_type, starts_at, ends_at, country, region, is_online, url, created_at')
      .gte('starts_at', now)
      .is('deleted_at', null)
      .order('starts_at', { ascending: true }),
    supabaseAdmin
      .from('events')
      .select('id, title, event_type, starts_at, is_online')
      .lt('starts_at', now)
      .is('deleted_at', null)
      .order('starts_at', { ascending: false })
      .limit(20),
  ]);

  const upcoming = upcomingRes.data ?? [];
  const past     = pastRes.data     ?? [];
  const tab      = searchParams.tab ?? 'upcoming';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-njoum-text">إدارة الفعاليات</h1>
          <p className="text-sm text-njoum-muted mt-0.5">{upcoming.length} فعالية قادمة</p>
        </div>
        <EventForm />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-njoum-bg rounded-xl p-1 mb-6 w-fit border border-njoum-border">
        {[
          { key: 'upcoming', label: 'القادمة', count: upcoming.length },
          { key: 'past',     label: 'السابقة', count: past.length    },
        ].map(t => (
          <a
            key={t.key}
            href={`/dashboard/events?tab=${t.key}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.key
                ? 'bg-white text-njoum-text shadow-sm border border-njoum-border'
                : 'text-njoum-muted hover:text-njoum-text'
            }`}
          >
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-primary/10 text-primary' : 'bg-njoum-border text-njoum-muted'}`}>
              {t.count}
            </span>
          </a>
        ))}
      </div>

      {tab === 'upcoming' && (
        <div className="space-y-3">
          {upcoming.length === 0 && (
            <div className="bg-white rounded-2xl border border-njoum-border py-16 text-center">
              <p className="text-4xl mb-2">📅</p>
              <p className="text-njoum-muted">لا توجد فعاليات قادمة. أضيفي فعالية!</p>
            </div>
          )}
          {upcoming.map((e: any) => (
            <div key={e.id} className="bg-white rounded-2xl border border-njoum-border p-5">
              <div className="flex items-start justify-between">
                <div className="flex gap-2">
                  <EditEventButton event={e} />
                  <DeleteEventButton id={e.id} />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      {TYPE_EMOJIS[e.event_type]} {TYPE_LABELS[e.event_type] ?? e.event_type}
                    </span>
                    {e.is_online && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        🌐 إلكترونية
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-njoum-text">{e.title}</h3>
                  {e.description && <p className="text-sm text-njoum-muted mt-0.5 line-clamp-2">{e.description}</p>}
                  <div className="flex gap-4 mt-2 justify-end">
                    <span className="text-xs text-njoum-muted">
                      🕐 {new Date(e.starts_at).toLocaleString('ar-LB', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    {(e.region || e.country) && <span className="text-xs text-njoum-muted">📍 {[e.region, e.country].filter(Boolean).join(', ')}</span>}
                  </div>
                  {e.url && (
                    <a href={e.url} target="_blank" rel="noreferrer"
                      className="text-xs text-primary hover:underline mt-1 block text-right">
                      🔗 رابط الانضمام
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'past' && (
        <div className="bg-white rounded-2xl border border-njoum-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-njoum-bg">
              <tr>
                <th className="text-right px-6 py-3 text-njoum-muted font-medium">العنوان</th>
                <th className="text-right px-6 py-3 text-njoum-muted font-medium">النوع</th>
                <th className="text-right px-6 py-3 text-njoum-muted font-medium">التاريخ</th>
                <th className="text-right px-6 py-3 text-njoum-muted font-medium">النوع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-njoum-border">
              {past.map((e: any) => (
                <tr key={e.id} className="hover:bg-njoum-bg/40">
                  <td className="px-6 py-3 font-medium text-njoum-text">{e.title}</td>
                  <td className="px-6 py-3 text-xs text-njoum-muted">{TYPE_LABELS[e.event_type] ?? e.event_type}</td>
                  <td className="px-6 py-3 text-xs text-njoum-muted">
                    {new Date(e.starts_at).toLocaleDateString('ar-LB', { dateStyle: 'short' })}
                  </td>
                  <td className="px-6 py-3">
                    {e.is_online
                      ? <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">إلكترونية</span>
                      : <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">حضورية</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {past.length === 0 && (
            <div className="py-12 text-center text-njoum-muted">لا توجد فعاليات سابقة.</div>
          )}
        </div>
      )}
    </div>
  );
}
