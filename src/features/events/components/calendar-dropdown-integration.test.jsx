import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DayView } from '@/features/events/components/day-view';
import { EventsSidebarContent } from '@/features/events/components/events-sidebar-content';
import { MonthView } from '@/features/events/components/month-view';
import { WeekView } from '@/features/events/components/week-view';
import { mapEventToCalendarItem } from '@/features/events/helpers/event';

vi.mock('@/components/ui/toast', () => ({
  toast: {
    add: vi.fn(),
  },
}));

vi.mock('@/features/events/hooks/use-google-calendar-sync', () => ({
  useGoogleCalendarSync: () => ({
    isSyncEnabled: false,
    isGoogleConnected: false,
  }),
}));

vi.mock('@/features/events/api/hooks', () => ({
  useCreateEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEditEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGetEvents: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/features/transactions/api/hooks', () => ({
  useCreateTransaction: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/components/ui/calendar', () => ({
  Calendar: () => <div data-testid="mock-calendar" />,
  CalendarDayButton: ({ children }) => <button type="button">{children}</button>,
}));

describe('Calendar Event Dropdown Menu Integration across surfaces', () => {
  const baseRawEvent = {
    id: 'e1000000-0000-0000-0000-000000000001',
    name: 'Reunião de Planejamento',
    description: 'Discussão de metas',
    startDate: '2026-10-15T10:00:00.000Z',
    endDate: '2026-10-15T11:00:00.000Z',
    allDay: false,
    startTime: '10:00',
    endTime: '11:00',
  };

  const allDayRawEvent = {
    id: 'e2000000-0000-0000-0000-000000000002',
    name: 'Feriado Nacional',
    description: 'Sem expediente',
    startDate: '2026-10-15T00:00:00.000Z',
    endDate: '2026-10-16T00:00:00.000Z',
    allDay: true,
  };

  const calendarEvent = mapEventToCalendarItem(baseRawEvent);
  const allDayCalendarEvent = mapEventToCalendarItem(allDayRawEvent);

  const currentDate = new Date(2026, 9, 15);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens dropdown menu with 4 quick actions when clicking an event in MonthView', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <MemoryRouter>
        <MonthView
          currentDate={currentDate}
          events={[calendarEvent]}
          onEventSelect={vi.fn()}
          onEventCreate={vi.fn()}
        />
      </MemoryRouter>
    );

    const eventButton = container.querySelector('button[data-calendar-event]');
    expect(eventButton).toBeInTheDocument();

    await user.click(eventButton);

    expect(
      await screen.findByRole('menuitem', { name: /ver detalhes e transações/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /editar evento/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /adicionar transação/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /excluir evento/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('opens dropdown menu when clicking an event in WeekView timed block and all-day header', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <MemoryRouter>
        <WeekView
          currentDate={currentDate}
          events={[calendarEvent, allDayCalendarEvent]}
          onEventSelect={vi.fn()}
          onEventCreate={vi.fn()}
          onEventResize={vi.fn()}
          onEventResizeEnd={vi.fn()}
        />
      </MemoryRouter>
    );

    // Timed block event
    const timedEventButton = container.querySelector(
      '.group\\/event-block button[data-calendar-event]'
    );
    expect(timedEventButton).toBeInTheDocument();
    await user.click(timedEventButton);

    expect(
      await screen.findByRole('menuitem', { name: /ver detalhes e transações/i })
    ).toBeInTheDocument();
  });

  it('opens dropdown menu when clicking an event in DayView', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <MemoryRouter>
        <DayView
          currentDate={currentDate}
          events={[calendarEvent, allDayCalendarEvent]}
          onEventSelect={vi.fn()}
          onEventCreate={vi.fn()}
          onEventResize={vi.fn()}
          onEventResizeEnd={vi.fn()}
        />
      </MemoryRouter>
    );

    const dayEventButton = container.querySelector(
      '.group\\/event-block button[data-calendar-event]'
    );
    expect(dayEventButton).toBeInTheDocument();
    await user.click(dayEventButton);

    expect(
      await screen.findByRole('menuitem', { name: /ver detalhes e transações/i })
    ).toBeInTheDocument();
  });

  it('opens dropdown menu when clicking an upcoming event in EventsSidebarContent', async () => {
    const user = userEvent.setup();

    const futureRawEvent = {
      ...baseRawEvent,
      startDate: new Date(Date.now() + 86400000).toISOString(),
      endDate: new Date(Date.now() + 90000000).toISOString(),
    };
    const futureCalendarEvent = mapEventToCalendarItem(futureRawEvent);

    render(
      <MemoryRouter>
        <EventsSidebarContent
          currentDate={new Date()}
          onDateChange={vi.fn()}
          sidebarDate={new Date()}
          onSidebarDateChange={vi.fn()}
          events={[futureCalendarEvent]}
          onEventCreate={vi.fn()}
        />
      </MemoryRouter>
    );

    const sidebarEventButton = screen.getByRole('button', {
      name: new RegExp(futureCalendarEvent.title, 'i'),
    });
    await user.click(sidebarEventButton);

    expect(
      await screen.findByRole('menuitem', { name: /ver detalhes e transações/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /editar evento/i })
    ).toBeInTheDocument();
  });
});
