import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import UserActions from './UserActions';

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  super_admin:         { label: 'مدير عام',      color: 'bg-depth/10 text-depth border-depth/20'             },
  content_admin:       { label: 'مدير محتوى',    color: 'bg-blue-50 text-blue-700 border-blue-200'           },
  community_moderator: { label: 'مشرف مجتمع',    color: 'bg-teal-50 text-teal-700 border-teal-200'           },
  mentor:              { label: 'مرشدة',          color: 'bg-green-50 text-green-700 border-green-200'        },
  parent:              { label: 'والدة',          color: 'bg-amber-50 text-amber-700 border-amber-200'        },
  girl:                { label: 'فتاة',           color: 'bg-primary/10 text-primary border-primary/20'       },
};

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] ?? { label: role, color: 'bg-gray-100 text-gray-600 border-gray-200' };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = (name ?? '؟').split(' ').map((w: string) => w[0]).slice(0, 2).join('');
  return (
    <div className="w-8 h-8 rounded-full bg-primary/15 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">
      {initials}
    </div>
  );
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { role?: string; search?: string };
}) {
  await requireAdmin();
  const roleFilter   = searchParams.role   ?? '';
  const searchFilter = searchParams.search ?? '';

  let query = supabaseAdmin
    .from('users')
    .select('id, email, full_name, role, country, is_verified, is_active, created_at, deleted_at')
    .order('created_at', { ascending: false });

  if (roleFilter)   query = query.eq('role', roleFilter);
  if (searchFilter) query = query.or(`email.ilike.%${searchFilter}%,full_name.ilike.%${searchFilter}%`);

  const { data: users = [] } = await query;

  const ROLES = ['', 'girl', 'parent', 'mentor', 'content_admin', 'community_moderator', 'super_admin'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-njoum-text">المستخدمات</h1>
          <p className="text-sm text-njoum-muted mt-0.5">{users.length} مستخدمة</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-njoum-border p-4 mb-6 flex flex-wrap gap-3 items-center">
        <form className="flex-1 min-w-[200px]">
          <input
            name="search"
            defaultValue={searchFilter}
            placeholder="بحث باسم أو بريد إلكتروني…"
            className="w-full border border-njoum-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-njoum-bg"
          />
        </form>
        <div className="flex flex-wrap gap-2">
          {ROLES.map(r => (
            <a
              key={r}
              href={r ? `/dashboard/users?role=${r}` : '/dashboard/users'}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                roleFilter === r
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-njoum-muted border-njoum-border hover:border-primary hover:text-primary'
              }`}
            >
              {r ? (ROLE_CONFIG[r]?.label ?? r) : 'الكل'}
            </a>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-njoum-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-njoum-bg">
            <tr>
              <th className="text-right px-6 py-3 text-njoum-muted font-medium">المستخدمة</th>
              <th className="text-right px-6 py-3 text-njoum-muted font-medium">الدور</th>
              <th className="text-right px-6 py-3 text-njoum-muted font-medium">الحالة</th>
              <th className="text-right px-6 py-3 text-njoum-muted font-medium">البلد</th>
              <th className="text-right px-6 py-3 text-njoum-muted font-medium">تاريخ الانضمام</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-njoum-border">
            {(users ?? []).map((u: any) => {
              const isBanned = u.deleted_at !== null;
              return (
                <tr key={u.id} className={`hover:bg-njoum-bg/40 transition-colors ${isBanned ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.full_name ?? '؟'} />
                      <div>
                        <p className="font-medium text-njoum-text">{u.full_name ?? '—'}</p>
                        <p className="text-njoum-muted text-xs">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-6 py-3">
                    {isBanned
                      ? <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">محظورة</span>
                      : <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">نشطة</span>}
                  </td>
                  <td className="px-6 py-3 text-njoum-muted text-xs font-mono">{u.country ?? '—'}</td>
                  <td className="px-6 py-3 text-njoum-muted text-xs">
                    {new Date(u.created_at).toLocaleDateString('ar-LB', { dateStyle: 'medium' })}
                  </td>
                  <td className="px-6 py-3">
                    <UserActions userId={u.id} isBanned={isBanned} currentRole={u.role} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(users ?? []).length === 0 && (
          <div className="py-16 text-center">
            <p className="text-4xl mb-2">👤</p>
            <p className="text-njoum-muted text-sm">لا توجد مستخدمات.</p>
          </div>
        )}
      </div>
    </div>
  );
}
