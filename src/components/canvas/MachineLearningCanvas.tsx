import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface MachineLearningCanvasProps {
  onStateChange?: (state: any) => void;
  initialState?: any;
  isInteractive?: boolean;
}

const MachineLearningCanvas: React.FC<MachineLearningCanvasProps> = ({ 
  onStateChange, 
  initialState = { currentPhase: 'training', currentItemIndex: 0 },
  isInteractive = true 
}) => {
  // Refs para el canvas y su contexto 2D
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Estados para el dibujo, predicción y confianza
  const [isDrawing, setIsDrawing] = useState(false);
  const [prediction, setPrediction] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(initialState.currentPhase || 'training');

  // Elementos que el usuario "entrenará" al modelo
  const TRAINING_ITEMS = ["círculo", "cuadrado", "triángulo", "casa", "árbol"];
  const MIN_TRAININGS_PER_ITEM = 3;

  // Estado para rastrear cuántas veces se ha dibujado cada elemento
  const [trainingCounts, setTrainingCounts] = useState(() => {
    const initialCounts: { [key: string]: number } = {};
    TRAINING_ITEMS.forEach(item => {
      initialCounts[item] = 0;
    });
    return initialCounts;
  });

  // Estado para el elemento activo a entrenar
  const [currentItemIndex, setCurrentItemIndex] = useState(initialState.currentItemIndex || 0);
  const currentItemToTrain = TRAINING_ITEMS[currentItemIndex];

  // Helper para verificar si un elemento ha cumplido su requerimiento de entrenamiento
  const isItemTrained = (item: string) => trainingCounts[item] >= MIN_TRAININGS_PER_ITEM;

  // Verificar si todo el entrenamiento está completo
  const allTrainingComplete = TRAINING_ITEMS.every(item => isItemTrained(item));

  // Notificar cambios de estado
  const notifyStateChange = useCallback((state: any) => {
    if (onStateChange) {
      onStateChange({
        currentPhase,
        currentItemIndex,
        trainingCounts,
        prediction,
        confidence,
        allTrainingComplete,
        ...state
      });
    }
  }, [onStateChange, currentPhase, currentItemIndex, trainingCounts, prediction, confidence, allTrainingComplete]);

  // useEffect para inicializar el contexto del canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;

    const context = canvas.getContext("2d");
    if (context) {
      context.scale(window.devicePixelRatio, window.devicePixelRatio);
      context.lineCap = "round";
      context.strokeStyle = "#333";
      context.lineWidth = 5;
      contextRef.current = context;
    }

    // Manejar redimensionamiento del canvas
    const handleResize = () => {
      const currentCanvas = canvasRef.current;
      if (currentCanvas && contextRef.current) {
        const imageData = contextRef.current.getImageData(0, 0, currentCanvas.width, currentCanvas.height);
        currentCanvas.width = currentCanvas.offsetWidth * window.devicePixelRatio;
        currentCanvas.height = currentCanvas.offsetHeight * window.devicePixelRatio;
        const newContext = currentCanvas.getContext("2d");
        if (newContext) {
          newContext.scale(window.devicePixelRatio, window.devicePixelRatio);
          newContext.lineCap = "round";
          newContext.strokeStyle = "#333";
          newContext.lineWidth = 5;
          newContext.putImageData(imageData, 0, 0);
          contextRef.current = newContext;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Función para comenzar a dibujar
  const startDrawing = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isInteractive) return;
    
    // Limpiar predicción solo cuando se comienza una nueva acción de dibujo
    setPrediction("");
    setConfidence(0);

    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    let offsetX: number, offsetY: number;

    if ('touches' in event && event.touches.length > 0) {
      // Evento táctil
      const touch = event.touches[0];
      const rect = canvas.getBoundingClientRect();
      offsetX = touch.clientX - rect.left;
      offsetY = touch.clientY - rect.top;
    } else {
      // Evento de mouse
      const mouseEvent = event as React.MouseEvent<HTMLCanvasElement>;
      offsetX = mouseEvent.nativeEvent.offsetX;
      offsetY = mouseEvent.nativeEvent.offsetY;
    }

    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  }, [isInteractive]);

  // Función para dibujar líneas mientras se mueve
  const draw = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isInteractive) return;

    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    let offsetX: number, offsetY: number;

    if ('touches' in event && event.touches.length > 0) {
      // Evento táctil
      const touch = event.touches[0];
      const rect = canvas.getBoundingClientRect();
      offsetX = touch.clientX - rect.left;
      offsetY = touch.clientY - rect.top;
    } else {
      // Evento de mouse
      const mouseEvent = event as React.MouseEvent<HTMLCanvasElement>;
      offsetX = mouseEvent.nativeEvent.offsetX;
      offsetY = mouseEvent.nativeEvent.offsetY;
    }

    context.lineTo(offsetX, offsetY);
    context.stroke();
  }, [isDrawing, isInteractive]);

  // Función para parar de dibujar
  const stopDrawing = useCallback(() => {
    if (!contextRef.current) return;
    contextRef.current.closePath();
    setIsDrawing(false);
  }, []);

  // Función para limpiar el canvas
  const handleClearCanvas = () => {
    if (!isInteractive) return;
    
    const canvas = canvasRef.current;
    if (canvas && contextRef.current) {
      contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
      setPrediction("");
      setConfidence(0);
      notifyStateChange({ prediction: "", confidence: 0 });
    }
  };

  // Función para manejar "entrenamiento" o "adivinanza" basado en la fase actual
  const handleAction = () => {
    if (!isInteractive) return;
    
    // Solo proceder si no se está dibujando actualmente
    if (isDrawing) return;

    handleClearCanvas(); // Limpiar canvas después de cada acción

    if (currentPhase === 'training') {
      // Simular guardar el dibujo para entrenamiento
      const newCounts = {
        ...trainingCounts,
        [currentItemToTrain]: trainingCounts[currentItemToTrain] + 1
      };
      setTrainingCounts(newCounts);
      setPrediction(`¡Dibujo de "${currentItemToTrain}" guardado!`);
      setConfidence(0);

      // Mover al siguiente elemento si el actual está entrenado
      if (newCounts[currentItemToTrain] >= MIN_TRAININGS_PER_ITEM) {
        if (currentItemIndex < TRAINING_ITEMS.length - 1) {
          setPrediction(`Pasemos a dibujar: ${TRAINING_ITEMS[currentItemIndex + 1]}`);
          setTimeout(() => {
            const newIndex = currentItemIndex + 1;
            setCurrentItemIndex(newIndex);
            notifyStateChange({ currentItemIndex: newIndex, trainingCounts: newCounts });
          }, 1000);
        } else {
          // Todo el entrenamiento completo, solicitar cambio a predicción
          setPrediction("¡Entrenamiento completado! Ahora puedes probar el modelo.");
          setTimeout(() => {
            setCurrentPhase('prediction');
            notifyStateChange({ currentPhase: 'prediction', trainingCounts: newCounts });
          }, 1500);
        }
      } else {
        notifyStateChange({ trainingCounts: newCounts });
      }
    } else { // Fase de predicción
      setPrediction("Procesando...");
      setConfidence(0);

      setTimeout(() => {
        const trainedItems = TRAINING_ITEMS.filter(item => isItemTrained(item));
        let guessedItem: string;
        let finalConfidence: number;

        if (trainedItems.length === 0) {
          // Fallback si no se entrenaron elementos
          const allPossibleGuesses = TRAINING_ITEMS.concat([
            "una línea", "un gato", "un perro", "una flor", "una estrella", "un auto", "una taza", "un libro"
          ]);
          guessedItem = allPossibleGuesses[Math.floor(Math.random() * allPossibleGuesses.length)];
          finalConfidence = Math.floor(Math.random() * 30) + 30;
        } else {
          // Simular una adivinanza ponderada basada en elementos entrenados
          const weightedGuesses: string[] = [];
          TRAINING_ITEMS.forEach(item => {
            const weight = isItemTrained(item) ? trainingCounts[item] * 2 : 1;
            for (let i = 0; i < weight; i++) {
              weightedGuesses.push(item);
            }
          });
          // Agregar algunos elementos aleatorios no entrenables
          weightedGuesses.push("una línea", "un garabato", "algo abstracto");

          guessedItem = weightedGuesses[Math.floor(Math.random() * weightedGuesses.length)];

          // Asignar confianza basada en si el elemento adivinado fue "entrenado"
          if (isItemTrained(guessedItem)) {
            finalConfidence = Math.floor(Math.random() * 20) + 75; // Mayor confianza si está entrenado (75-95)
          } else {
            finalConfidence = Math.floor(Math.random() * 30) + 40; // Confianza moderada (40-70)
          }
        }

        setPrediction(guessedItem);
        setConfidence(finalConfidence);
        notifyStateChange({ prediction: guessedItem, confidence: finalConfidence });
      }, 1500);
    }
  };

  const handlePhaseChange = (newPhase: 'training' | 'prediction') => {
    if (!isInteractive) return;
    
    if (newPhase === 'training') {
      setCurrentPhase('training');
      setPrediction("Volviendo a la fase de entrenamiento.");
      setConfidence(0);
      setCurrentItemIndex(0);
      // Opcionalmente resetear conteos para re-entrenamiento
      const resetCounts: { [key: string]: number } = {};
      TRAINING_ITEMS.forEach(item => {
        resetCounts[item] = 0;
      });
      setTrainingCounts(resetCounts);
      handleClearCanvas();
      notifyStateChange({ 
        currentPhase: 'training', 
        currentItemIndex: 0, 
        trainingCounts: resetCounts,
        prediction: "Volviendo a la fase de entrenamiento.",
        confidence: 0
      });
    } else {
      setCurrentPhase('prediction');
      setPrediction("¡Entrenamiento completo! Ahora adivinaré tus dibujos.");
      setConfidence(0);
      handleClearCanvas();
      notifyStateChange({ 
        currentPhase: 'prediction',
        prediction: "¡Entrenamiento completo! Ahora adivinaré tus dibujos.",
        confidence: 0
      });
    }
  };

  return (
    <motion.div 
      className="bg-white rounded-2xl shadow-xl p-6 max-w-6xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Simulador de Machine Learning
        </h1>
        <p className="text-lg text-gray-600">
          Aprende cómo funciona el entrenamiento y predicción en Machine Learning
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Sección Izquierda: Canvas de Dibujo y Controles */}
        <div className="flex flex-col items-center">
          {currentPhase === 'training' ? (
            <>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">
                Entrena el Modelo
              </h2>
              <p className="text-xl text-gray-700 mb-6 text-center">
                Dibuja un <span className="font-bold text-indigo-700">{currentItemToTrain}</span> ({trainingCounts[currentItemToTrain]}/{MIN_TRAININGS_PER_ITEM})
              </p>
            </>
          ) : (
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">¡Dibuja Algo para Adivinar!</h2>
          )}

          <div className="w-full max-w-lg bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden shadow-inner aspect-square">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              onTouchCancel={stopDrawing}
              className="w-full h-full cursor-crosshair bg-white"
            />
          </div>

          {/* Botones de Control */}
          <div className="flex gap-4 mt-6">
            <motion.button
              onClick={handleAction}
              disabled={!isInteractive || isDrawing}
              className={`px-6 py-3 font-semibold rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                currentPhase === 'training' 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } ${(!isInteractive || isDrawing) ? 'opacity-50 cursor-not-allowed' : ''}`}
              whileHover={isInteractive && !isDrawing ? { scale: 1.05 } : {}}
              whileTap={isInteractive && !isDrawing ? { scale: 0.95 } : {}}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2" viewBox="0 0 20 20" fill="currentColor">
                {currentPhase === 'training' ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                )}
              </svg>
              {currentPhase === 'training' ? 'Guardar Dibujo' : 'Adivinar'}
            </motion.button>
            
            <motion.button
              onClick={handleClearCanvas}
              disabled={!isInteractive}
              className={`px-6 py-3 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${!isInteractive ? 'opacity-50 cursor-not-allowed' : ''}`}
              whileHover={isInteractive ? { scale: 1.05 } : {}}
              whileTap={isInteractive ? { scale: 0.95 } : {}}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
              </svg>
              Limpiar
            </motion.button>
          </div>

          <div className="flex gap-4 mt-4">
            {currentPhase === 'training' && allTrainingComplete && isInteractive && (
              <motion.button
                onClick={() => handlePhaseChange('prediction')}
                className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition duration-300 ease-in-out transform hover:scale-105 active:scale-95"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 001 1h2a1 1 0 100-2h-2V7a1 1 0 10-2 0v2z" clipRule="evenodd" />
                </svg>
                Probar Modelo
              </motion.button>
            )}
            {currentPhase === 'prediction' && isInteractive && (
              <motion.button
                onClick={() => handlePhaseChange('training')}
                className="px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-700 transition duration-300 ease-in-out transform hover:scale-105 active:scale-95"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-2.5-4a1 1 0 011-1h4a1 1 0 010 2h-4a1 1 0 01-1-1zm3.707-10.293a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 7.414V11a1 1 0 102 0V7.414l1.293 1.293a1 1 0 001.414-1.414l-3-3z" clipRule="evenodd" />
                </svg>
                Re-entrenar Modelo
              </motion.button>
            )}
          </div>

          {/* Mostrar Estado de Predicción/Entrenamiento */}
          {prediction && (
            <motion.div 
              className="mt-6 text-center bg-purple-100 p-4 rounded-xl shadow-inner border border-purple-200"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-xl font-bold text-purple-800">
                {currentPhase === 'training' ? prediction : `Mi "modelo" cree que es: `}
                {currentPhase === 'prediction' && <span className="text-indigo-600">{prediction}</span>}
              </p>
              {confidence > 0 && (
                <p className="text-lg text-purple-700 mt-2">
                  Con una confianza del: <span className="font-semibold">{confidence}%</span>
                </p>
              )}
            </motion.div>
          )}
        </div>

        {/* Sección Derecha: Explicación del Machine Learning */}
        <div className="p-4 bg-blue-50 rounded-xl shadow-inner border border-blue-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">¿Cómo funciona el Machine Learning?</h3>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              El <strong>Machine Learning (Aprendizaje Automático)</strong> es una rama de la Inteligencia Artificial que permite a las computadoras aprender de los datos sin ser programadas explícitamente para cada tarea.
            </p>
            <p>
              Para que un modelo de Machine Learning funcione, necesita ser <strong>"entrenado"</strong>. En esta demostración, tú serás el que entrene el modelo. Le mostrarás ejemplos de diferentes dibujos (como "círculo", "cuadrado", etc.).
            </p>
            <p>
              Durante el <strong>"entrenamiento"</strong>, el modelo (simulado aquí por el conteo de tus dibujos) aprende patrones y características asociadas a cada objeto. Cuantos más ejemplos le des, "más aprenderá".
            </p>
            <p>
              Una vez entrenado, el modelo puede pasar a la fase de <strong>"predicción"</strong> (o inferencia). Cuando le presentas un nuevo dibujo, el modelo utiliza lo que aprendió durante el entrenamiento para hacer una <strong>"predicción"</strong>, es decir, adivinar qué es. También asigna una <strong>"confianza"</strong>, que indica qué tan seguro está de su predicción.
            </p>
            <p>
              En esta simulación, la "confianza" y la "predicción" se basan en qué tan bien has "entrenado" el modelo con tus dibujos. ¡Intenta dibujar claramente los objetos para que el modelo "aprenda" mejor!
            </p>
          </div>

          {/* Progreso del entrenamiento */}
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Progreso del Entrenamiento</h4>
            <div className="space-y-2">
              {TRAINING_ITEMS.map((item) => (
                <div key={item} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{item}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isItemTrained(item) ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${(trainingCounts[item] / MIN_TRAININGS_PER_ITEM) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">
                      {trainingCounts[item]}/{MIN_TRAININGS_PER_ITEM}
                    </span>
                    {isItemTrained(item) && (
                      <span className="text-green-500">✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MachineLearningCanvas;