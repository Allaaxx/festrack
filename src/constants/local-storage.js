export const LOCAL_STORAGE_REFRESH_TOKEN_KEY = 'refreshToken';
export const LOCAL_STORAGE_ACCESS_TOKEN_KEY = 'accessToken';

export const LOCAL_STORAGE_FINANCE_FILTERS_KEY = 'finance_filters';
export const LOCAL_STORAGE_EVENT_CALENDAR_FILTERS_KEY =
  'event_calendar_filters';

export const getStoredFiltersKey = (userId, featureKey) =>
  `festrack:${userId || 'anon'}:${featureKey}`;
