'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTroop, createActivity, createBadge } from '@/app/actions/scouts';
import { toast } from 'sonner';

const AGE_TIERS = [
  { value: 'all',           label: 'الكل'                },
  { value: 'brownie_6_8',   label: 'براعم ٦-٨'          },
  { value: 'guide_9_12',    label: 'مرشدات ٩-١٢'        },
  { value: 'senior_13_17',  label: 'رائدات ١٣-١٧'       },
];

const ACTIVITY_CATEGORIES = [
  { value: 'safety',        label: 'السلامة'             },
  { value: 'self_defence',  label: 'الدفاع عن النفس'    },
  { value: 'wellness',      label: 'العافية'             },
  { value: 'scouts',        label: 'الكشافة'             },
  { value: 'community',     label: 'المجتمع'             },
  { value: 'first_aid',     label: 'الإسعافات الأولية'  },
  { value: 'legal',         label: 'القانون'             },
];

const BADGE_MODULES = [
  { value: 'scouts',        label: 'الكشافة'             },
  { value: 'self_defence',  label: 'الدفاع عن النفس'    },
  { value: 'wellness',      label: 'العافية'             },
  { value: 'safety',        label: 'السلامة'             },
  { value: 'community',     label: 'المجتمع'             },
];

type Mode = 'troop' | 'activity' | 'badge';

interface Props {
  mode:     Mode;
  label:    string;
  badgeIds?: { id: string; name: string }[];
}

export default function ScoutsCreate({ mode, label, badgeIds = [] }: Props) {
  const router = useRouter();
  const [open,   setOpen]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const [troop, setTroop] = useState({ name: '', region: '', country: 'LB', age_tier: 'guide_9_12' });
  const [activity, setActivity] = useState({
    title: '', description: '', age_tier: 'all',
    category: 'safety', is_offline_capable: false, badge_id: '',
  });
  const [badge, setBadge] = useState({ name: '', description: '', module: 'scouts', category: '' });

  function updateTroop(f: string, v: unknown)    { setTroop(p    => ({ ...p, [f]: v })); }
  function updateActivity(f: string, v: unknown) { setActivity(p => ({ ...p, [f]: v })); }
  function updateBadge(f: string, v: unknown)    { setBadge(p    => ({ ...p, [f]: v })); }

  async function save() {
    setSaving(true); setError(null);
    let result: { success: true } | { error: string };

    if (mode === 'troop') {
      if (!troop.name.trim()) { setError('اسم الفوج مطلوب'); setSaving(false); return; }
      result = await createTroop(troop);
    } else if (mode === 'activity') {
      if (!activity.title.trim()) { setError('عنوان النشاط مطلوب'); setSaving(false); return; }
      result = await createActivity({ ...activity, badge_id: activity.badge_id || null });
    } else {
      if (!badge.name.trim()) { setError('اسم الشارة مطلوب'); setSaving(false); return; }
      result = await createBadge(badge);
    }

    setSaving(false);
    if ('error' in result) { setError(result.error); return; }
    toast.success('تمت الإضافة ✓');
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2 text-sm font-semibold hover:opacity-90 transition">
        <span className="text-lg leading-none">+</span>
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <button onClick={() => setOpen(false)} className="text-njoum-muted text-xl">✕</button>
              <h2 className="text-lg font-bold text-njoum-text">{label}</h2>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}

            <div className="space-y-3">
              {mode === 'troop' && (
                <>
                  <div>
                    <label className="block text-xs text-njoum-muted text-right mb-1">اسم الفوج *</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-right text-sm"
                      value={troop.name} onChange={e => updateTroop('name', e.target.value)}
                      placeholder="مثال: فوج نجوم بيروت" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-njoum-muted text-right mb-1">المنطقة</label>
                      <input className="w-full border rounded-lg px-3 py-2 text-right text-sm"
                        value={troop.region} onChange={e => updateTroop('region', e.target.value)} placeholder="بيروت" />
                    </div>
                    <div>
                      <label className="block text-xs text-njoum-muted text-right mb-1">البلد</label>
                      <input className="w-full border rounded-lg px-3 py-2 text-sm" dir="ltr"
                        value={troop.country} onChange={e => updateTroop('country', e.target.value)} placeholder="LB" maxLength={2} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-njoum-muted text-right mb-1">الفئة العمرية</label>
                    <select className="w-full border rounded-lg px-2 py-2 text-sm"
                      value={troop.age_tier} onChange={e => updateTroop('age_tier', e.target.value)}>
                      {AGE_TIERS.filter(t => t.value !== 'all').map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </>
              )}

              {mode === 'activity' && (
                <>
                  <div>
                    <label className="block text-xs text-njoum-muted text-right mb-1">عنوان النشاط *</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-right text-sm"
                      value={activity.title} onChange={e => updateActivity('title', e.target.value)}
                      placeholder="مثال: خريطة أماني" />
                  </div>
                  <div>
                    <label className="block text-xs text-njoum-muted text-right mb-1">الوصف</label>
                    <textarea className="w-full border rounded-lg px-3 py-2 text-right text-sm resize-none" rows={2}
                      value={activity.description} onChange={e => updateActivity('description', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-njoum-muted text-right mb-1">الفئة العمرية</label>
                      <select className="w-full border rounded-lg px-2 py-2 text-sm"
                        value={activity.age_tier} onChange={e => updateActivity('age_tier', e.target.value)}>
                        {AGE_TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-njoum-muted text-right mb-1">تصنيف النشاط</label>
                      <select className="w-full border rounded-lg px-2 py-2 text-sm"
                        value={activity.category} onChange={e => updateActivity('category', e.target.value)}>
                        {ACTIVITY_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>
                  {badgeIds.length > 0 && (
                    <div>
                      <label className="block text-xs text-njoum-muted text-right mb-1">الشارة المرتبطة</label>
                      <select className="w-full border rounded-lg px-2 py-2 text-sm"
                        value={activity.badge_id} onChange={e => updateActivity('badge_id', e.target.value)}>
                        <option value="">— بدون شارة —</option>
                        {badgeIds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer justify-end">
                    <span className="text-sm text-njoum-text">قابل للاستخدام بدون إنترنت</span>
                    <input type="checkbox" className="w-4 h-4 accent-primary"
                      checked={activity.is_offline_capable} onChange={e => updateActivity('is_offline_capable', e.target.checked)} />
                  </label>
                </>
              )}

              {mode === 'badge' && (
                <>
                  <div>
                    <label className="block text-xs text-njoum-muted text-right mb-1">اسم الشارة *</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-right text-sm"
                      value={badge.name} onChange={e => updateBadge('name', e.target.value)}
                      placeholder="مثال: مستكشفة الأمان" />
                  </div>
                  <div>
                    <label className="block text-xs text-njoum-muted text-right mb-1">الوصف</label>
                    <textarea className="w-full border rounded-lg px-3 py-2 text-right text-sm resize-none" rows={2}
                      value={badge.description} onChange={e => updateBadge('description', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-njoum-muted text-right mb-1">القسم</label>
                      <select className="w-full border rounded-lg px-2 py-2 text-sm"
                        value={badge.module} onChange={e => updateBadge('module', e.target.value)}>
                        {BADGE_MODULES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-njoum-muted text-right mb-1">التصنيف الفرعي</label>
                      <input className="w-full border rounded-lg px-3 py-2 text-right text-sm"
                        value={badge.category} onChange={e => updateBadge('category', e.target.value)}
                        placeholder="مثال: leadership" />
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setOpen(false)} className="flex-1 border rounded-lg px-4 py-2 text-sm">إلغاء</button>
                <button onClick={save} disabled={saving}
                  className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50">
                  {saving ? 'جارٍ الحفظ…' : 'إضافة'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
