'use client';
import { useState, useTransition } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { createArticle, updateArticle } from '@/app/actions/content';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const MODULES = [
  { value: 'safety',       label: '🛡️ السلامة'           },
  { value: 'mental_health',label: '🧠 الصحة النفسية'     },
  { value: 'legal',        label: '⚖️ القانون'           },
  { value: 'wellness',     label: '💚 العافية'           },
  { value: 'self_defence', label: '🥊 الدفاع عن النفس'  },
];
const LANGUAGES = [
  { value: 'ar', label: 'العربية' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
];

const inputCls = 'border border-njoum-border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary w-full';

interface ExistingArticle {
  id: string; title: string; body: string; module: string; language: string;
}

interface Props {
  article?: ExistingArticle;
}

export default function ArticleEditor({ article }: Props) {
  const isEdit  = !!article;
  const router  = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title,    setTitle]    = useState(article?.title    ?? '');
  const [module,   setModule]   = useState(article?.module   ?? 'safety');
  const [language, setLanguage] = useState(article?.language ?? 'ar');

  const editor = useEditor({
    extensions: [StarterKit],
    content: article?.body ?? '<p>اكتبي محتوى المقالة هنا…</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[200px] p-4 focus:outline-none text-njoum-text',
        dir: 'auto',
      },
    },
  });

  function handleSave(publish: boolean) {
    if (!title.trim()) { toast.error('العنوان مطلوب'); return; }
    const body = editor?.getHTML() ?? '';
    startTransition(async () => {
      try {
        if (isEdit) {
          await updateArticle(article.id, { title, body, module, language, is_published: publish });
          toast.success(publish ? 'تم التحديث والنشر ✓' : 'تم الحفظ ✓');
        } else {
          await createArticle({ title, body, module, language, is_published: publish });
          toast.success(publish ? 'تم النشر ✓' : 'تم الحفظ كمسودة ✓');
        }
        router.push('/dashboard/content');
      } catch { toast.error('فشل الحفظ'); }
    });
  }

  return (
    <div className="max-w-3xl">
      <div className="bg-white rounded-2xl border border-njoum-border overflow-hidden">
        {/* Metadata */}
        <div className="p-6 border-b border-njoum-border grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-3">
            <label className="block text-xs text-njoum-muted mb-1.5 font-medium">عنوان المقالة *</label>
            <input
              className={inputCls}
              placeholder="عنوان واضح ومختصر…"
              value={title}
              onChange={e => setTitle(e.target.value)}
              dir="auto"
            />
          </div>
          <div>
            <label className="block text-xs text-njoum-muted mb-1.5 font-medium">القسم</label>
            <select className={inputCls} value={module} onChange={e => setModule(e.target.value)}>
              {MODULES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-njoum-muted mb-1.5 font-medium">اللغة</label>
            <select className={inputCls} value={language} onChange={e => setLanguage(e.target.value)}>
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </div>

        {/* Toolbar */}
        {editor && (
          <div className="flex flex-wrap gap-1 px-4 py-2 border-b border-njoum-border bg-njoum-bg">
            {[
              { label: 'B', cmd: () => editor.chain().focus().toggleBold().run(),        active: editor.isActive('bold') },
              { label: 'I', cmd: () => editor.chain().focus().toggleItalic().run(),      active: editor.isActive('italic') },
              { label: 'H2',cmd: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
              { label: 'H3',cmd: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) },
              { label: '•',  cmd: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
              { label: '1.',  cmd: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
            ].map((btn, i) => (
              <button
                key={i}
                type="button"
                onClick={btn.cmd}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                  btn.active
                    ? 'bg-primary text-white'
                    : 'text-njoum-muted hover:bg-njoum-border hover:text-njoum-text'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* Editor body */}
        <EditorContent editor={editor} className="min-h-[250px]" />
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={() => router.push('/dashboard/content')}
          className="border border-njoum-border text-njoum-muted rounded-xl py-2.5 px-4 text-sm hover:bg-njoum-bg transition"
        >
          إلغاء
        </button>
        <button
          onClick={() => handleSave(false)}
          disabled={isPending}
          className="flex-1 border border-njoum-border text-njoum-text rounded-xl py-2.5 text-sm font-semibold hover:bg-njoum-bg transition disabled:opacity-50"
        >
          {isPending ? '…' : isEdit ? 'حفظ كمسودة' : 'حفظ كمسودة'}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={isPending}
          className="flex-1 bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          {isPending ? '…' : isEdit ? 'تحديث ونشر ✓' : 'نشر الآن ✓'}
        </button>
      </div>
    </div>
  );
}
