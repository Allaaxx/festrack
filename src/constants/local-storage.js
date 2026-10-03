export const LOCAL_STORAGE_FINANCE_FILTERS_KEY = 'finance_filters';
export const LOCAL_STORAGE_EVENT_CALENDAR_FILTERS_KEY =
  'event_calendar_filters';

export const getStoredFiltersKey = (userId, featureKey) =>
  `festrack:${userId || 'anon'}:${featureKey}`;
