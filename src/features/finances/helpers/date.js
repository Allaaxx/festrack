import { format, isValid } from 'date-fns';

const CIVIL_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})(?:$|T00:00:00(?:\.000)?Z?$)/;

/**
 * Faz o parse de uma data civil (YYYY-MM-DD ou YYYY-MM-DDT00:00:00.000Z)
 * para um objeto Date no fuso horário local sem deslocamento para o dia anterior.
 *
 * @param {string | Date | null | undefined} dateValue
 * @returns {Date}
 */
export const parseDateSafely = (dateValue) => {
  if (!dateValue) return new Date();
  if (dateValue instanceof Date) return dateValue;
  const str = String(dateValue).trim();
  const matchDate = str.match(CIVIL_DATE_REGEX);
  if (matchDate) {
    const [, year, month, day] = matchDate;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  return new Date(dateValue);
};

/**
 * Formata uma data de transação (Date, YYYY-MM-DD ou ISO string) para
 * o formato civil local `YYYY-MM-DD` esperado pela API.
 *
 * @param {string | Date | null | undefined} date
 * @returns {string | Date | null | undefined}
 */
export const formatTransactionDate = (date) => {
  if (!date) return date;
  if (date instanceof Date) {
    return isValid(date) ? format(date, 'yyyy-MM-dd') : date;
  }
  if (typeof date === 'string') {
    const trimmed = date.trim();
    const matchDate = trimmed.match(CIVIL_DATE_REGEX);
    if (matchDate) {
      const [, year, month, day] = matchDate;
      return `${year}-${month}-${day}`;
    }
    const parsed = new Date(trimmed);
    return isValid(parsed) ? format(parsed, 'yyyy-MM-dd') : trimmed;
  }
  return date;
};
