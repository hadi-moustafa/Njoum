import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title:       'Njoum Admin',
  description: 'لوحة تحكم نجوم — للمشرفين فقط',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
        <Toaster position="bottom-left" richColors />
      </body>
    </html>
  );
}
