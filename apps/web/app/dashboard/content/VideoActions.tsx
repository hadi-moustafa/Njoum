'use client';

import { useTransition } from 'react';
import { useState } from 'react';
import { toggleVideoPublish, deleteVideo, updateVideo } from '@/app/actions/content';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const SCENARIO_CATEGORIES = [
  { value: 'grabbed',       label: 'إمساك / قبضة'         },
  { value: 'followed',      label: 'متابعة / مطاردة'       },
  { value: 'attacked',      label: 'اعتداء مباشر'          },
  { value: 'online_safety', label: 'السلامة الإلكترونية'   },
  { value: 'general',       label: 'عام'                   },
];

interface VideoRow {
  id: string; title: string; description: string; scenario_category: string;
  video_url: string; thumbnail_url: string; duration_seconds: number | null;
  is_offline_capable: boolean; is_published: boolean;
}

export default function VideoActions({ video }: { video: VideoRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [form, setForm] = useState({
    title:              video.title,
    description:        video.description        ?? '',
    scenario_category:  video.scenario_category,
    video_url:          video.video_url,
    thumbnail_url:      video.thumbnail_url      ?? '',
    duration_seconds:   video.duration_seconds,
    is_offline_capable: video.is_offline_capable,
    is_published:       video.is_published,
  });

  function update(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleToggle() {
    startTransition(async () => {
      try {
        await toggleVideoPublish(video.id, !video.is_published);
        toast.success(video.is_published ? 'تم إلغاء النشر' : 'تم النشر ✓');
      } catch { toast.error('فشلت العملية'); }
    });
  }

  function handleDelete() {
    if (!confirm('هل أنتِ متأكدة من حذف هذا الفيديو؟')) return;
    startTransition(async () => {
      try {
        await deleteVideo(video.id);
        toast.success('تم الحذف');
      } catch { toast.error('فشل الحذف'); }
    });
  }

  async function handleSaveEdit() {
    if (!form.title.trim())     { setError('العنوان مطلوب'); return; }
    if (!form.video_url.trim()) { setError('رابط الفيديو مطلوب'); return; }
    setSaving(true); setError(null);
    const result = await updateVideo(video.id, {
      title:              form.title,
      description:        form.description,
      scenario_category:  form.scenario_category,
      video_url:          form.video_url,
      thumbnail_url:      form.thumbnail_url,
      duration_seconds:   form.duration_seconds,
      is_offline_capable: form.is_offline_capable,
      is_published:       form.is_published,
    });
    setSaving(false);
    if ('error' in result) { setError(result.error); return; }
    toast.success('تم التعديل ✓');
    setEditOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button onClick={handleToggle} disabled={isPending}
          className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition disabled:opacity-50 ${
            video.is_published
              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
          }`}>
          {video.is_published ? 'إلغاء' : 'نشر'}
        </button>
        <button onClick={() => setEditOpen(true)}
          className="text-xs px-2 py-1.5 rounded-lg text-primary hover:bg-primary/10 transition">
          ✏️
        </button>
        <button onClick={handleDelete} disabled={isPending}
          className="text-xs px-2 py-1.5 rounded-lg text-red-500 hover:bg-red-50 transition disabled:opacity-50">
          🗑
        </button>
      </div>

      {editOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <button onClick={() => setEditOpen(false)} className="text-njoum-muted text-xl">✕</button>
              <h2 className="text-lg font-bold text-njoum-text">تعديل الفيديو</h2>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-njoum-muted text-right mb-1">العنوان *</label>
                <input className="w-full border rounded-lg px-3 py-2 text-right text-sm"
                  value={form.title} onChange={e => update('title', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-njoum-muted text-right mb-1">الفئة</label>
                <select className="w-full border rounded-lg px-2 py-2 text-sm text-right"
                  value={form.scenario_category} onChange={e => update('scenario_category', e.target.value)}>
                  {SCENARIO_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-njoum-muted text-right mb-1">رابط الفيديو *</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" dir="ltr"
                  value={form.video_url} onChange={e => update('video_url', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-njoum-muted text-right mb-1">المدة (ثواني)</label>
                <input type="number" min={0} className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.duration_seconds ?? ''}
                  onChange={e => update('duration_seconds', e.target.value ? parseInt(e.target.value) : null)} />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-primary"
                    checked={form.is_offline_capable} onChange={e => update('is_offline_capable', e.target.checked)} />
                  <span className="text-sm">قابل للتنزيل</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-primary"
                    checked={form.is_published} onChange={e => update('is_published', e.target.checked)} />
                  <span className="text-sm">منشور</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditOpen(false)} className="flex-1 border rounded-lg px-4 py-2 text-sm">إلغاء</button>
                <button onClick={handleSaveEdit} disabled={saving}
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
