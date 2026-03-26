import axios from 'axios';

// Defer importing the auth store to break the circular dependency
let _clearAuth: (() => void) | null = null;

export const registerClearAuth = (fn: () => void) => {
  _clearAuth = fn;
};

const apiClient = axios.create({
  baseURL: 'https://api.learnapp.pro',
  withCredentials: true,
});

// Wrap POST/PATCH/PUT body in { data: ... }
apiClient.interceptors.request.use((config) => {
  if (
    config.data &&
    ['post', 'patch', 'put'].includes(config.method?.toLowerCase() ?? '') &&
    !(config.data instanceof FormData) &&
    !('data' in config.data) // already wrapped (e.g. deleteSome)
  ) {
    config.data = { data: config.data };
  }
  return config;
});

// On 401 → clear auth state and redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      _clearAuth?.();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
