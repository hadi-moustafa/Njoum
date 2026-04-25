import { requireAdmin } from '@/lib/auth';
import ArticleEditor from '../ArticleEditor';

export default async function NewContentPage() {
  await requireAdmin();
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-njoum-text">مقالة جديدة</h1>
        <p className="text-sm text-njoum-muted mt-0.5">أنشئي مقالة جديدة للنشر في التطبيق</p>
      </div>
      <ArticleEditor />
    </div>
  );
}
