import { render, screen, within } from '@testing-library/react';
import { addDays, format, startOfDay } from 'date-fns';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import EventCalendar from '@/features/events/components/event-calendar';
import { mapEventToCalendarItem } from '@/features/events/helpers/event';
import { useCalendarDnd } from '@/features/events/hooks/use-calendar-dnd';
import { useEventTagFilter } from '@/features/events/hooks/use-event-tag-filter';

// Mock sub-components and hooks to isolate EventCalendar orchestration
vi.mock('@/features/events/hooks/use-event-tag-filter', () => ({
  useEventTagFilter: vi.fn(),
}));

vi.mock('@/features/events/hooks/use-calendar-dnd', () => ({
  useCalendarDnd: vi.fn(),
}));

vi.mock('@/features/events/components/calendar-header', () => ({
  CalendarHeader: vi.fn((props) => (
    <header
      data-testid="calendar-header"
      data-props={JSON.stringify(Object.keys(props))}
    />
  )),
}));

vi.mock('..', () => ({
  EventsSidebar: vi.fn((props) => (
    <aside
      data-testid="events-sidebar"
      data-props={JSON.stringify(Object.keys(props))}
    />
  )),
}));

vi.mock('./month-view', () => ({
  MonthView: vi.fn(),
}));

vi.mock('./week-view', () => ({
  WeekView: vi.fn(({ events }) => (
    <div data-testid="week-view" data-event-count={events.length} />
  )),
}));

vi.mock('./day-view', () => ({
  DayView: vi.fn(),
}));

vi.mock('./year-view', () => ({
  YearView: vi.fn(({ events }) => (
    <div data-testid="year-view" data-event-count={events.length} />
  )),
}));

vi.mock('./agenda-view', () => ({
  AgendaView: vi.fn(({ events }) => (
    <div data-testid="agenda-view" data-event-count={events.length} />
  )),
}));

vi.mock('./calendar-drag-overlay', () => ({
  CalendarDragOverlay: vi.fn(() => <div data-testid="calendar-drag-overlay" />),
}));

describe('EventCalendar - useEventTagFilter Integration (#137)', () => {
  const sampleEvents = [
    { id: '1', title: 'Reunião Família', tag: 'family' },
    { id: '2', title: 'Planejamento Empresa', tag: 'business' },
  ];

  const mockTagFilterResult = {
    filteredEvents: [sampleEvents[0]],
    showAllTags: false,
    selectedTags: ['family'],
    tagOptions: [
      { value: 'family', label: 'Família' },
      { value: 'business', label: 'Negócios' },
    ],
    setShowAll: vi.fn(),
    toggleTag: vi.fn(),
    addTag: vi.fn(),
    removeTag: vi.fn(),
    setShowAllTags: vi.fn(),
    toggleTagFilter: vi.fn(),
    addTagOption: vi.fn(),
    removeTagOption: vi.fn(),
    onSetShowAllTags: vi.fn(),
    onToggleTagFilter: vi.fn(),
    onAddTagOption: vi.fn(),
    onRemoveTagOption: vi.fn(),
    tagFilter: {
      showAllTags: false,
      selectedTags: ['family'],
      tagOptions: [
        { value: 'family', label: 'Família' },
        { value: 'business', label: 'Negócios' },
      ],
      setShowAll: vi.fn(),
      toggleTag: vi.fn(),
      addTag: vi.fn(),
      removeTag: vi.fn(),
      setShowAllTags: vi.fn(),
      toggleTagFilter: vi.fn(),
      addTagOption: vi.fn(),
      removeTagOption: vi.fn(),
      onSetShowAllTags: vi.fn(),
      onToggleTagFilter: vi.fn(),
      onAddTagOption: vi.fn(),
      onRemoveTagOption: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const { MonthView } = await import('./month-view');
    const { DayView } = await import('./day-view');

    MonthView.mockImplementation(({ events }) => (
      <div data-testid="month-view" data-event-count={events.length}>
        {events.map((e) => (
          <span key={e.id} data-testid={`month-event-${e.id}`}>
            {e.title}
          </span>
        ))}
      </div>
    ));

    DayView.mockImplementation(({ events }) => (
      <div data-testid="day-view" data-event-count={events.length} />
    ));

    useEventTagFilter.mockReturnValue(mockTagFilterResult);

    useCalendarDnd.mockImplementation(({ events }) => ({
      calendarEvents: events,
      activeEvent: null,
      dragOverSlot: null,
      activeDragWidth: null,
      sensors: [],
      collisionDetection: vi.fn(),
      handleDragStart: vi.fn(),
      handleDragMove: vi.fn(),
      handleDragEnd: vi.fn(),
      handleDragCancel: vi.fn(),
      handleEventResize: vi.fn(),
      handleEventCommit: vi.fn(),
    }));
  });

  it('consumes useEventTagFilter passing events and passes filteredEvents to useCalendarDnd and active view', () => {
    render(<EventCalendar events={sampleEvents} initialView="month" />);

    // useEventTagFilter should be called with input events
    expect(useEventTagFilter).toHaveBeenCalledWith(sampleEvents);

    // useCalendarDnd should receive the filteredEvents from tagFilter
    expect(useCalendarDnd).toHaveBeenCalledWith(
      expect.objectContaining({
        events: mockTagFilterResult.filteredEvents,
      })
    );

    // MonthView should render only the filtered events
    const monthView = screen.getByTestId('month-view');
    expect(monthView).toHaveAttribute('data-event-count', '1');
    expect(screen.getByTestId('month-event-1')).toBeInTheDocument();
    expect(screen.queryByTestId('month-event-2')).not.toBeInTheDocument();
  });

  it('forwards cohesive tagFilter package to CalendarHeader and EventsSidebar without prop-drilling 16 attributes (#138)', async () => {
    const { CalendarHeader } =
      await import('@/features/events/components/calendar-header');
    const { EventsSidebar } = await import('..');

    render(<EventCalendar events={sampleEvents} />);

    // Verify CalendarHeader received only the cohesive tagFilter package and calendar props
    expect(CalendarHeader).toHaveBeenCalledWith(
      expect.objectContaining({
        tagFilter: mockTagFilterResult.tagFilter,
      }),
      undefined
    );

    const headerProps = CalendarHeader.mock.calls[0][0];
    expect(headerProps.tagFilter).toBe(mockTagFilterResult.tagFilter);
    expect(headerProps.tagFilter.tagFilter).toBeUndefined();
    expect(headerProps.showAllTags).toBeUndefined();
    expect(headerProps.selectedTags).toBeUndefined();
    expect(headerProps.tagOptions).toBeUndefined();
    expect(headerProps.onSetShowAllTags).toBeUndefined();
    expect(headerProps.onToggleTagFilter).toBeUndefined();
    expect(headerProps.onAddTagOption).toBeUndefined();
    expect(headerProps.onRemoveTagOption).toBeUndefined();
    expect(headerProps.showAllTypes).toBeUndefined();
    expect(headerProps.selectedTypes).toBeUndefined();
    expect(headerProps.eventTypeOptions).toBeUndefined();
    expect(headerProps.onSetShowAllTypes).toBeUndefined();
    expect(headerProps.onToggleTypeFilter).toBeUndefined();
    expect(headerProps.onAddEventTypeOption).toBeUndefined();
    expect(headerProps.onRemoveEventTypeOption).toBeUndefined();

    // Verify EventsSidebar received only the cohesive tagFilter package and calendar props
    expect(EventsSidebar).toHaveBeenCalledWith(
      expect.objectContaining({
        tagFilter: mockTagFilterResult.tagFilter,
      }),
      undefined
    );

    const sidebarProps = EventsSidebar.mock.calls[0][0];
    expect(sidebarProps.tagFilter).toBe(mockTagFilterResult.tagFilter);
    expect(sidebarProps.tagFilter.tagFilter).toBeUndefined();
    expect(sidebarProps.showAllTags).toBeUndefined();
    expect(sidebarProps.selectedTags).toBeUndefined();
    expect(sidebarProps.tagOptions).toBeUndefined();
    expect(sidebarProps.onSetShowAllTags).toBeUndefined();
    expect(sidebarProps.onToggleTagFilter).toBeUndefined();
    expect(sidebarProps.onAddTagOption).toBeUndefined();
    expect(sidebarProps.onRemoveTagOption).toBeUndefined();
    expect(sidebarProps.showAllTypes).toBeUndefined();
    expect(sidebarProps.selectedTypes).toBeUndefined();
    expect(sidebarProps.eventTypeOptions).toBeUndefined();
    expect(sidebarProps.onSetShowAllTypes).toBeUndefined();
    expect(sidebarProps.onToggleTypeFilter).toBeUndefined();
    expect(sidebarProps.onAddEventTypeOption).toBeUndefined();
    expect(sidebarProps.onRemoveEventTypeOption).toBeUndefined();
  });

  it('supports switching calendar views and feeding filtered events and tagOptions to all 5 views and CalendarDragOverlay', async () => {
    const { MonthView } = await import('./month-view');
    const { WeekView } = await import('./week-view');
    const { DayView } = await import('./day-view');
    const { YearView } = await import('./year-view');
    const { AgendaView } = await import('./agenda-view');
    const { CalendarDragOverlay } = await import('./calendar-drag-overlay');

    const { rerender } = render(
      <EventCalendar events={sampleEvents} view="month" />
    );
    expect(screen.getByTestId('month-view')).toHaveAttribute(
      'data-event-count',
      '1'
    );
    expect(MonthView.mock.calls.at(-1)[0].tagOptions).toBe(
      mockTagFilterResult.tagFilter.tagOptions
    );
    expect(CalendarDragOverlay.mock.calls.at(-1)[0].tagOptions).toBe(
      mockTagFilterResult.tagFilter.tagOptions
    );

    rerender(<EventCalendar events={sampleEvents} view="week" />);
    expect(screen.getByTestId('week-view')).toHaveAttribute(
      'data-event-count',
      '1'
    );
    expect(WeekView.mock.calls.at(-1)[0].tagOptions).toBe(
      mockTagFilterResult.tagFilter.tagOptions
    );

    rerender(<EventCalendar events={sampleEvents} view="day" />);
    expect(screen.getByTestId('day-view')).toHaveAttribute(
      'data-event-count',
      '1'
    );
    expect(DayView.mock.calls.at(-1)[0].tagOptions).toBe(
      mockTagFilterResult.tagFilter.tagOptions
    );

    rerender(<EventCalendar events={sampleEvents} view="year" />);
    expect(screen.getByTestId('year-view')).toHaveAttribute(
      'data-event-count',
      '1'
    );
    expect(YearView.mock.calls.at(-1)[0].tagOptions).toBe(
      mockTagFilterResult.tagFilter.tagOptions
    );

    rerender(<EventCalendar events={sampleEvents} view="agenda" />);
    expect(screen.getByTestId('agenda-view')).toHaveAttribute(
      'data-event-count',
      '1'
    );
    expect(AgendaView.mock.calls.at(-1)[0].tagOptions).toBe(
      mockTagFilterResult.tagFilter.tagOptions
    );
  });

  it('handles empty server tagOptions cleanly when shop has no tags (#142)', () => {
    useEventTagFilter.mockReturnValue({
      ...mockTagFilterResult,
      tagOptions: [],
      tagFilter: {
        ...mockTagFilterResult.tagFilter,
        tagOptions: [],
      },
    });

    render(<EventCalendar events={sampleEvents} />);

    expect(screen.getByTestId('calendar-header')).toBeInTheDocument();
    expect(screen.getByTestId('events-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('month-view')).toBeInTheDocument();
  });
});

describe('EventCalendar - All-Day & Night-Time Timed Event Rendering (#154/#155/#156)', () => {
  const getMonthCellForDay = (container, dayNumber) => {
    const cells = container.querySelectorAll(
      '[data-slot="month-day-cell"]:not([data-outside-cell])'
    );
    return Array.from(cells).find(
      (cell) => cell.firstElementChild?.textContent?.trim() === String(dayNumber)
    );
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const actualMonth = await vi.importActual('./month-view');
    const actualDay = await vi.importActual('./day-view');
    const actualDnd = await vi.importActual(
      '@/features/events/hooks/use-calendar-dnd'
    );

    const { MonthView } = await import('./month-view');
    const { DayView } = await import('./day-view');

    MonthView.mockImplementation(actualMonth.MonthView);
    DayView.mockImplementation(actualDay.DayView);
    useCalendarDnd.mockImplementation(actualDnd.useCalendarDnd);

    useEventTagFilter.mockImplementation((inputEvents) => ({
      filteredEvents: inputEvents,
      tagFilter: {
        showAllTags: true,
        selectedTags: [],
        tagOptions: [],
      },
    }));
  });

  it('renders an allDay: true event (T00:00:00.000Z–T23:59:59.000Z) on its civil day without next-day spillover', () => {
    const allDayItem = mapEventToCalendarItem({
      id: 'ev-allday-civil',
      name: 'Festival Civil',
      startDate: '2026-11-18T00:00:00.000Z',
      endDate: '2026-11-18T23:59:59.000Z',
      allDay: true,
    });

    const { container, rerender } = render(
      <MemoryRouter>
        <EventCalendar
          events={[allDayItem]}
          view="month"
          currentDate={new Date(2026, 10, 18)}
        />
      </MemoryRouter>
    );

    const day18Cell = getMonthCellForDay(container, 18);
    const day19Cell = getMonthCellForDay(container, 19);

    expect(day18Cell).toBeTruthy();
    expect(day19Cell).toBeTruthy();
    expect(within(day18Cell).getByText('Festival Civil')).toBeInTheDocument();
    expect(
      within(day19Cell).queryByText('Festival Civil')
    ).not.toBeInTheDocument();
    expect(screen.getAllByText('Festival Civil')).toHaveLength(1);

    rerender(
      <MemoryRouter>
        <EventCalendar
          events={[allDayItem]}
          view="day"
          currentDate={new Date(2026, 10, 18)}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Dia todo')).toBeInTheDocument();
    expect(screen.getByText('Festival Civil')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <EventCalendar
          events={[allDayItem]}
          view="day"
          currentDate={new Date(2026, 10, 19)}
        />
      </MemoryRouter>
    );
    expect(screen.queryByText('Festival Civil')).not.toBeInTheDocument();
  });

  it('renders a night-time Timed Event (allDay: false, UTC Z) on the expected local day and time', () => {
    const startUtc = '2026-11-19T01:00:00.000Z';
    const endUtc = '2026-11-19T02:30:00.000Z';
    const expectedStart = new Date(startUtc);
    const expectedEnd = new Date(endUtc);
    const expectedStartTime = format(expectedStart, 'HH:mm');
    const expectedTimeRange = `${expectedStartTime} - ${format(expectedEnd, 'HH:mm')}`;
    const expectedDayNumber = Number(format(expectedStart, 'd'));
    const nextDay = addDays(startOfDay(expectedStart), 1);

    const timedItem = mapEventToCalendarItem({
      id: 'ev-night-timed',
      name: 'Jantar Noturno',
      startDate: startUtc,
      endDate: endUtc,
      allDay: false,
    });

    const { container, rerender } = render(
      <MemoryRouter>
        <EventCalendar
          events={[timedItem]}
          view="month"
          currentDate={startOfDay(expectedStart)}
        />
      </MemoryRouter>
    );

    const expectedCell = getMonthCellForDay(container, expectedDayNumber);
    expect(expectedCell).toBeTruthy();
    expect(within(expectedCell).getByText('Jantar Noturno')).toBeInTheDocument();
    expect(within(expectedCell).getByText(expectedStartTime)).toBeInTheDocument();
    expect(screen.getAllByText('Jantar Noturno')).toHaveLength(1);

    rerender(
      <MemoryRouter>
        <EventCalendar
          events={[timedItem]}
          view="day"
          currentDate={startOfDay(expectedStart)}
        />
      </MemoryRouter>
    );
    expect(screen.queryByText('Dia todo')).not.toBeInTheDocument();
    expect(screen.getByText('Jantar Noturno')).toBeInTheDocument();
    expect(screen.getByText(expectedTimeRange)).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <EventCalendar
          events={[timedItem]}
          view="day"
          currentDate={nextDay}
        />
      </MemoryRouter>
    );
    expect(screen.queryByText('Jantar Noturno')).not.toBeInTheDocument();
  });
});
