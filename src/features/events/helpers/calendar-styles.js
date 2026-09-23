import { cn } from '@/lib/utils';

/**
 * Retorna as classes Tailwind de cores de fundo, texto e sombra com base na categoria/cor do evento.
 *
 * @param {string} color
 * @returns {string}
 */
export function getEventColorClasses(color) {
  switch (color) {
    case 'family':
      return 'bg-amber-200/50 text-amber-950/80 dark:bg-amber-400/25 dark:text-amber-200 shadow-amber-700/8';
    case 'business':
      return 'bg-violet-200/50 text-violet-950/80 dark:bg-violet-400/25 dark:text-violet-200 shadow-violet-700/8';
    case 'personal':
      return 'bg-rose-200/50 text-rose-950/80 dark:bg-rose-400/25 dark:text-rose-200 shadow-rose-700/8';
    case 'holiday':
      return 'bg-emerald-200/50 text-emerald-950/80 dark:bg-emerald-400/25 dark:text-emerald-200 shadow-emerald-700/8';
    case 'etc':
    default:
      return 'bg-sky-200/50 text-sky-950/80 dark:bg-sky-400/25 dark:text-sky-200 shadow-sky-700/8';
  }
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
