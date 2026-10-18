import { TransactionsTable } from '@/features/finances';

/**
 * Tabela de transações dedicada para a visualização detalhada de um evento.
 * Fachada fina (thin facade) delegando para a TransactionsTable canônica do domínio finances.
 *
 * @param {{
 *   eventId: string,
 *   transactions?: Array<any>,
 *   isLoading?: boolean,
 *   isError?: boolean,
 *   refetch?: () => void,
 * }} props
 */
const EventTransactionsTable = ({ eventId, ...props }) => {
  return <TransactionsTable eventId={eventId} {...props} />;
};

export default EventTransactionsTable;
