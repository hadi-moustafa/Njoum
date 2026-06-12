'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createVideo, updateVideo } from '@/app/actions/content';

const SCENARIO_CATEGORIES = [
  { value: 'grabbed',       label: 'إمساك / قبضة'         },
  { value: 'followed',      label: 'متابعة / مطاردة'       },
  { value: 'attacked',      label: 'اعتداء مباشر'          },
  { value: 'online_safety', label: 'السلامة الإلكترونية'   },
  { value: 'general',       label: 'عام'                   },
];

interface VideoData {
  title: string;
  description: string;
  scenario_category: string;
  video_url: string;
  thumbnail_url: string;
  duration_seconds: number | null;
  is_offline_capable: boolean;
  is_published: boolean;
}

interface Props {
  video?: { id: string } & VideoData;
  trigger?: React.ReactNode;
}

export default function VideoForm({ video, trigger }: Props) {
  const isEdit  = !!video;
  const router  = useRouter();
  const [open,   setOpen]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const [form, setForm] = useState<VideoData>({
    title:              video?.title              ?? '',
    description:        video?.description        ?? '',
    scenario_category:  video?.scenario_category  ?? 'general',
    video_url:          video?.video_url          ?? '',
    thumbnail_url:      video?.thumbnail_url      ?? '',
    duration_seconds:   video?.duration_seconds   ?? null,
    is_offline_capable: video?.is_offline_capable ?? false,
    is_published:       video?.is_published       ?? false,
  });

  function update(field: keyof VideoData, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function save() {
    if (!form.title.trim())     { setError('العنوان مطلوب'); return; }
    if (!form.video_url.trim()) { setError('رابط الفيديو مطلوب'); return; }
    setSaving(true); setError(null);

    const result = isEdit
      ? await updateVideo(video.id, form)
      : await createVideo(form);

    setSaving(false);
    if ('error' in result) { setError(result.error); return; }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger ?? (
          <button className="flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2 text-sm font-semibold hover:opacity-90 transition">
            <span className="text-lg leading-none">+</span>
            فيديو جديد
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <button onClick={() => setOpen(false)} className="text-njoum-muted hover:text-njoum-text text-xl">✕</button>
              <h2 className="text-lg font-bold text-njoum-text">
                {isEdit ? 'تعديل الفيديو' : 'فيديو جديد'}
              </h2>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-njoum-muted text-right mb-1">عنوان الفيديو *</label>
                <input className="w-full border rounded-lg px-3 py-2 text-right text-sm"
                  value={form.title} onChange={e => update('title', e.target.value)}
                  placeholder="مثال: كيف تتحررين من قبضة المعصم" />
              </div>

              <div>
                <label className="block text-xs text-njoum-muted text-right mb-1">الوصف</label>
                <textarea className="w-full border rounded-lg px-3 py-2 text-right text-sm resize-none" rows={2}
                  value={form.description} onChange={e => update('description', e.target.value)}
                  placeholder="وصف موجز للفيديو" />
              </div>

              <div>
                <label className="block text-xs text-njoum-muted text-right mb-1">الفئة</label>
                <select className="w-full border rounded-lg px-2 py-2 text-sm text-right"
                  value={form.scenario_category} onChange={e => update('scenario_category', e.target.value)}>
                  {SCENARIO_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-njoum-muted text-right mb-1">رابط الفيديو * (Cloudinary / YouTube)</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" dir="ltr"
                  value={form.video_url} onChange={e => update('video_url', e.target.value)}
                  placeholder="https://res.cloudinary.com/..." />
              </div>

              <div>
                <label className="block text-xs text-njoum-muted text-right mb-1">رابط الصورة المصغرة</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" dir="ltr"
                  value={form.thumbnail_url} onChange={e => update('thumbnail_url', e.target.value)}
                  placeholder="https://..." />
              </div>

              <div>
                <label className="block text-xs text-njoum-muted text-right mb-1">المدة (بالثواني)</label>
                <input type="number" min={0} className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.duration_seconds ?? ''}
                  onChange={e => update('duration_seconds', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="مثال: 180 = 3 دقائق" />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-primary"
                    checked={form.is_offline_capable} onChange={e => update('is_offline_capable', e.target.checked)} />
                  <span className="text-sm text-njoum-text">قابل للتنزيل</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-primary"
                    checked={form.is_published} onChange={e => update('is_published', e.target.checked)} />
                  <span className="text-sm text-njoum-text">نشر الآن</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setOpen(false)} className="flex-1 border rounded-lg px-4 py-2 text-sm">إلغاء</button>
                <button onClick={save} disabled={saving}
                  className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50">
                  {saving ? 'جارٍ الحفظ…' : isEdit ? 'حفظ التعديلات' : 'إضافة الفيديو'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
