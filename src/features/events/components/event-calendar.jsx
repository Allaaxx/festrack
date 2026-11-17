import { DndContext } from '@dnd-kit/core';
import { useMemo, useState } from 'react';

import { useShopContext } from '@/contexts/shop';
import { cn } from '@/lib/utils';

import { EventsSidebar } from '..';
import {
  useCreateEventTag,
  useDeleteEventTag,
  useGetEventTags,
} from '../api/hooks';
import { EventGap, EventHeight, WeekCellsHeight } from '../constants';
import { useCalendarDnd } from '../hooks/use-calendar-dnd';
import { useCalendarNavigation } from '../hooks/use-calendar-navigation';
import { AgendaView } from './agenda-view';
import { CalendarDragOverlay } from './calendar-drag-overlay';
import { CalendarHeader } from './calendar-header';
import { DayView } from './day-view';
import { DEFAULT_EVENT_TAGS } from './event-tag-filter-dropdown';
import { MonthView } from './month-view';
import { WeekView } from './week-view';
import { YearView } from './year-view';

// Re-exportações para preservar compatibilidade retroativa
export {
  DefaultStartHour,
  EndHour,
  EventGap,
  EventHeight,
  StartHour,
  WeekCellsHeight,
} from '../constants';
export {
  calculateDayPositionedEvents,
  getAllEventsForDay,
  getEventsForDay,
  getSpanningEventsForDay,
  isMultiDayEvent,
  sortEvents,
} from '../helpers/calendar-layout';
export {
  getBorderRadiusClasses,
  getEventColorClasses,
  getMonthViewBleedClasses,
  getMonthViewEventPaddingClasses,
} from '../helpers/calendar-styles';
export { EVENT_STATUSES } from '../helpers/event';

const EventCalendar = ({
  events = [],
  initialView = 'month',
  view: controlledView,
  onViewChange,
  currentDate: controlledCurrentDate,
  onDateChange,
  sidebarDate,
  onSidebarDateChange,
  className,
  onEventSelect = () => {},
  onEventCreate = () => {},
  onEventUpdate = () => {},
}) => {
  const shopContext = useShopContext?.();
  const shopId = shopContext?.activeShop?.id;

  const tagsStorageKey = shopId
    ? `festrack:${shopId}:event_tags`
    : 'festrack:event_tags';
  const filtersStorageKey = shopId
    ? `festrack:${shopId}:event_tag_filters`
    : 'festrack:event_tag_filters';

  const [customTagOptions, setCustomTagOptions] = useState(() => {
    try {
      const stored =
        localStorage.getItem(tagsStorageKey) ||
        (!shopId ? localStorage.getItem('festrack:event_tags') : null);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [filterState, setFilterState] = useState(() => {
    try {
      const stored = localStorage.getItem(filtersStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          showAllTags: parsed.showAllTags ?? true,
          selectedTags: parsed.selectedTags ?? [],
        };
      }
    } catch {
      // ignore
    }
    return { showAllTags: true, selectedTags: [] };
  });

  const showAllTags = filterState.showAllTags;
  const selectedTags = filterState.selectedTags;

  const persistTags = (tags) => {
    try {
      localStorage.setItem(tagsStorageKey, JSON.stringify(tags));
    } catch (err) {
      void err;
    }
  };

  const persistFilters = (filters) => {
    try {
      localStorage.setItem(filtersStorageKey, JSON.stringify(filters));
    } catch (err) {
      void err;
    }
  };

  const { data: serverTags } = useGetEventTags();
  const createTagMutation = useCreateEventTag();
  const deleteTagMutation = useDeleteEventTag();

  const allTagOptions = useMemo(() => {
    if (serverTags && serverTags.length > 0) {
      return serverTags.map((t) => ({
        id: t.id,
        value: t.slug || t.value,
        label: t.name || t.label,
        dotClass: t.color || t.dotClass,
        isSystem: t.is_system ?? t.isSystem,
      }));
    }
    return [...DEFAULT_EVENT_TAGS, ...customTagOptions];
  }, [serverTags, customTagOptions]);

  const {
    currentDate,
    view,
    viewTitle,
    viewLabels,
    goToToday,
    goToPrevious,
    goToNext,
    handleViewChange,
  } = useCalendarNavigation({
    initialView,
    view: controlledView,
    onViewChange,
    currentDate: controlledCurrentDate,
    onDateChange,
  });

  const handleSetShowAllTags = (showAll) => {
    const next = {
      showAllTags: showAll,
      selectedTags: showAll ? [] : allTagOptions.map((opt) => opt.value),
    };
    setFilterState(next);
    persistFilters(next);
  };

  const handleToggleTagFilter = (value, checked) => {
    setFilterState((prev) => {
      let nextSelected;
      let nextShowAll;

      if (prev.showAllTags) {
        if (!checked) {
          nextSelected = allTagOptions
            .map((opt) => opt.value)
            .filter((v) => v !== value);
          nextShowAll = false;
        } else {
          return prev;
        }
      } else {
        if (checked) {
          nextSelected = prev.selectedTags.includes(value)
            ? prev.selectedTags
            : [...prev.selectedTags, value];
        } else {
          nextSelected = prev.selectedTags.filter((v) => v !== value);
        }

        if (
          nextSelected.length === 0 ||
          nextSelected.length === allTagOptions.length
        ) {
          nextShowAll = true;
          nextSelected = [];
        } else {
          nextShowAll = false;
        }
      }

      const next = { showAllTags: nextShowAll, selectedTags: nextSelected };
      persistFilters(next);
      return next;
    });
  };

  const handleAddTagOption = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const value = trimmed.toLowerCase().replace(/\s+/g, '-');
    if (allTagOptions.some((opt) => opt.value === value)) return;

    const colorPalette = [
      'bg-indigo-400',
      'bg-teal-400',
      'bg-orange-400',
      'bg-pink-400',
      'bg-cyan-400',
      'bg-lime-400',
    ];
    const color = colorPalette[customTagOptions.length % colorPalette.length];
    const newOption = { value, label: trimmed, dotClass: color };
    setCustomTagOptions((prev) => {
      const next = [...prev, newOption];
      persistTags(next);
      return next;
    });

    createTagMutation?.mutate?.({
      name: trimmed,
      color,
      slug: value,
    });
  };

  const handleRemoveTagOption = (value, id) => {
    setCustomTagOptions((prev) => {
      const next = prev.filter(
        (opt) => opt.value !== value && (!id || opt.id !== id)
      );
      persistTags(next);
      return next;
    });
    setFilterState((prev) => {
      const next = {
        showAllTags: prev.showAllTags,
        selectedTags: prev.selectedTags.filter((v) => v !== value),
      };
      persistFilters(next);
      return next;
    });

    const targetId = id || allTagOptions.find((opt) => opt.value === value)?.id;
    if (targetId) {
      deleteTagMutation?.mutate?.({ tagId: targetId });
    }
  };

  const filteredEvents = useMemo(() => {
    if (showAllTags || selectedTags.length === 0) return events;
    return events.filter((event) => {
      const eventTag =
        event.tag ||
        event.rawEvent?.tag ||
        event.rawEvent?.category ||
        event.event ||
        event.color ||
        'etc';
      return selectedTags.includes(eventTag);
    });
  }, [events, showAllTags, selectedTags]);

  const tagFilterProps = {
    showAllTags,
    selectedTags,
    tagOptions: allTagOptions,
    onSetShowAllTags: handleSetShowAllTags,
    onToggleTagFilter: handleToggleTagFilter,
    onAddTagOption: handleAddTagOption,
    onRemoveTagOption: handleRemoveTagOption,
    // Backward-compatibility aliases
    showAllTypes: showAllTags,
    selectedTypes: selectedTags,
    eventTypeOptions: allTagOptions,
    onSetShowAllTypes: handleSetShowAllTags,
    onToggleTypeFilter: handleToggleTagFilter,
    onAddEventTypeOption: handleAddTagOption,
    onRemoveEventTypeOption: handleRemoveTagOption,
  };

  const {
    calendarEvents,
    activeEvent,
    dragOverSlot,
    activeDragWidth,
    sensors,
    collisionDetection,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
    handleEventResize,
    handleEventCommit,
  } = useCalendarDnd({
    events: filteredEvents,
    onEventUpdate,
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <CalendarHeader
          view={view}
          viewTitle={viewTitle}
          viewLabels={viewLabels}
          onViewChange={handleViewChange}
          onEventCreate={onEventCreate}
          onToday={goToToday}
          onPrevious={goToPrevious}
          onNext={goToNext}
          events={calendarEvents}
          currentDate={currentDate}
          onDateChange={onDateChange}
          sidebarDate={sidebarDate}
          onSidebarDateChange={onSidebarDateChange}
          {...tagFilterProps}
        />
        <div className="flex h-full min-h-0 flex-1 flex-row overflow-hidden">
          <div
            className={cn(
              'bg-card flex h-full min-h-0 flex-1 flex-col overflow-hidden',
              className
            )}
            style={{
              '--event-height': `${EventHeight}px`,
              '--event-gap': `${EventGap}px`,
              '--week-cells-height': `${WeekCellsHeight}px`,
            }}
          >
            <div className="bg-background flex h-full min-h-0 flex-1 flex-col overflow-hidden">
              {view === 'month' && (
                <MonthView
                  currentDate={currentDate}
                  events={calendarEvents}
                  onEventSelect={onEventSelect}
                  onEventCreate={onEventCreate}
                />
              )}
              {view === 'week' && (
                <WeekView
                  currentDate={currentDate}
                  events={calendarEvents}
                  dragOverSlot={dragOverSlot}
                  onEventSelect={onEventSelect}
                  onEventCreate={onEventCreate}
                  onEventResize={handleEventResize}
                  onEventResizeEnd={handleEventCommit}
                />
              )}
              {view === 'day' && (
                <DayView
                  currentDate={currentDate}
                  events={calendarEvents}
                  dragOverSlot={dragOverSlot}
                  onEventSelect={onEventSelect}
                  onEventCreate={onEventCreate}
                  onEventResize={handleEventResize}
                  onEventResizeEnd={handleEventCommit}
                />
              )}
              {view === 'year' && (
                <YearView
                  currentDate={currentDate}
                  events={calendarEvents}
                  onEventSelect={onEventSelect}
                  onEventCreate={onEventCreate}
                />
              )}
              {view === 'agenda' && (
                <AgendaView
                  currentDate={currentDate}
                  events={calendarEvents}
                  onEventSelect={onEventSelect}
                />
              )}
            </div>
          </div>
          <EventsSidebar
            currentDate={currentDate}
            onDateChange={onDateChange}
            sidebarDate={sidebarDate}
            onSidebarDateChange={onSidebarDateChange}
            events={calendarEvents}
            onEventCreate={onEventCreate}
            {...tagFilterProps}
          />
        </div>
      </div>
      <CalendarDragOverlay
        activeEvent={activeEvent}
        activeDragWidth={activeDragWidth}
        view={view}
        cellHeight={WeekCellsHeight}
      />
    </DndContext>
  );
};

export default EventCalendar;
