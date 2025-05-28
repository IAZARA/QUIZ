import { create } from 'zustand';

interface WordCloudWord {
  text: string;
  count: number;
  _id?: string;
}

interface WordCloudState {
  isActive: boolean;
  words: WordCloudWord[];
  error: string | null;
  
  // Métodos para gestionar el estado
  fetchWords: () => Promise<void>;
  startWordCloud: () => Promise<void>;
  stopWordCloud: () => Promise<void>;
  resetWordCloud: () => Promise<void>;
  addWord: (word: string) => Promise<void>;
}

export const useWordCloudStore = create<WordCloudState>((set, get) => ({
  isActive: false,
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
      
      // La actualización de palabras debería venir por socket
      // pero por si acaso actualizamos manualmente
      const { words } = get();
      const existingWordIndex = words.findIndex(w => w.text.toLowerCase() === word.toLowerCase());
      
      if (existingWordIndex >= 0) {
        // Si la palabra ya existe, incrementar su contador
        const updatedWords = [...words];
        updatedWords[existingWordIndex] = {
          ...updatedWords[existingWordIndex],
          count: updatedWords[existingWordIndex].count + 1
        };
        set({ words: updatedWords });
      } else {
        // Si es una palabra nueva, añadirla
        set({ words: [...words, { text: word, count: 1 }] });
      }
    } catch (error) {
      console.error('Error al añadir palabra:', error);
      set({ error: 'No se pudo añadir la palabra' });
    }
  },
}));
