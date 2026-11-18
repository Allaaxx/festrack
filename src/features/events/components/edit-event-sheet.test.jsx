import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import EditEventSheet from '@/features/events/components/edit-event-sheet';
import protectedApi from '@/lib/axios';

vi.mock('@/components/ui/toast', () => ({
  toast: { add: vi.fn() },
}));

vi.mock('@/contexts/auth', () => ({
  useAuthContext: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/contexts/shop', () => ({
  useShopContext: () => ({
    role: 'OWNER',
    activeShop: { id: 'shop-1', role: 'OWNER' },
  }),
}));

vi.mock('@/features/events/hooks/use-google-calendar-sync', () => ({
  useGoogleCalendarSync: () => ({
    isSyncEnabled: false,
    isGoogleConnected: false,
  }),
}));

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/components/ui/calendar', () => ({
  Calendar: () => <div data-testid="mock-calendar" />,
}));

const VALID_EVENT_ID = '123e4567-e89b-12d3-a456-426614174000';

const renderEditEventSheet = (event, props = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

  return {
    invalidateSpy,
    ...render(
      <QueryClientProvider client={queryClient}>
        <EditEventSheet
          event={event}
          open={true}
          onOpenChange={vi.fn()}
          {...props}
        />
      </QueryClientProvider>
    ),
  };
};

describe('EditEventSheet - All-Day & Timed initialization and toggle (#157)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    protectedApi.get.mockResolvedValue({ data: [] });
  });

  it('initializes an All-Day Event (allDay: true) with checkbox checked, hidden time pickers, and exact civil start/end dates', async () => {
    const allDayEvent = {
      id: VALID_EVENT_ID,
      name: 'Festival de Verão',
      description: 'Cinco dias de evento',
      startDate: '2026-12-01T00:00:00.000Z',
      endDate: '2026-12-05T23:59:59.000Z',
      allDay: true,
      tag: null,
    };

    renderEditEventSheet(allDayEvent);

    const allDayCheckbox = await screen.findByRole('checkbox', {
      name: /dia inteiro/i,
    });
    expect(allDayCheckbox).toHaveAttribute('aria-checked', 'true');

    expect(screen.queryByText(/hora inicial/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/hora final/i)).not.toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: '1 de dezembro de 2026' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '5 de dezembro de 2026' })
    ).toBeInTheDocument();
  });

  it('initializes a Timed Event (allDay: false) from UTC night-time timestamps with local date and time', async () => {
    const startIso = '2026-11-19T01:00:00.000Z';
    const endIso = '2026-11-19T02:30:00.000Z';
    const expectedStart = new Date(startIso);
    const expectedEnd = new Date(endIso);

    renderEditEventSheet({
      id: VALID_EVENT_ID,
      name: 'Show Noturno',
      description: 'Apresentação à noite',
      startDate: startIso,
      endDate: endIso,
      allDay: false,
      tag: null,
    });

    const allDayCheckbox = await screen.findByRole('checkbox', {
      name: /dia inteiro/i,
    });
    expect(allDayCheckbox).toHaveAttribute('aria-checked', 'false');

    expect(screen.getByText(/hora inicial/i)).toBeInTheDocument();
    expect(screen.getByText(/hora final/i)).toBeInTheDocument();
    expect(screen.getByText(format(expectedStart, 'HH:mm'))).toBeInTheDocument();
    expect(screen.getByText(format(expectedEnd, 'HH:mm'))).toBeInTheDocument();

    const expectedStartDateLabel = format(expectedStart, 'PPP', {
      locale: ptBR,
    });
    const expectedEndDateLabel = format(expectedEnd, 'PPP', { locale: ptBR });
    if (expectedStartDateLabel === expectedEndDateLabel) {
      expect(
        screen.getAllByRole('button', { name: expectedStartDateLabel })
      ).toHaveLength(2);
    } else {
      expect(
        screen.getByRole('button', { name: expectedStartDateLabel })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: expectedEndDateLabel })
      ).toBeInTheDocument();
    }
  });

  it('initializes a Timed Event (allDay: false) from explicit ±HH:mm offset timestamps', async () => {
    const startIso = '2026-11-19T01:00:00+02:00';
    const endIso = '2026-11-19T02:15:00+02:00';
    const expectedStart = new Date(startIso);
    const expectedEnd = new Date(endIso);

    renderEditEventSheet({
      id: VALID_EVENT_ID,
      name: 'Conferência Remota',
      description: '',
      startDate: startIso,
      endDate: endIso,
      allDay: false,
      tag: null,
    });

    const allDayCheckbox = await screen.findByRole('checkbox', {
      name: /dia inteiro/i,
    });
    expect(allDayCheckbox).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText(format(expectedStart, 'HH:mm'))).toBeInTheDocument();
    expect(screen.getByText(format(expectedEnd, 'HH:mm'))).toBeInTheDocument();
  });

  it('toggles an All-Day Event (allDay: true -> false) and submits all_day: false with explicit local offset timestamps', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    protectedApi.patch.mockResolvedValueOnce({
      data: {
        id: VALID_EVENT_ID,
        shop_id: 'shop-1',
        name: 'Feriado',
        description: null,
        start_date: '2026-12-01T09:00:00.000Z',
        end_date: '2026-12-01T10:00:00.000Z',
        all_day: false,
        tag: null,
      },
    });

    const { invalidateSpy } = renderEditEventSheet(
      {
        id: VALID_EVENT_ID,
        name: 'Feriado',
        description: null,
        startDate: '2026-12-01T00:00:00.000Z',
        endDate: '2026-12-01T23:59:59.000Z',
        allDay: true,
        tag: null,
      },
      { onOpenChange }
    );

    const allDayCheckbox = await screen.findByRole('checkbox', {
      name: /dia inteiro/i,
    });
    expect(allDayCheckbox).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByText(/hora inicial/i)).not.toBeInTheDocument();

    await user.click(allDayCheckbox);

    expect(allDayCheckbox).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText(/hora inicial/i)).toBeInTheDocument();
    expect(screen.getByText(/hora final/i)).toBeInTheDocument();
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /salvar/i }));

    const expectedStartDate = format(
      new Date(2026, 11, 1, 9, 0, 0),
      "yyyy-MM-dd'T'HH:mm:ssXXX"
    );
    const expectedEndDate = format(
      new Date(2026, 11, 1, 10, 0, 0),
      "yyyy-MM-dd'T'HH:mm:ssXXX"
    );

    await waitFor(() => {
      expect(protectedApi.patch).toHaveBeenCalledWith(
        `/shops/shop-1/events/${VALID_EVENT_ID}`,
        expect.objectContaining({
          name: 'Feriado',
          all_day: false,
          start_date: expectedStartDate,
          end_date: expectedEndDate,
        })
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  it('toggles a Timed Event (allDay: false -> true) and submits all_day: true with UTC civil date boundaries', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const startIso = '2026-11-19T01:00:00.000Z';
    const endIso = '2026-11-19T02:30:00.000Z';
    const expectedLocalStartDay = format(new Date(startIso), 'yyyy-MM-dd');
    const expectedLocalEndDay = format(new Date(endIso), 'yyyy-MM-dd');

    protectedApi.patch.mockResolvedValueOnce({
      data: {
        id: VALID_EVENT_ID,
        shop_id: 'shop-1',
        name: 'Show Noturno',
        description: null,
        start_date: `${expectedLocalStartDay}T00:00:00.000Z`,
        end_date: `${expectedLocalEndDay}T23:59:59.000Z`,
        all_day: true,
        tag: null,
      },
    });

    const { invalidateSpy } = renderEditEventSheet(
      {
        id: VALID_EVENT_ID,
        name: 'Show Noturno',
        description: null,
        startDate: startIso,
        endDate: endIso,
        allDay: false,
        tag: null,
      },
      { onOpenChange }
    );

    const allDayCheckbox = await screen.findByRole('checkbox', {
      name: /dia inteiro/i,
    });
    expect(allDayCheckbox).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText(/hora inicial/i)).toBeInTheDocument();

    await user.click(allDayCheckbox);

    expect(allDayCheckbox).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByText(/hora inicial/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/hora final/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(protectedApi.patch).toHaveBeenCalledWith(
        `/shops/shop-1/events/${VALID_EVENT_ID}`,
        expect.objectContaining({
          name: 'Show Noturno',
          all_day: true,
          start_date: `${expectedLocalStartDay}T00:00:00.000Z`,
          end_date: `${expectedLocalEndDay}T23:59:59.000Z`,
        })
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  it('preserves civil bounds when saving an All-Day Event without toggling mode', async () => {
    const user = userEvent.setup();
    protectedApi.patch.mockResolvedValueOnce({
      data: {
        id: VALID_EVENT_ID,
        shop_id: 'shop-1',
        name: 'Congresso Anual',
        description: null,
        start_date: '2026-12-01T00:00:00.000Z',
        end_date: '2026-12-05T23:59:59.000Z',
        all_day: true,
        tag: null,
      },
    });

    renderEditEventSheet({
      id: VALID_EVENT_ID,
      name: 'Congresso',
      description: null,
      startDate: '2026-12-01T00:00:00.000Z',
      endDate: '2026-12-05T23:59:59.000Z',
      allDay: true,
      tag: null,
    });

    const nameInput = await screen.findByLabelText(/nome do evento/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Congresso Anual');

    await user.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(protectedApi.patch).toHaveBeenCalledWith(
        `/shops/shop-1/events/${VALID_EVENT_ID}`,
        expect.objectContaining({
          name: 'Congresso Anual',
          all_day: true,
          start_date: '2026-12-01T00:00:00.000Z',
          end_date: '2026-12-05T23:59:59.000Z',
        })
      );
    });
  });
});
