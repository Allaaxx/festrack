import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AgendaView from '@/features/events/components/agenda-view';

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
});
