'use client';

import { useState, useEffect } from 'react';
import StarField from './StarField';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface DashboardShellProps {
  adminEmail: string;
  children: React.ReactNode;
}

export default function DashboardShell({ adminEmail, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  /* Restore sidebar preference */
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('njoum-sidebar');
    if (saved !== null) setSidebarOpen(saved === 'open');
  }, []);

  function toggleSidebar() {
    setSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('njoum-sidebar', next ? 'open' : 'closed');
      return next;
    });
  }

  const sidebarWidth = sidebarOpen ? '240px' : '72px';

  return (
    <div className="min-h-screen bg-njoum-bg">
      {/* Star field — only visible in dark mode via CSS */}
      <StarField />

      {/* Fixed top header */}
      <Topbar adminEmail={adminEmail} sidebarOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Fixed sidebar */}
      <Sidebar open={sidebarOpen} />

      {/* Main content — shifts based on sidebar width */}
      <main
        className="relative z-10 min-h-screen pt-16 content-shift"
        style={{
          paddingInlineStart: mounted ? sidebarWidth : '240px',
        }}
      >
        <div className="p-6 md:p-8 animate-fade-up">
          {children}
        </div>
      </main>
    </div>
  );
}
