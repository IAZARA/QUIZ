import { create } from 'zustand';
import io from 'socket.io-client';

export interface CanvasInstance {
  id: string;
  userId: string;
  canvasType: string;
  state: any;
  lastUpdated: Date;
}

export interface Canvas {
  id: string;
  name: string;
  description: string;
  type: 'clasificador' | 'mapa-patrones' | 'custom';
  thumbnail: string;
  component: string;
  defaultParams?: any;
}

interface CanvasInteractivosState {
  // Connection
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  
  // Canvas management
  activeCanvas: string | null;
  availableCanvas: Canvas[];
  isRunning: boolean;
  
  // Instance management
  userInstances: Map<string, CanvasInstance>;
  currentUserInstance: CanvasInstance | null;
  
  // Canvas state
  currentStep: string;
  explanations: string[];
  
  // Canvas settings
  canvasSize: { width: number; height: number };
  
  // Actions
  initializeSocket: () => void;
  disconnectSocket: () => void;
  setActiveCanvas: (canvasId: string) => void;
  createUserInstance: (userId: string, canvasType: string) => void;
  updateUserInstance: (userId: string, state: any) => void;
  sendCanvasToAudience: (canvasId: string, params?: any) => void;
  stopCanvas: () => void;
  resetState: () => void;
}

// Variable para almacenar la instancia del socket
let socket: any = null;

const initialState = {
  connectionStatus: 'connecting' as const,
  activeCanvas: null,
  availableCanvas: [
    {
      id: 'clasificador-actividad',
      name: 'Clasificador Visual de Actividad',
      description: 'Aprende Machine Learning ajustando sliders para ver cómo se clasifica una actividad',
      type: 'clasificador' as const,
      thumbnail: '/thumbnails/clasificador-actividad.png',
      component: 'ClasificadorCanvas',
      defaultParams: {
        frecuencia: 50,
        intensidad: 50
      }
    },
    {
      id: 'mapa-patrones-robos',
      name: 'ML: Mapa de Patrones de Robos por Hora',
      description: 'Demostración interactiva de Machine Learning para entender patrones de robos por hora',
      type: 'mapa-patrones' as const,
      thumbnail: '/thumbnails/mapa-patrones.png',
      component: 'MapaPatronesCanvas',
      defaultParams: {
        clusterCount: 3,
        showTraining: true
      }
    },
    {
      id: 'machine-learning-dibujo',
      name: 'Simulador de Machine Learning',
      description: 'Aprende cómo funciona el entrenamiento y predicción en ML dibujando formas',
      type: 'custom' as const,
      thumbnail: '/thumbnails/machine-learning-dibujo.png',
      component: 'MachineLearningCanvas',
      defaultParams: {
        currentPhase: 'training',
        currentItemIndex: 0
      }
    },
    {
      id: 'red-criminal',
      name: 'Desentrañando la Red Criminal',
      description: 'Identifica al líder de la red criminal analizando conexiones como lo haría una IA',
      type: 'custom' as const,
      thumbnail: '/thumbnails/red-criminal.svg',
      component: 'RedCriminalCanvas',
      defaultParams: {
        currentLevel: 0,
        gameState: 'playing',
        identifiedMembers: 0
      }
    },
    {
      id: 'anomalia-financiera',
      name: 'Cazador de Anomalías Financieras',
      description: '¡Ayuda a la IA a detectar el lavado de dinero! Haz clic en las transacciones que consideres sospechosas.',
      type: 'custom' as const,
      thumbnail: '/thumbnails/anomalia-financiera.svg',
      component: 'AnomaliaFinancieraCanvas',
      defaultParams: {
        currentLevel: 0,
        score: 0,
        correctFlags: 0,
        falseFlags: 0,
        missedFlags: 0,
        gameRunning: false
      }
    },
    {
      id: 'verificador-evidencia',
      name: 'Verificador de Evidencia Digital',
      description: 'Identifica si la evidencia es genuina o ha sido manipulada por IA. Aprende a detectar deepfakes y contenido sintético.',
      type: 'custom' as const,
      thumbnail: '/thumbnails/verificador-evidencia.svg',
      component: 'VerificadorEvidenciaCanvas',
      defaultParams: {
        currentLevel: 0,
        currentRound: 0,
        score: 0,
        gameRunning: false
      }
    }
  ],
  isRunning: false,
  userInstances: new Map(),
  currentUserInstance: null,
  currentStep: 'waiting',
  explanations: [],
  canvasSize: { width: 800, height: 600 }
};

export const useCanvasInteractivosStore = create<CanvasInteractivosState>((set, get) => ({
  ...initialState,

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
        console.log('Canvas Interactivos socket connected');
        set({ connectionStatus: 'connected' });
        // Unirse a la sala de canvas interactivos
        socket.emit('join:canvas-interactivos');
        console.log('Emitted join:canvas-interactivos');
      });

      socket.on('disconnect', () => {
        console.log('Canvas Interactivos socket disconnected');
        set({ connectionStatus: 'disconnected' });
      });

      socket.on('reconnect', () => {
        console.log('Canvas Interactivos socket reconnected');
        set({ connectionStatus: 'connected' });
      });

      // Listeners para eventos de canvas
      socket.on('canvas:status', (data: { isActive: boolean, canvasId?: string }) => {
        console.log('Canvas status update:', data);
        set({
          isRunning: data.isActive,
          activeCanvas: data.canvasId || null,
          currentStep: data.isActive ? 'canvas-sent' : 'waiting'
        });
      });

      socket.on('canvas:update', (data: any) => {
        console.log('Canvas update:', data);
        set({
          activeCanvas: data.canvasId || get().activeCanvas,
          currentStep: data.step || get().currentStep,
          explanations: data.explanations || get().explanations
        });
      });
    }
  },

  disconnectSocket: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
      set({ connectionStatus: 'disconnected' });
    }
  },

  setActiveCanvas: (canvasId: string) => {
    set({ activeCanvas: canvasId });
  },

  createUserInstance: (userId: string, canvasType: string) => {
    const instanceId = `${userId}-${canvasType}-${Date.now()}`;
    
    const newInstance: CanvasInstance = {
      id: instanceId,
      userId,
      canvasType,
      state: {},
      lastUpdated: new Date()
    };
    
    const userInstances = get().userInstances;
    userInstances.set(userId, newInstance);
    
    set({
      userInstances: new Map(userInstances),
      currentUserInstance: newInstance
    });
  },

  updateUserInstance: (userId: string, state: any) => {
    const userInstances = get().userInstances;
    
    if (userInstances.has(userId)) {
      const instance = userInstances.get(userId)!;
      instance.state = { ...instance.state, ...state };
      instance.lastUpdated = new Date();
      userInstances.set(userId, instance);
      
      set({ userInstances: new Map(userInstances) });
    }
  },

  sendCanvasToAudience: (canvasId: string, params?: any) => {
    if (socket) {
      socket.emit('canvasInteractivos:start', { canvasId, params });
    }
    
    set({
      activeCanvas: canvasId,
      isRunning: true,
      currentStep: 'canvas-sent'
    });
  },

  stopCanvas: () => {
    if (socket) {
      socket.emit('canvasInteractivos:stop');
    }
    
    set({
      isRunning: false,
      activeCanvas: null,
      currentStep: 'waiting',
      explanations: [],
      userInstances: new Map(),
      currentUserInstance: null
    });
  },

  resetState: () => {
    set({
      ...initialState,
      connectionStatus: get().connectionStatus
    });
  }
}));