import express from 'express';

const router = express.Router();

// Variable para almacenar la instancia de io
let ioInstance = null;

// Estado global del sistema de canvas interactivos
let canvasState = {
  activeCanvas: null,
  isRunning: false,
  currentStep: 'waiting',
  explanations: [],
  userInstances: new Map()
};

// Canvas disponibles
const availableCanvas = [
  {
    id: 'clasificador-actividad',
    name: 'Clasificador Visual de Actividad',
    description: 'Aprende Machine Learning ajustando sliders para ver cómo se clasifica una actividad',
    type: 'clasificador',
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
    type: 'mapa-patrones',
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
    type: 'custom',
    thumbnail: '/thumbnails/machine-learning-dibujo.svg',
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
    type: 'custom',
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
    type: 'custom',
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
  }
];

// Función para configurar la instancia de Socket.IO
export function setupCanvasInteractivosSockets(io) {
  ioInstance = io;
  console.log('Canvas Interactivos sockets configurados');
}

// Función auxiliar para emitir eventos a la audiencia
function broadcastToAudience(eventType, payload) {
  if (!ioInstance) {
    console.error('Socket.IO instance not configured');
    return;
  }

  ioInstance.to('canvas-interactivos-room').emit(eventType, payload);
  console.log(`Broadcasted ${eventType} to audience:`, payload);
}

// GET /api/canvas-interactivos/test - Verificar estado del módulo
router.get('/test', (req, res) => {
  res.json({
    message: 'Canvas Interactivos API funcionando correctamente',
    timestamp: new Date().toISOString(),
    state: canvasState
  });
});

// GET /api/canvas-interactivos/canvas - Obtener canvas disponibles
router.get('/canvas', (req, res) => {
  res.json({
    canvas: availableCanvas,
    total: availableCanvas.length
  });
});

// GET /api/canvas-interactivos/status - Obtener estado actual
router.get('/status', (req, res) => {
  res.json({
    ...canvasState,
    userInstances: Array.from(canvasState.userInstances.entries())
  });
});

// POST /api/canvas-interactivos/start - Iniciar un canvas
router.post('/start', (req, res) => {
  try {
    const { canvasId, params } = req.body;
    
    if (!canvasId) {
      return res.status(400).json({
        error: 'Canvas ID es requerido',
        received: req.body
      });
    }

    const canvas = availableCanvas.find(c => c.id === canvasId);
    if (!canvas) {
      return res.status(404).json({
        error: 'Canvas no encontrado',
        canvasId,
        available: availableCanvas.map(c => c.id)
      });
    }

    // Actualizar estado
    canvasState.activeCanvas = canvasId;
    canvasState.isRunning = true;
    canvasState.currentStep = 'canvas-sent';
    canvasState.explanations = [];
    canvasState.userInstances.clear();

    // Emitir evento a la audiencia
    broadcastToAudience('canvas:status', {
      isActive: true,
      canvasId: canvasId,
      canvas: canvas,
      params: params || canvas.defaultParams
    });

    res.json({
      success: true,
      message: `Canvas ${canvas.name} iniciado correctamente`,
      state: {
        ...canvasState,
        userInstances: Array.from(canvasState.userInstances.entries())
      }
    });

  } catch (error) {
    console.error('Error al iniciar canvas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// POST /api/canvas-interactivos/stop - Detener canvas actual
router.post('/stop', (req, res) => {
  try {
    const previousCanvas = canvasState.activeCanvas;
    
    // Resetear estado
    canvasState.activeCanvas = null;
    canvasState.isRunning = false;
    canvasState.currentStep = 'waiting';
    canvasState.explanations = [];
    canvasState.userInstances.clear();

    // Emitir evento a la audiencia
    broadcastToAudience('canvas:status', {
      isActive: false,
      canvasId: null
    });

    res.json({
      success: true,
      message: `Canvas ${previousCanvas || 'desconocido'} detenido correctamente`,
      state: {
        ...canvasState,
        userInstances: Array.from(canvasState.userInstances.entries())
      }
    });

  } catch (error) {
    console.error('Error al detener canvas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// POST /api/canvas-interactivos/instance/create - Crear instancia de usuario
router.post('/instance/create', (req, res) => {
  try {
    const { userId, canvasType } = req.body;
    
    if (!userId || !canvasType) {
      return res.status(400).json({
        error: 'userId y canvasType son requeridos'
      });
    }

    const instanceId = `${userId}-${canvasType}-${Date.now()}`;
    const instance = {
      id: instanceId,
      userId,
      canvasType,
      state: {},
      lastUpdated: new Date()
    };

    canvasState.userInstances.set(userId, instance);

    res.json({
      success: true,
      instance: instance,
      totalInstances: canvasState.userInstances.size
    });

  } catch (error) {
    console.error('Error al crear instancia:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// POST /api/canvas-interactivos/instance/update - Actualizar instancia de usuario
router.post('/instance/update', (req, res) => {
  try {
    const { userId, state } = req.body;
    
    if (!userId || !state) {
      return res.status(400).json({
        error: 'userId y state son requeridos'
      });
    }

    if (canvasState.userInstances.has(userId)) {
      const instance = canvasState.userInstances.get(userId);
      instance.state = { ...instance.state, ...state };
      instance.lastUpdated = new Date();
      canvasState.userInstances.set(userId, instance);

      res.json({
        success: true,
        instance: instance
      });
    } else {
      res.status(404).json({
        error: 'Instancia de usuario no encontrada',
        userId
      });
    }

  } catch (error) {
    console.error('Error al actualizar instancia:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Configuración de eventos de Socket.IO para Canvas Interactivos
export function setupCanvasInteractivosSocketEvents(io) {
  io.on('connection', (socket) => {
    console.log(`Canvas Interactivos: Socket ${socket.id} connected`);

    // Unirse a la sala de canvas interactivos
    socket.on('join:canvas-interactivos', () => {
      socket.join('canvas-interactivos-room');
      console.log(`Socket ${socket.id} joined Canvas Interactivos room`);
      
      // Enviar estado actual al cliente que se conecta
      socket.emit('canvas:status', {
        isActive: canvasState.isRunning,
        canvasId: canvasState.activeCanvas,
        canvas: canvasState.activeCanvas ? availableCanvas.find(c => c.id === canvasState.activeCanvas) : null
      });
    });

    // Eventos del presentador
    socket.on('canvasInteractivos:start', (data) => {
      console.log('Canvas start event received:', data);
      const { canvasId, params } = data;
      
      const canvas = availableCanvas.find(c => c.id === canvasId);
      if (canvas) {
        canvasState.activeCanvas = canvasId;
        canvasState.isRunning = true;
        canvasState.currentStep = 'canvas-sent';
        canvasState.userInstances.clear();

        // Broadcast a toda la audiencia
        io.to('canvas-interactivos-room').emit('canvas:status', {
          isActive: true,
          canvasId: canvasId,
          canvas: canvas,
          params: params || canvas.defaultParams
        });
      }
    });

    socket.on('canvasInteractivos:stop', () => {
      console.log('Canvas stop event received');
      
      canvasState.activeCanvas = null;
      canvasState.isRunning = false;
      canvasState.currentStep = 'waiting';
      canvasState.userInstances.clear();

      // Broadcast a toda la audiencia
      io.to('canvas-interactivos-room').emit('canvas:status', {
        isActive: false,
        canvasId: null
      });
    });

    // Salir de la sala
    socket.on('leave:canvas-interactivos', () => {
      socket.leave('canvas-interactivos-room');
      console.log(`Socket ${socket.id} left Canvas Interactivos room`);
    });

    socket.on('disconnect', () => {
      console.log(`Canvas Interactivos: Socket ${socket.id} disconnected`);
    });
  });
}

export default router;