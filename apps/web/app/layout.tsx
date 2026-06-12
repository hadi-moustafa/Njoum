import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title:       'Njoum Admin — نجوم',
  description: 'لوحة تحكم نجوم — للمشرفين فقط',
};

/* Inline script injected BEFORE paint to prevent flash-of-unstyled-content */
const themeScript = `
(function () {
  try {
    var t = localStorage.getItem('njoum-theme');
    var l = localStorage.getItem('njoum-lang') || 'ar';
    var html = document.documentElement;
    if (t === 'dark') html.classList.add('dark');
    html.lang = l;
    html.dir  = l === 'ar' ? 'rtl' : 'ltr';
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Prevent FOUC — runs synchronously before first paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Toaster
          position="bottom-center"
          richColors
          toastOptions={{
            style: {
              fontFamily: 'Inter, Nunito, system-ui, sans-serif',
            },
          }}
        />
      </body>
    </html>
  );
}
