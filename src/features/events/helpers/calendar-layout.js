import {
  addHours,
  areIntervalsOverlapping,
  differenceInMinutes,
  getHours,
  getMinutes,
  isSameDay,
  startOfDay,
} from 'date-fns';

import { StartHour, WeekCellsHeight } from '../constants';

/**
 * Determina se o evento se estende por mais de um dia ou é considerado "dia todo".
 *
 * @param {{ allDay?: boolean, start: Date, end: Date }} event
 * @returns {boolean}
 */
export function isMultiDayEvent(event) {
  return Boolean(event.allDay || !isSameDay(event.start, event.end));
}

/**
 * Retorna os eventos que iniciam em um determinado dia, ordenados pelo horário de início.
 *
 * @param {Array<{ start: Date }>} events
 * @param {Date} day
 * @returns {Array}
 */
export function getEventsForDay(events, day) {
  return events
    .filter((event) => isSameDay(day, event.start))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * Ordena eventos priorizando eventos de múltiplos dias/dia inteiro e depois por horário de início.
 *
 * @param {Array} events
 * @returns {Array}
 */
export function sortEvents(events) {
  return [...events].sort((a, b) => {
    const aIsMultiDay = isMultiDayEvent(a);
    const bIsMultiDay = isMultiDayEvent(b);

    if (aIsMultiDay && !bIsMultiDay) return -1;
    if (!aIsMultiDay && bIsMultiDay) return 1;

    return a.start.getTime() - b.start.getTime();
  });
}

/**
 * Retorna eventos contínuos/múltiplos dias que cruzam o dia informado,
 * excluindo aqueles que iniciam nele.
 *
 * @param {Array} events
 * @param {Date} day
 * @returns {Array}
 */
export function getSpanningEventsForDay(events, day) {
  return events.filter((event) => {
    if (!isMultiDayEvent(event)) return false;

    return (
      !isSameDay(day, event.start) &&
      (isSameDay(day, event.end) || (day > event.start && day < event.end))
    );
  });
}

/**
 * Retorna todos os eventos que ocorrem, cruzam ou terminam em determinado dia.
 *
 * @param {Array} events
 * @param {Date} day
 * @returns {Array}
 */
export function getAllEventsForDay(events, day) {
  return events.filter(
    (event) =>
      isSameDay(day, event.start) ||
      isSameDay(day, event.end) ||
      (day > event.start && day < event.end)
  );
}

/**
 * Calcula o posicionamento absoluto (top, height, left, width, zIndex)
 * para eventos baseados em horário dentro de um dia, resolvendo sobreposições em colunas.
 *
 * @param {Object} params
 * @param {Date} params.day
 * @param {Array} params.events
 * @param {number} [params.startHour=StartHour]
 * @param {number} [params.cellHeight=WeekCellsHeight]
 * @returns {Array<{ event: Object, top: number, height: number, left: number, width: number, zIndex: number }>}
 */
export function calculateDayPositionedEvents({
  day,
  events,
  startHour = StartHour,
  cellHeight = WeekCellsHeight,
}) {
  const dayStart = startOfDay(day);

  // Filtra apenas eventos que tocam o dia e que têm horário (não são dia todo/múltiplos dias)
  const timeEvents = events.filter((event) => {
    if (isMultiDayEvent(event)) return false;

    return (
      isSameDay(day, event.start) ||
      isSameDay(day, event.end) ||
      (event.start < day && event.end > day)
    );
  });

  const sortedEvents = [...timeEvents].sort((a, b) => {
    if (a.start < b.start) return -1;
    if (a.start > b.start) return 1;

    return (
      differenceInMinutes(b.end, b.start) - differenceInMinutes(a.end, a.start)
    );
  });

  const columns = [];
  const result = [];

  sortedEvents.forEach((event) => {
    const adjustedStart = isSameDay(day, event.start) ? event.start : dayStart;
    const adjustedEnd = isSameDay(day, event.end)
      ? event.end
      : addHours(dayStart, 24);

    const startHourValue =
      getHours(adjustedStart) + getMinutes(adjustedStart) / 60;
    const endHourValue = getHours(adjustedEnd) + getMinutes(adjustedEnd) / 60;
    const top = (startHourValue - startHour) * cellHeight;
    const height = Math.max((endHourValue - startHourValue) * cellHeight, 18);

    let columnIndex = 0;
    let placed = false;

    while (!placed) {
      const col = columns[columnIndex] || [];

      if (col.length === 0) {
        columns[columnIndex] = col;
        placed = true;
      } else {
        const overlaps = col.some((c) =>
          areIntervalsOverlapping(
            { start: adjustedStart, end: adjustedEnd },
            { start: c.event.start, end: c.event.end }
          )
        );

        if (!overlaps) {
          placed = true;
        } else {
          columnIndex++;
        }
      }
    }

    const currentColumn = columns[columnIndex] || [];
    columns[columnIndex] = currentColumn;
    currentColumn.push({ event, end: adjustedEnd });

    const width = columnIndex === 0 ? 1 : 1 - columnIndex * 0.1;
    const left = columnIndex === 0 ? 0 : columnIndex * 0.1;

    result.push({
      event,
      top,
      height,
      left,
      width,
      zIndex: 10 + columnIndex,
    });
  });

  return result;
}
