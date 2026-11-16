import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import YearView from '@/features/events/components/year-view';

vi.mock('@/components/ui/toast', () => ({
  toast: { add: vi.fn() },
}));

describe('YearView (#130)', () => {
  const currentDate = new Date(2027, 0, 1); // 2027-01-01
  const mockEvents = [
    {
      id: 'ev-1',
      title: 'Planejamento Estratégico',
      start: new Date(2027, 0, 15, 10, 0),
      end: new Date(2027, 0, 15, 11, 0),
      color: 'scheduled',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 12 months with Portuguese (BR) headers', () => {
    render(<YearView currentDate={currentDate} events={mockEvents} />);

    expect(screen.getByText(/janeiro/i)).toBeInTheDocument();
    expect(screen.getByText(/fevereiro/i)).toBeInTheDocument();
    expect(screen.getByText(/dezembro/i)).toBeInTheDocument();
  });

  it('opens dialog with events list when clicking a day with events', async () => {
    const user = userEvent.setup();
    const onEventSelect = vi.fn();

    render(
      <YearView
        currentDate={currentDate}
        events={mockEvents}
        onEventSelect={onEventSelect}
      />
    );

    // Find the button for day 15 in January
    const day15Buttons = screen.getAllByRole('button', { name: /^15/i });
    // First one corresponds to January
    await user.click(day15Buttons[0]);

    // Dialog opens
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText(/eventos em sexta-feira, 15 de janeiro de 2027/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Planejamento Estratégico')).toBeInTheDocument();
  });

  it('opens dialog with empty state and create button when clicking a day with no events', async () => {
    const user = userEvent.setup();
    const onEventCreate = vi.fn();

    render(
      <YearView
        currentDate={currentDate}
        events={mockEvents}
        onEventCreate={onEventCreate}
      />
    );

    // Find the button for day 10 in January (no events)
    const day10Buttons = screen.getAllByRole('button', { name: /^10/i });
    await user.click(day10Buttons[0]);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Nenhum evento planejado')).toBeInTheDocument();

    const createButton = screen.getByRole('button', { name: /criar evento/i });
    await user.click(createButton);

    expect(onEventCreate).toHaveBeenCalledTimes(1);
  });
});
