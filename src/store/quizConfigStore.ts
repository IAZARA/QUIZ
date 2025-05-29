import { create } from 'zustand';
import { QuizConfigState, QuizConfig } from '../types';

// Configuración por defecto
const DEFAULT_CONFIG: QuizConfig = {
  defaultTimer: 30, // 30 segundos por defecto
  showRankings: true,
  allowJoinDuringQuiz: true,
  soundsEnabled: true, // Habilitar sonidos por defecto
  masterVolume: 0.75, // Volumen maestro por defecto (0.0 a 1.0)
  logoUrl: '' // URL del logo por defecto
};

// Constantes para validación
const MIN_TIMER = 10;
const MAX_TIMER = 120;
const MIN_VOLUME = 0.0;
const MAX_VOLUME = 1.0;

// Función para validar URLs
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};

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

  // Validar el volumen maestro si está presente
  if (config.masterVolume !== undefined) {
    if (isNaN(config.masterVolume)) {
      return { isValid: false, error: 'El volumen maestro debe ser un número válido' };
    }
    
    if (config.masterVolume < MIN_VOLUME || config.masterVolume > MAX_VOLUME) {
      return { 
        isValid: false, 
        error: `El volumen maestro debe estar entre ${MIN_VOLUME} y ${MAX_VOLUME}` 
      };
    }
  }

  // Validar la URL del logo si está presente y no está vacía
  if (config.logoUrl !== undefined && config.logoUrl.trim() !== '') {
    if (!isValidUrl(config.logoUrl)) {
      return { isValid: false, error: 'La URL del logo no es válida' };
    }
  }
  
  return { isValid: true };
};

export const useQuizConfigStore = create<QuizConfigState>((set, get) => ({
  config: DEFAULT_CONFIG,
  isLoading: false,
  isRankingVisible: false, // Nuevo estado para controlar la visibilidad

  // Nuevas acciones para mostrar/ocultar el ranking
  showRanking: () => {
    // Emitir evento al servidor para que todos los clientes vean el ranking
    fetch('/api/admin/show-ranking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      console.error('Error al mostrar el ranking:', error);
    });
    
    set({ isRankingVisible: true });
  },
  
  hideRanking: () => {
    // Emitir evento al servidor para que todos los clientes oculten el ranking
    fetch('/api/admin/hide-ranking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      console.error('Error al ocultar el ranking:', error);
    });
    
    set({ isRankingVisible: false });
  },

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