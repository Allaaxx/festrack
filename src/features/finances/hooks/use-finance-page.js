import { endOfMonth, format, isValid, startOfMonth, subDays } from 'date-fns';
import { useCallback, useMemo } from 'react';

import { LOCAL_STORAGE_FINANCE_FILTERS_KEY } from '@/constants/local-storage';
import {
  useGetTransactions,
  useGetUserBalance,
} from '@/features/finances/api/hooks';
import { calculateMatchingPreset } from '@/features/finances/helpers/chart';
import useStoredSearchParams from '@/hooks/use-stored-search-params';

export const isValidDateString = (val) => {
  if (!val || typeof val !== 'string') return false;
  const date = new Date(val + 'T00:00:00');
  return isValid(date);
};

export const getDefaultFinanceParams = () => {
  const now = new Date();
  return {
    from: format(startOfMonth(now), 'yyyy-MM-dd'),
    to: format(endOfMonth(now), 'yyyy-MM-dd'),
    q: '',
    page: 0,
    pageSize: 10,
  };
};

const formatDateValue = (val) => {
  if (!val) return '';
  if (val instanceof Date) return format(val, 'yyyy-MM-dd');
  return String(val);
};

/**
 * Domain controller hook orchestrating the finances cockpit page state.
 *
 * Synchronizes reporting dates, query search term, and pagination parameters
 * with URL search params and user-scoped localStorage. Coordinates query
 * lifecycles for account balance and transactions.
 *
 * @returns {{
 *   balance: Object | null,
 *   transactions: Array,
 *   isLoading: boolean,
 *   isError: boolean,
 *   refetch: () => Promise<any>,
 *   params: {
 *     from: string,
 *     to: string,
 *     q: string,
 *     page: number,
 *     pageSize: number,
 *   },
 *   handlers: {
 *     setDateRange: (rangeOrFrom: Object | string | Date, maybeTo?: string | Date) => void,
 *     setPresetRange: (preset: '7d' | '30d' | '90d' | string | number) => void,
 *     setSearchQuery: (query: string) => void,
 *     setPage: (page: number | ((prev: number) => number)) => void,
 *     setPageSize: (pageSize: number | ((prev: number) => number)) => void,
 *   }
 * }}
 */
export function useFinancePage() {
  const [storedParams, setStoredParams] = useStoredSearchParams(
    LOCAL_STORAGE_FINANCE_FILTERS_KEY,
    getDefaultFinanceParams,
    {
      requiredKeys: ['from', 'to'],
      validate: (data) =>
        isValidDateString(data?.from) && isValidDateString(data?.to),
    }
  );

  const params = useMemo(
    () => ({
      from: storedParams.from,
      to: storedParams.to,
      q: storedParams.q ?? '',
      page: Number(storedParams.page) || 0,
      pageSize: Number(storedParams.pageSize) || 10,
    }),
    [
      storedParams.from,
      storedParams.to,
      storedParams.q,
      storedParams.page,
      storedParams.pageSize,
    ]
  );

  const preset = useMemo(
    () => calculateMatchingPreset(params.from, params.to),
    [params.from, params.to]
  );

  const balanceQuery = useGetUserBalance({
    from: params.from,
    to: params.to,
  });

  const transactionsQuery = useGetTransactions({
    from: params.from,
    to: params.to,
  });

  const setDateRange = useCallback(
    (rangeOrFrom, maybeTo) => {
      let from;
      let to;

      if (
        rangeOrFrom &&
        typeof rangeOrFrom === 'object' &&
        !(rangeOrFrom instanceof Date)
      ) {
        from = rangeOrFrom.from;
        to = rangeOrFrom.to;
      } else {
        from = rangeOrFrom;
        to = maybeTo;
      }

      setStoredParams({
        from: formatDateValue(from),
        to: formatDateValue(to),
      });
    },
    [setStoredParams]
  );

  const setPresetRange = useCallback(
    (preset) => {
      const now = new Date();
      const to = format(now, 'yyyy-MM-dd');
      const normalizedPreset = String(preset).toLowerCase();

      let days;
      if (normalizedPreset === '7d' || normalizedPreset === '7') {
        days = 7;
      } else if (normalizedPreset === '30d' || normalizedPreset === '30') {
        days = 30;
      } else if (normalizedPreset === '90d' || normalizedPreset === '90') {
        days = 90;
      } else {
        return;
      }

      const from = format(subDays(now, days - 1), 'yyyy-MM-dd');
      setStoredParams({ from, to });
    },
    [setStoredParams]
  );

  const setSearchQuery = useCallback(
    (query) => {
      setStoredParams({
        q: query ?? '',
        page: 0,
      });
    },
    [setStoredParams]
  );

  const setPage = useCallback(
    (pageOrUpdater) => {
      setStoredParams((prev) => {
        const prevPage = Number(prev.page) || 0;
        const nextPage =
          typeof pageOrUpdater === 'function'
            ? pageOrUpdater(prevPage)
            : pageOrUpdater;
        return {
          ...prev,
          page: Number(nextPage) || 0,
        };
      });
    },
    [setStoredParams]
  );

  const setPageSize = useCallback(
    (pageSizeOrUpdater) => {
      setStoredParams((prev) => {
        const prevPageSize = Number(prev.pageSize) || 10;
        const nextPageSize =
          typeof pageSizeOrUpdater === 'function'
            ? pageSizeOrUpdater(prevPageSize)
            : pageSizeOrUpdater;
        return {
          ...prev,
          pageSize: Number(nextPageSize) || 10,
        };
      });
    },
    [setStoredParams]
  );

  const refetch = useCallback(() => {
    return Promise.all([balanceQuery.refetch(), transactionsQuery.refetch()]);
  }, [balanceQuery, transactionsQuery]);

  const isLoading = balanceQuery.isLoading || transactionsQuery.isLoading;
  const isError = balanceQuery.isError || transactionsQuery.isError;
  const balance = balanceQuery.data ?? null;
  const transactions = transactionsQuery.data ?? [];

  return {
    balance,
    transactions,
    isLoading,
    isError,
    refetch,
    params,
    preset,
    handlers: {
      setDateRange,
      setPresetRange,
      setSearchQuery,
      setPage,
      setPageSize,
    },
  };
}

export default useFinancePage;
