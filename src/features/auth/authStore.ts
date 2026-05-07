import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Credentials } from '../../shared/types';
import { usersApi } from './usersApi';
import { DEMO_USER } from '../demo/demoData';

interface AuthState {
  isAuthenticated: boolean;
  isInitializing: boolean;
  isDemo: boolean;
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
  enterDemo: () => void;
  setUser: (user: User | null) => void;
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

      login: async (credentials) => {
        await usersApi.login(credentials);
        const user = await usersApi.getMe();
        if (!user?.id || !user?.email) {
          try { await usersApi.logout(); } catch (_) { /* ignore */ }
          return;
        }
        set({ isAuthenticated: true, isDemo: false, user });
      },

      logout: async () => {
        try {
          await usersApi.logout();
        } catch (_) {
          // ignore
        }
        set({ isAuthenticated: false, isDemo: false, user: null });
      },

      enterDemo: () =>
        set({
          isAuthenticated: true,
          isDemo: true,
          user: DEMO_USER as User,
          isInitializing: false,
        }),

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setInitializing: (v) => set({ isInitializing: v }),

      clearAuth: () => set({ isAuthenticated: false, isDemo: false, user: null }),
    }),
    {
      name: 'phrasely_auth',
      partialize: (state) => ({
        // Never persist demo mode auth — demo user must re-enter on refresh
        isAuthenticated: state.isDemo ? false : state.isAuthenticated,
        user: state.isDemo ? null : state.user,
      }),
    }
  )
);
