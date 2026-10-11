import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const protectedApi = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

export const publicApi = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

const unauthorizedListeners = new Set();

/**
 * Registers a listener invoked when a protected API request receives an HTTP 401 response.
 * @param {(error: any) => void} listener
 * @returns {() => void} Unsubscribe function
 */
export const onUnauthorized = (listener) => {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
};

let lastNotificationTime = 0;
const NOTIFICATION_DEBOUNCE_MS = 500;

export const resetUnauthorizedNotification = () => {
  lastNotificationTime = 0;
};

/**
 * Dispatches notification to all registered unauthorized listeners with concurrent deduplication.
 * @param {any} error
 */
export const notifyUnauthorized = (error) => {
  const now = Date.now();
  if (now - lastNotificationTime < NOTIFICATION_DEBOUNCE_MS) {
    return;
  }
  lastNotificationTime = now;

  unauthorizedListeners.forEach((listener) => {
    try {
      listener(error);
    } catch (e) {
      console.error(e);
    }
  });
};

protectedApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      notifyUnauthorized(error);
    }

    return Promise.reject(error);
  }
);

export default protectedApi;
