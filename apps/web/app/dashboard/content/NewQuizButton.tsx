'use client';

import { useState } from 'react';
import QuizEditor from './QuizEditor';

export default function NewQuizButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2 text-sm font-semibold hover:opacity-90 transition"
      >
        <span className="text-lg leading-none">+</span>
        اختبار جديد
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <button onClick={() => setOpen(false)} className="text-njoum-muted hover:text-njoum-text text-xl leading-none">✕</button>
              <h2 className="text-lg font-bold text-njoum-text">إنشاء اختبار جديد</h2>
            </div>
            <QuizEditor onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
