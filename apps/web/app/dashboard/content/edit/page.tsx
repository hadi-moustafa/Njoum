import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import ArticleEditor from '../ArticleEditor';
import Link from 'next/link';

export default async function EditArticlePage({ searchParams }: { searchParams: { id?: string } }) {
  await requireAdmin();
  const { id } = searchParams;
  if (!id) notFound();

  const { data: article, error } = await supabaseAdmin
    .from('content_articles')
    .select('id, title, body, module, language')
    .eq('id', id)
    .single();

  if (error || !article) notFound();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/content" className="text-njoum-muted hover:text-njoum-text text-sm">
          ← رجوع
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-njoum-text">تعديل المقالة</h1>
          <p className="text-sm text-njoum-muted mt-0.5 truncate max-w-xs">{article.title}</p>
        </div>
      </div>
      <ArticleEditor article={article} />
    </div>
  );
}
