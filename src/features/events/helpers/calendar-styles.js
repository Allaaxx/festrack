import { cn } from '@/lib/utils';

import { EVENT_STATUSES } from './event';

export const DEFAULT_UNTAGGED_CALENDAR_CLASS =
  'bg-pink-200/50 text-pink-950/80 dark:bg-pink-400/25 dark:text-pink-200 shadow-pink-700/8';

export const DEFAULT_UNTAGGED_DOT_CLASS = 'bg-pink-400';

export const TAG_COLOR_CLASSES = {
  // Legacy / standard tags
  family:
    'bg-amber-200/50 text-amber-950/80 dark:bg-amber-400/25 dark:text-amber-200 shadow-amber-700/8',
  business:
    'bg-violet-200/50 text-violet-950/80 dark:bg-violet-400/25 dark:text-violet-200 shadow-violet-700/8',
  personal:
    'bg-rose-200/50 text-rose-950/80 dark:bg-rose-400/25 dark:text-rose-200 shadow-rose-700/8',
  holiday:
    'bg-emerald-200/50 text-emerald-950/80 dark:bg-emerald-400/25 dark:text-emerald-200 shadow-emerald-700/8',
  etc: DEFAULT_UNTAGGED_CALENDAR_CLASS,

  // Palette colors (by dot class name)
  'bg-indigo-400':
    'bg-indigo-200/50 text-indigo-950/80 dark:bg-indigo-400/25 dark:text-indigo-200 shadow-indigo-700/8',
  'bg-teal-400':
    'bg-teal-200/50 text-teal-950/80 dark:bg-teal-400/25 dark:text-teal-200 shadow-teal-700/8',
  'bg-orange-400':
    'bg-orange-200/50 text-orange-950/80 dark:bg-orange-400/25 dark:text-orange-200 shadow-orange-700/8',
  'bg-pink-400': DEFAULT_UNTAGGED_CALENDAR_CLASS,
  'bg-cyan-400':
    'bg-cyan-200/50 text-cyan-950/80 dark:bg-cyan-400/25 dark:text-cyan-200 shadow-cyan-700/8',
  'bg-lime-400':
    'bg-lime-200/50 text-lime-950/80 dark:bg-lime-400/25 dark:text-lime-200 shadow-lime-700/8',
  'bg-amber-400':
    'bg-amber-200/50 text-amber-950/80 dark:bg-amber-400/25 dark:text-amber-200 shadow-amber-700/8',
  'bg-violet-400':
    'bg-violet-200/50 text-violet-950/80 dark:bg-violet-400/25 dark:text-violet-200 shadow-violet-700/8',
  'bg-rose-400':
    'bg-rose-200/50 text-rose-950/80 dark:bg-rose-400/25 dark:text-rose-200 shadow-rose-700/8',
  'bg-emerald-400':
    'bg-emerald-200/50 text-emerald-950/80 dark:bg-emerald-400/25 dark:text-emerald-200 shadow-emerald-700/8',

  // By bare color name
  indigo:
    'bg-indigo-200/50 text-indigo-950/80 dark:bg-indigo-400/25 dark:text-indigo-200 shadow-indigo-700/8',
  teal: 'bg-teal-200/50 text-teal-950/80 dark:bg-teal-400/25 dark:text-teal-200 shadow-teal-700/8',
  orange:
    'bg-orange-200/50 text-orange-950/80 dark:bg-orange-400/25 dark:text-orange-200 shadow-orange-700/8',
  pink: DEFAULT_UNTAGGED_CALENDAR_CLASS,
  cyan: 'bg-cyan-200/50 text-cyan-950/80 dark:bg-cyan-400/25 dark:text-cyan-200 shadow-cyan-700/8',
  lime: 'bg-lime-200/50 text-lime-950/80 dark:bg-lime-400/25 dark:text-lime-200 shadow-lime-700/8',
  amber:
    'bg-amber-200/50 text-amber-950/80 dark:bg-amber-400/25 dark:text-amber-200 shadow-amber-700/8',
  violet:
    'bg-violet-200/50 text-violet-950/80 dark:bg-violet-400/25 dark:text-violet-200 shadow-violet-700/8',
  rose: 'bg-rose-200/50 text-rose-950/80 dark:bg-rose-400/25 dark:text-rose-200 shadow-rose-700/8',
  emerald:
    'bg-emerald-200/50 text-emerald-950/80 dark:bg-emerald-400/25 dark:text-emerald-200 shadow-emerald-700/8',
};

export const TAG_DOT_COLORS = {
  family: 'bg-amber-400',
  business: 'bg-violet-400',
  personal: 'bg-rose-400',
  holiday: 'bg-emerald-400',
  etc: DEFAULT_UNTAGGED_DOT_CLASS,
  'bg-indigo-400': 'bg-indigo-400',
  'bg-teal-400': 'bg-teal-400',
  'bg-orange-400': 'bg-orange-400',
  'bg-pink-400': DEFAULT_UNTAGGED_DOT_CLASS,
  'bg-cyan-400': 'bg-cyan-400',
  'bg-lime-400': 'bg-lime-400',
  'bg-amber-400': 'bg-amber-400',
  'bg-violet-400': 'bg-violet-400',
  'bg-rose-400': 'bg-rose-400',
  'bg-emerald-400': 'bg-emerald-400',
  indigo: 'bg-indigo-400',
  teal: 'bg-teal-400',
  orange: 'bg-orange-400',
  pink: DEFAULT_UNTAGGED_DOT_CLASS,
  cyan: 'bg-cyan-400',
  lime: 'bg-lime-400',
  amber: 'bg-amber-400',
  violet: 'bg-violet-400',
  rose: 'bg-rose-400',
  emerald: 'bg-emerald-400',
};

/**
 * Retorna as classes Tailwind de cores de fundo, texto e sombra com base na categoria/cor do evento.
 * Se o evento não possuir etiqueta, ou possuir etiqueta órfã/inexistente, retorna rosa neutro.
 *
 * @param {string | object} colorOrEvent
 * @param {Array<object>} [tagOptions]
 * @returns {string}
 */
export function getEventColorClasses(colorOrEvent, tagOptions) {
  if (colorOrEvent && typeof colorOrEvent === 'object') {
    const tag = colorOrEvent.tag ?? colorOrEvent.rawEvent?.tag ?? null;
    if (!tag) {
      return DEFAULT_UNTAGGED_CALENDAR_CLASS;
    }

    if (Array.isArray(tagOptions)) {
      const match = tagOptions.find(
        (t) => (t.value || t.slug || t.id) === tag
      );
      if (!match) {
        // Tag órfã (excluída ou não existente no shop)
        return DEFAULT_UNTAGGED_CALENDAR_CLASS;
      }
      const dot = match.dotClass || match.color;
      return (
        TAG_COLOR_CLASSES[dot] ||
        TAG_COLOR_CLASSES[match.value] ||
        DEFAULT_UNTAGGED_CALENDAR_CLASS
      );
    }

    return (
      TAG_COLOR_CLASSES[tag] ||
      EVENT_STATUSES[tag]?.calendarClass ||
      DEFAULT_UNTAGGED_CALENDAR_CLASS
    );
  }

  if (!colorOrEvent || colorOrEvent === 'etc') {
    return DEFAULT_UNTAGGED_CALENDAR_CLASS;
  }

  return (
    EVENT_STATUSES[colorOrEvent]?.calendarClass ||
    TAG_COLOR_CLASSES[colorOrEvent] ||
    DEFAULT_UNTAGGED_CALENDAR_CLASS
  );
}

/**
 * Retorna a classe Tailwind da cor do ponto indicador (dot) para eventos.
 * Eventos sem etiqueta ou com etiquetas órfãs retornam rosa neutro (bg-pink-400).
 *
 * @param {string | object} colorOrEvent
 * @param {Array<object>} [tagOptions]
 * @returns {string}
 */
export function getEventDotColor(colorOrEvent, tagOptions) {
  if (colorOrEvent && typeof colorOrEvent === 'object') {
    const tag = colorOrEvent.tag ?? colorOrEvent.rawEvent?.tag ?? null;
    if (!tag) {
      return DEFAULT_UNTAGGED_DOT_CLASS;
    }

    if (Array.isArray(tagOptions)) {
      const match = tagOptions.find(
        (t) => (t.value || t.slug || t.id) === tag
      );
      if (!match) {
        return DEFAULT_UNTAGGED_DOT_CLASS;
      }
      return match.dotClass || match.color || DEFAULT_UNTAGGED_DOT_CLASS;
    }

    return (
      TAG_DOT_COLORS[tag] ||
      EVENT_STATUSES[tag]?.dotClass ||
      DEFAULT_UNTAGGED_DOT_CLASS
    );
  }

  if (!colorOrEvent || colorOrEvent === 'etc') {
    return DEFAULT_UNTAGGED_DOT_CLASS;
  }

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
