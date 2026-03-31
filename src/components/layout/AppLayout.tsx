import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const PAGE_META: Record<string, { title: string; subtitle?: string }> = {
  '/':         { title: 'Dashboard',    subtitle: 'Visão geral dos seus lançamentos' },
  '/entries':  { title: 'Lançamentos',  subtitle: 'Registre e gerencie seus apontamentos' },
  '/reports':  { title: 'Relatórios',   subtitle: 'Análise detalhada do seu trabalho' },
  '/simulator': { title: 'Simulador PJ',  subtitle: 'Calcule seu rendimento líquido mensal' },
  '/settings':  { title: 'Configurações', subtitle: 'Valor por hora e meta diária' },
};

function getPageMeta(pathname: string) {
  return PAGE_META[pathname] ?? { title: 'TaskManager' };
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const { title, subtitle } = getPageMeta(pathname);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-app">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen(true)} title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto bg-app">
          <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
