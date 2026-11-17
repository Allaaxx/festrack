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

  it('opens dialog with events list and create button when clicking a day with events', async () => {
    const user = userEvent.setup();
    const onEventSelect = vi.fn();
    const onEventCreate = vi.fn();

    render(
      <YearView
        currentDate={currentDate}
        events={mockEvents}
        onEventSelect={onEventSelect}
        onEventCreate={onEventCreate}
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

    const createButton = screen.getByRole('button', { name: /criar evento/i });
    expect(createButton).toBeInTheDocument();
    await user.click(createButton);
    expect(onEventCreate).toHaveBeenCalledTimes(1);
  });

  it('renders multi-day events across each day in the span', async () => {
    const user = userEvent.setup();
    const multiDayEvents = [
      {
        id: 'multi-1',
        title: 'Festival Multi-dia',
        start: new Date(2027, 0, 20),
        end: new Date(2027, 0, 22),
        color: 'scheduled',
      },
    ];

    render(<YearView currentDate={currentDate} events={multiDayEvents} />);

    // Day 21 (middle day of span) should have the event in its dialog
    const day21Buttons = screen.getAllByRole('button', { name: /^21/i });
    await user.click(day21Buttons[0]);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Festival Multi-dia')).toBeInTheDocument();
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

  it('renders untagged events and orphan tags with neutral pink dot and pink event item (#145)', async () => {
    const user = userEvent.setup();
    const untaggedEvent = {
      id: 'ev-pink',
      title: 'Evento Sem Etiqueta',
      start: new Date(2027, 0, 5, 14, 0),
      end: new Date(2027, 0, 5, 15, 0),
      tag: null,
    };
    const orphanEvent = {
      id: 'ev-orphan',
      title: 'Evento com Tag Órfã',
      start: new Date(2027, 0, 8, 14, 0),
      end: new Date(2027, 0, 8, 15, 0),
      tag: 'deleted-tag',
    };
    const shopTags = [
      { value: 'active-tag', label: 'Tag Ativa', dotClass: 'bg-indigo-400' },
    ];

    const { container } = render(
      <YearView
        currentDate={currentDate}
        events={[untaggedEvent, orphanEvent]}
        tagOptions={shopTags}
      />
    );

    // Both untagged and orphan events should have pink indicator dots (bg-pink-400)
    const pinkDots = container.querySelectorAll('.bg-pink-400');
    expect(pinkDots.length).toBeGreaterThanOrEqual(2);

    // Clicking day 5 opens dialog with pink EventItem
    const day5Buttons = screen.getAllByRole('button', { name: /^5/i });
    await user.click(day5Buttons[0]);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    const eventItem = screen.getByText('Evento Sem Etiqueta').closest('button');
    expect(eventItem.className).toContain('bg-pink-200/50');
  });
});
