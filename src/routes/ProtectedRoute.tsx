import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth/useAuth';
import { PageLoader } from '@/components/ui/LoadingSpinner';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-app flex items-center justify-center"><PageLoader /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
