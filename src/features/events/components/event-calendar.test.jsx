import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import EventCalendar from '@/features/events/components/event-calendar';
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
    <header data-testid="calendar-header" data-props={JSON.stringify(Object.keys(props))} />
  )),
}));

vi.mock('..', () => ({
  EventsSidebar: vi.fn((props) => (
    <aside data-testid="events-sidebar" data-props={JSON.stringify(Object.keys(props))} />
  )),
}));

vi.mock('./month-view', () => ({
  MonthView: vi.fn(({ events }) => (
    <div data-testid="month-view" data-event-count={events.length}>
      {events.map((e) => (
        <span key={e.id} data-testid={`month-event-${e.id}`}>
          {e.title}
        </span>
      ))}
    </div>
  )),
}));

vi.mock('./week-view', () => ({
  WeekView: vi.fn(({ events }) => (
    <div data-testid="week-view" data-event-count={events.length} />
  )),
}));

vi.mock('./day-view', () => ({
  DayView: vi.fn(({ events }) => (
    <div data-testid="day-view" data-event-count={events.length} />
  )),
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
      onSetShowAllTags: vi.fn(),
      onToggleTagFilter: vi.fn(),
      onAddTagOption: vi.fn(),
      onRemoveTagOption: vi.fn(),
      showAllTypes: false,
      selectedTypes: ['family'],
      eventTypeOptions: [
        { value: 'family', label: 'Família' },
        { value: 'business', label: 'Negócios' },
      ],
      onSetShowAllTypes: vi.fn(),
      onToggleTypeFilter: vi.fn(),
      onAddEventTypeOption: vi.fn(),
      onRemoveEventTypeOption: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

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

  it('forwards tagFilterProps and tagFilter package to CalendarHeader and EventsSidebar', async () => {
    const { CalendarHeader } = await import('@/features/events/components/calendar-header');
    const { EventsSidebar } = await import('..');

    render(<EventCalendar events={sampleEvents} />);

    // Verify CalendarHeader received tag filter props including tagFilter package and aliases
    expect(CalendarHeader).toHaveBeenCalledWith(
      expect.objectContaining({
        showAllTags: false,
        selectedTags: ['family'],
        tagOptions: mockTagFilterResult.tagOptions,
        onSetShowAllTags: mockTagFilterResult.onSetShowAllTags,
        onToggleTagFilter: mockTagFilterResult.onToggleTagFilter,
        onAddTagOption: mockTagFilterResult.onAddTagOption,
        onRemoveTagOption: mockTagFilterResult.onRemoveTagOption,
        showAllTypes: false,
        selectedTypes: ['family'],
        eventTypeOptions: mockTagFilterResult.tagOptions,
        onSetShowAllTypes: mockTagFilterResult.onSetShowAllTags,
        onToggleTypeFilter: mockTagFilterResult.onToggleTagFilter,
        onAddEventTypeOption: mockTagFilterResult.onAddTagOption,
        onRemoveEventTypeOption: mockTagFilterResult.onRemoveTagOption,
        tagFilter: mockTagFilterResult.tagFilter,
      }),
      undefined
    );

    // Verify EventsSidebar received tag filter props
    expect(EventsSidebar).toHaveBeenCalledWith(
      expect.objectContaining({
        showAllTags: false,
        selectedTags: ['family'],
        tagFilter: mockTagFilterResult.tagFilter,
      }),
      undefined
    );
  });

  it('supports switching calendar views and feeding filtered events to WeekView, DayView, YearView, and AgendaView', () => {
    const { rerender } = render(<EventCalendar events={sampleEvents} view="week" />);
    expect(screen.getByTestId('week-view')).toHaveAttribute('data-event-count', '1');

    rerender(<EventCalendar events={sampleEvents} view="day" />);
    expect(screen.getByTestId('day-view')).toHaveAttribute('data-event-count', '1');

    rerender(<EventCalendar events={sampleEvents} view="year" />);
    expect(screen.getByTestId('year-view')).toHaveAttribute('data-event-count', '1');

    rerender(<EventCalendar events={sampleEvents} view="agenda" />);
    expect(screen.getByTestId('agenda-view')).toHaveAttribute('data-event-count', '1');
  });
});
