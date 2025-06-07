import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, RotateCcw, Brain, MousePointer, Zap, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useInteractiveScriptsStore, Point } from '../../store/interactiveScriptsStore';

interface InteractiveScriptsTabProps {
  socket?: any;
}

const InteractiveScriptsTab: React.FC<InteractiveScriptsTabProps> = ({ socket }) => {
  const { t } = useTranslation();
  const {
    connectionStatus,
    activeScript,
    availableScripts,
    isRunning,
    points,
    clusters,
    currentStep,
    explanations,
    canvasSize,
    initializeSocket,
    setActiveScript,
    addPoint,
    movePoint,
    clearPoints,
    runClustering,
    stopScript,
    resetState
  } = useInteractiveScriptsStore();

  const [selectedScript, setSelectedScript] = useState<string>('ml-clustering');
  const [clusterCount, setClusterCount] = useState<number>(3);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    initializeSocket();
    return () => {
      // Socket se maneja en el store
    };
  }, [initializeSocket]);

  const handleStartScript = () => {
    if (!selectedScript) return;
    
    setActiveScript(selectedScript);
    setNotification({
      type: 'success',
      message: 'Script iniciado correctamente'
    });
    
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStopScript = () => {
    stopScript();
    setNotification({
      type: 'success',
      message: 'Script detenido'
    });
    
    setTimeout(() => setNotification(null), 3000);
  };

  const handleReset = () => {
    resetState();
    setSelectedScript('ml-clustering');
    setClusterCount(3);
  };

  const handleCanvasClick = (event: React.MouseEvent<SVGElement>) => {
    if (!isRunning || isDragging) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    addPoint({ x, y });
  };

  const handlePointMouseDown = (event: React.MouseEvent, pointId: string) => {
    event.stopPropagation();
    setIsDragging(pointId);
    
    const rect = event.currentTarget.getBoundingClientRect();
    const point = points.find(p => p.id === pointId);
    if (point) {
      setDragOffset({
        x: event.clientX - rect.left - point.x,
        y: event.clientY - rect.top - point.y
      });
    }
  };

  const handleMouseMove = (event: React.MouseEvent<SVGElement>) => {
    if (!isDragging) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - dragOffset.x;
    const y = event.clientY - rect.top - dragOffset.y;
    
    // Mantener dentro del canvas
    const clampedX = Math.max(10, Math.min(canvasSize.width - 10, x));
    const clampedY = Math.max(10, Math.min(canvasSize.height - 10, y));
    
    movePoint(isDragging, clampedX, clampedY);
  };

  const handleMouseUp = () => {
    setIsDragging(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleRunClustering = () => {
    if (points.length === 0) {
      setNotification({
        type: 'error',
        message: 'Agrega algunos puntos antes de ejecutar clustering'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    runClustering(clusterCount);
  };

  const getStepDescription = (step: string): string => {
    switch (step) {
      case 'waiting': return 'Esperando inicio del script';
      case 'started': return 'Script iniciado - Agrega puntos haciendo clic';
      case 'clustering-running': return 'Ejecutando algoritmo de clustering...';
      case 'clustering-complete': return 'Clustering completado - ¡Observa los grupos formados!';
      default: return 'Script en progreso';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Scripts Interactivos
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Demostraciones interactivas de Machine Learning donde la audiencia puede participar en tiempo real
        </p>
      </motion.div>

      {/* Panel de Estado */}
      <motion.div
        className="bg-white rounded-lg shadow-md p-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Estado del Sistema</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
              connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <div className="text-sm font-medium">Conexión</div>
            <div className="text-xs text-gray-600">{connectionStatus}</div>
          </div>
          <div className="text-center">
            <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
              isRunning ? 'bg-green-500' : 'bg-gray-400'
            }`}></div>
            <div className="text-sm font-medium">Script</div>
            <div className="text-xs text-gray-600">{isRunning ? 'Activo' : 'Inactivo'}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{points.length}</div>
            <div className="text-sm font-medium">Puntos</div>
            <div className="text-xs text-gray-600">En canvas</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{clusters.length}</div>
            <div className="text-sm font-medium">Clusters</div>
            <div className="text-xs text-gray-600">Identificados</div>
          </div>
        </div>
        {currentStep && currentStep !== 'waiting' && (
          <div className="mt-3 text-center">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {getStepDescription(currentStep)}
            </span>
          </div>
        )}
      </motion.div>

      {/* Selector de Script */}
      <motion.div 
        className="flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Script:
          </label>
          <select
            value={selectedScript}
            onChange={(e) => setSelectedScript(e.target.value)}
            disabled={isRunning}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          >
            {availableScripts.map((script) => (
              <option key={script.id} value={script.id}>
                {script.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {availableScripts.find(s => s.id === selectedScript)?.description}
          </p>
        </div>
      </motion.div>

      {/* Controles */}
      <motion.div 
        className="flex flex-wrap justify-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <motion.button
          onClick={handleStartScript}
          disabled={isRunning || !selectedScript}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
            isRunning || !selectedScript
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105'
          }`}
          whileHover={!isRunning && selectedScript ? { scale: 1.05 } : {}}
          whileTap={!isRunning && selectedScript ? { scale: 0.95 } : {}}
        >
          <Play className="h-5 w-5" />
          <span>Iniciar Script</span>
        </motion.button>

        <motion.button
          onClick={handleStopScript}
          disabled={!isRunning}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
            !isRunning
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:scale-105'
          }`}
          whileHover={isRunning ? { scale: 1.05 } : {}}
          whileTap={isRunning ? { scale: 0.95 } : {}}
        >
          <Square className="h-5 w-5" />
          <span>Detener</span>
        </motion.button>

        <motion.button
          onClick={handleReset}
          className="flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RotateCcw className="h-5 w-5" />
          <span>Reiniciar</span>
        </motion.button>
      </motion.div>

      {/* Canvas Interactivo */}
      {isRunning && (
        <motion.div 
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Brain className="h-5 w-5 text-blue-600 mr-2" />
                Canvas Interactivo
              </h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Clusters:</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={clusterCount}
                    onChange={(e) => setClusterCount(parseInt(e.target.value) || 3)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <button
                  onClick={handleRunClustering}
                  disabled={points.length === 0}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium ${
                    points.length === 0
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  <span>Clustering</span>
                </button>
                <button
                  onClick={clearPoints}
                  className="flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Limpiar</span>
                </button>
              </div>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg">
              <svg
                width={canvasSize.width}
                height={canvasSize.height}
                className="cursor-crosshair"
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Grid de fondo */}
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* Clusters (círculos de área) */}
                {clusters.map((cluster) => (
                  <g key={`cluster-${cluster.id}`}>
                    <circle
                      cx={cluster.centroid.x}
                      cy={cluster.centroid.y}
                      r="50"
                      fill={cluster.color}
                      fillOpacity="0.1"
                      stroke={cluster.color}
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                    <circle
                      cx={cluster.centroid.x}
                      cy={cluster.centroid.y}
                      r="8"
                      fill={cluster.color}
                      stroke="white"
                      strokeWidth="2"
                    />
                    <text
                      x={cluster.centroid.x}
                      y={cluster.centroid.y - 60}
                      textAnchor="middle"
                      className="text-sm font-medium fill-gray-700"
                    >
                      Cluster {cluster.id + 1} ({cluster.points.length} puntos)
                    </text>
                  </g>
                ))}
                
                {/* Puntos */}
                {points.map((point) => (
                  <circle
                    key={point.id}
                    cx={point.x}
                    cy={point.y}
                    r="6"
                    fill={point.color || '#3B82F6'}
                    stroke="white"
                    strokeWidth="2"
                    className="cursor-move hover:r-8 transition-all"
                    onMouseDown={(e) => handlePointMouseDown(e, point.id)}
                  />
                ))}
                
                {/* Instrucciones */}
                {points.length === 0 && (
                  <text
                    x={canvasSize.width / 2}
                    y={canvasSize.height / 2}
                    textAnchor="middle"
                    className="text-lg fill-gray-400"
                  >
                    Haz clic para agregar puntos
                  </text>
                )}
              </svg>
            </div>
            
            <div className="mt-4 text-sm text-gray-600 flex items-center">
              <MousePointer className="h-4 w-4 mr-2" />
              Haz clic para agregar puntos, arrastra para moverlos
            </div>
          </div>
        </motion.div>
      )}

      {/* Panel de Explicaciones */}
      {explanations.length > 0 && (
        <motion.div 
          className="bg-blue-50 rounded-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <h4 className="text-lg font-semibold text-blue-900 mb-2">Resultados del Análisis</h4>
          <ul className="space-y-1">
            {explanations.map((explanation, index) => (
              <li key={index} className="text-blue-800 text-sm">
                • {explanation}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Sistema de Notificaciones */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            notification.type === 'success' 
              ? 'bg-green-100 border border-green-400 text-green-700'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}
        >
          <div className="flex items-center">
            <span className="mr-2">
              {notification.type === 'success' ? '✅' : '❌'}
            </span>
            {notification.message}
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default InteractiveScriptsTab;