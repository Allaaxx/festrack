import { CalendarXIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';

import { Button } from '@/components/ui/button';
import {
  EventDetailHeader,
  EventDetailSkeleton,
  EventFinancialCards,
  EventTransactionsTable,
  useGetEvent,
} from '@/features/events';

const EventDetailPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { data: event, isLoading, isError, refetch } = useGetEvent({ eventId });

  if (isLoading) {
    return <EventDetailSkeleton />;
  }

  if (isError) {
    return (
      <div className="m-6 flex flex-col items-center justify-center gap-4 rounded-xl border py-16 text-center">
        <CalendarXIcon className="text-muted-foreground size-10" />
        <div className="space-y-1">
          <p className="text-lg font-medium">
            Não foi possível carregar o evento.
          </p>
          <p className="text-muted-foreground text-sm">
            Verifique sua conexão e tente novamente.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/events')}>
            Voltar ao calendário
          </Button>
          <Button onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="m-6 flex flex-col items-center justify-center gap-4 rounded-xl border py-16 text-center">
        <CalendarXIcon className="text-muted-foreground size-10" />
        <div className="space-y-1">
          <p className="text-lg font-medium">Evento não encontrado</p>
          <p className="text-muted-foreground text-sm">
            O evento solicitado não foi encontrado ou foi excluído.
          </p>
        </div>
        <Button onClick={() => navigate('/events')}>
          Voltar ao calendário
        </Button>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-6">
      <EventDetailHeader
        event={event}
        onDeleteSuccess={() => navigate('/events')}
      />

      <div data-testid="event-detail-content" className="space-y-6">
        <EventFinancialCards eventId={event.id} event={event} />
        <EventTransactionsTable eventId={event.id} />
      </div>
    </div>
  );
};

export default EventDetailPage;
