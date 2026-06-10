import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import HotlineForm from './HotlineForm';
import HotlineToggle from './HotlineToggle';

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  police:           { label: 'شرطة',            icon: '🚔', color: 'bg-blue-50 text-blue-700 border-blue-200'     },
  fire:             { label: 'إطفاء',            icon: '🚒', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  mental_health:    { label: 'الصحة النفسية',    icon: '🧠', color: 'bg-depth/10 text-depth border-depth/20'       },
  domestic_violence:{ label: 'عنف أسري',         icon: '🛡️', color: 'bg-red-50 text-red-700 border-red-200'        },
  legal_aid:        { label: 'مساعدة قانونية',   icon: '⚖️', color: 'bg-amber-50 text-amber-700 border-amber-200'  },
  child_protection: { label: 'حماية الطفل',      icon: '🌸', color: 'bg-pink-50 text-pink-700 border-pink-200'     },
  eating_disorder:  { label: 'اضطرابات الأكل',   icon: '💚', color: 'bg-green-50 text-green-700 border-green-200'  },
  addiction:        { label: 'الإدمان',           icon: '🤝', color: 'bg-teal-50 text-teal-700 border-teal-200'    },
};

const COUNTRY_FLAGS: Record<string, string> = { LB: '🇱🇧', SA: '🇸🇦', AE: '🇦🇪', EG: '🇪🇬', JO: '🇯🇴', IQ: '🇮🇶', SY: '🇸🇾' };

function CategoryBadge({ category }: { category: string }) {
  const cfg = CATEGORY_CONFIG[category] ?? { label: category, icon: '📞', color: 'bg-gray-100 text-gray-600 border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

export default async function HotlinesPage({ searchParams }: { searchParams: { country?: string } }) {
  await requireAdmin();
  const countryFilter = searchParams.country ?? '';

  let query = supabaseAdmin.from('hotlines').select('*').order('country').order('category').order('name');
  if (countryFilter) query = query.eq('country', countryFilter);

  const { data: hotlines = [] } = await query;

  const countries = [...new Set((hotlines ?? []).map((h: any) => h.country as string))].sort();
  const active   = (hotlines ?? []).filter((h: any) => h.is_active).length;
  const inactive = (hotlines ?? []).length - active;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-njoum-text">خطوط الطوارئ</h1>
        <p className="text-sm text-njoum-muted mt-0.5">
          {active} نشط · {inactive} معطّل · {(hotlines ?? []).length} إجمالي
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Form */}
        <div className="lg:col-span-1 self-start">
          <div className="bg-white rounded-2xl border border-njoum-border p-6">
            <h2 className="font-semibold text-njoum-text mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">+</span>
              إضافة خط جديد
            </h2>
            <HotlineForm />
          </div>
        </div>

        {/* Table */}
        <div className="lg:col-span-2">
          {/* Country filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <a
              href="/dashboard/hotlines"
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                !countryFilter ? 'bg-primary text-white border-primary' : 'bg-white text-njoum-muted border-njoum-border hover:border-primary hover:text-primary'
              }`}
            >
              الكل
            </a>
            {countries.map((c: string) => (
              <a
                key={c}
                href={`/dashboard/hotlines?country=${c}`}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  countryFilter === c ? 'bg-primary text-white border-primary' : 'bg-white text-njoum-muted border-njoum-border hover:border-primary hover:text-primary'
                }`}
              >
                {COUNTRY_FLAGS[c] ?? ''} {c}
              </a>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-njoum-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-njoum-bg">
                <tr>
                  <th className="text-right px-4 py-3 text-njoum-muted font-medium">البلد</th>
                  <th className="text-right px-4 py-3 text-njoum-muted font-medium">الاسم</th>
                  <th className="text-right px-4 py-3 text-njoum-muted font-medium">الرقم</th>
                  <th className="text-right px-4 py-3 text-njoum-muted font-medium">الفئة</th>
                  <th className="text-right px-4 py-3 text-njoum-muted font-medium">موثّق</th>
                  <th className="text-right px-4 py-3 text-njoum-muted font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-njoum-border">
                {(hotlines ?? []).map((h: any) => (
                  <tr key={h.id} className={`hover:bg-njoum-bg/40 transition-colors ${!h.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 text-lg">{COUNTRY_FLAGS[h.country] ?? h.country}</td>
                    <td className="px-4 py-3 font-medium text-njoum-text">{h.name}</td>
                    <td className="px-4 py-3 text-njoum-muted font-mono text-xs" dir="ltr">{h.phone}</td>
                    <td className="px-4 py-3"><CategoryBadge category={h.category} /></td>
                    <td className="px-4 py-3">
                      {h.is_verified
                        ? <span className="text-green-600 font-bold text-xs">✓</span>
                        : <span className="text-njoum-muted text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <HotlineToggle id={h.id} isActive={h.is_active} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(hotlines ?? []).length === 0 && (
              <div className="py-16 text-center">
                <p className="text-4xl mb-2">📞</p>
                <p className="text-njoum-muted text-sm">لا توجد خطوط مضافة.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
