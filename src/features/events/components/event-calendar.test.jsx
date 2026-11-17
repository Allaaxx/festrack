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

  it('forwards cohesive tagFilter package to CalendarHeader and EventsSidebar without prop-drilling 16 attributes (#138)', async () => {
    const { CalendarHeader } = await import('@/features/events/components/calendar-header');
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
