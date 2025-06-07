import express from 'express';

const router = express.Router();

// Variable para almacenar la instancia de io
let ioInstance = null;

// Estado global del sistema de scripts
let scriptsState = {
  activeScript: null,
  isRunning: false,
  points: [],
  clusters: [],
  currentStep: 'waiting',
  explanations: []
};

// Scripts disponibles
const availableScripts = [
  {
    id: 'ml-clustering',
    name: 'ML Clustering Interactivo',
    description: 'Aprende clustering arrastrando puntos y viendo cómo se forman grupos automáticamente',
    type: 'clustering'
  }
];

// Función auxiliar para generar colores de clusters
function getClusterColors() {
  return ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FFB347', '#98FB98'];
}

// Algoritmo K-means simplificado para el servidor
function simpleKMeans(points, k) {
  if (points.length === 0 || k <= 0) return [];
  
  const colors = getClusterColors();
  const clusters = [];
  
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
  
  // Iterar hasta convergencia (máximo 10 iteraciones)
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
}

// Función para emitir eventos a la audiencia
function broadcastScriptUpdate(eventType, data) {
  if (ioInstance) {
    const payload = {
      ...data,
      timestamp: new Date().toISOString()
    };
    
    ioInstance.to('interactive-scripts-room').emit(eventType, payload);
    console.log(`Broadcasted ${eventType} to audience:`, payload);
  }
}

// GET /api/interactive-scripts/test - Verificar estado del módulo
router.get('/test', (req, res) => {
  res.json({
    message: 'Módulo Scripts Interactivos funcionando correctamente',
    timestamp: new Date().toISOString(),
    availableScripts: availableScripts.length,
    status: 'active'
  });
});

// GET /api/interactive-scripts/scripts - Obtener scripts disponibles
router.get('/scripts', (req, res) => {
  res.json({
    success: true,
    scripts: availableScripts,
    timestamp: new Date().toISOString()
  });
});

// GET /api/interactive-scripts/status - Obtener estado actual
router.get('/status', (req, res) => {
  res.json({
    success: true,
    state: scriptsState,
    timestamp: new Date().toISOString()
  });
});

// POST /api/interactive-scripts/start - Iniciar un script
router.post('/start', (req, res) => {
  try {
    const { scriptId } = req.body;
    
    if (!scriptId) {
      return res.status(400).json({ error: 'Script ID es requerido' });
    }
    
    const script = availableScripts.find(s => s.id === scriptId);
    if (!script) {
      return res.status(404).json({ error: 'Script no encontrado' });
    }
    
    // Actualizar estado
    scriptsState = {
      activeScript: scriptId,
      isRunning: true,
      points: [],
      clusters: [],
      currentStep: 'started',
      explanations: [`Script "${script.name}" iniciado`, 'Haz clic para agregar puntos de datos']
    };
    
    // Emitir a la audiencia
    broadcastScriptUpdate('script:start', {
      scriptId,
      script,
      step: 'started',
      explanations: scriptsState.explanations
    });
    
    res.json({
      success: true,
      message: 'Script iniciado correctamente',
      state: scriptsState
    });
    
  } catch (error) {
    console.error('Error starting script:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/interactive-scripts/stop - Detener script actual
router.post('/stop', (req, res) => {
  try {
    scriptsState = {
      activeScript: null,
      isRunning: false,
      points: [],
      clusters: [],
      currentStep: 'waiting',
      explanations: []
    };
    
    // Emitir a la audiencia
    broadcastScriptUpdate('script:end', {});
    
    res.json({
      success: true,
      message: 'Script detenido correctamente',
      state: scriptsState
    });
    
  } catch (error) {
    console.error('Error stopping script:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/interactive-scripts/point/add - Agregar punto
router.post('/point/add', (req, res) => {
  try {
    const { point } = req.body;
    
    if (!scriptsState.isRunning) {
      return res.status(400).json({ error: 'No hay script activo' });
    }
    
    if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
      return res.status(400).json({ error: 'Datos de punto inválidos' });
    }
    
    const newPoint = {
      ...point,
      id: point.id || Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    
    scriptsState.points.push(newPoint);
    
    // Emitir a la audiencia
    broadcastScriptUpdate('script:point-add', { point: newPoint });
    
    res.json({
      success: true,
      point: newPoint,
      totalPoints: scriptsState.points.length
    });
    
  } catch (error) {
    console.error('Error adding point:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/interactive-scripts/point/move - Mover punto
router.post('/point/move', (req, res) => {
  try {
    const { pointId, x, y } = req.body;
    
    if (!scriptsState.isRunning) {
      return res.status(400).json({ error: 'No hay script activo' });
    }
    
    const pointIndex = scriptsState.points.findIndex(p => p.id === pointId);
    if (pointIndex === -1) {
      return res.status(404).json({ error: 'Punto no encontrado' });
    }
    
    scriptsState.points[pointIndex] = {
      ...scriptsState.points[pointIndex],
      x,
      y
    };
    
    // Emitir a la audiencia
    broadcastScriptUpdate('script:point-move', { pointId, x, y });
    
    res.json({
      success: true,
      point: scriptsState.points[pointIndex]
    });
    
  } catch (error) {
    console.error('Error moving point:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/interactive-scripts/point/remove - Eliminar punto
router.post('/point/remove', (req, res) => {
  try {
    const { pointId } = req.body;
    
    if (!scriptsState.isRunning) {
      return res.status(400).json({ error: 'No hay script activo' });
    }
    
    const initialLength = scriptsState.points.length;
    scriptsState.points = scriptsState.points.filter(p => p.id !== pointId);
    
    if (scriptsState.points.length === initialLength) {
      return res.status(404).json({ error: 'Punto no encontrado' });
    }
    
    // Emitir a la audiencia
    broadcastScriptUpdate('script:point-remove', { pointId });
    
    res.json({
      success: true,
      remainingPoints: scriptsState.points.length
    });
    
  } catch (error) {
    console.error('Error removing point:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/interactive-scripts/points/clear - Limpiar todos los puntos
router.post('/points/clear', (req, res) => {
  try {
    if (!scriptsState.isRunning) {
      return res.status(400).json({ error: 'No hay script activo' });
    }
    
    scriptsState.points = [];
    scriptsState.clusters = [];
    scriptsState.currentStep = 'started';
    scriptsState.explanations = ['Puntos limpiados', 'Agrega nuevos puntos para continuar'];
    
    // Emitir a la audiencia
    broadcastScriptUpdate('script:clear-points', {
      step: scriptsState.currentStep,
      explanations: scriptsState.explanations
    });
    
    res.json({
      success: true,
      message: 'Puntos limpiados correctamente'
    });
    
  } catch (error) {
    console.error('Error clearing points:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/interactive-scripts/clustering/run - Ejecutar clustering
router.post('/clustering/run', (req, res) => {
  try {
    const { k = 3 } = req.body;
    
    if (!scriptsState.isRunning) {
      return res.status(400).json({ error: 'No hay script activo' });
    }
    
    if (scriptsState.points.length === 0) {
      return res.status(400).json({ error: 'No hay puntos para analizar' });
    }
    
    // Actualizar estado a "ejecutando"
    scriptsState.currentStep = 'clustering-running';
    broadcastScriptUpdate('script:update', {
      step: 'clustering-running',
      explanations: ['Ejecutando algoritmo K-Means...', 'Identificando patrones en los datos']
    });
    
    // Simular tiempo de procesamiento
    setTimeout(() => {
      try {
        // Ejecutar clustering
        const clusters = simpleKMeans(scriptsState.points, Math.min(k, scriptsState.points.length));
        
        // Actualizar puntos con colores de cluster
        const updatedPoints = scriptsState.points.map(point => {
          const cluster = clusters.find(c => c.points.some(p => p.id === point.id));
          return cluster ? { ...point, clusterId: cluster.id, color: cluster.color } : point;
        });
        
        const explanations = [
          `Se han identificado ${clusters.length} grupos distintos`,
          `Total de puntos analizados: ${scriptsState.points.length}`,
          `Algoritmo utilizado: K-Means con k=${Math.min(k, scriptsState.points.length)}`,
          clusters.length > 0 ? `Tamaño promedio de grupo: ${Math.round(scriptsState.points.length / clusters.length * 10) / 10}` : ''
        ].filter(Boolean);
        
        // Actualizar estado
        scriptsState.clusters = clusters;
        scriptsState.points = updatedPoints;
        scriptsState.currentStep = 'clustering-complete';
        scriptsState.explanations = explanations;
        
        // Emitir resultado a la audiencia
        broadcastScriptUpdate('script:cluster', {
          clusters,
          points: updatedPoints,
          step: 'clustering-complete',
          explanations
        });
        
      } catch (clusteringError) {
        console.error('Error in clustering execution:', clusteringError);
        scriptsState.currentStep = 'started';
        scriptsState.explanations = ['Error en el clustering', 'Intenta nuevamente'];
        
        broadcastScriptUpdate('script:update', {
          step: 'started',
          explanations: scriptsState.explanations
        });
      }
    }, 2000); // 2 segundos de delay para mostrar la animación
    
    res.json({
      success: true,
      message: 'Clustering iniciado',
      estimatedTime: '2 segundos'
    });
    
  } catch (error) {
    console.error('Error running clustering:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Función para configurar los sockets de Scripts Interactivos
function setupInteractiveScriptsSockets(io) {
  ioInstance = io;
  
  io.on('connection', (socket) => {
    // Unirse a la sala de scripts interactivos
    socket.on('join:interactive-scripts', () => {
      socket.join('interactive-scripts-room');
      console.log(`Socket ${socket.id} joined Interactive Scripts room`);
      
      // Enviar estado actual
      socket.emit('script:status', {
        isRunning: scriptsState.isRunning,
        activeScript: scriptsState.activeScript,
        currentStep: scriptsState.currentStep,
        points: scriptsState.points,
        clusters: scriptsState.clusters,
        explanations: scriptsState.explanations
      });
    });
    
    // Salir de la sala
    socket.on('leave:interactive-scripts', () => {
      socket.leave('interactive-scripts-room');
      console.log(`Socket ${socket.id} left Interactive Scripts room`);
    });
    
    // Eventos desde el cliente (admin)
    socket.on('script:start', (data) => {
      console.log('Script start request from client:', data);
      // El cliente debería usar la API REST, pero podemos manejar esto también
    });
    
    socket.on('script:point-add', (data) => {
      if (scriptsState.isRunning && data.point) {
        const newPoint = {
          ...data.point,
          id: data.point.id || Date.now().toString() + Math.random().toString(36).substr(2, 9)
        };
        
        scriptsState.points.push(newPoint);
        broadcastScriptUpdate('script:point-add', { point: newPoint });
      }
    });
    
    socket.on('script:point-move', (data) => {
      if (scriptsState.isRunning && data.pointId) {
        const pointIndex = scriptsState.points.findIndex(p => p.id === data.pointId);
        if (pointIndex !== -1) {
          scriptsState.points[pointIndex] = {
            ...scriptsState.points[pointIndex],
            x: data.x,
            y: data.y
          };
          broadcastScriptUpdate('script:point-move', data);
        }
      }
    });
    
    socket.on('script:cluster', (data) => {
      if (scriptsState.isRunning) {
        // Ejecutar clustering
        const k = data.k || 3;
        const clusters = simpleKMeans(scriptsState.points, Math.min(k, scriptsState.points.length));
        
        const updatedPoints = scriptsState.points.map(point => {
          const cluster = clusters.find(c => c.points.some(p => p.id === point.id));
          return cluster ? { ...point, clusterId: cluster.id, color: cluster.color } : point;
        });
        
        scriptsState.clusters = clusters;
        scriptsState.points = updatedPoints;
        scriptsState.currentStep = 'clustering-complete';
        
        broadcastScriptUpdate('script:cluster', {
          clusters,
          points: updatedPoints,
          step: 'clustering-complete',
          explanations: data.explanations || []
        });
      }
    });
    
    socket.on('script:end', () => {
      scriptsState = {
        activeScript: null,
        isRunning: false,
        points: [],
        clusters: [],
        currentStep: 'waiting',
        explanations: []
      };
      
      broadcastScriptUpdate('script:end', {});
    });
    
    socket.on('disconnect', () => {
      console.log(`Socket ${socket.id} disconnected from Interactive Scripts`);
    });
  });
}

// Exportar el router y la función de configuración
export default router;
export { setupInteractiveScriptsSockets };