import { CalendarXIcon, SearchXIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { LOCAL_STORAGE_EVENT_CARDS_FILTERS_KEY } from '@/constants/local-storage';
import {
  CreateEventButton,
  EventCard,
  getEventStatus,
  useGetEvents,
} from '@/features/events';
import useStoredSearchParams from '@/hooks/use-stored-search-params';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
  { label: 'Todos', value: 'all' },
  { label: 'Agendados', value: 'scheduled' },
  { label: 'Em andamento', value: 'in_progress' },
  { label: 'Finalizados', value: 'completed' },
];

const defaultEventCardsParams = {
  search: '',
  status: 'all',
};

const EventPage = () => {
  const [params, setParams] = useStoredSearchParams(
    LOCAL_STORAGE_EVENT_CARDS_FILTERS_KEY,
    defaultEventCardsParams,
    {
      validate: (data) =>
        typeof data?.search === 'string' &&
        STATUS_FILTERS.some((f) => f.value === data?.status),
    }
  );

  const [searchValue, setSearchValue] = useState(params.search ?? '');
  const [prevParamSearch, setPrevParamSearch] = useState(params.search ?? '');

  if (params.search !== prevParamSearch) {
    setPrevParamSearch(params.search ?? '');
    setSearchValue(params.search ?? '');
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== (params.search ?? '')) {
        setParams({ search: searchValue });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, params.search, setParams]);

  const activeStatusFilter = STATUS_FILTERS.some(
    (f) => f.value === params.status
  )
    ? params.status
    : 'all';

  const { data: events = [], isLoading, isError, refetch } = useGetEvents();

  const filteredEvents = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase();

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
  }, [events, searchValue, activeStatusFilter]);

  const hasActiveFilters =
    searchValue.trim() !== '' || activeStatusFilter !== 'all';

  const handleClearFilters = () => {
    setSearchValue('');
    setParams({ search: '', status: 'all' });
  };

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
          <CreateEventButton className="w-full" />
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar eventos..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
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
              onClick={() => setParams({ status: filter.value })}
              className={cn(
                'flex items-center justify-center rounded-full',
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
                  <Button variant="outline" onClick={handleClearFilters}>
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
