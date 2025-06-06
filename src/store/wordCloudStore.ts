import { create } from 'zustand';
import io from 'socket.io-client';

interface WordCloudWord {
  text: string;
  count: number;
  _id?: string;
}

interface WordCloudState {
  isActive: boolean;
  isLoading: boolean;
  words: WordCloudWord[];
  error: string | null;

  // Métodos para gestionar el estado
  fetchWords: () => Promise<void>;
  startWordCloud: () => Promise<void>;
  stopWordCloud: () => Promise<void>;
  resetWordCloud: () => Promise<void>;
  addWord: (word: string) => Promise<void>;
  setWordCloudData: (words: { text: string; value: number }[]) => void;
  setIsActive: (isActive: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  initializeSocket: () => void;
}

// Variable para almacenar la instancia del socket
let socket: any = null;

export const useWordCloudStore = create<WordCloudState>((set, get) => ({
  isActive: false,
  isLoading: false,
  words: [],
  error: null,
  
  fetchWords: async () => {
    try {
      const response = await fetch('/api/wordcloud');
      if (!response.ok) {
        throw new Error('Error al cargar las palabras');
      }
      
      const data = await response.json();
      set({
        words: data.words || [],
        isActive: data.isActive || false
      });
    } catch (error) {
      console.error('Error al cargar las palabras:', error);
      set({ error: 'No se pudieron cargar las palabras' });
    }
  },
  
  startWordCloud: async () => {
    try {
      const response = await fetch('/api/wordcloud/start', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Error al iniciar la nube de palabras');
      }
      
      set({ isActive: true });
      
      // Iniciar socket para escuchar nuevas palabras en tiempo real
      // Esto se implementaría con socket.io
    } catch (error) {
      console.error('Error al iniciar la nube de palabras:', error);
      set({ error: 'No se pudo iniciar la nube de palabras' });
    }
  },
  
  stopWordCloud: async () => {
    try {
      const response = await fetch('/api/wordcloud/stop', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Error al detener la nube de palabras');
      }
      
      set({ isActive: false });
      
      // Detener socket
    } catch (error) {
      console.error('Error al detener la nube de palabras:', error);
      set({ error: 'No se pudo detener la nube de palabras' });
    }
  },
  
  resetWordCloud: async () => {
    try {
      const response = await fetch('/api/wordcloud/reset', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Error al reiniciar la nube de palabras');
      }
      
      set({ words: [] });
    } catch (error) {
      console.error('Error al reiniciar la nube de palabras:', error);
      set({ error: 'No se pudo reiniciar la nube de palabras' });
    }
  },
  
  setWordCloudData: (words: { text: string; value: number }[]) => {
    // Convert value to count if needed
    set({ words: words.map(w => ({ text: w.text, count: w.value ?? 1 })) });
  },

  setIsActive: (isActive: boolean) => {
    set({ isActive });
  },

  setIsLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  addWord: async (word: string) => {
    try {
      const response = await fetch('/api/wordcloud/word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word }),
      });
      
      if (!response.ok) {
        throw new Error('Error al añadir palabra');
      }
      
      // No actualizamos manualmente aquí - dejamos que el socket maneje la actualización
      // Esto evita conflictos y asegura que todos los clientes reciban la misma actualización
      console.log('Palabra enviada correctamente, esperando actualización por socket...');
    } catch (error) {
      console.error('Error al añadir palabra:', error);
      set({ error: 'No se pudo añadir la palabra' });
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
        console.log('WordCloud Socket connected');
        // Solicitar estado actual al conectarse
        get().fetchWords();
      });

      socket.on('disconnect', () => {
        console.log('WordCloud Socket disconnected');
      });

      socket.on('reconnect', () => {
        console.log('WordCloud Socket reconnected');
        // Refrescar datos al reconectarse
        get().fetchWords();
      });

      socket.on('wordcloud:status', (data: { isActive: boolean }) => {
        console.log('Recibido evento de estado de nube de palabras:', data);
        set({ isActive: data.isActive });
      });

      socket.on('wordcloud:update', (words: WordCloudWord[]) => {
        console.log('Recibida actualización de nube de palabras:', words);
        set({ words });
      });

      // También escuchar el evento alternativo para compatibilidad
      socket.on('wordCloudUpdate', (data: { words: WordCloudWord[], isActive: boolean }) => {
        console.log('Recibida actualización de nube de palabras (formato alternativo):', data);
        set({
          words: data.words || [],
          isActive: data.isActive !== undefined ? data.isActive : get().isActive
        });
      });
    }
  },
}));
