import { toast } from "../hooks/use-toast";
import axios from "axios";
import { auth } from "./firebase";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Local dev bypass fallback
      const state = useAuthStore.getState();
      if (state.user?.uid === 'local-dev-uid' || state.user?.uid === 'local-dev-google-uid') {
        config.headers.Authorization = `Bearer local-dev-token`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Determine the error message
    let errorMessage = "An unexpected error occurred.";
    if (!error.response) {
      errorMessage = "Connection failed. Please check your network.";
    } else if (error.response.data && error.response.data.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.message) {
      errorMessage = error.message;
    }

    toast({
      variant: "destructive",
      title: "Error",
      description: errorMessage,
    });

    return Promise.reject(error);
  }
);

export default api;
