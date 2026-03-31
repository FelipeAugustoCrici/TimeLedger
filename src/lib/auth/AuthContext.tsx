import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AuthUser, LoginInput, RegisterInput } from '@/types';
import { authService } from '@/services/auth.service';

const TOKEN_KEY = 'task-manager-token';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  // Valida o token salvo ao iniciar
  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) { setLoading(false); return; }

    authService.me(saved)
      .then((u) => { setUser(u); setToken(saved); })
      .catch(() => { localStorage.removeItem(TOKEN_KEY); setToken(null); })
      .finally(() => setLoading(false));
  }, []);

  const persist = (t: string, u: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setUser(u);
  };

  const login = useCallback(async (input: LoginInput) => {
    const res = await authService.login(input);
    persist(res.token, res.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await authService.register(input);
    persist(res.token, res.user);
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try { await authService.logout(token); } catch { /* ignora */ }
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, [token]);

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, register, logout,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
