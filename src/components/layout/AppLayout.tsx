import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TimerProvider } from '@/lib/timer/TimerContext';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const { pathname } = useLocation();

  const isDashboard = pathname === '/';

  return (
    <TimerProvider>
      <div className="flex h-screen w-full overflow-hidden bg-app">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <Header
            onMenuToggle={() => setSidebarOpen(true)}
            showMonthNav={isDashboard}
            monthOffset={monthOffset}
            onMonthChange={setMonthOffset}
          />
          <main className="flex-1 overflow-y-auto bg-app">
            <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
              <Outlet context={{ monthOffset }} />
            </div>
          </main>
        </div>
      </div>
    </TimerProvider>
  );
}
