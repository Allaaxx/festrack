/**
 * Calcula os totais financeiros (Receitas, Despesas, Investimentos e Saldo Líquido)
 * a partir das transações associadas a um evento.
 *
 * @param {Array<{ type: string, amount: number | string }>} [transactions=[]]
 * @returns {{
 *   earnings: number,
 *   expenses: number,
 *   investments: number,
 *   netBalance: number,
 * }}
 */
export const calculateEventFinancialTotals = (transactions = []) => {
  if (!Array.isArray(transactions)) {
    return { earnings: 0, expenses: 0, investments: 0, netBalance: 0 };
  }

  let earnings = 0;
  let expenses = 0;
  let investments = 0;

  for (const transaction of transactions) {
    const amount = Number(transaction?.amount) || 0;
    const type = String(transaction?.type ?? '').toUpperCase();

    if (type === 'EARNING') {
      earnings += amount;
    } else if (type === 'EXPENSE') {
      expenses += amount;
    } else if (type === 'INVESTMENT') {
      investments += amount;
    }
  }

  const netBalance = earnings - (expenses + investments);

  return {
    earnings,
    expenses,
    investments,
    netBalance,
  };
};
