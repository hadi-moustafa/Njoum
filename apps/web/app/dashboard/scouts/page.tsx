import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

const TIER_LABELS: Record<string, string> = {
  brownie_6_8:   'براعم ٦-٨',
  guide_9_12:    'مرشدات ٩-١٢',
  senior_13_17:  'رائدات ١٣-١٧',
};

const CATEGORY_ICONS: Record<string, string> = {
  safety: '🛡️', self_defence: '🥊', wellness: '💚',
  scouts: '⭐', community: '🤝', first_aid: '🩺', legal: '⚖️',
};

const AGE_TIER_LABELS: Record<string, string> = {
  all:          'الكل',
  brownie_6_8:  'براعم',
  guide_9_12:   'مرشدات',
  senior_13_17: 'رائدات',
};

export default async function ScoutsPage({ searchParams }: { searchParams: { tab?: string } }) {
  await requireAdmin();
  const tab = searchParams.tab ?? 'troops';

  const [troopsRes, activitiesRes, badgesRes] = await Promise.all([
    supabaseAdmin
      .from('scouts_troops')
      .select('id, name, region, country, age_tier, created_at, users!leader_id(full_name)')
      .order('created_at'),
    supabaseAdmin
      .from('activities')
      .select('id, title, description, age_tier, category, is_offline_capable, badge_id')
      .order('category'),
    supabaseAdmin
      .from('badges')
      .select('id, name, description, module, category, created_at')
      .order('module'),
  ]);

  const troops     = troopsRes.data     ?? [];
  const activities = activitiesRes.data ?? [];
  const badges     = badgesRes.data     ?? [];

  // Troop member counts
  const memberCounts: Record<string, number> = {};
  if (troops.length > 0) {
    const ids = troops.map((t: any) => t.id);
    const { data: members } = await supabaseAdmin
      .from('troop_members')
      .select('troop_id')
      .in('troop_id', ids)
      .eq('status', 'active');
    (members ?? []).forEach((m: any) => {
      memberCounts[m.troop_id] = (memberCounts[m.troop_id] ?? 0) + 1;
    });
  }

  const TABS = [
    { key: 'troops',     label: 'الأفواج',   icon: '🏕️', count: troops.length },
    { key: 'activities', label: 'الأنشطة',   icon: '🎯', count: activities.length },
    { key: 'badges',     label: 'الشارات',   icon: '⭐', count: badges.length },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-njoum-text">برنامج الكشافة</h1>
        <p className="text-sm text-njoum-muted mt-0.5">
          {troops.length} فوج · {activities.length} نشاط · {badges.length} شارة
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-njoum-bg rounded-xl p-1 mb-6 w-fit border border-njoum-border">
        {TABS.map(t => (
          <a key={t.key} href={`/dashboard/scouts?tab=${t.key}`}
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

      {/* Troops */}
      {tab === 'troops' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(troops ?? []).map((t: any) => (
            <div key={t.id} className="bg-white rounded-2xl border border-njoum-border p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">🏕️</div>
                <span className="text-xs px-2 py-1 rounded-full bg-njoum-bg text-njoum-muted border border-njoum-border">
                  {TIER_LABELS[t.age_tier] ?? t.age_tier}
                </span>
              </div>
              <h3 className="font-semibold text-njoum-text mb-1">{t.name}</h3>
              <p className="text-xs text-njoum-muted mb-3">{t.region} · {t.country}</p>
              <div className="flex items-center justify-between text-xs text-njoum-muted border-t border-njoum-border pt-3 mt-3">
                <span>قائدة: {(t.users as any)?.full_name ?? '—'}</span>
                <span className="font-semibold text-primary">{memberCounts[t.id] ?? 0} عضوة</span>
              </div>
            </div>
          ))}
          {(troops ?? []).length === 0 && (
            <div className="col-span-3 py-16 text-center bg-white rounded-2xl border border-njoum-border">
              <p className="text-4xl mb-2">🏕️</p><p className="text-njoum-muted text-sm">لا توجد أفواج بعد.</p>
            </div>
          )}
        </div>
      )}

      {/* Activities */}
      {tab === 'activities' && (
        <div className="bg-white rounded-2xl border border-njoum-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-njoum-bg"><tr>
              <th className="text-right px-6 py-3 text-njoum-muted font-medium">النشاط</th>
              <th className="text-right px-6 py-3 text-njoum-muted font-medium">الفئة</th>
              <th className="text-right px-6 py-3 text-njoum-muted font-medium">الفئة العمرية</th>
              <th className="text-right px-6 py-3 text-njoum-muted font-medium">بدون إنترنت</th>
            </tr></thead>
            <tbody className="divide-y divide-njoum-border">
              {(activities ?? []).map((a: any) => (
                <tr key={a.id} className="hover:bg-njoum-bg/40 transition-colors">
                  <td className="px-6 py-3">
                    <p className="font-medium text-njoum-text">{a.title}</p>
                    <p className="text-xs text-njoum-muted truncate max-w-xs">{a.description}</p>
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-lg">{CATEGORY_ICONS[a.category] ?? '📋'}</span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-njoum-bg text-njoum-muted border border-njoum-border">
                      {AGE_TIER_LABELS[a.age_tier] ?? a.age_tier}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    {a.is_offline_capable
                      ? <span className="text-green-600 text-sm">✓</span>
                      : <span className="text-njoum-muted text-sm">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(activities ?? []).length === 0 && (
            <div className="py-16 text-center"><p className="text-4xl mb-2">🎯</p><p className="text-njoum-muted text-sm">لا توجد أنشطة بعد.</p></div>
          )}
        </div>
      )}

      {/* Badges */}
      {tab === 'badges' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {(badges ?? []).map((b: any) => (
            <div key={b.id} className="bg-white rounded-2xl border border-njoum-border p-5 text-center hover:border-primary/40 transition-colors">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl mx-auto mb-3">
                {CATEGORY_ICONS[b.module] ?? '⭐'}
              </div>
              <h3 className="font-semibold text-njoum-text text-sm mb-1">{b.name}</h3>
              <p className="text-xs text-njoum-muted leading-relaxed">{b.description}</p>
              <div className="mt-3 pt-3 border-t border-njoum-border">
                <span className="text-xs text-njoum-muted/80 bg-njoum-bg px-2 py-0.5 rounded-full">{b.category}</span>
              </div>
            </div>
          ))}
          {(badges ?? []).length === 0 && (
            <div className="col-span-4 py-16 text-center bg-white rounded-2xl border border-njoum-border">
              <p className="text-4xl mb-2">⭐</p><p className="text-njoum-muted text-sm">لا توجد شارات بعد.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
