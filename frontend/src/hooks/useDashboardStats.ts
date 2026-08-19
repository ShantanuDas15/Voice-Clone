import { useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';

export interface GenerationListItem {
  id: string;
  status: string;
  text: string;
  created_at: string;
}

export interface VoiceProfileItem {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface UserStats {
  voice_count: number;
  generation_count: number;
  chars_used_this_month: number;
  chars_remaining: number;
  monthly_limit: number;
}

export interface DashboardData {
  stats: UserStats | null;
  recentGenerations: GenerationListItem[];
  userVoices: VoiceProfileItem[];
  isLoading: boolean;
  error: string | null;
}

export interface VoiceListResponse {
  user_voices: VoiceProfileItem[];
  engine_voices: any[];
}

export const useDashboardStats = () => {
  const [data, setData] = useState<DashboardData>({
    stats: null,
    recentGenerations: [],
    userVoices: [],
    isLoading: true,
    error: null,
  });

  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setData((prev) => ({ ...prev, isLoading: true, error: null }));
    }
    try {
      // Fetch stats, recent generations, and user voices concurrently
      const [statsRes, gensRes, voicesRes] = await Promise.all([
        api.get<UserStats>('/api/v1/users/stats'),
        api.get<GenerationListItem[]>('/api/v1/generations/'),
        api.get<VoiceListResponse>('/api/v1/voices/'),
      ]);

      setData({
        stats: statsRes.data,
        recentGenerations: gensRes.data.slice(0, 5), // Only need last 5 for dashboard
        userVoices: voicesRes.data.user_voices.slice(0, 5), // Top 5 user voices
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: err.response?.data?.detail || 'Failed to load dashboard data',
      }));
    }
  }, []);

  useEffect(() => {
    // Initial fetch (shows loading skeleton)
    fetchDashboardData(true);

    // Set up polling interval (every 5 seconds, silent background update)
    const intervalId = setInterval(() => {
      fetchDashboardData(false);
    }, 5000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchDashboardData]);

  return { ...data, refetch: () => fetchDashboardData(true) };
};
