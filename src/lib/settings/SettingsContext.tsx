import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/common/constants';
import { settingsService } from '@/services/settings.service';

interface SettingsContextValue {
  settings: UserSettings;
  saveSettings: (next: UserSettings) => Promise<void>;
  loading: boolean;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>({ ...DEFAULT_SETTINGS });
  const [loading, setLoading] = useState(true);

  // Carrega do backend ao iniciar
  useEffect(() => {
    settingsService.get()
      .then(setSettings)
      .catch(() => { /* mantém DEFAULT_SETTINGS se API falhar */ })
      .finally(() => setLoading(false));
  }, []);

  // Salva no backend e atualiza estado local
  const saveSettings = useCallback(async (next: UserSettings) => {
    const saved = await settingsService.update(next);
    setSettings(saved);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, saveSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}
