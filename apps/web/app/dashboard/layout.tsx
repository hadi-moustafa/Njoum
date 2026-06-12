import { requireAdmin } from '@/lib/auth';
import DashboardShell from '@/components/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();

  return (
    <DashboardShell adminEmail={user.email ?? ''}>
      {children}
    </DashboardShell>
  );
}
