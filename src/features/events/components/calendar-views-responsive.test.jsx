import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AgendaView } from '@/features/events/components/agenda-view';
import { DayView } from '@/features/events/components/day-view';
import EventCalendar from '@/features/events/components/event-calendar';
import { MonthView } from '@/features/events/components/month-view';
import { WeekView } from '@/features/events/components/week-view';
import { YearView } from '@/features/events/components/year-view';

vi.mock('@/components/ui/toast', () => ({
  toast: { add: vi.fn() },
}));

vi.mock('@/contexts/auth', () => ({
  useAuthContext: () => ({
    user: { id: 'user-1', name: 'User 1' },
  }),
}));

vi.mock('@/features/events/hooks/use-event-tag-filter', () => ({
  useEventTagFilter: () => ({
    filteredEvents: [],
    tagFilter: {
      showAllTags: true,
      selectedTags: [],
      tagOptions: [],
    },
  }),
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

describe('Fluid Calendar Below lg Breakpoint', () => {
  const currentDate = new Date(2027, 0, 15);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('EventCalendar', () => {
    it('applies fluid responsive classes instead of fixed heights below lg', () => {
      const { container } = render(
        <MemoryRouter>
          <EventCalendar events={[]} currentDate={currentDate} />
        </MemoryRouter>
      );

      // Root container inside EventCalendar
      const calendarRoot = container.firstElementChild;
      expect(calendarRoot).toBeInTheDocument();
      expect(calendarRoot).toHaveClass('flex', 'flex-1', 'flex-col');
      expect(calendarRoot).toHaveClass(
        'lg:h-full',
        'lg:min-h-0',
        'lg:overflow-hidden'
      );
      expect(calendarRoot).not.toHaveClass('h-full');
      expect(calendarRoot).not.toHaveClass('overflow-hidden');

      // Second container (holds views and sidebar)
      const contentWrapper = calendarRoot?.children[1];
      expect(contentWrapper).toBeInTheDocument();
      expect(contentWrapper).toHaveClass('flex', 'flex-1', 'flex-row');
      expect(contentWrapper).toHaveClass('lg:min-h-0', 'lg:overflow-hidden');
      expect(contentWrapper).not.toHaveClass('min-h-0');
      expect(contentWrapper).not.toHaveClass('overflow-hidden');

      // Views container (wrapper around MonthView/WeekView etc.)
      const viewsContainer =
        contentWrapper?.firstElementChild?.firstElementChild;
      expect(viewsContainer).toBeInTheDocument();
      expect(viewsContainer).toHaveClass('flex', 'flex-1', 'flex-col');
      expect(viewsContainer).toHaveClass('lg:min-h-0', 'lg:overflow-hidden');
      expect(viewsContainer).not.toHaveClass('min-h-0');
      expect(viewsContainer).not.toHaveClass('overflow-hidden');
    });
  });

  describe('MonthView', () => {
    it('uses responsive classes on root and grid to expand naturally below lg', () => {
      const { container } = render(
        <MemoryRouter>
          <MonthView currentDate={currentDate} events={[]} />
        </MemoryRouter>
      );

      const monthRoot = container.querySelector('[data-slot="month-view"]');
      expect(monthRoot).toBeInTheDocument();
      expect(monthRoot).toHaveClass('flex', 'flex-col');
      expect(monthRoot).toHaveClass(
        'lg:h-full',
        'lg:min-h-0',
        'lg:flex-1',
        'lg:overflow-hidden'
      );
      expect(monthRoot).not.toHaveClass('h-full');
      expect(monthRoot).not.toHaveClass('overflow-hidden');

      // Month grid (weeks)
      const monthGrid = monthRoot?.children[1];
      expect(monthGrid).toBeInTheDocument();
      expect(monthGrid).toHaveClass('grid', 'auto-rows-fr');
      expect(monthGrid).toHaveClass(
        'lg:min-h-0',
        'lg:flex-1',
        'lg:overflow-y-auto'
      );
      expect(monthGrid).not.toHaveClass('min-h-0');
      expect(monthGrid).not.toHaveClass('flex-1');
      expect(monthGrid).not.toHaveClass('overflow-y-auto');
    });
  });

  describe('WeekView', () => {
    it('uses responsive classes on root and ScrollArea to expand naturally below lg', () => {
      const { container } = render(
        <MemoryRouter>
          <WeekView currentDate={currentDate} events={[]} />
        </MemoryRouter>
      );

      const weekRoot = container.querySelector('[data-slot="week-view"]');
      expect(weekRoot).toBeInTheDocument();
      expect(weekRoot).toHaveClass('flex', 'flex-col');
      expect(weekRoot).toHaveClass(
        'lg:h-full',
        'lg:min-h-0',
        'lg:flex-1',
        'lg:overflow-hidden'
      );
      expect(weekRoot).not.toHaveClass('h-full');
      expect(weekRoot).not.toHaveClass('overflow-hidden');

      // ScrollArea
      const scrollArea = weekRoot?.querySelector('[data-slot="scroll-area"]');
      expect(scrollArea).toBeInTheDocument();
      expect(scrollArea).toHaveClass('lg:h-full', 'lg:min-h-0', 'lg:flex-1');
      expect(scrollArea).not.toHaveClass('h-full');
      expect(scrollArea).not.toHaveClass('min-h-0');
    });
  });

  describe('DayView', () => {
    it('uses responsive classes on root and ScrollArea to expand naturally below lg', () => {
      const { container } = render(
        <MemoryRouter>
          <DayView currentDate={currentDate} events={[]} />
        </MemoryRouter>
      );

      const dayRoot = container.querySelector('[data-slot="day-view"]');
      expect(dayRoot).toBeInTheDocument();
      expect(dayRoot).toHaveClass('flex', 'flex-col');
      expect(dayRoot).toHaveClass(
        'lg:h-full',
        'lg:min-h-0',
        'lg:flex-1',
        'lg:overflow-hidden'
      );
      expect(dayRoot).not.toHaveClass('h-full');
      expect(dayRoot).not.toHaveClass('overflow-hidden');

      // ScrollArea
      const scrollArea = dayRoot?.querySelector('[data-slot="scroll-area"]');
      expect(scrollArea).toBeInTheDocument();
      expect(scrollArea).toHaveClass('lg:h-full', 'lg:min-h-0', 'lg:flex-1');
      expect(scrollArea).not.toHaveClass('h-full');
      expect(scrollArea).not.toHaveClass('min-h-0');
    });
  });

  describe('YearView', () => {
    it('uses responsive classes on root and ScrollArea to expand naturally below lg', () => {
      const { container } = render(
        <MemoryRouter>
          <YearView currentDate={currentDate} events={[]} />
        </MemoryRouter>
      );

      const yearRoot = container.firstElementChild;
      expect(yearRoot).toBeInTheDocument();
      expect(yearRoot).toHaveClass('flex', 'flex-col');
      expect(yearRoot).toHaveClass(
        'lg:h-full',
        'lg:min-h-0',
        'lg:flex-1',
        'lg:overflow-hidden'
      );
      expect(yearRoot).not.toHaveClass('h-full');
      expect(yearRoot).not.toHaveClass('overflow-hidden');

      // ScrollArea
      const scrollArea = yearRoot?.querySelector('[data-slot="scroll-area"]');
      expect(scrollArea).toBeInTheDocument();
      expect(scrollArea).toHaveClass('lg:h-full');
      expect(scrollArea).not.toHaveClass('h-full');
    });
  });

  describe('AgendaView', () => {
    it('uses responsive classes on root and ScrollArea to expand naturally below lg', () => {
      const { container } = render(
        <MemoryRouter>
          <AgendaView currentDate={currentDate} events={[]} />
        </MemoryRouter>
      );

      const agendaRoot = container.querySelector('[data-slot="agenda-view"]');
      expect(agendaRoot).toBeInTheDocument();
      expect(agendaRoot).toHaveClass('flex', 'flex-col');
      expect(agendaRoot).toHaveClass(
        'lg:h-full',
        'lg:min-h-0',
        'lg:flex-1',
        'lg:overflow-hidden'
      );
      expect(agendaRoot).not.toHaveClass('h-full');
      expect(agendaRoot).not.toHaveClass('overflow-hidden');

      // ScrollArea
      const scrollArea = agendaRoot?.querySelector('[data-slot="scroll-area"]');
      expect(scrollArea).toBeInTheDocument();
      expect(scrollArea).toHaveClass('lg:h-full', 'lg:min-h-0', 'lg:flex-1');
      expect(scrollArea).not.toHaveClass('h-full');
      expect(scrollArea).not.toHaveClass('min-h-0');
    });
  });
});
