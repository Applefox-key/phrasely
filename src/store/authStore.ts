import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Credentials } from '../types';
import { usersApi } from '../api/users';
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
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        // isDemo and isInitializing are intentionally NOT persisted
      }),
    }
  )
);
