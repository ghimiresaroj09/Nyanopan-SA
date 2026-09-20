import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '../../../shared/format';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const DESKTOP_QUERY = '(min-width: 981px)';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.matchMedia(DESKTOP_QUERY).matches,
  );

  return (
    <div className={cn('app-shell', !sidebarOpen && 'shell-closed')}>
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((open) => !open)}
      />
      <div
        className="shell-backdrop"
        onClick={() => setSidebarOpen(false)}
        aria-hidden
      />
      <div className="main">
        <Topbar
          open={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
