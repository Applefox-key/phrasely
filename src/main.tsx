import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import { registerClearAuth } from './shared/api/client';
import { useAuthStore } from './features/auth/authStore';

registerClearAuth(() => useAuthStore.getState().clearAuth());

// Google OAuth: server redirects back with ?token= in URL.
// Extract and store before first render so getMe() fires with the Bearer header.
const _oauthParams = new URLSearchParams(window.location.search);
const _oauthToken = _oauthParams.get('token');
if (_oauthToken) {
  useAuthStore.getState().setToken(_oauthToken);
  window.history.replaceState({}, '', window.location.pathname);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
