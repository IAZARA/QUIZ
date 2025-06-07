import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, RotateCcw, Monitor, Eye, Send, Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCanvasInteractivosStore, Canvas } from '../../store/canvasInteractivosStore';
import ClasificadorCanvas from '../canvas/ClasificadorCanvas';
import MapaPatronesCanvas from '../canvas/MapaPatronesCanvas';
import MachineLearningCanvas from '../canvas/MachineLearningCanvas';
import RedCriminalCanvas from '../canvas/RedCriminalCanvas';
import AnomaliaFinancieraCanvas from '../canvas/AnomaliaFinancieraCanvas';
import VerificadorEvidenciaCanvas from '../canvas/VerificadorEvidenciaCanvas';

interface CanvasInteractivosTabProps {
  socket?: any;
}

const CanvasInteractivosTab: React.FC<CanvasInteractivosTabProps> = () => {
  const { t } = useTranslation();
  const {
    connectionStatus,
    activeCanvas,
    availableCanvas,
    isRunning,
    currentStep,
    explanations,
    initializeSocket,
    setActiveCanvas,
    sendCanvasToAudience,
    stopCanvas,
    resetState
  } = useCanvasInteractivosStore();

  const [selectedCanvas, setSelectedCanvas] = useState<string>('');
  const [previewCanvas, setPreviewCanvas] = useState<string>('');
  const [canvasParams, setCanvasParams] = useState<any>({});
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    initializeSocket();
    return () => {
      // Socket se maneja en el store
    };
  }, [initializeSocket]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSelectCanvas = (canvasId: string) => {
    setSelectedCanvas(canvasId);
    setPreviewCanvas(canvasId);
    const canvas = availableCanvas.find(c => c.id === canvasId);
    if (canvas?.defaultParams) {
      setCanvasParams(canvas.defaultParams);
    }
  };

  const handleSendToAudience = () => {
    if (!selectedCanvas) {
      showNotification('error', 'Selecciona un canvas primero');
      return;
    }
    
    sendCanvasToAudience(selectedCanvas, canvasParams);
    showNotification('success', 'Canvas enviado a la audiencia');
  };

  const handleStopCanvas = () => {
    stopCanvas();
    showNotification('success', 'Canvas detenido');
  };

  const handleReset = () => {
    resetState();
    setSelectedCanvas('');
    setPreviewCanvas('');
    setCanvasParams({});
  };

  const renderCanvasPreview = (canvasId: string) => {
    const canvas = availableCanvas.find(c => c.id === canvasId);
    if (!canvas) return null;

    const commonProps = {
      onStateChange: (state: any) => setCanvasParams((prev: any) => ({ ...prev, ...state })),
      initialState: canvasParams,
      isInteractive: true
    };

    switch (canvas.component) {
      case 'ClasificadorCanvas':
        return <ClasificadorCanvas {...commonProps} />;
      case 'MapaPatronesCanvas':
        return <MapaPatronesCanvas {...commonProps} />;
      case 'MachineLearningCanvas':
        return <MachineLearningCanvas {...commonProps} />;
      case 'RedCriminalCanvas':
        return <RedCriminalCanvas {...commonProps} />;
      case 'AnomaliaFinancieraCanvas':
        return <AnomaliaFinancieraCanvas {...commonProps} />;
      case 'VerificadorEvidenciaCanvas':
        return <VerificadorEvidenciaCanvas {...commonProps} />;
      default:
        return <div className="text-center text-gray-500">Canvas no encontrado</div>;
    }
  };

  const getCanvasThumbnail = (canvas: Canvas) => {
    // Por ahora usamos un gradiente como placeholder
    const gradients = {
      'clasificador-actividad': 'from-blue-400 to-purple-600',
      'mapa-patrones-robos': 'from-green-400 to-blue-600',
      'machine-learning-dibujo': 'from-purple-400 to-pink-600',
      'red-criminal': 'from-red-400 to-orange-600',
      'anomalia-financiera': 'from-green-400 to-yellow-600',
      'verificador-evidencia': 'from-cyan-400 to-blue-600'
    };
    
    return gradients[canvas.id as keyof typeof gradients] || 'from-gray-400 to-gray-600';
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
          Canvas Interactivos
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Selecciona y envía demostraciones interactivas de Machine Learning donde cada participante de la audiencia puede interactuar individualmente
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
            <div className="text-sm font-medium">Canvas</div>
            <div className="text-xs text-gray-600">{isRunning ? 'Activo' : 'Inactivo'}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{selectedCanvas ? '1' : '0'}</div>
            <div className="text-sm font-medium">Seleccionado</div>
            <div className="text-xs text-gray-600">Canvas</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{availableCanvas.length}</div>
            <div className="text-sm font-medium">Disponibles</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
        </div>
        {currentStep && currentStep !== 'waiting' && (
          <div className="mt-3 text-center">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Estado: {currentStep}
            </span>
          </div>
        )}
      </motion.div>

      {/* Selector de Canvas tipo "Casette" */}
      <motion.div 
        className="bg-white rounded-lg shadow-md p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Palette className="h-6 w-6 text-purple-600 mr-2" />
          Seleccionar Canvas
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableCanvas.map((canvas) => (
            <motion.div
              key={canvas.id}
              className={`relative bg-gradient-to-br ${getCanvasThumbnail(canvas)} rounded-xl p-1 cursor-pointer transition-all duration-300 ${
                selectedCanvas === canvas.id 
                  ? 'ring-4 ring-blue-500 shadow-xl scale-105' 
                  : 'hover:shadow-lg hover:scale-102'
              }`}
              onClick={() => handleSelectCanvas(canvas.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="bg-white rounded-lg p-4 h-full">
                {/* Miniatura del canvas */}
                <div className={`w-full h-32 bg-gradient-to-br ${getCanvasThumbnail(canvas)} rounded-lg mb-3 flex items-center justify-center`}>
                  <Monitor className="h-12 w-12 text-white opacity-80" />
                </div>
                
                {/* Información del canvas */}
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                  {canvas.name}
                </h4>
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {canvas.description}
                </p>
                
                {/* Badge del tipo */}
                <div className="flex justify-between items-center">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    canvas.type === 'clasificador' 
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {canvas.type}
                  </span>
                  
                  {selectedCanvas === canvas.id && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Controles Principales */}
      <motion.div 
        className="flex flex-wrap justify-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <motion.button
          onClick={() => setPreviewCanvas(selectedCanvas)}
          disabled={!selectedCanvas}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
            !selectedCanvas
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105'
          }`}
          whileHover={selectedCanvas ? { scale: 1.05 } : {}}
          whileTap={selectedCanvas ? { scale: 0.95 } : {}}
        >
          <Eye className="h-5 w-5" />
          <span>Previsualizar</span>
        </motion.button>

        <motion.button
          onClick={handleSendToAudience}
          disabled={!selectedCanvas || isRunning}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
            !selectedCanvas || isRunning
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105'
          }`}
          whileHover={selectedCanvas && !isRunning ? { scale: 1.05 } : {}}
          whileTap={selectedCanvas && !isRunning ? { scale: 0.95 } : {}}
        >
          <Send className="h-5 w-5" />
          <span>Enviar a Audiencia</span>
        </motion.button>

        <motion.button
          onClick={handleStopCanvas}
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
          className="flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 shadow-lg hover:shadow-xl transform hover:scale-105"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RotateCcw className="h-5 w-5" />
          <span>Reiniciar</span>
        </motion.button>
      </motion.div>

      {/* Área de Previsualización */}
      {previewCanvas && (
        <motion.div 
          className="bg-gray-50 rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Eye className="h-5 w-5 text-purple-600 mr-2" />
                Previsualización: {availableCanvas.find(c => c.id === previewCanvas)?.name}
              </h3>
              <button
                onClick={() => setPreviewCanvas('')}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {renderCanvasPreview(previewCanvas)}
          </div>
        </motion.div>
      )}

      {/* Panel de Información */}
      {isRunning && (
        <motion.div 
          className="bg-blue-50 rounded-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <h4 className="text-lg font-semibold text-blue-900 mb-2">Canvas Activo</h4>
          <p className="text-blue-800 mb-2">
            Canvas "{availableCanvas.find(c => c.id === activeCanvas)?.name}" está siendo mostrado a la audiencia.
          </p>
          <p className="text-sm text-blue-700">
            Cada participante tiene su propia instancia interactiva del canvas.
          </p>
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

export default CanvasInteractivosTab;