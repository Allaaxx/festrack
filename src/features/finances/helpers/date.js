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
  const matchDate = str.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:$|T00:00:00(?:\.000)?Z?$)/
  );
  if (matchDate) {
    const [, year, month, day] = matchDate;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  return new Date(dateValue);
};
