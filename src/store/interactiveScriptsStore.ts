import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export interface Point {
  id: string;
  x: number;
  y: number;
  color?: string;
  clusterId?: number;
}

export interface Cluster {
  id: number;
  centroid: { x: number; y: number };
  points: Point[];
  color: string;
}

export interface Script {
  id: string;
  name: string;
  description: string;
  type: 'clustering' | 'classification' | 'regression';
}

interface InteractiveScriptsState {
  // Connection
  socket: Socket | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  
  // Script management
  activeScript: string | null;
  availableScripts: Script[];
  isRunning: boolean;
  
  // Clustering state
  points: Point[];
  clusters: Cluster[];
  currentStep: string;
  explanations: string[];
  
  // Canvas settings
  canvasSize: { width: number; height: number };
  
  // Actions
  initializeSocket: () => void;
  disconnectSocket: () => void;
  setActiveScript: (scriptId: string) => void;
  addPoint: (point: Omit<Point, 'id'>) => void;
  movePoint: (pointId: string, x: number, y: number) => void;
  removePoint: (pointId: string) => void;
  clearPoints: () => void;
  runClustering: (k?: number) => void;
  stopScript: () => void;
  resetState: () => void;
}

const initialState = {
  socket: null,
  connectionStatus: 'connecting' as const,
  activeScript: null,
  availableScripts: [
    {
      id: 'ml-clustering',
      name: 'ML Clustering Interactivo',
      description: 'Aprende clustering arrastrando puntos y viendo cómo se forman grupos automáticamente',
      type: 'clustering' as const
    }
  ],
  isRunning: false,
  points: [],
  clusters: [],
  currentStep: 'waiting',
  explanations: [],
  canvasSize: { width: 800, height: 600 }
};

// Función auxiliar para generar colores de clusters
const getClusterColors = () => [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FFEAA7', '#DDA0DD', '#FFB347', '#98FB98'
];

// Algoritmo K-means simplificado
const simpleKMeans = (points: Point[], k: number): Cluster[] => {
  if (points.length === 0 || k <= 0) return [];
  
  const colors = getClusterColors();
  const clusters: Cluster[] = [];
  
  // Inicializar centroides aleatoriamente
  for (let i = 0; i < k; i++) {
    const randomPoint = points[Math.floor(Math.random() * points.length)];
    clusters.push({
      id: i,
      centroid: { x: randomPoint.x, y: randomPoint.y },
      points: [],
      color: colors[i % colors.length]
    });
  }
  
  // Iterar hasta convergencia (máximo 10 iteraciones para simplicidad)
  for (let iteration = 0; iteration < 10; iteration++) {
    // Limpiar puntos de clusters
    clusters.forEach(cluster => cluster.points = []);
    
    // Asignar cada punto al cluster más cercano
    points.forEach(point => {
      let minDistance = Infinity;
      let closestCluster = 0;
      
      clusters.forEach((cluster, index) => {
        const distance = Math.sqrt(
          Math.pow(point.x - cluster.centroid.x, 2) + 
          Math.pow(point.y - cluster.centroid.y, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestCluster = index;
        }
      });
      
      const updatedPoint = { 
        ...point, 
        clusterId: closestCluster,
        color: clusters[closestCluster].color 
      };
      clusters[closestCluster].points.push(updatedPoint);
    });
    
    // Recalcular centroides
    clusters.forEach(cluster => {
      if (cluster.points.length > 0) {
        const sumX = cluster.points.reduce((sum, p) => sum + p.x, 0);
        const sumY = cluster.points.reduce((sum, p) => sum + p.y, 0);
        cluster.centroid.x = sumX / cluster.points.length;
        cluster.centroid.y = sumY / cluster.points.length;
      }
    });
  }
  
  return clusters.filter(cluster => cluster.points.length > 0);
};

export const useInteractiveScriptsStore = create<InteractiveScriptsState>((set, get) => ({
  ...initialState,

  initializeSocket: () => {
    const currentSocket = get().socket;
    if (currentSocket?.connected) {
      return;
    }

    const newSocket = io({
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
    });

    newSocket.on('connect', () => {
      console.log('Interactive Scripts socket connected');
      set({ connectionStatus: 'connected' });
      newSocket.emit('join:interactive-scripts');
    });

    newSocket.on('disconnect', () => {
      console.log('Interactive Scripts socket disconnected');
      set({ connectionStatus: 'disconnected' });
    });

    newSocket.on('reconnect', () => {
      console.log('Interactive Scripts socket reconnected');
      set({ connectionStatus: 'connected' });
      newSocket.emit('join:interactive-scripts');
    });

    // Listeners para eventos de scripts
    newSocket.on('script:start', (data: any) => {
      console.log('Script started:', data);
      set({
        activeScript: data.scriptId,
        isRunning: true,
        currentStep: data.step || 'started',
        explanations: data.explanations || []
      });
    });

    newSocket.on('script:update', (data: any) => {
      console.log('Script update:', data);
      set({
        points: data.points || get().points,
        clusters: data.clusters || get().clusters,
        currentStep: data.step || get().currentStep,
        explanations: data.explanations || get().explanations
      });
    });

    newSocket.on('script:point-add', (data: any) => {
      const currentPoints = get().points;
      const newPoint = { ...data.point, id: data.point.id || Date.now().toString() };
      set({ points: [...currentPoints, newPoint] });
    });

    newSocket.on('script:point-move', (data: any) => {
      const currentPoints = get().points;
      const updatedPoints = currentPoints.map(point =>
        point.id === data.pointId 
          ? { ...point, x: data.x, y: data.y }
          : point
      );
      set({ points: updatedPoints });
    });

    newSocket.on('script:cluster', (data: any) => {
      set({
        clusters: data.clusters || [],
        points: data.points || get().points,
        currentStep: 'clustering-complete',
        explanations: data.explanations || []
      });
    });

    newSocket.on('script:end', () => {
      console.log('Script ended');
      set({
        isRunning: false,
        activeScript: null,
        currentStep: 'waiting',
        clusters: [],
        explanations: []
      });
    });

    set({ socket: newSocket, connectionStatus: 'connecting' });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.emit('leave:interactive-scripts');
      socket.disconnect();
      set({ socket: null, connectionStatus: 'disconnected' });
    }
  },

  setActiveScript: (scriptId: string) => {
    const socket = get().socket;
    if (socket) {
      socket.emit('script:start', { scriptId });
    }
    set({ activeScript: scriptId });
  },

  addPoint: (point: Omit<Point, 'id'>) => {
    const newPoint: Point = {
      ...point,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    
    const currentPoints = get().points;
    const updatedPoints = [...currentPoints, newPoint];
    
    set({ points: updatedPoints });
    
    // Emitir a través del socket
    const socket = get().socket;
    if (socket) {
      socket.emit('script:point-add', { point: newPoint });
    }
  },

  movePoint: (pointId: string, x: number, y: number) => {
    const currentPoints = get().points;
    const updatedPoints = currentPoints.map(point =>
      point.id === pointId ? { ...point, x, y } : point
    );
    
    set({ points: updatedPoints });
    
    // Emitir a través del socket
    const socket = get().socket;
    if (socket) {
      socket.emit('script:point-move', { pointId, x, y });
    }
  },

  removePoint: (pointId: string) => {
    const currentPoints = get().points;
    const updatedPoints = currentPoints.filter(point => point.id !== pointId);
    
    set({ points: updatedPoints });
    
    // Emitir a través del socket
    const socket = get().socket;
    if (socket) {
      socket.emit('script:point-remove', { pointId });
    }
  },

  clearPoints: () => {
    set({ points: [], clusters: [] });
    
    // Emitir a través del socket
    const socket = get().socket;
    if (socket) {
      socket.emit('script:clear-points');
    }
  },

  runClustering: (k = 3) => {
    const points = get().points;
    if (points.length === 0) return;
    
    set({ currentStep: 'clustering-running' });
    
    // Ejecutar clustering localmente
    const clusters = simpleKMeans(points, Math.min(k, points.length));
    
    // Actualizar puntos con colores de cluster
    const updatedPoints = points.map(point => {
      const cluster = clusters.find(c => c.points.some(p => p.id === point.id));
      return cluster ? { ...point, clusterId: cluster.id, color: cluster.color } : point;
    });
    
    const explanations = [
      `Se han identificado ${clusters.length} clusters`,
      `Total de puntos analizados: ${points.length}`,
      `Algoritmo utilizado: K-Means simplificado`
    ];
    
    set({ 
      clusters, 
      points: updatedPoints,
      currentStep: 'clustering-complete',
      explanations 
    });
    
    // Emitir a través del socket
    const socket = get().socket;
    if (socket) {
      socket.emit('script:cluster', { 
        clusters, 
        points: updatedPoints, 
        explanations,
        k 
      });
    }
  },

  stopScript: () => {
    const socket = get().socket;
    if (socket) {
      socket.emit('script:end');
    }
    
    set({
      isRunning: false,
      activeScript: null,
      currentStep: 'waiting',
      clusters: [],
      explanations: []
    });
  },

  resetState: () => {
    const socket = get().socket;
    set({
      ...initialState,
      socket,
      connectionStatus: get().connectionStatus
    });
  }
}));