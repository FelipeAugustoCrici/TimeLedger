import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TimerProvider } from '@/lib/timer/TimerContext';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isDashboard = pathname === '/';

  const handleNewEntry = () => navigate('/entries');

  return (
    <TimerProvider>
      <div className="flex h-screen w-full overflow-hidden bg-app">
        {/* Sidebar wrapper — floating panel with margin */}
        <div className="hidden lg:flex shrink-0 py-3 pl-3">
          <Sidebar
            open={sidebarOpen}
            collapsed={sidebarCollapsed}
            onClose={() => setSidebarOpen(false)}
            onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          />
        </div>
        {/* Mobile sidebar — no wrapper margin */}
        <div className="lg:hidden">
          <Sidebar
            open={sidebarOpen}
            collapsed={sidebarCollapsed}
            onClose={() => setSidebarOpen(false)}
            onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          />
        </div>
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          {/* Floating header wrapper — provides top padding and horizontal margin */}
          <div className="shrink-0 px-3 pt-3">
            <Header
              onMenuToggle={() => setSidebarOpen(true)}
              showMonthNav={isDashboard}
              monthOffset={monthOffset}
              onMonthChange={setMonthOffset}
              onNewEntry={isDashboard ? handleNewEntry : undefined}
            />
          </div>
          <main className="flex-1 overflow-y-auto bg-app">
            <div className="mx-auto max-w-7xl px-5 py-5 lg:px-8">
              <Outlet context={{ monthOffset }} />
            </div>
          </main>
        </div>
      </div>
    </TimerProvider>
  );
}
