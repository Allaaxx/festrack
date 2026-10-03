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

protectedApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/signin') &&
        !window.location.pathname.startsWith('/signup')
      ) {
        window.location.href = '/signin';
      }
    }

    return Promise.reject(error);
  }
);

export default protectedApi;
