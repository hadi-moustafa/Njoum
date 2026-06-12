'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateHotline } from '@/app/actions/hotlines';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'police',            label: 'شرطة'               },
  { value: 'fire',              label: 'إطفاء'              },
  { value: 'mental_health',     label: 'الصحة النفسية'      },
  { value: 'domestic_violence', label: 'عنف أسري'           },
  { value: 'legal_aid',         label: 'مساعدة قانونية'     },
  { value: 'child_protection',  label: 'حماية الطفل'        },
  { value: 'eating_disorder',   label: 'اضطرابات الأكل'     },
  { value: 'addiction',         label: 'الإدمان'            },
];

interface HotlineRow {
  id: string; name: string; phone: string; category: string; country: string; is_verified: boolean;
}

export default function EditHotlineButton({ hotline }: { hotline: HotlineRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name:        hotline.name,
    phone:       hotline.phone,
    category:    hotline.category,
    country:     hotline.country,
    is_verified: hotline.is_verified,
  });

  function update(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function save() {
    if (!form.name.trim() || !form.phone.trim() || !form.country.trim()) {
      setError('الاسم والرقم والبلد مطلوبة'); return;
    }
    setSaving(true); setError(null);
    const result = await updateHotline(hotline.id, {
      name:        form.name,
      phone:       form.phone,
      category:    form.category,
      country:     form.country,
      is_verified: form.is_verified,
    });
    setSaving(false);
    if ('error' in result) { setError(result.error); return; }
    toast.success('تم التعديل ✓');
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="text-xs px-2 py-1.5 rounded-lg text-primary hover:bg-primary/10 transition">
        ✏️
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <button onClick={() => setOpen(false)} className="text-njoum-muted text-xl">✕</button>
              <h2 className="text-lg font-bold text-njoum-text">تعديل خط الطوارئ</h2>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-njoum-muted text-right mb-1">الاسم *</label>
                <input className="w-full border rounded-lg px-3 py-2 text-right text-sm"
                  value={form.name} onChange={e => update('name', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-njoum-muted text-right mb-1">الرقم *</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" dir="ltr"
                  value={form.phone} onChange={e => update('phone', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-njoum-muted text-right mb-1">الفئة</label>
                  <select className="w-full border rounded-lg px-2 py-2 text-sm"
                    value={form.category} onChange={e => update('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-njoum-muted text-right mb-1">البلد *</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" dir="ltr"
                    value={form.country} onChange={e => update('country', e.target.value)}
                    placeholder="LB" maxLength={2} />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer justify-end">
                <span className="text-sm text-njoum-text">موثّق</span>
                <input type="checkbox" className="w-4 h-4 accent-primary"
                  checked={form.is_verified} onChange={e => update('is_verified', e.target.checked)} />
              </label>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setOpen(false)} className="flex-1 border rounded-lg px-4 py-2 text-sm">إلغاء</button>
                <button onClick={save} disabled={saving}
                  className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50">
                  {saving ? 'جارٍ الحفظ…' : 'حفظ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
