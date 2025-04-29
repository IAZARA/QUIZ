import { create } from 'zustand';
import { QuizConfigState, QuizConfig } from '../types';

// Configuración por defecto
const DEFAULT_CONFIG: QuizConfig = {
  defaultTimer: 30, // 30 segundos por defecto
  showRankings: true,
  allowJoinDuringQuiz: true
};

// Constantes para validación
const MIN_TIMER = 10;
const MAX_TIMER = 120;

// Función para validar la configuración
const validateConfig = (config: Partial<QuizConfig>): { isValid: boolean; error?: string } => {
  // Validar el timer si está presente
  if (config.defaultTimer !== undefined) {
    if (isNaN(config.defaultTimer)) {
      return { isValid: false, error: 'El tiempo debe ser un número válido' };
    }
    
    if (config.defaultTimer < MIN_TIMER || config.defaultTimer > MAX_TIMER) {
      return { 
        isValid: false, 
        error: `El tiempo debe estar entre ${MIN_TIMER} y ${MAX_TIMER} segundos` 
      };
    }
  }
  
  return { isValid: true };
};

export const useQuizConfigStore = create<QuizConfigState>((set, get) => ({
  config: DEFAULT_CONFIG,
  isLoading: false,
  
  getConfig: async () => {
    try {
      set({ isLoading: true });
      
      const response = await fetch('/api/admin/config');
      
      if (!response.ok) {
        throw new Error(`Error al obtener la configuración: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && Object.keys(data).length > 0) {
        // Validar la configuración recibida
        const validation = validateConfig(data);
        
        if (validation.isValid) {
          set({ config: data });
        } else {
          console.warn('Configuración recibida inválida:', validation.error);
          set({ config: DEFAULT_CONFIG });
        }
      } else {
        // Si no hay configuración guardada, usar los valores por defecto
        set({ config: DEFAULT_CONFIG });
      }
    } catch (error) {
      console.error('Error al obtener la configuración:', error);
      // Establecer valores por defecto en caso de error
      set({ config: DEFAULT_CONFIG });
    } finally {
      set({ isLoading: false });
    }
  },
  
  saveConfig: async (configUpdates: Partial<QuizConfig>) => {
    try {
      // Validar las actualizaciones antes de enviarse
      const validation = validateConfig(configUpdates);
      
      if (!validation.isValid) {
        console.error('Configuración inválida:', validation.error);
        return false;
      }
      
      set({ isLoading: true });
      
      // Combinar la configuración actual con las actualizaciones
      const updatedConfig = {
        ...get().config,
        ...configUpdates
      };
      
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedConfig)
      });
      
      if (!response.ok) {
        throw new Error(`Error al guardar la configuración: ${response.status}`);
      }
      
      const data = await response.json();
      
      set({ config: data });
      return true;
    } catch (error) {
      console.error('Error al guardar la configuración:', error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  
  resetConfig: () => {
    set({ config: DEFAULT_CONFIG });
  }
})); 