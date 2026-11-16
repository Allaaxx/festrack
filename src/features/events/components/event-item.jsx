import { differenceInMinutes, format, isPast } from 'date-fns';
import { useMemo } from 'react';

import { cn } from '@/lib/utils';

import {
  getBorderRadiusClasses,
  getEventColorClasses,
  getMonthViewBleedClasses,
  getMonthViewEventPaddingClasses,
} from '../helpers/calendar-styles';

const formatEventTime = (date) => format(date, 'HH:mm');

function EventWrapper({
  ref,
  event,
  isFirstDay = true,
  isLastDay = true,
  onClick,
  className,
  children,
  ...props
}) {
  return (
    <button
      ref={ref}
      className={cn(
        'focus-visible:border-ring focus-visible:ring-ring/50 flex h-full w-full text-left font-medium transition outline-none select-none focus-visible:ring-[3px] data-past-event:line-through',
        getEventColorClasses(event.color),
        getBorderRadiusClasses(isFirstDay, isLastDay),
        className
      )}
      data-calendar-event
      data-past-event={isPast(event.end) || undefined}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

export function EventItem({
  ref,
  event,
  view,
  onClick,
  showTime,
  isFirstDay = true,
  isLastDay = true,
  spansLeft = false,
  spansRight = false,
  isOverlay = false,
  children,
  className,
  ...props
}) {
  const durationMinutes = useMemo(
    () => differenceInMinutes(event.end, event.start),
    [event.start, event.end]
  );

  const getEventTime = () => {
    if (event.allDay) return 'Dia todo';
    if (durationMinutes < 45) return formatEventTime(event.start);

    return `${formatEventTime(event.start)} - ${formatEventTime(event.end)}`;
  };

  if (view === 'month') {
    const monthContent =
      children ??
      (isFirstDay ? (
        <span className="truncate">
          {!event.allDay && (
            <span className="truncate font-normal opacity-70 sm:text-[11px]">
              {formatEventTime(event.start)}{' '}
            </span>
          )}
          {event.title}
        </span>
      ) : null);

    const eventWrapper = (
      <EventWrapper
        ref={ref}
        event={event}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
        onClick={onClick}
        className={cn(
          'relative h-(--event-height) w-full min-w-0 items-center overflow-hidden text-[10px] sm:text-xs',
          getMonthViewBleedClasses(spansRight),
          getMonthViewEventPaddingClasses(spansLeft, spansRight),
          className
        )}
        {...props}
      >
        {monthContent ? (
          <span className="relative z-10 block min-w-0 flex-1 truncate overflow-hidden">
            {monthContent}
          </span>
        ) : (
          <span className="sr-only">{event.title}</span>
        )}
      </EventWrapper>
    );

    if (isOverlay) {
      return eventWrapper;
    }

    return (
      <div className="relative mt-(--event-gap) w-full">{eventWrapper}</div>
    );
  }

  if (view === 'agenda') {
    const timeText = getEventTime();
    const authorText =
      event.author ||
      event.creator?.name ||
      event.rawEvent?.creator?.name ||
      event.rawEvent?.created_by_user_name ||
      event.rawEvent?.author ||
      event.location ||
      event.rawEvent?.location ||
      null;

    const descriptionText =
      event.description || event.rawEvent?.description || null;

    return (
      <EventWrapper
        ref={ref}
        event={event}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
        onClick={onClick}
        className={cn(
          'flex-col items-start gap-1 rounded-lg border border-current/15 p-3 text-left transition hover:border-current/30 sm:p-3.5',
          className
        )}
        {...props}
      >
        <div className="text-sm font-semibold tracking-tight">
          {event.title}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-normal opacity-80">
          <span>{timeText}</span>
          {authorText && (
            <>
              <span className="opacity-50">·</span>
              <span>{authorText}</span>
            </>
          )}
        </div>
        {descriptionText && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed opacity-70">
            {descriptionText}
          </p>
        )}
      </EventWrapper>
    );
  }

  return (
    <EventWrapper
      ref={ref}
      event={event}
      isFirstDay={isFirstDay}
      isLastDay={isLastDay}
      onClick={onClick}
      className={cn(
        'px-1 py-1 backdrop-blur-md sm:px-2',
        durationMinutes < 45 ? 'items-center' : 'flex-col',
        view === 'week' ? 'text-[10px] sm:text-xs' : 'text-xs',
        className
      )}
      {...props}
    >
      {durationMinutes < 45 ? (
        <div className="truncate">
          {event.title}{' '}
          {showTime && (
            <span className="opacity-70">{formatEventTime(event.start)}</span>
          )}
        </div>
      ) : (
        <>
          <div className="truncate font-medium">{event.title}</div>
          {showTime && (
            <div className="truncate font-normal opacity-70 sm:text-[11px]">
              {getEventTime()}
            </div>
          )}
        </>
      )}
    </EventWrapper>
  );
}
