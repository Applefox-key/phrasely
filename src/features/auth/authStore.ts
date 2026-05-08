import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Credentials } from '../../shared/types';
import { usersApi } from './usersApi';
import { setAuthToken } from '../../shared/api/client';
import { DEMO_USER } from '../demo/demoData';

interface AuthState {
  isAuthenticated: boolean;
  isInitializing: boolean;
  isDemo: boolean;
  user: User | null;
  token: string | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
  enterDemo: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setInitializing: (v: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isInitializing: true,
      isDemo: false,
      user: null,
      token: null,

      login: async (credentials) => {
        const { token } = await usersApi.login(credentials);
        setAuthToken(token);
        const user = await usersApi.getMe();
        if (!user?.id || !user?.email) {
          try { await usersApi.logout(); } catch (_) { /* ignore */ }
          setAuthToken(null);
          return;
        }
        set({ isAuthenticated: true, isDemo: false, user, token });
      },

      logout: async () => {
        try {
          await usersApi.logout();
        } catch (_) {
          // ignore
        }
        setAuthToken(null);
        set({ isAuthenticated: false, isDemo: false, user: null, token: null });
      },

      enterDemo: () =>
        set({
          isAuthenticated: true,
          isDemo: true,
          user: DEMO_USER as User,
          isInitializing: false,
        }),

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setToken: (token) => {
        setAuthToken(token);
        set({ token });
      },

      setInitializing: (v) => set({ isInitializing: v }),

      clearAuth: () => {
        setAuthToken(null);
        set({ isAuthenticated: false, isDemo: false, user: null, token: null });
      },
    }),
    {
      name: 'phrasely_auth',
      partialize: (state) => ({
        isAuthenticated: state.isDemo ? false : state.isAuthenticated,
        user: state.isDemo ? null : state.user,
        token: state.isDemo ? null : state.token,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) setAuthToken(state.token);
      },
    }
  )
);
