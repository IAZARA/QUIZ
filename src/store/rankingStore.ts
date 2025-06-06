import { create } from 'zustand';
import io from 'socket.io-client';

interface RankingState {
  isActive: boolean;
  isLoading: boolean;
  error: string | null;

  // Métodos para gestionar el estado
  startRanking: () => Promise<void>;
  stopRanking: () => Promise<void>;
  setIsActive: (isActive: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  initializeSocket: () => void;
}

// Variable para almacenar la instancia del socket
let socket: any = null;

export const useRankingStore = create<RankingState>((set, get) => ({
  isActive: false,
  isLoading: false,
  error: null,
  
  startRanking: async () => {
    try {
      const response = await fetch('/api/ranking/show', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Error al mostrar el ranking');
      }
      
      set({ isActive: true });
      
    } catch (error) {
      console.error('Error al mostrar el ranking:', error);
      set({ error: 'No se pudo mostrar el ranking' });
    }
  },
  
  stopRanking: async () => {
    try {
      const response = await fetch('/api/ranking/hide', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Error al ocultar el ranking');
      }
      
      set({ isActive: false });
      
    } catch (error) {
      console.error('Error al ocultar el ranking:', error);
      set({ error: 'No se pudo ocultar el ranking' });
    }
  },

  setIsActive: (isActive: boolean) => {
    set({ isActive });
  },

  setIsLoading: (isLoading: boolean) => {
    set({ isLoading });
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
        console.log('✅ Ranking Socket conectado:', socket.id);
        // Solicitar estado actual al conectarse
        fetch('/api/ranking/status')
          .then(res => res.json())
          .then(data => {
            console.log('📊 Estado inicial del ranking:', data);
            set({ isActive: data.isVisible });
          })
          .catch(err => console.error('Error al obtener estado inicial:', err));
      });

      socket.on('disconnect', () => {
        console.log('⚠️ Ranking Socket desconectado');
      });

      socket.on('reconnect', () => {
        console.log('🔄 Ranking Socket reconectado');
        // Refrescar estado al reconectarse
        fetch('/api/ranking/status')
          .then(res => res.json())
          .then(data => {
            console.log('📊 Estado del ranking tras reconexión:', data);
            set({ isActive: data.isVisible });
          })
          .catch(err => console.error('Error al obtener estado tras reconexión:', err));
      });

      socket.on('ranking:status', (data: { isVisible: boolean }) => {
        console.log('🎯 Evento ranking:status recibido:', data);
        set({ isActive: data.isVisible });
      });

      // Mantener compatibilidad con eventos existentes
      socket.on('show_ranking', (data: any) => {
        console.log('🎯 Evento show_ranking recibido:', data);
        set({ isActive: true });
      });

      socket.on('hide_ranking', (data: any) => {
        console.log('🎯 Evento hide_ranking recibido:', data);
        set({ isActive: false });
      });
    }
  },
}));