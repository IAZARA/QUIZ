import React, { useEffect, useState } from 'react';
import { Brain, Play, Pause, Zap, MousePointer } from 'lucide-react';
import { useInteractiveScriptsStore, Point, Cluster } from '../../store/interactiveScriptsStore';

interface InteractiveScriptsAudienceViewProps {
  socket: any;
}

const InteractiveScriptsAudienceView: React.FC<InteractiveScriptsAudienceViewProps> = ({ socket }) => {
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
    initializeSocket
  } = useInteractiveScriptsStore();

  const [animationStep, setAnimationStep] = useState<number>(0);

  useEffect(() => {
    initializeSocket();
  }, [initializeSocket]);

  // Animación de clustering
  useEffect(() => {
    if (currentStep === 'clustering-running') {
      const interval = setInterval(() => {
        setAnimationStep(prev => (prev + 1) % 4);
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [currentStep]);

  const getStepTitle = (step: string): string => {
    switch (step) {
      case 'waiting': return 'Scripts Interactivos';
      case 'started': return 'Demostración Iniciada';
      case 'clustering-running': return 'Analizando Patrones...';
      case 'clustering-complete': return 'Análisis Completado';
      default: return 'Script en Progreso';
    }
  };

  const getStepDescription = (step: string): string => {
    switch (step) {
      case 'waiting': return 'Esperando que el presentador inicie una demostración interactiva';
      case 'started': return 'El presentador está agregando puntos de datos en tiempo real';
      case 'clustering-running': return 'El algoritmo está identificando grupos y patrones automáticamente';
      case 'clustering-complete': return 'Observa cómo se han formado los grupos de datos';
      default: return 'Demostración en progreso...';
    }
  };

  const getActiveScriptInfo = () => {
    return availableScripts.find(script => script.id === activeScript);
  };

  if (connectionStatus === 'connecting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Conectando a Scripts Interactivos...</p>
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {getStepTitle(currentStep)}
                </h1>
                <p className="text-sm text-gray-500">
                  {getStepDescription(currentStep)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
                isRunning
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {isRunning ? (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    En vivo
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-1" />
                    Esperando
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isRunning ? (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Canvas Principal */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Brain className="h-5 w-5 text-blue-600 mr-2" />
                    {getActiveScriptInfo()?.name || 'Demostración Interactiva'}
                  </h3>
                  {currentStep === 'clustering-running' && (
                    <div className="flex items-center text-blue-600">
                      <Zap className="h-4 w-4 mr-1 animate-pulse" />
                      <span className="text-sm">Procesando...</span>
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <svg
                    width={canvasSize.width}
                    height={canvasSize.height}
                    className="mx-auto border border-gray-200 rounded bg-white"
                    viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
                  >
                    {/* Grid de fondo */}
                    <defs>
                      <pattern id="audience-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f8f9fa" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#audience-grid)" />
                    
                    {/* Clusters con animación */}
                    {clusters.map((cluster, index) => (
                      <g key={`cluster-${cluster.id}`}>
                        {/* Área del cluster */}
                        <circle
                          cx={cluster.centroid.x}
                          cy={cluster.centroid.y}
                          r="50"
                          fill={cluster.color}
                          fillOpacity="0.15"
                          stroke={cluster.color}
                          strokeWidth="2"
                          strokeDasharray="5,5"
                          className={currentStep === 'clustering-complete' ? 'animate-pulse' : ''}
                        />
                        
                        {/* Centroide */}
                        <circle
                          cx={cluster.centroid.x}
                          cy={cluster.centroid.y}
                          r={currentStep === 'clustering-running' ? 6 + animationStep : 8}
                          fill={cluster.color}
                          stroke="white"
                          strokeWidth="3"
                          className="transition-all duration-300"
                        />
                        
                        {/* Etiqueta del cluster */}
                        <text
                          x={cluster.centroid.x}
                          y={cluster.centroid.y - 60}
                          textAnchor="middle"
                          className="text-sm font-medium fill-gray-700"
                        >
                          Grupo {cluster.id + 1}
                        </text>
                        
                        {/* Contador de puntos */}
                        <text
                          x={cluster.centroid.x}
                          y={cluster.centroid.y - 45}
                          textAnchor="middle"
                          className="text-xs fill-gray-500"
                        >
                          {cluster.points.length} elementos
                        </text>
                      </g>
                    ))}
                    
                    {/* Puntos con animación */}
                    {points.map((point, index) => (
                      <g key={point.id}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={currentStep === 'clustering-running' ? 4 + Math.sin(animationStep + index) : 6}
                          fill={point.color || '#3B82F6'}
                          stroke="white"
                          strokeWidth="2"
                          className="transition-all duration-300"
                        />
                        
                        {/* Efecto de aparición para puntos nuevos */}
                        {currentStep === 'started' && (
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r="15"
                            fill={point.color || '#3B82F6'}
                            fillOpacity="0.3"
                            className="animate-ping"
                          />
                        )}
                      </g>
                    ))}
                    
                    {/* Mensaje cuando no hay puntos */}
                    {points.length === 0 && (
                      <text
                        x={canvasSize.width / 2}
                        y={canvasSize.height / 2}
                        textAnchor="middle"
                        className="text-lg fill-gray-400"
                      >
                        El presentador agregará puntos de datos aquí
                      </text>
                    )}
                    
                    {/* Indicador de clustering en progreso */}
                    {currentStep === 'clustering-running' && (
                      <text
                        x={canvasSize.width / 2}
                        y={30}
                        textAnchor="middle"
                        className="text-lg font-semibold fill-blue-600 animate-pulse"
                      >
                        Analizando patrones...
                      </text>
                    )}
                  </svg>
                </div>
                
                {/* Instrucciones para la audiencia */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start">
                    <MousePointer className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800 font-medium">
                        {currentStep === 'started' && 'Observa cómo el presentador agrega puntos de datos'}
                        {currentStep === 'clustering-running' && 'El algoritmo está identificando grupos automáticamente'}
                        {currentStep === 'clustering-complete' && 'Análisis completado - ¡Mira los grupos formados!'}
                        {currentStep === 'waiting' && 'Esperando que inicie la demostración'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel de Información */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Información en Tiempo Real
                </h3>
                
                {/* Estadísticas */}
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">{points.length}</div>
                    <div className="text-sm text-blue-800">Puntos de Datos</div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">{clusters.length}</div>
                    <div className="text-sm text-green-800">Grupos Identificados</div>
                  </div>
                  
                  {clusters.length > 0 && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round(points.length / clusters.length * 10) / 10}
                      </div>
                      <div className="text-sm text-purple-800">Promedio por Grupo</div>
                    </div>
                  )}
                </div>
                
                {/* Explicaciones */}
                {explanations.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-2">Resultados</h4>
                    <div className="space-y-2">
                      {explanations.map((explanation, index) => (
                        <div key={index} className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                          {explanation}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Información del script */}
                {getActiveScriptInfo() && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-2">Sobre esta Demostración</h4>
                    <p className="text-sm text-gray-600">
                      {getActiveScriptInfo()?.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Vista de espera */
          <div className="text-center py-16">
            <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Scripts Interactivos
            </h2>
            <p className="text-gray-600 mb-8">
              Esperando que el presentador inicie una demostración interactiva de Machine Learning
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                ¿Qué verás en esta demostración?
              </h3>
              <ul className="text-blue-800 text-left space-y-2">
                <li>• Puntos de datos agregados en tiempo real</li>
                <li>• Algoritmos de clustering ejecutándose automáticamente</li>
                <li>• Formación de grupos y patrones visuales</li>
                <li>• Explicaciones paso a paso del proceso</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveScriptsAudienceView;