import { redirect } from 'next/navigation';

// Root → redirect to dashboard (or login if unauthenticated — caught by middleware)
export default function RootPage() {
  redirect('/dashboard');
}
