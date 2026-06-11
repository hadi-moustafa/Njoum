'use client';

import { useTransition } from 'react';
import { endAssignment } from '../../actions/mentors';

export default function EndAssignmentButton({ assignmentId }: { assignmentId: string }) {
  const [pending, startTransition] = useTransition();

  function handleEnd() {
    if (!confirm('End this mentor assignment? This cannot be undone.')) return;
    startTransition(() => endAssignment(assignmentId));
  }

  return (
    <button
      onClick={handleEnd}
      disabled={pending}
      className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 font-medium transition-colors"
    >
      {pending ? 'Ending…' : 'End'}
    </button>
  );
}
