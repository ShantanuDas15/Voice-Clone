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
  initializeAuthListener: () => void;
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
      // Syncs/Fetches backend user
      const response = await api.get('/api/v1/users/me');
      set({ dbUser: response.data });
    } catch (error) {
      console.error("Failed to fetch DB user:", error);
      set({ dbUser: null });
    }
  },

  initializeAuthListener: () => {
    onAuthStateChanged(auth, async (user) => {
      set({ user });
      if (user) {
        await get().fetchDbUser();
      } else {
        set({ dbUser: null });
      }
      set({ isLoading: false });
    });
  }
}));
