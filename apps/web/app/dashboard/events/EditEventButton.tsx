'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateEvent } from '@/app/actions/events';
import { toast } from 'sonner';

const EVENT_TYPES = [
  { value: 'workshop',          label: 'ورشة عمل'        },
  { value: 'webinar',           label: 'ندوة إلكترونية'  },
  { value: 'meetup',            label: 'لقاء'             },
  { value: 'troop_meeting',     label: 'اجتماع كشافة'    },
  { value: 'community_service', label: 'خدمة مجتمعية'    },
];

interface EventRow {
  id: string; title: string; description: string; event_type: string;
  starts_at: string; ends_at: string; country: string; region: string;
  is_online: boolean; url: string;
}

export default function EditEventButton({ event }: { event: EventRow }) {
  const router = useRouter();
  const [open,   setOpen]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const [form, setForm] = useState({
    title:       event.title,
    description: event.description ?? '',
    event_type:  event.event_type,
    starts_at:   event.starts_at ? event.starts_at.slice(0, 16) : '',
    ends_at:     event.ends_at   ? event.ends_at.slice(0, 16)   : '',
    country:     event.country   ?? '',
    region:      event.region    ?? '',
    is_online:   event.is_online ?? false,
    url:         event.url       ?? '',
  });

  function update(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function save() {
    if (!form.title.trim() || !form.starts_at) {
      setError('العنوان وتاريخ البداية مطلوبان'); return;
    }
    setSaving(true); setError(null);
    const result = await updateEvent(event.id, form);
    setSaving(false);
    if ('error' in result) { setError(result.error); return; }
    toast.success('تم التعديل ✓');
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="text-xs text-primary hover:text-primary/80 border border-primary/30 hover:border-primary/60 rounded-lg px-3 py-1.5 transition">
        تعديل
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <button onClick={() => setOpen(false)} className="text-njoum-muted text-xl">✕</button>
              <h2 className="text-lg font-bold text-njoum-text">تعديل الفعالية</h2>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-njoum-muted text-right mb-1">العنوان *</label>
                <input className="w-full border rounded-lg px-3 py-2 text-right text-sm"
                  value={form.title} onChange={e => update('title', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-njoum-muted text-right mb-1">الوصف</label>
                <textarea className="w-full border rounded-lg px-3 py-2 text-right text-sm resize-none" rows={2}
                  value={form.description} onChange={e => update('description', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-njoum-muted text-right mb-1">النوع</label>
                  <select className="w-full border rounded-lg px-2 py-2 text-sm"
                    value={form.event_type} onChange={e => update('event_type', e.target.value)}>
                    {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded accent-primary"
                      checked={form.is_online} onChange={e => update('is_online', e.target.checked)} />
                    <span className="text-sm text-njoum-text">إلكترونية</span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-njoum-muted text-right mb-1">تاريخ البداية *</label>
                  <input type="datetime-local" className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={form.starts_at} onChange={e => update('starts_at', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-njoum-muted text-right mb-1">تاريخ النهاية</label>
                  <input type="datetime-local" className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={form.ends_at} onChange={e => update('ends_at', e.target.value)} />
                </div>
              </div>
              {!form.is_online && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-njoum-muted text-right mb-1">البلد</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-right text-sm"
                      value={form.country} onChange={e => update('country', e.target.value)} placeholder="LB" />
                  </div>
                  <div>
                    <label className="block text-xs text-njoum-muted text-right mb-1">المنطقة</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-right text-sm"
                      value={form.region} onChange={e => update('region', e.target.value)} placeholder="بيروت" />
                  </div>
                </div>
              )}
              {form.is_online && (
                <div>
                  <label className="block text-xs text-njoum-muted text-right mb-1">رابط الانضمام</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" dir="ltr"
                    value={form.url} onChange={e => update('url', e.target.value)} placeholder="https://..." />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setOpen(false)} className="flex-1 border rounded-lg px-4 py-2 text-sm">إلغاء</button>
                <button onClick={save} disabled={saving}
                  className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50">
                  {saving ? 'جارٍ الحفظ…' : 'حفظ التعديلات'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
