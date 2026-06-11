// ============================================================
// /dashboard/mentors — Admin view of all mentor assignments
//
// Shows:
//  • Assignment status tabs (pending / active / ended)
//  • Mentee + mentor names, dates
//  • End assignment action
//  • View mentor's events + activities
// ============================================================
import { requireAdmin }   from '../../../lib/auth';
import { supabaseAdmin }  from '../../../lib/supabase/admin';
import EndAssignmentButton from './EndAssignmentButton';

type TabKey = 'pending' | 'active' | 'ended';

interface Assignment {
  id:          string;
  status:      string;
  started_at:  string | null;
  ended_at:    string | null;
  created_at:  string;
  message:     string | null;
  mentee:      { full_name: string | null; role: string } | null;
  mentor:      { full_name: string | null; role: string } | null;
}

interface Event {
  id:         string;
  title:      string;
  event_type: string;
  starts_at:  string | null;
  is_virtual: boolean;
  created_at: string;
  creator:    { full_name: string | null } | null;
}

interface Activity {
  id:          string;
  title:       string;
  difficulty:  string | null;
  created_at:  string;
  creator:     { full_name: string | null } | null;
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  active:  'bg-green-100 text-green-700',
  ended:   'bg-gray-100 text-gray-500',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  active:  'Active',
  ended:   'Ended',
};

async function getData(tab: TabKey) {
  const [assignmentsRes, eventsRes, activitiesRes] = await Promise.all([
    supabaseAdmin
      .from('mentor_assignments')
      .select(`
        id, status, started_at, ended_at, created_at, message,
        mentee:mentee_id ( full_name, role ),
        mentor:mentor_id ( full_name, role )
      `)
      .eq('status', tab)
      .order('created_at', { ascending: false })
      .limit(100),

    supabaseAdmin
      .from('events')
      .select(`
        id, title, event_type, starts_at, is_virtual, created_at,
        creator:created_by ( full_name )
      `)
      .is('deleted_at', null)
      .gte('created_at', new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString())
      .order('created_at', { ascending: false })
      .limit(50),

    supabaseAdmin
      .from('activities')
      .select(`
        id, title, difficulty, created_at,
        creator:created_by ( full_name )
      `)
      .not('created_by', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  return {
    assignments: (assignmentsRes.data ?? []) as unknown as Assignment[],
    events:      (eventsRes.data      ?? []) as unknown as Event[],
    activities:  (activitiesRes.data   ?? []) as unknown as Activity[],
  };
}

async function getCounts() {
  const [p, a, e] = await Promise.all([
    supabaseAdmin.from('mentor_assignments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('mentor_assignments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabaseAdmin.from('mentor_assignments').select('id', { count: 'exact', head: true }).eq('status', 'ended'),
  ]);
  return { pending: p.count ?? 0, active: a.count ?? 0, ended: e.count ?? 0 };
}

export default async function MentorsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();
  const sp    = await searchParams;
  const tab   = (sp.tab as TabKey) || 'active';
  const [{ assignments, events, activities }, counts] = await Promise.all([getData(tab), getCounts()]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'active',  label: `Active (${counts.active})`  },
    { key: 'pending', label: `Pending (${counts.pending})` },
    { key: 'ended',   label: `Ended (${counts.ended})`    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mentor Assignments</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage mentor–mentee relationships and monitor mentor-posted content.
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {tabs.map(t => (
          <a
            key={t.key}
            href={`?tab=${t.key}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {/* ── Assignment table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Mentee</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Mentor</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Started</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Message</th>
              {tab !== 'ended' && (
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  No {tab} assignments.
                </td>
              </tr>
            ) : (
              assignments.map(a => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">
                      {a.mentee?.full_name ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-purple-700">
                      {a.mentor?.full_name ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[a.status]}`}>
                      {STATUS_LABEL[a.status] ?? a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {a.started_at
                      ? new Date(a.started_at).toLocaleDateString('en-GB', { dateStyle: 'medium' })
                      : new Date(a.created_at).toLocaleDateString('en-GB', { dateStyle: 'medium' })}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                    {a.message ?? <span className="text-gray-300 italic">none</span>}
                  </td>
                  {tab !== 'ended' && (
                    <td className="px-4 py-3">
                      <EndAssignmentButton assignmentId={a.id} />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mentor content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Events posted by mentors */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-800">📅 Mentor-Posted Events (last 30 days)</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {events.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">No mentor events yet.</p>
            ) : (
              events.map(ev => (
                <div key={ev.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{ev.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        By {ev.creator?.full_name ?? '—'} ·{' '}
                        {ev.starts_at
                          ? new Date(ev.starts_at).toLocaleDateString('en-GB', { dateStyle: 'medium' })
                          : 'TBD'}
                      </p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                      ev.is_virtual ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {ev.is_virtual ? 'Virtual' : 'In-person'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Scout activities posted by mentors */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-800">⭐ Mentor-Created Scout Activities</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {activities.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">No mentor activities yet.</p>
            ) : (
              activities.map(act => (
                <div key={act.id} className="px-4 py-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{act.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      By {act.creator?.full_name ?? '—'} ·{' '}
                      {new Date(act.created_at).toLocaleDateString('en-GB', { dateStyle: 'medium' })}
                    </p>
                  </div>
                  {act.difficulty && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      {act.difficulty}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
