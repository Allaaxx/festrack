/**
 * Realistic domain fixture data for catalog metrics, stock status,
 * and stock movement ledger entries.
 */

export const DEFAULT_CATALOG_METRICS = {
  activeCatalog: {
    total: 48,
    simpleProducts: 36,
    bundles: 12,
    trend: 12,
    trendLabel: 'vs. mês anterior',
  },
  activeRentals: {
    total: 26,
    trend: 8,
    trendLabel: 'unidades em eventos ativos',
  },
  stockAlerts: {
    total: 3,
    outOfStock: 2,
    criticalBottlenecks: 1,
    trend: -25,
    trendLabel: 'itens com reposição urgente',
  },
};

export const DEFAULT_STOCK_MOVEMENTS_SERIES = [
  {
    date: '2026-11-06',
    day: 'Sex',
    inbound: 25,
    sale: 8,
    rentalAllocation: 14,
    loss: 1,
  },
  {
    date: '2026-11-07',
    day: 'Sáb',
    inbound: 10,
    sale: 15,
    rentalAllocation: 22,
    loss: 2,
  },
  {
    date: '2026-11-08',
    day: 'Dom',
    inbound: 0,
    sale: 12,
    rentalAllocation: 18,
    loss: 0,
  },
  {
    date: '2026-11-09',
    day: 'Seg',
    inbound: 40,
    sale: 4,
    rentalAllocation: 6,
    loss: 0,
  },
  {
    date: '2026-11-10',
    day: 'Ter',
    inbound: 15,
    sale: 7,
    rentalAllocation: 12,
    loss: 1,
  },
  {
    date: '2026-11-11',
    day: 'Qua',
    inbound: 30,
    sale: 10,
    rentalAllocation: 15,
    loss: 0,
  },
  {
    date: '2026-11-12',
    day: 'Qui',
    inbound: 20,
    sale: 6,
    rentalAllocation: 10,
    loss: 0,
  },
];

export const DEFAULT_STOCK_MOVEMENTS = [
  {
    id: 'mov-1',
    type: 'INBOUND',
    productName: 'Painel Redondo Dourado',
    quantity: 10,
    date: '2026-11-12T10:00:00.000Z',
    note: 'Recebimento de lote novo de fornecedor',
  },
  {
    id: 'mov-2',
    type: 'RENTAL_ALLOCATION',
    productName: 'Mesa Cilindro Acrílico (Kit c/ 3)',
    quantity: 4,
    date: '2026-11-11T14:30:00.000Z',
    note: 'Alocação para Casamento Marina & Lucas',
  },
  {
    id: 'mov-3',
    type: 'SALE',
    productName: 'Balões Metalizados Rose Gold',
    quantity: 6,
    date: '2026-11-10T16:15:00.000Z',
    note: 'Venda avulsa balcão',
  },
  {
    id: 'mov-4',
    type: 'LOSS',
    productName: 'Vaso de Vidro Espelhado',
    quantity: 1,
    date: '2026-11-09T18:00:00.000Z',
    note: 'Danificado no transporte de retorno do evento',
  },
];
