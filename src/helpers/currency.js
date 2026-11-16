export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Formats a percentage number or string with a leading '+' if positive,
 * or returns '0%' when empty or zero.
 *
 * @param {number | string | null | undefined} value
 * @returns {string}
 */
export const formatPercentage = (value) => {
  if (value === null || value === undefined) return '0%';
  if (typeof value === 'string' && value.endsWith('%')) {
    const trimmed = value.slice(0, -1);
    const num = parseFloat(trimmed);
    if (Number.isNaN(num)) return value;
    if (num > 0 && !value.startsWith('+')) return `+${value}`;
    return value;
  }
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (Number.isNaN(num) || num === 0) return '0%';
  const formatted = Number.isInteger(num) ? num.toString() : num.toFixed(1);
  return num > 0 ? `+${formatted}%` : `${formatted}%`;
};
