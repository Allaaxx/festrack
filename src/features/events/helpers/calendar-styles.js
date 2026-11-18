import { cn } from '@/lib/utils';

import { EVENT_STATUSES, findTagOption } from './event';

const COLOR_STYLES = {
  indigo: {
    calendar:
      'bg-indigo-200/50 text-indigo-950/80 dark:bg-indigo-400/25 dark:text-indigo-200 shadow-indigo-700/8',
    dot: 'bg-indigo-400',
  },
  teal: {
    calendar:
      'bg-teal-200/50 text-teal-950/80 dark:bg-teal-400/25 dark:text-teal-200 shadow-teal-700/8',
    dot: 'bg-teal-400',
  },
  orange: {
    calendar:
      'bg-orange-200/50 text-orange-950/80 dark:bg-orange-400/25 dark:text-orange-200 shadow-orange-700/8',
    dot: 'bg-orange-400',
  },
  pink: {
    calendar:
      'bg-pink-200/50 text-pink-950/80 dark:bg-pink-400/25 dark:text-pink-200 shadow-pink-700/8',
    dot: 'bg-pink-400',
  },
  cyan: {
    calendar:
      'bg-cyan-200/50 text-cyan-950/80 dark:bg-cyan-400/25 dark:text-cyan-200 shadow-cyan-700/8',
    dot: 'bg-cyan-400',
  },
  lime: {
    calendar:
      'bg-lime-200/50 text-lime-950/80 dark:bg-lime-400/25 dark:text-lime-200 shadow-lime-700/8',
    dot: 'bg-lime-400',
  },
  amber: {
    calendar:
      'bg-amber-200/50 text-amber-950/80 dark:bg-amber-400/25 dark:text-amber-200 shadow-amber-700/8',
    dot: 'bg-amber-400',
  },
  violet: {
    calendar:
      'bg-violet-200/50 text-violet-950/80 dark:bg-violet-400/25 dark:text-violet-200 shadow-violet-700/8',
    dot: 'bg-violet-400',
  },
  rose: {
    calendar:
      'bg-rose-200/50 text-rose-950/80 dark:bg-rose-400/25 dark:text-rose-200 shadow-rose-700/8',
    dot: 'bg-rose-400',
  },
  emerald: {
    calendar:
      'bg-emerald-200/50 text-emerald-950/80 dark:bg-emerald-400/25 dark:text-emerald-200 shadow-emerald-700/8',
    dot: 'bg-emerald-400',
  },
};

export const DEFAULT_UNTAGGED_CALENDAR_CLASS = COLOR_STYLES.pink.calendar;

export const DEFAULT_UNTAGGED_DOT_CLASS = COLOR_STYLES.pink.dot;

export const TAG_COLOR_CLASSES = Object.fromEntries(
  Object.entries(COLOR_STYLES).flatMap(([name, { calendar, dot }]) => [
    [name, calendar],
    [dot, calendar],
  ])
);

export const TAG_DOT_COLORS = Object.fromEntries(
  Object.entries(COLOR_STYLES).flatMap(([name, { dot }]) => [
    [name, dot],
    [dot, dot],
  ])
);

function resolveTagColorKey(event, tagOptions) {
  const tag = event?.tag ?? event?.rawEvent?.tag ?? null;
  if (!tag) return null;

  if (Array.isArray(tagOptions)) {
    const match = findTagOption(tagOptions, tag);
    return match ? match.dotClass || match.color || match.value : null;
  }

  return tag;
}

/**
 * Retorna as classes Tailwind de cores de fundo, texto e sombra para um evento com base na etiqueta.
 * Eventos sem etiqueta ou com etiqueta órfã/inexistente retornam rosa neutro.
 *
 * @param {object} event
 * @param {Array<object>} [tagOptions]
 * @returns {string}
 */
export function getTagColorClasses(event, tagOptions) {
  const key = resolveTagColorKey(event, tagOptions);
  if (!key) return DEFAULT_UNTAGGED_CALENDAR_CLASS;

  return (
    TAG_COLOR_CLASSES[key] ||
    (!Array.isArray(tagOptions) && EVENT_STATUSES[key]?.calendarClass) ||
    DEFAULT_UNTAGGED_CALENDAR_CLASS
  );
}

/**
 * Retorna a classe Tailwind da cor do ponto indicador (dot) para um evento com base na etiqueta.
 * Eventos sem etiqueta ou com etiqueta órfã retornam rosa neutro (bg-pink-400).
 *
 * @param {object} event
 * @param {Array<object>} [tagOptions]
 * @returns {string}
 */
export function getTagDotColor(event, tagOptions) {
  const key = resolveTagColorKey(event, tagOptions);
  if (!key) return DEFAULT_UNTAGGED_DOT_CLASS;

  return (
    TAG_DOT_COLORS[key] ||
    (typeof key === 'string' && key.startsWith('bg-') ? key : null) ||
    (!Array.isArray(tagOptions) && EVENT_STATUSES[key]?.dotClass) ||
    DEFAULT_UNTAGGED_DOT_CLASS
  );
}

/**
 * Retorna as classes Tailwind de cores de fundo, texto e sombra com base no evento ou status/cor.
 *
 * @param {string | object} colorOrEvent
 * @param {Array<object>} [tagOptions]
 * @returns {string}
 */
export function getEventColorClasses(colorOrEvent, tagOptions) {
  if (colorOrEvent && typeof colorOrEvent === 'object') {
    return getTagColorClasses(colorOrEvent, tagOptions);
  }
  if (!colorOrEvent) return DEFAULT_UNTAGGED_CALENDAR_CLASS;

  return (
    EVENT_STATUSES[colorOrEvent]?.calendarClass ||
    TAG_COLOR_CLASSES[colorOrEvent] ||
    DEFAULT_UNTAGGED_CALENDAR_CLASS
  );
}

/**
 * Retorna a classe Tailwind da cor do ponto indicador (dot) com base no evento ou status/cor.
 *
 * @param {string | object} colorOrEvent
 * @param {Array<object>} [tagOptions]
 * @returns {string}
 */
export function getEventDotColor(colorOrEvent, tagOptions) {
  if (colorOrEvent && typeof colorOrEvent === 'object') {
    return getTagDotColor(colorOrEvent, tagOptions);
  }
  if (!colorOrEvent) return DEFAULT_UNTAGGED_DOT_CLASS;

  return (
    EVENT_STATUSES[colorOrEvent]?.dotClass ||
    TAG_DOT_COLORS[colorOrEvent] ||
    DEFAULT_UNTAGGED_DOT_CLASS
  );
}

/**
 * Retorna classes de arredondamento de borda para eventos contínuos entre múltiplos dias.
 *
 * @param {boolean} isFirstDay
 * @param {boolean} isLastDay
 * @returns {string}
 */
export function getBorderRadiusClasses(isFirstDay, isLastDay) {
  if (isFirstDay && isLastDay) return 'rounded-sm';
  if (isFirstDay) return 'rounded-l-sm rounded-tr-none rounded-br-none';
  if (isLastDay) return 'rounded-r-sm rounded-tl-none rounded-bl-none';

  return 'rounded-none';
}

/**
 * Estende a barra visual do evento até a célula do próximo dia (apenas para a direita),
 * garantindo uma faixa contínua sem quebras visuais na borda da grade mensal.
 *
 * @param {boolean} spansRight
 * @returns {string}
 */
export function getMonthViewBleedClasses(spansRight) {
  if (!spansRight) return '';

  return cn(
    'overflow-visible',
    'after:absolute after:top-0 after:bottom-0 after:left-full after:z-0 after:w-[calc(0.125rem+1px+0.125rem)] after:rounded-none after:bg-inherit after:content-[""] sm:after:w-[calc(0.25rem+1px+0.25rem)]'
  );
}

/**
 * Retorna os paddings adequados para eventos na visualização mensal dependendo
 * de estarem se estendendo para a esquerda ou para a direita.
 *
 * @param {boolean} spansLeft
 * @param {boolean} spansRight
 * @returns {string}
 */
export function getMonthViewEventPaddingClasses(spansLeft, spansRight) {
  if (!spansLeft && !spansRight) return 'px-1 sm:px-2';

  return cn(
    !spansLeft && 'pl-1 sm:pl-2',
    !spansRight && 'pr-1 sm:pr-2',
    spansLeft && 'pl-0',
    spansRight && 'pr-0'
  );
}
