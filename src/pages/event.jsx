import { CalendarXIcon, SearchXIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Navigate } from 'react-router';

import { useGetEvents } from '@/api/hooks/event';
import CreateEventButton from '@/components/create-event-button';
import EventCard from '@/components/event-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthContext } from '@/contexts/auth';
import { getEventStatus } from '@/helpers/event';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
  { label: 'Todos', value: 'all' },
  { label: 'Agendados', value: 'scheduled' },
  { label: 'Em andamento', value: 'in_progress' },
  { label: 'Finalizados', value: 'completed' },
];

const EventPage = () => {
  const { user, isInitializing } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');

  const { data: events = [], isLoading, isError, refetch } = useGetEvents();

  const filteredEvents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch =
        !normalizedQuery ||
        event.name.toLowerCase().includes(normalizedQuery) ||
        (event.description ?? '').toLowerCase().includes(normalizedQuery);

      const matchesStatus =
        activeStatusFilter === 'all' ||
        getEventStatus(event) === activeStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [events, searchQuery, activeStatusFilter]);

  if (isInitializing) return null;

  if (!user) {
    return <Navigate to="/signin" />;
  }

  const hasActiveFilters =
    searchQuery.trim() !== '' || activeStatusFilter !== 'all';

  return (
    <div className="space-y-6 p-4 py-2 sm:space-y-8 sm:p-8 sm:py-4">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Eventos</h2>
          <p className="text-muted-foreground text-sm">
            Organize seus objetivos e períodos financeiros.
          </p>
        </div>
        <div className="shrink-0">
          <CreateEventButton />
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar eventos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sm:max-w-64"
        />

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              variant={
                activeStatusFilter === filter.value ? 'default' : 'outline'
              }
              size="sm"
              onClick={() => setActiveStatusFilter(filter.value)}
              className={cn(
                'rounded-full',
                activeStatusFilter === filter.value && 'shadow-none'
              )}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Estado de Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-xl" />
          ))}
        </div>
      )}

      {/* Estado de Erro */}
      {isError && !isLoading && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border py-16 text-center">
          <CalendarXIcon className="text-muted-foreground size-10" />
          <div className="space-y-1">
            <p className="font-medium">Não foi possível carregar os eventos.</p>
            <p className="text-muted-foreground text-sm">
              Verifique sua conexão e tente novamente.
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Lista de Eventos */}
      {!isLoading && !isError && (
        <>
          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border py-16 text-center">
              {hasActiveFilters ? (
                <>
                  <SearchXIcon className="text-muted-foreground size-10" />
                  <div className="space-y-1">
                    <p className="font-medium">Nenhum evento encontrado</p>
                    <p className="text-muted-foreground text-sm">
                      Tente ajustar sua busca ou os filtros selecionados.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveStatusFilter('all');
                    }}
                  >
                    Limpar filtros
                  </Button>
                </>
              ) : (
                <>
                  <CalendarXIcon className="text-muted-foreground size-10" />
                  <div className="space-y-1">
                    <p className="font-medium">Nenhum evento cadastrado</p>
                    <p className="text-muted-foreground text-sm">
                      Crie seu primeiro evento para organizar seus objetivos
                      financeiros.
                    </p>
                  </div>
                  <CreateEventButton />
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EventPage;
