import { differenceInMinutes, format, isPast } from 'date-fns';
import { useMemo } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthContext } from '@/contexts/auth';
import { cn } from '@/lib/utils';

import {
  getBorderRadiusClasses,
  getEventColorClasses,
  getMonthViewBleedClasses,
  getMonthViewEventPaddingClasses,
} from '../helpers/calendar-styles';
import { normalizeEventAuthor } from '../helpers/event';

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
  const { user } = useAuthContext();
  const author = useMemo(
    () => normalizeEventAuthor(event, user),
    [event, user]
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
    const rawDescription =
      event.description ??
      event.rawEvent?.description ??
      event.details ??
      event.rawEvent?.details ??
      event.notes ??
      event.rawEvent?.notes ??
      event.desc ??
      event.rawEvent?.desc ??
      '';
    const descriptionText =
      typeof rawDescription === 'string' ? rawDescription.trim() : '';

    return (
      <EventWrapper
        ref={ref}
        event={event}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
        onClick={onClick}
        className={cn(
          'h-auto w-full flex-col items-start gap-1 rounded-lg border border-current/15 p-3 text-left transition hover:border-current/30 data-past-event:no-underline sm:p-3.5',
          className
        )}
        {...props}
      >
        <div className="text-sm font-semibold tracking-tight">
          {event.title}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-normal opacity-85">
          <span>{timeText}</span>
          {(author.hasAuthor || author.name) && (
            <>
              <span className="opacity-40">·</span>
              <div className="inline-flex items-center gap-1.5">
                <Avatar className="size-5 shrink-0">
                  {author.avatar && (
                    <AvatarImage src={author.avatar} alt={author.name} />
                  )}
                  <AvatarFallback className="text-[9px]">
                    {author.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{author.name}</span>
              </div>
            </>
          )}
        </div>
        <div className="mt-1 w-full min-w-0 text-xs leading-relaxed font-normal break-words opacity-75">
          {descriptionText || (
            <span className="italic opacity-60">Sem descrição</span>
          )}
        </div>
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
