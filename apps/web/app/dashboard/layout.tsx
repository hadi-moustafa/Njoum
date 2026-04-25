import { requireAdmin } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-[#F8F4F6]">
      <Sidebar adminEmail={user.email ?? ''} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
