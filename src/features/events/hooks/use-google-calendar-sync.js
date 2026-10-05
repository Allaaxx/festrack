import { useState } from 'react';

import { useGetAccounts } from '@/api/hooks/user';
import { toast } from '@/components/ui/toast';
import { getStoredFiltersKey } from '@/constants/local-storage';
import { useAuthContext } from '@/contexts/auth';

export const GOOGLE_CALENDAR_SYNC_KEY = 'google_calendar_sync';
export const GOOGLE_CALENDAR_SCOPE =
  'https://www.googleapis.com/auth/calendar.events';

export const useGoogleCalendarSync = () => {
  const { user, linkSocial } = useAuthContext();
  const { data: accounts = [], isLoading: isLoadingAccounts } =
    useGetAccounts();

  const isGoogleConnected = accounts.some((acc) => acc.providerId === 'google');
  const storageKey = getStoredFiltersKey(user?.id, GOOGLE_CALENDAR_SYNC_KEY);

  const [isSyncEnabled, setIsSyncEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored !== null ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  const [isConnecting, setIsConnecting] = useState(false);

  const updateSyncEnabled = (enabled) => {
    setIsSyncEnabled(enabled);
    try {
      localStorage.setItem(storageKey, JSON.stringify(enabled));
    } catch {
      // Ignora erro de gravação em storage
    }
  };

  const enableSync = async () => {
    if (!isGoogleConnected) {
      try {
        setIsConnecting(true);
        updateSyncEnabled(true);
        await linkSocial({
          provider: 'google',
          callbackURL: window.location.href,
          scopes: [GOOGLE_CALENDAR_SCOPE],
          additionalParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        });
        toast.add({
          type: 'success',
          title: 'Google Agenda sincronizado',
          description:
            'Sua conta Google foi conectada e a sincronização ativada.',
        });
      } catch (error) {
        setIsConnecting(false);
        updateSyncEnabled(false);
        toast.add({
          type: 'error',
          title: 'Erro na sincronização',
          description: error?.message || 'Falha ao autorizar o Google Agenda.',
        });
        throw error;
      }
    } else {
      updateSyncEnabled(true);
      toast.add({
        type: 'success',
        title: 'Sincronização ativada',
        description:
          'Os eventos do Festrack serão exportados para seu Google Agenda.',
      });
    }
  };

  const disableSync = () => {
    updateSyncEnabled(false);
    toast.add({
      type: 'info',
      title: 'Sincronização desativada',
      description: 'A exportação de eventos para o Google Agenda foi pausada.',
    });
  };

  const toggleSync = () => {
    if (isSyncEnabled && isGoogleConnected) {
      disableSync();
    } else {
      enableSync();
    }
  };

  return {
    isGoogleConnected,
    isSyncEnabled: isGoogleConnected && isSyncEnabled,
    isLoadingAccounts,
    isConnecting,
    enableSync,
    disableSync,
    toggleSync,
  };
};

export default useGoogleCalendarSync;
