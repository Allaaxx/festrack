import { endOfMonth, format, isValid, startOfMonth } from 'date-fns';
import { useMemo, useState } from 'react';

import DatePickerWithRange from '@/components/ui/date-picker-with-range';
import { LOCAL_STORAGE_FINANCE_FILTERS_KEY } from '@/constants/local-storage';
import useStoredSearchParams from '@/hooks/use-stored-search-params';

const formatDateToQueryParam = (date) => format(date, 'yyyy-MM-dd');

const isValidDateString = (val) => {
  if (!val || typeof val !== 'string') return false;
  const date = new Date(val + 'T00:00:00');
  return isValid(date);
};

const getDefaultDateParams = () => ({
  from: formatDateToQueryParam(startOfMonth(new Date())),
  to: formatDateToQueryParam(endOfMonth(new Date())),
});

const DateSelection = () => {
  const [params, setParams] = useStoredSearchParams(
    LOCAL_STORAGE_FINANCE_FILTERS_KEY,
    getDefaultDateParams,
    {
      requiredKeys: ['from', 'to'],
      validate: (data) =>
        isValidDateString(data?.from) && isValidDateString(data?.to),
    }
  );

  const selectedRange = useMemo(() => {
    if (!isValidDateString(params.from) || !isValidDateString(params.to)) {
      return {
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      };
    }
    return {
      from: new Date(params.from + 'T00:00:00'),
      to: new Date(params.to + 'T00:00:00'),
    };
  }, [params.from, params.to]);

  const [partialDate, setPartialDate] = useState(null);

  const activeDate = partialDate ?? selectedRange;

  const handleDateChange = (newRange) => {
    if (
      newRange?.from &&
      newRange?.to &&
      isValid(newRange.from) &&
      isValid(newRange.to)
    ) {
      setPartialDate(null);
      setParams({
        from: formatDateToQueryParam(newRange.from),
        to: formatDateToQueryParam(newRange.to),
      });
    } else {
      setPartialDate(newRange);
    }
  };

  return <DatePickerWithRange value={activeDate} onChange={handleDateChange} />;
};

export default DateSelection;
