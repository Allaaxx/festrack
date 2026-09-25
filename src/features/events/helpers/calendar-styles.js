import { cn } from '@/lib/utils';

import { EVENT_STATUSES } from './event';

/**
 * Retorna as classes Tailwind de cores de fundo, texto e sombra com base na categoria/cor do evento.
 *
 * @param {string} color
 * @returns {string}
 */
export function getEventColorClasses(color) {
  return (
    EVENT_STATUSES[color]?.calendarClass ||
    'bg-sky-200/50 text-sky-950/80 dark:bg-sky-400/25 dark:text-sky-200 shadow-sky-700/8'
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
