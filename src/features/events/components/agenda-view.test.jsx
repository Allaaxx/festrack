import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AgendaView from '@/features/events/components/agenda-view';

describe('AgendaView (#131)', () => {
  const today = new Date();
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
});
