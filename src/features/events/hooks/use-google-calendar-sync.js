import { useState } from 'react';

import { useGetAccounts, useUpdateUser } from '@/api/hooks/user';
import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';

export const GOOGLE_CALENDAR_SCOPE =
  'https://www.googleapis.com/auth/calendar.events';

export const useGoogleCalendarSync = () => {
  const { user, linkSocial } = useAuthContext();
  const { data: accounts = [], isLoading: isLoadingAccounts } =
    useGetAccounts();
  const updateUserMutation = useUpdateUser();

  const isGoogleConnected = accounts.some((acc) => acc.providerId === 'google');
  const isSyncEnabled = Boolean(
    isGoogleConnected &&
    (user?.google_calendar_sync_enabled ?? user?.googleCalendarSyncEnabled)
  );

  const [isConnecting, setIsConnecting] = useState(false);

  const enableSync = async () => {
    if (!isGoogleConnected) {
      try {
        setIsConnecting(true);
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
        toast.add({
          type: 'error',
          title: 'Erro na sincronização',
          description: error?.message || 'Falha ao autorizar o Google Agenda.',
        });
        throw error;
      } finally {
        setIsConnecting(false);
      }
    } else {
      try {
        await updateUserMutation.mutateAsync({
          google_calendar_sync_enabled: true,
        });
        toast.add({
          type: 'success',
          title: 'Sincronização ativada',
          description:
            'Os eventos do Festrack serão exportados para seu Google Agenda.',
        });
      } catch (error) {
        toast.add({
          type: 'error',
          title: 'Erro na sincronização',
          description:
            error?.response?.data?.message ||
            error?.message ||
            'Falha ao ativar a sincronização com o Google Agenda.',
        });
        throw error;
      }
    }
  };

  const disableSync = async () => {
    try {
      await updateUserMutation.mutateAsync({
        google_calendar_sync_enabled: false,
      });
      toast.add({
        type: 'info',
        title: 'Sincronização desativada',
        description:
          'A exportação de eventos para o Google Agenda foi pausada.',
      });
    } catch (error) {
      toast.add({
        type: 'error',
        title: 'Erro na sincronização',
        description:
          error?.response?.data?.message ||
          error?.message ||
          'Falha ao desativar a sincronização com o Google Agenda.',
      });
      throw error;
    }
  };

  const toggleSync = async () => {
    try {
      if (isSyncEnabled) {
        await disableSync();
      } else {
        await enableSync();
      }
    } catch {
      // Erro tratado e exibido via toast
    }
  };

  return {
    isGoogleConnected,
    isSyncEnabled,
    isLoadingAccounts,
    isConnecting: isConnecting || updateUserMutation.isPending,
    enableSync,
    disableSync,
    toggleSync,
  };
};

export default useGoogleCalendarSync;
