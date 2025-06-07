import React, { useEffect, useState } from 'react';
import { Monitor, Play, Pause, Palette, User, Smartphone, RotateCcw } from 'lucide-react';
import { useCanvasInteractivosStore } from '../../store/canvasInteractivosStore';
import ClasificadorCanvas from '../canvas/ClasificadorCanvas';
import MapaPatronesCanvas from '../canvas/MapaPatronesCanvas';
import MachineLearningCanvas from '../canvas/MachineLearningCanvas';
import RedCriminalCanvas from '../canvas/RedCriminalCanvas';
import AnomaliaFinancieraCanvas from '../canvas/AnomaliaFinancieraCanvas';
import VerificadorEvidenciaCanvas from '../canvas/VerificadorEvidenciaCanvas';

interface CanvasInteractivosAudienceViewProps {
  socket?: any;
}

const CanvasInteractivosAudienceView: React.FC<CanvasInteractivosAudienceViewProps> = () => {
  const {
    connectionStatus,
    activeCanvas,
    availableCanvas,
    isRunning,
    currentUserInstance,
    currentStep,
    explanations,
    initializeSocket,
    createUserInstance,
    updateUserInstance
  } = useCanvasInteractivosStore();

  const [userId] = useState(() => `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [canvasState, setCanvasState] = useState<any>({});
  const [showMobileHint, setShowMobileHint] = useState(false);

  // Detectar si es móvil y orientación
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth <= 768;
      const isPortrait = window.innerHeight > window.innerWidth;
      setShowMobileHint(isMobile && isPortrait);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', () => {
      setTimeout(checkMobile, 100); // Delay para que la orientación se actualice
    });

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  useEffect(() => {
    initializeSocket();
  }, [initializeSocket]);

  // Crear instancia de usuario cuando se recibe un canvas
  useEffect(() => {
    if (activeCanvas && isRunning && !currentUserInstance) {
      createUserInstance(userId, activeCanvas);
    }
  }, [activeCanvas, isRunning, currentUserInstance, userId, createUserInstance]);

  const handleCanvasStateChange = (state: any) => {
    setCanvasState(state);
    if (currentUserInstance) {
      updateUserInstance(userId, state);
    }
  };

  const getStepTitle = (step: string): string => {
    switch (step) {
      case 'waiting': return 'Canvas Interactivos';
      case 'canvas-sent': return 'Canvas Recibido';
      case 'started': return 'Interacción Iniciada';
      default: return 'Canvas en Progreso';
    }
  };

  const getStepDescription = (step: string): string => {
    switch (step) {
      case 'waiting': return 'Esperando que el presentador envíe un canvas interactivo';
      case 'canvas-sent': return 'El presentador ha enviado un canvas - ¡Puedes interactuar con él!';
      case 'started': return 'Interactúa con el canvas - tus cambios son independientes de otros participantes';
      default: return 'Canvas en progreso...';
    }
  };

  const getActiveCanvasInfo = () => {
    return availableCanvas.find(canvas => canvas.id === activeCanvas);
  };

  const renderCanvas = () => {
    const canvasInfo = getActiveCanvasInfo();
    if (!canvasInfo) return null;

    const commonProps = {
      onStateChange: handleCanvasStateChange,
      initialState: canvasState,
      isInteractive: true
    };

    switch (canvasInfo.component) {
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
        return (
          <div className="text-center py-16">
            <Monitor className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Canvas no disponible</p>
          </div>
        );
    }
  };

  if (connectionStatus === 'connecting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Conectando a Canvas Interactivos...</p>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'disconnected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Conexión perdida con el servidor
          </div>
          <p className="text-gray-600">Intentando reconectar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Recomendación para móviles */}
      {showMobileHint && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Smartphone className="h-5 w-5 mr-2 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">¡Mejor experiencia en horizontal!</p>
                <p className="text-xs opacity-90">Gira tu teléfono para ver mejor el canvas</p>
              </div>
            </div>
            <RotateCcw className="h-6 w-6 animate-pulse" />
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4">
        {isRunning && activeCanvas ? (
          <div className="space-y-2 sm:space-y-4">
            {/* Header compacto con información esencial - Responsive */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 border border-white/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                    <Monitor className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                      {getActiveCanvasInfo()?.name || 'Canvas Interactivo'}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                      {getActiveCanvasInfo()?.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                  {/* Indicador de instancia personal */}
                  <div className="flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm bg-purple-100 text-purple-800 border border-purple-200">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Tu instancia</span>
                    <span className="sm:hidden">Personal</span>
                  </div>
                  
                  {/* Estado del canvas */}
                  <div className={`flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border ${
                    isRunning
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    {isRunning ? (
                      <>
                        <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Activo
                      </>
                    ) : (
                      <>
                        <Pause className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Esperando
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Instrucciones compactas - Responsive */}
              <div className="mt-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-2 sm:p-3 border border-purple-100">
                <div className="flex items-start">
                  <Palette className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-purple-800">
                    <span className="font-medium">¡Canvas personal!</span>
                    <span className="hidden sm:inline"> Interactúa libremente - tus cambios son independientes de otros participantes.</span>
                    <span className="sm:hidden"> Interactúa libremente.</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Canvas Interactivo - Más prominente y responsive */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-xl overflow-hidden border border-gray-100">
              <div className="w-full overflow-x-auto">
                {renderCanvas()}
              </div>
            </div>

            {/* Panel de Información Adicional - Más compacto y responsive */}
            {explanations.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-100">
                <h4 className="text-sm sm:text-base font-semibold text-blue-900 mb-2 flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Información Adicional
                </h4>
                <ul className="space-y-1">
                  {explanations.map((explanation, index) => (
                    <li key={index} className="text-blue-800 text-xs sm:text-sm flex items-start">
                      <span className="text-blue-400 mr-2 flex-shrink-0">•</span>
                      <span className="break-words">{explanation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          /* Vista de espera mejorada y responsive */
          <div className="text-center py-6 sm:py-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8 max-w-3xl mx-auto border border-white/20">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-3 sm:p-4 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                <Palette className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              
              <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
                Canvas Interactivos
              </h2>
              <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-lg px-2">
                Esperando que el presentador envíe un canvas interactivo de Machine Learning
              </p>
              
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg sm:rounded-xl p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-purple-900 mb-3 sm:mb-4">
                  ¿Qué verás en esta demostración?
                </h3>
                <ul className="text-purple-800 text-left space-y-2 sm:space-y-3 max-w-lg mx-auto">
                  <li className="flex items-start">
                    <span className="bg-purple-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs mr-2 sm:mr-3 mt-0.5 flex-shrink-0">1</span>
                    <span className="text-xs sm:text-sm">Canvas interactivos de Machine Learning en tiempo real</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-purple-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs mr-2 sm:mr-3 mt-0.5 flex-shrink-0">2</span>
                    <span className="text-xs sm:text-sm">Tu propia instancia personal para experimentar</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-purple-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs mr-2 sm:mr-3 mt-0.5 flex-shrink-0">3</span>
                    <span className="text-xs sm:text-sm">Controles y visualizaciones que puedes manipular</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-purple-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs mr-2 sm:mr-3 mt-0.5 flex-shrink-0">4</span>
                    <span className="text-xs sm:text-sm">Explicaciones paso a paso de los conceptos</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-purple-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs mr-2 sm:mr-3 mt-0.5 flex-shrink-0">5</span>
                    <span className="text-xs sm:text-sm">Independencia total de otros participantes</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Información sobre canvas disponibles - Mejorada y responsive */}
            {availableCanvas.length > 0 && (
              <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
                {availableCanvas.map((canvas) => (
                  <div key={canvas.id} className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg border border-white/20 hover:shadow-xl transition-shadow">
                    <div className="flex items-center mb-2 sm:mb-3">
                      <div className={`p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 flex-shrink-0 ${
                        canvas.type === 'clasificador'
                          ? 'bg-blue-100 text-blue-600'
                          : canvas.type === 'mapa-patrones'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-purple-100 text-purple-600'
                      }`}>
                        <Monitor className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base truncate">{canvas.name}</h4>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">{canvas.description}</p>
                    <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                      canvas.type === 'clasificador'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : canvas.type === 'mapa-patrones'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-purple-100 text-purple-800 border border-purple-200'
                    }`}>
                      {canvas.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasInteractivosAudienceView;