import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AgendaView from '@/features/events/components/agenda-view';
import { EventItem } from '@/features/events/components/event-item';
import { mapEventToCalendarItem } from '@/features/events/helpers/event';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: () => ({
    user: {
      id: 'user-logged-in',
      name: 'Usuário Logado',
      first_name: 'Usuário',
      last_name: 'Logado',
      email: 'logado@example.com',
      image: null,
    },
  }),
}));

describe('AgendaView (#131)', () => {
  const today = new Date();
  today.setHours(10, 0, 0, 0);

  const mockEvents = [
    {
      id: 'ev-agenda-1',
      title: 'Reunião com Fornecedores',
      start: today,
      end: new Date(today.getTime() + 3600000),
      color: 'scheduled',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when there are no events in the 30-day window', () => {
    render(<AgendaView currentDate={today} events={[]} />);

    expect(screen.getByText('Nenhum evento encontrado')).toBeInTheDocument();
    expect(
      screen.getByText('Não há eventos agendados para este período.')
    ).toBeInTheDocument();
  });

  it('renders grouped events with pt-BR date header and Hoje badge for today', () => {
    render(<AgendaView currentDate={today} events={mockEvents} />);

    expect(screen.getByText('Hoje')).toBeInTheDocument();
    expect(screen.getByText('Reunião com Fornecedores')).toBeInTheDocument();
  });

  it('triggers onEventSelect when an event item is clicked', async () => {
    const user = userEvent.setup();
    const onEventSelect = vi.fn();

    render(
      <AgendaView
        currentDate={today}
        events={mockEvents}
        onEventSelect={onEventSelect}
      />
    );

    const eventItem = screen.getByText('Reunião com Fornecedores');
    await user.click(eventItem);

    expect(onEventSelect).toHaveBeenCalledTimes(1);
    expect(onEventSelect).toHaveBeenCalledWith(mockEvents[0]);
  });

  it('handles multi-day events spanning across days without duplicate single-day leak', () => {
    const multiDayEvent = {
      id: 'ev-multi-day',
      title: 'Workshop Intensivo',
      start: today,
      end: new Date(today.getTime() + 86400000 * 2),
      color: 'scheduled',
    };

    render(<AgendaView currentDate={today} events={[multiDayEvent]} />);
    const workshopElements = screen.getAllByText('Workshop Intensivo');
    expect(workshopElements.length).toBeGreaterThanOrEqual(2);
  });

  it('renders event description and author with avatar in agenda view cards', () => {
    const detailedEvent = {
      id: 'ev-detailed-1',
      title: 'Company Offsite',
      description: 'Team building and strategy planning retreat',
      author: {
        name: 'Allan Silva',
        image: 'https://example.com/avatar.jpg',
      },
      start: today,
      end: new Date(today.getTime() + 7200000),
      color: 'scheduled',
    };

    render(<AgendaView currentDate={today} events={[detailedEvent]} />);

    expect(screen.getByText('Company Offsite')).toBeInTheDocument();
    expect(screen.getByText('Allan Silva')).toBeInTheDocument();
    expect(screen.getByText('AS')).toBeInTheDocument();
    expect(
      screen.getByText('Team building and strategy planning retreat')
    ).toBeInTheDocument();
    expect(screen.queryByText(/location/i)).not.toBeInTheDocument();
  });

  it('renders author string and fallback initials without throwing when author is string', () => {
    const stringAuthorEvent = {
      id: 'ev-string-author',
      title: 'Workshop de Design',
      description: 'Alinhamento de design tokens',
      author: 'Lakeside Resort',
      start: today,
      end: new Date(today.getTime() + 3600000),
      color: 'scheduled',
    };

    render(<AgendaView currentDate={today} events={[stringAuthorEvent]} />);

    expect(screen.getByText('Workshop de Design')).toBeInTheDocument();
    expect(screen.getByText('Lakeside Resort')).toBeInTheDocument();
    expect(screen.getByText('LR')).toBeInTheDocument();
    expect(
      screen.getByText('Alinhamento de design tokens')
    ).toBeInTheDocument();
  });

  it('displays creator avatar initials and full name when event is created by another Shop Member (#147)', () => {
    const memberEvent = mapEventToCalendarItem({
      id: 'ev-member-1',
      name: 'Evento de Outro Membro',
      description: 'Detalhes do evento',
      createdByUserId: 'user-other',
      author: {
        id: 'user-other',
        name: 'Maria Clara',
        first_name: 'Maria',
        last_name: 'Clara',
        email: 'maria@example.com',
        image: null,
      },
      startDate: today,
      endDate: new Date(today.getTime() + 3600000),
      allDay: false,
    });

    render(<AgendaView currentDate={today} events={[memberEvent]} />);

    expect(screen.getByText('Evento de Outro Membro')).toBeInTheDocument();
    expect(screen.getByText('Maria Clara')).toBeInTheDocument();
    expect(screen.getByText('MC')).toBeInTheDocument();
  });

  it('renders "Membro" fallback when created_by_user_id is null even when a user is logged in (#147)', () => {
    const orphanEvent = mapEventToCalendarItem({
      id: 'ev-orphan-1',
      name: 'Evento Sem Autor',
      description: null,
      createdByUserId: null,
      author: null,
      startDate: today,
      endDate: new Date(today.getTime() + 3600000),
      allDay: false,
    });

    render(<AgendaView currentDate={today} events={[orphanEvent]} />);

    expect(screen.getByText('Evento Sem Autor')).toBeInTheDocument();
    expect(screen.getByText('Membro')).toBeInTheDocument();
    expect(screen.queryByText('Usuário Logado')).not.toBeInTheDocument();
  });

  it('does NOT render author name in month, week, or day views (#147)', () => {
    const calendarItem = mapEventToCalendarItem({
      id: 'ev-other-views',
      name: 'Reunião Mensal',
      description: null,
      createdByUserId: 'user-other',
      author: {
        id: 'user-other',
        name: 'Carlos Drummond',
        first_name: 'Carlos',
        last_name: 'Drummond',
        email: 'carlos@example.com',
        image: null,
      },
      startDate: today,
      endDate: new Date(today.getTime() + 3600000),
      allDay: false,
    });

    const { rerender } = render(
      <EventItem event={calendarItem} view="month" />
    );
    expect(screen.queryByText('Carlos Drummond')).not.toBeInTheDocument();

    rerender(<EventItem event={calendarItem} view="week" />);
    expect(screen.queryByText('Carlos Drummond')).not.toBeInTheDocument();

    rerender(<EventItem event={calendarItem} view="day" />);
    expect(screen.queryByText('Carlos Drummond')).not.toBeInTheDocument();
  });

  it('renders multi-day All-Day Event from UTC bounds strictly on its civil days with "Dia todo" (#155)', () => {
    const baseDate = new Date(2026, 10, 18);
    const allDayEvent = mapEventToCalendarItem({
      id: 'ev-all-day-agenda',
      name: 'Congresso Civil',
      startDate: '2026-11-18T00:00:00.000Z',
      endDate: '2026-11-19T23:59:59.000Z',
      allDay: true,
    });

    render(<AgendaView currentDate={baseDate} events={[allDayEvent]} />);

    expect(screen.getAllByText('Congresso Civil')).toHaveLength(2);
    expect(screen.getAllByText('Dia todo')).toHaveLength(2);
    expect(screen.queryByText(/03:00|02:59/)).not.toBeInTheDocument();
  });
});
