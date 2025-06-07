import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface MapaPatronesCanvasProps {
  onStateChange?: (state: any) => void;
  initialState?: any;
  isInteractive?: boolean;
}

interface DataPoint {
  x: number;
  y: number;
}

const MapaPatronesCanvas: React.FC<MapaPatronesCanvasProps> = ({ 
  onStateChange, 
  initialState = { clusterCount: 3, showTraining: true },
  isInteractive = true 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [slope, setSlope] = useState<number>(0);
  const [intercept, setIntercept] = useState<number>(0);
  const [clusterCount, setClusterCount] = useState(initialState.clusterCount || 3);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [trainingStatus, setTrainingStatus] = useState<string>('');
  const [predictionResult, setPredictionResult] = useState<string>('');
  const [predictX, setPredictX] = useState<string>('');

  const learningRate = 0.001;
  const iterations = 5000;
  const canvasSize = { width: 800, height: 400 };
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const width = canvasSize.width - margin.left - margin.right;
  const height = canvasSize.height - margin.top - margin.bottom;

  // Pasos de explicación
  const steps = [
    {
      title: "Introducción al Machine Learning",
      description: "El **Machine Learning (ML)** permite a las máquinas aprender de datos para encontrar patrones. Hoy, veremos cómo puede ayudar a entender la 'actividad' de robos según la hora del día en una ubicación de Neuquén.",
      uiVisibility: { add: false, train: false, predict: false, graphClick: false, prevBtn: false },
    },
    {
      title: "El Problema: Entender los Patrones",
      description: "Imagina que queremos saber, ¿a qué horas hay **más robos** en una zona? O, ¿a qué horas hay **menos**? Esto es vital para asignar recursos de seguridad de forma efectiva.",
      uiVisibility: { add: false, train: false, predict: false, graphClick: false, prevBtn: true },
    },
    {
      title: "Datos Históricos: Nuestra Base",
      description: "Para que una máquina aprenda, necesita **datos**. Aquí, cada punto representa una **hora del día (Eje X)** y la **cantidad de incidentes/robos registrados (Eje Y)** en esa hora en el pasado. ¡Vamos a agregar algunos!",
      uiVisibility: { add: true, train: false, predict: false, graphClick: true, prevBtn: true },
    },
    {
      title: "Explora y Agrega Más Datos",
      description: "Observa los puntos en el gráfico. ¿Ves alguna **tendencia**? Puedes agregar más datos haciendo clic en el gráfico o usando los campos de entrada. Intenta simular un aumento o disminución de incidentes en ciertas horas.",
      uiVisibility: { add: true, train: false, predict: false, graphClick: true, prevBtn: true },
    },
    {
      title: "El Objetivo: Deducir la Tendencia",
      description: "El modelo de Machine Learning buscará una **línea** que represente la 'mejor deducción' de la relación entre la hora y la cantidad de incidentes. Esta línea será nuestra **'predicción'** de la tendencia.",
      uiVisibility: { add: true, train: false, predict: false, graphClick: false, prevBtn: true },
    },
    {
      title: "¡Momento de Aprender!",
      description: "Ahora, el modelo se va a **'entrenar'**. Esto significa que ajustará esa línea, iteración tras iteración, para que se acerque lo más posible a todos los datos históricos, minimizando el **'error'** de su deducción.",
      uiVisibility: { add: true, train: true, predict: false, graphClick: false, prevBtn: true },
    },
    {
      title: "La Máquina ha Deducido el Patrón",
      description: "¡Listo! El modelo ha **entrenado**. La línea que ves es la **'deducción'** que hizo la máquina sobre la relación entre la hora y la cantidad de incidentes. ¡Ha aprendido el patrón!",
      uiVisibility: { add: true, train: true, predict: true, graphClick: false, prevBtn: true },
    },
    {
      title: "Usemos la Deducción para Predecir",
      description: "Con el patrón deducido, podemos preguntarle al modelo: 'Si es tal hora, ¿cuántos incidentes se esperaría?'. Ingresa una hora y el modelo hará su predicción basada en lo que aprendió.",
      uiVisibility: { add: true, train: true, predict: true, graphClick: false, prevBtn: true },
    },
    {
      title: "Aplicaciones Reales del ML",
      description: "Así es como el ML puede deducir tendencias y patrones complejos en datos. En la vida real, esto ayuda a tomar decisiones informadas, como dónde y cuándo desplegar más policías o qué áreas necesitan más iluminación.",
      uiVisibility: { add: true, train: true, predict: true, graphClick: false, prevBtn: true },
    }
  ];

  // Escala para convertir coordenadas
  const xScale = (x: number) => (x / 24) * width;
  const yScale = (y: number) => height - (y / 100) * height;
  const xScaleInvert = (x: number) => (x / width) * 24;
  const yScaleInvert = (y: number) => ((height - y) / height) * 100;

  // Escala de color para los puntos
  const getPointColor = (y: number) => {
    if (y <= 30) return "#a8dadc";
    if (y <= 70) return "#fcd34d";
    if (y <= 90) return "#fca5a5";
    return "#ef4444";
  };

  const initializeData = () => {
    const initialData = [
      { x: 2, y: 10 }, { x: 5, y: 5 }, { x: 8, y: 15 },
      { x: 12, y: 30 }, { x: 15, y: 40 }, { x: 18, y: 70 },
      { x: 20, y: 90 }, { x: 22, y: 85 }, { x: 23, y: 75 }
    ];
    setDataPoints(initialData);
  };

  const addPoint = (x: number, y: number) => {
    if (!isInteractive || !steps[currentStep]?.uiVisibility.graphClick) return;
    
    if (x >= 0 && x < 24 && y >= 0 && y <= 100) {
      const newPoints = [...dataPoints, { x, y }];
      setDataPoints(newPoints);
      notifyStateChange({ dataPoints: newPoints });
    }
  };

  const clearPoints = () => {
    if (!isInteractive) return;
    setDataPoints([]);
    setSlope(0);
    setIntercept(0);
    setTrainingStatus('');
    setPredictionResult('');
    notifyStateChange({ dataPoints: [], slope: 0, intercept: 0 });
  };

  const trainModel = () => {
    if (!isInteractive || dataPoints.length < 2) {
      setTrainingStatus('Necesitas al menos 2 puntos para entrenar el modelo.');
      return;
    }

    setTrainingStatus('Entrenando...');
    
    let newSlope = slope === 0 ? (Math.random() * 5) - 2.5 : slope;
    let newIntercept = intercept === 0 ? Math.random() * 50 - 25 : intercept;

    // Algoritmo de descenso de gradiente
    for (let i = 0; i < iterations; i++) {
      let sumErrorSlope = 0;
      let sumErrorIntercept = 0;

      for (let j = 0; j < dataPoints.length; j++) {
        const x = dataPoints[j].x;
        const y = dataPoints[j].y;
        const predictedY = newSlope * x + newIntercept;
        const error = predictedY - y;

        sumErrorSlope += error * x;
        sumErrorIntercept += error;
      }

      newSlope -= (learningRate / dataPoints.length) * sumErrorSlope;
      newIntercept -= (learningRate / dataPoints.length) * sumErrorIntercept;
    }

    setSlope(newSlope);
    setIntercept(newIntercept);
    setTrainingStatus(`Entrenamiento completado. Línea deducida: Incidentes = ${newSlope.toFixed(2)} * Hora + ${newIntercept.toFixed(2)}`);
    
    notifyStateChange({ 
      slope: newSlope, 
      intercept: newIntercept, 
      trainingStatus: 'completed' 
    });
  };

  const predict = () => {
    if (!isInteractive || dataPoints.length < 2) {
      setPredictionResult('Entrena el modelo primero.');
      return;
    }
    
    const predictXInput = parseFloat(predictX);
    if (isNaN(predictXInput) || predictXInput < 0 || predictXInput >= 24) {
      setPredictionResult('Por favor, ingresa una hora válida (0-23).');
      return;
    }

    const predictedY = slope * predictXInput + intercept;
    const clampedPredictedY = Math.max(0, Math.min(100, predictedY));

    setPredictionResult(`Para la Hora ${predictXInput.toFixed(1)}, se deducen: ${clampedPredictedY.toFixed(0)} incidentes.`);
    
    notifyStateChange({ 
      prediction: { x: predictXInput, y: clampedPredictedY } 
    });
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      
      // Ejecutar acciones específicas del paso
      if (newStep === 2) {
        initializeData();
      } else if (newStep === 6) {
        trainModel();
      }
      
      notifyStateChange({ currentStep: newStep });
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      notifyStateChange({ currentStep: newStep });
    }
  };

  const notifyStateChange = (state: any) => {
    if (onStateChange) {
      onStateChange({
        dataPoints,
        slope,
        intercept,
        clusterCount,
        currentStep,
        trainingStatus,
        predictionResult,
        ...state
      });
    }
  };

  const handleSvgClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!isInteractive || !steps[currentStep]?.uiVisibility.graphClick) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - margin.left;
    const y = event.clientY - rect.top - margin.top;
    
    const dataX = xScaleInvert(x);
    const dataY = yScaleInvert(y);
    
    addPoint(dataX, dataY);
  };

  useEffect(() => {
    if (currentStep === 2) {
      initializeData();
    }
  }, [currentStep]);

  return (
    <motion.div 
      className="bg-white rounded-2xl shadow-xl p-6 max-w-6xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ML: Mapa de Patrones de Robos por Hora
        </h1>
        <p className="text-lg text-gray-600">
          Demostración interactiva de Machine Learning para entender patrones de robos por hora
        </p>
      </div>

      {/* Panel de explicación */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {steps[currentStep]?.title}
            </h2>
            <p 
              className="text-gray-700"
              dangerouslySetInnerHTML={{ __html: steps[currentStep]?.description || '' }}
            />
          </div>
        </div>
        
        {isInteractive && (
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`px-4 py-2 rounded-lg font-medium ${
                currentStep === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Anterior
            </button>
            <button
              onClick={nextStep}
              disabled={currentStep === steps.length - 1}
              className={`px-4 py-2 rounded-lg font-medium ${
                currentStep === steps.length - 1
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Controles */}
        <div className="space-y-4">
          {/* Agregar puntos */}
          {isInteractive && steps[currentStep]?.uiVisibility.add && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-lg font-bold text-blue-800 mb-3">Agregar Datos de Incidentes</h3>
              <div className="space-y-3">
                <input
                  type="number"
                  placeholder="Hora (0-23)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  step="0.5"
                  min="0"
                  max="23.9"
                />
                <input
                  type="number"
                  placeholder="Nº de Incidentes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  step="1"
                  min="0"
                  max="100"
                />
                <button className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
                  Agregar Dato
                </button>
                <button 
                  onClick={clearPoints}
                  className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
                >
                  Limpiar Datos
                </button>
              </div>
            </div>
          )}

          {/* Entrenamiento */}
          {isInteractive && steps[currentStep]?.uiVisibility.train && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="text-lg font-bold text-green-800 mb-3">Entrenar el Modelo</h3>
              <button 
                onClick={trainModel}
                className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
              >
                Entrenar Modelo
              </button>
              {trainingStatus && (
                <div className="mt-3 text-sm text-gray-700 text-center">
                  {trainingStatus}
                </div>
              )}
            </div>
          )}

          {/* Predicción */}
          {isInteractive && steps[currentStep]?.uiVisibility.predict && (
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h3 className="text-lg font-bold text-purple-800 mb-3">Predecir Incidente por Hora</h3>
              <div className="space-y-3">
                <input
                  type="number"
                  placeholder="Hora para predecir (0-23)"
                  value={predictX}
                  onChange={(e) => setPredictX(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  step="0.5"
                  min="0"
                  max="23.9"
                />
                <button 
                  onClick={predict}
                  className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600"
                >
                  Predecir Cantidad
                </button>
                {predictionResult && (
                  <div className="text-lg font-bold text-gray-800 text-center">
                    {predictionResult}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Gráfico */}
        <div className="lg:col-span-2">
          <div className="bg-gray-50 rounded-lg p-4">
            <svg
              ref={svgRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="border border-gray-200 rounded bg-white cursor-crosshair"
              onClick={handleSvgClick}
            >
              {/* Grid de fondo */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Área del gráfico */}
              <g transform={`translate(${margin.left},${margin.top})`}>
                {/* Ejes */}
                <line x1="0" y1={height} x2={width} y2={height} stroke="#9ca3af" strokeWidth="1" />
                <line x1="0" y1="0" x2="0" y2={height} stroke="#9ca3af" strokeWidth="1" />
                
                {/* Etiquetas de ejes */}
                <text x={width / 2} y={height + 35} textAnchor="middle" className="text-sm fill-gray-700">
                  Hora del Día (0-23)
                </text>
                <text x="-35" y={height / 2} textAnchor="middle" transform={`rotate(-90, -35, ${height / 2})`} className="text-sm fill-gray-700">
                  Cantidad de Incidentes
                </text>
                
                {/* Línea de regresión */}
                {slope !== 0 || intercept !== 0 ? (
                  <line
                    x1="0"
                    y1={yScale(intercept)}
                    x2={width}
                    y2={yScale(slope * 24 + intercept)}
                    stroke="#22C55E"
                    strokeWidth="3"
                    strokeDasharray="5,5"
                  />
                ) : null}
                
                {/* Puntos de datos */}
                {dataPoints.map((point, index) => (
                  <circle
                    key={index}
                    cx={xScale(point.x)}
                    cy={yScale(point.y)}
                    r={5 + (point.y / 20)}
                    fill={getPointColor(point.y)}
                    stroke="#2563EB"
                    strokeWidth="1.5"
                    className="transition-all duration-300"
                  />
                ))}
                
                {/* Mensaje cuando no hay puntos */}
                {dataPoints.length === 0 && (
                  <text x={width / 2} y={height / 2} textAnchor="middle" className="text-lg fill-gray-400">
                    Haz clic para agregar puntos de datos
                  </text>
                )}
              </g>
            </svg>
            
            {steps[currentStep]?.uiVisibility.graphClick && (
              <div className="mt-4 text-sm text-gray-600 flex items-center">
                <span className="mr-2">💡</span>
                Haz clic en el gráfico para agregar datos de incidentes
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MapaPatronesCanvas;