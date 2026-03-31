import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import Dashboard from '@/pages/Dashboard';
import Entries from '@/pages/Entries';
import Settings from '@/pages/Settings';
import Simulator from '@/pages/Simulator';
import Login from '@/pages/Login';
import TimeGridPage from '@/modules/time-grid/pages/TimeGrid';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="entries"   element={<Entries />} />
        <Route path="time-grid" element={<TimeGridPage />} />
        <Route path="simulator" element={<Simulator />} />
        <Route path="settings"  element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
