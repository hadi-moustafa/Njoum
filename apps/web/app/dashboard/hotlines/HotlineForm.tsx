'use client';
import { useState, useTransition } from 'react';
import { createHotline } from '@/app/actions/hotlines';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'police',            label: '🚔 شرطة'           },
  { value: 'fire',              label: '🚒 إطفاء'          },
  { value: 'mental_health',     label: '🧠 الصحة النفسية'  },
  { value: 'domestic_violence', label: '🛡️ عنف أسري'       },
  { value: 'legal_aid',         label: '⚖️ مساعدة قانونية' },
  { value: 'child_protection',  label: '🌸 حماية الطفل'   },
  { value: 'eating_disorder',   label: '💚 اضطرابات الأكل' },
  { value: 'addiction',         label: '🤝 الإدمان'        },
  { value: 'general',           label: '📞 عام'            },
];

const inputCls = 'border border-njoum-border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary w-full';

export default function HotlineForm() {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: '', phone: '', category: 'mental_health', country: 'LB',
  });

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('الاسم والرقم مطلوبان');
      return;
    }
    startTransition(async () => {
      try {
        await createHotline(form);
        setForm({ name: '', phone: '', category: 'mental_health', country: 'LB' });
        toast.success('تمت إضافة الخط بنجاح ✓');
      } catch {
        toast.error('فشل الحفظ — حاولي مجدداً');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input className={inputCls} placeholder="اسم الخط *" value={form.name}
        onChange={e => set('name', e.target.value)} required />
      <input className={`${inputCls} font-mono text-left`} dir="ltr"
        placeholder="الرقم (e.g. +961 1 123456) *"
        value={form.phone} onChange={e => set('phone', e.target.value)} required />
      <select className={inputCls} value={form.category} onChange={e => set('category', e.target.value)}>
        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      <input className={`${inputCls} uppercase`} placeholder="رمز البلد: LB, SA, AE…" maxLength={2}
        value={form.country} onChange={e => set('country', e.target.value.toUpperCase())} />
      <button
        type="submit" disabled={isPending}
        className="bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 mt-1"
      >
        {isPending ? 'جارٍ الحفظ…' : 'حفظ الخط'}
      </button>
    </form>
  );
}
