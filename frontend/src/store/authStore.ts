import { create } from 'zustand';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import api from '../lib/axios';

interface AuthState {
  user: User | null;
  dbUser: any | null; // Detailed user from backend
  isLoading: boolean;
  setAuthUser: (user: User | null) => void;
  fetchDbUser: () => Promise<void>;
  syncUser: () => Promise<void>;
  initializeAuthListener: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  dbUser: null,
  isLoading: true,

  setAuthUser: (user) => {
    set({ user });
  },

  fetchDbUser: async () => {
    try {
      const response = await api.get('/api/v1/users/me');
      set({ dbUser: response.data });
    } catch (error) {
      console.error("Failed to fetch DB user:", error);
      set({ dbUser: null });
    }
  },

  syncUser: async () => {
    try {
      const response = await api.post('/api/v1/auth/sync');
      set({ dbUser: response.data });
    } catch (error) {
      console.error("Failed to sync user:", error);
    }
  },

  initializeAuthListener: () => {
    onAuthStateChanged(auth, async (user) => {
      set({ user, isLoading: true });
      if (user) {
        // Sync with backend on auth state change (creates row if missing)
        await get().syncUser();
      } else {
        set({ dbUser: null });
      }
      set({ isLoading: false });
    });
  },

  logout: async () => {
    try {
      await auth.signOut();
      set({ user: null, dbUser: null });
    } catch (error) {
      console.error("Logout failed", error);
    }
  }
}));
