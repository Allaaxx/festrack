import { DndContext } from '@dnd-kit/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { AgendaView } from './agenda-view';
import { CalendarDragOverlay } from './calendar-drag-overlay';
import { DayView } from './day-view';
import { MonthView } from './month-view';
import { WeekView } from './week-view';
import { YearView } from './year-view';

vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    DragOverlay: ({ children }) => <div>{children}</div>,
  };
});

vi.mock('@/contexts/auth', () => ({
  useAuthContext: () => ({
    user: { id: 'user-1', name: 'Ana Silva', email: 'ana@example.com' },
  }),
}));

vi.mock('@/components/ui/toast', () => ({
  toast: { add: vi.fn() },
}));

vi.mock('./event-dropdown-menu', () => ({
  default: ({ children }) => <>{children}</>,
}));

describe('Calendar Views - Dynamic Tag Colors & Orphan Pink Fallback', () => {
  const currentDate = new Date(2027, 4, 12); // 2027-05-12

  const customTagOptions = [
    {
      id: 'tag-casamento',
      value: 'casamento',
      label: 'Casamento',
      dotClass: 'bg-teal-400',
    },
  ];

  const timedCustomEvent = {
    id: 'ev-custom',
    title: 'Cerimônia Jardim',
    tag: 'casamento',
    start: new Date(2027, 4, 12, 10, 0),
    end: new Date(2027, 4, 12, 11, 30),
    allDay: false,
  };

  const timedLegacyOrphanEvent = {
    id: 'ev-orphan',
    title: 'Almoço Legado',
    tag: 'family',
    start: new Date(2027, 4, 12, 13, 0),
    end: new Date(2027, 4, 12, 14, 0),
    allDay: false,
  };

  const allDayCustomEvent = {
    id: 'ev-allday-custom',
    title: 'Feira Dia Todo',
    tag: 'casamento',
    start: new Date(2027, 4, 12, 0, 0),
    end: new Date(2027, 4, 12, 23, 59),
    allDay: true,
  };

  const events = [timedCustomEvent, timedLegacyOrphanEvent];

  const renderWithProviders = (ui) =>
    render(
      <MemoryRouter>
        <DndContext>{ui}</DndContext>
      </MemoryRouter>
    );

  it('MonthView applies custom tag color and falls back to pink for orphan slug "family"', () => {
    renderWithProviders(
      <MonthView
        currentDate={currentDate}
        events={events}
        tagOptions={customTagOptions}
        onEventSelect={vi.fn()}
        onEventCreate={vi.fn()}
      />
    );

    const customBtn = screen.getByText('Cerimônia Jardim').closest('button');
    const orphanBtn = screen.getByText('Almoço Legado').closest('button');

    expect(customBtn.className).toContain('bg-teal-200/50');
    expect(orphanBtn.className).toContain('bg-pink-200/50');
  });

  it('WeekView applies custom tag color and falls back to pink for orphan slug "family"', () => {
    renderWithProviders(
      <WeekView
        currentDate={currentDate}
        events={[...events, allDayCustomEvent]}
        tagOptions={customTagOptions}
        onEventSelect={vi.fn()}
        onEventCreate={vi.fn()}
      />
    );

    const customBtn = screen.getByText('Cerimônia Jardim').closest('button');
    const allDayBtn = screen.getByText('Feira Dia Todo').closest('button');
    const orphanBtn = screen.getByText('Almoço Legado').closest('button');

    expect(customBtn.className).toContain('bg-teal-200/50');
    expect(allDayBtn.className).toContain('bg-teal-200/50');
    expect(orphanBtn.className).toContain('bg-pink-200/50');
  });

  it('DayView applies custom tag color and falls back to pink for orphan slug "family"', () => {
    renderWithProviders(
      <DayView
        currentDate={currentDate}
        events={[...events, allDayCustomEvent]}
        tagOptions={customTagOptions}
        onEventSelect={vi.fn()}
        onEventCreate={vi.fn()}
      />
    );

    const customBtn = screen.getByText('Cerimônia Jardim').closest('button');
    const allDayBtn = screen.getByText('Feira Dia Todo').closest('button');
    const orphanBtn = screen.getByText('Almoço Legado').closest('button');

    expect(customBtn.className).toContain('bg-teal-200/50');
    expect(allDayBtn.className).toContain('bg-teal-200/50');
    expect(orphanBtn.className).toContain('bg-pink-200/50');
  });

  it('YearView renders custom tag dot and pink fallback for orphan slug "family" in grid and dialog', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <YearView
        currentDate={currentDate}
        events={events}
        tagOptions={customTagOptions}
        onEventSelect={vi.fn()}
        onEventCreate={vi.fn()}
      />
    );

    expect(container.querySelector('.bg-teal-400')).toBeInTheDocument();
    expect(container.querySelector('.bg-pink-400')).toBeInTheDocument();

    const day12Buttons = screen.getAllByRole('button', { name: /^12/i });
    await user.click(day12Buttons[4]); // May (index 4)

    const customBtn = (await screen.findByText('Cerimônia Jardim')).closest(
      'button'
    );
    const orphanBtn = screen.getByText('Almoço Legado').closest('button');

    expect(customBtn.className).toContain('bg-teal-200/50');
    expect(orphanBtn.className).toContain('bg-pink-200/50');
  });

  it('AgendaView applies custom tag color and falls back to pink for orphan slug "family"', () => {
    renderWithProviders(
      <AgendaView
        currentDate={currentDate}
        events={events}
        tagOptions={customTagOptions}
        onEventSelect={vi.fn()}
      />
    );

    const customBtn = screen.getByText('Cerimônia Jardim').closest('button');
    const orphanBtn = screen.getByText('Almoço Legado').closest('button');

    expect(customBtn.className).toContain('bg-teal-200/50');
    expect(orphanBtn.className).toContain('bg-pink-200/50');
  });

  it('CalendarDragOverlay applies custom tag color and falls back to pink for orphan slug "family"', () => {
    const { rerender } = renderWithProviders(
      <CalendarDragOverlay
        activeEvent={timedCustomEvent}
        activeDragWidth={180}
        view="month"
        tagOptions={customTagOptions}
      />
    );

    expect(
      screen.getByText('Cerimônia Jardim').closest('button').className
    ).toContain('bg-teal-200/50');

    rerender(
      <MemoryRouter>
        <DndContext>
          <CalendarDragOverlay
            activeEvent={timedLegacyOrphanEvent}
            activeDragWidth={180}
            view="month"
            tagOptions={customTagOptions}
          />
        </DndContext>
      </MemoryRouter>
    );

    expect(
      screen.getByText('Almoço Legado').closest('button').className
    ).toContain('bg-pink-200/50');
  });
});
