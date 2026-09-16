import {
  format,
  isAfter,
  isBefore,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Faz o parse seguro de uma data vinda da API ou do form,
 * sem causar deslocamento de timezone.
 *
 * @param {Date | string | null | undefined} dateValue
 * @returns {Date | null}
 */
export const parseEventDate = (dateValue) => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) {
    return isValid(dateValue) ? dateValue : null;
  }
  const parsed = parseISO(String(dateValue));
  return isValid(parsed) ? parsed : null;
};

/**
 * Formata uma data para exibição no padrão dd/MM/yyyy.
 *
 * @param {Date | string | null | undefined} dateValue
 * @returns {string}
 */
export const formatEventDate = (dateValue) => {
  const date = parseEventDate(dateValue);
  if (!date) return '—';
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
};

/**
 * Formata o intervalo de datas de um evento.
 * Exemplo: "01/12/2026 até 31/12/2026"
 *
 * @param {Date | string | null | undefined} startDate
 * @param {Date | string | null | undefined} endDate
 * @returns {string}
 */
export const formatEventDateRange = (startDate, endDate) => {
  return `${formatEventDate(startDate)} até ${formatEventDate(endDate)}`;
};

/**
 * Calcula o status temporal de um evento em relação à data atual.
 *
 * @param {{ startDate: Date | string, endDate: Date | string }} event
 * @returns {'scheduled' | 'in_progress' | 'completed'}
 */
export const getEventStatus = (event) => {
  const today = startOfDay(new Date());
  const start = startOfDay(parseEventDate(event.startDate) ?? new Date(0));
  const end = startOfDay(parseEventDate(event.endDate) ?? new Date(0));

  if (isBefore(today, start)) return 'scheduled';
  if (isAfter(today, end)) return 'completed';
  return 'in_progress';
};

/**
 * Mapeia o valor interno do status para o texto em pt-BR.
 *
 * @param {'scheduled' | 'in_progress' | 'completed'} status
 * @returns {string}
 */
export const getEventStatusLabel = (status) => {
  switch (status) {
    case 'scheduled':
      return 'Agendado';
    case 'in_progress':
      return 'Em andamento';
    case 'completed':
      return 'Finalizado';
    default:
      return '—';
  }
};

/**
 * Mapeia um evento do domínio para o formato esperado pelo EventCalendar.
 *
 * @param {{ id: string, name: string, description: string | null, startDate: string | Date, endDate: string | Date }} event
 * @returns {{ id: string, title: string, description: string | null, start: Date, end: Date, allDay: boolean, color: string, rawEvent: any }}
 */
export const mapEventToCalendarItem = (event) => {
  const start = parseEventDate(event.startDate) ?? new Date();
  const end = parseEventDate(event.endDate) ?? start;
  const status = getEventStatus(event);

  const statusColorMap = {
    scheduled: 'business',
    in_progress: 'holiday',
    completed: 'personal',
  };

  return {
    id: event.id,
    title: event.name,
    description: event.description,
    start,
    end,
    allDay: true,
    color: statusColorMap[status] ?? 'etc',
    rawEvent: event,
  };
};
