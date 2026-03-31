import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { SettingsProvider } from '@/lib/settings/SettingsContext';
import { ToastProvider } from '@/lib/toast/ToastContext';
import { AppRoutes } from '@/routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <SettingsProvider>
              <AppRoutes />
            </SettingsProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
