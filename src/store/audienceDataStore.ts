import { create } from 'zustand';
import io from 'socket.io-client';

interface AudienceDataState {
  isAudienceDataActive: boolean;
  isLoading: boolean;
  error: string | null;
  activateAudienceData: () => Promise<void>;
  deactivateAudienceData: () => Promise<void>;
  initializeSocket: () => void;
}

const API_BASE_URL = '/api/audience-data';
let socket: ReturnType<typeof io> | null = null;

export const useAudienceDataStore = create<AudienceDataState>((set) => ({
  isAudienceDataActive: false,
  isLoading: false,
  error: null,

  activateAudienceData: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/status/activate`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error activating Audience Data Form');
      }
      set({ isAudienceDataActive: true, isLoading: false, error: null });
    } catch (error: any) {
      console.error('Error activating Audience Data Form:', error);
      set({ isLoading: false, error: error.message });
    }
  },

  deactivateAudienceData: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/status/deactivate`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error deactivating Audience Data Form');
      }
      set({ isAudienceDataActive: false, isLoading: false, error: null });
    } catch (error: any) {
      console.error('Error deactivating Audience Data Form:', error);
      set({ isLoading: false, error: error.message });
    }
  },

  initializeSocket: () => {
    if (!socket) {
      socket = io({
        path: '/socket.io',
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        console.log('AudienceData Socket connected');
      });

      socket.on('disconnect', () => {
        console.log('AudienceData Socket disconnected');
      });

      // Listen for audience data form status changes
      socket.on('audienceData:status', (data: { isActive: boolean }) => {
        console.log('Received audience data status update:', data);
        set({ isAudienceDataActive: data.isActive });
      });
    }
  }
}));