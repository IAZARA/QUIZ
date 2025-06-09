import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

interface Evidence {
  id: string;
  text: string;
  isManipulated: boolean;
  explanation: string;
  category: string;
}

interface Level {
  level: number;
  description: string;
  timePerRound: number;
  evidence: Evidence[];
}

interface VerificadorEvidenciaCanvasProps {
  onStateChange?: (state: any) => void;
  initialState?: any;
  isInteractive?: boolean;
}

const VerificadorEvidenciaCanvas: React.FC<VerificadorEvidenciaCanvasProps> = ({
  onStateChange,
  initialState = {},
  isInteractive = true
}) => {
  // Estados del juego
  const [currentLevel, setCurrentLevel] = useState(initialState.currentLevel || 0);
  const [currentRound, setCurrentRound] = useState(initialState.currentRound || 0);
  const [score, setScore] = useState(initialState.score || 0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameRunning, setGameRunning] = useState(initialState.gameRunning || false);
  const [currentEvidence, setCurrentEvidence] = useState<Evidence | null>(null);
  const [gameMessage, setGameMessage] = useState('Haz clic en "Iniciar Juego" para comenzar.');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect'>('correct');
  const [feedbackText, setFeedbackText] = useState('');
  const [showNextRound, setShowNextRound] = useState(false);
  const [showReset, setShowReset] = useState(false);

  // Referencias para intervalos
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Configuración de niveles simplificada
  const levels: Level[] = [
    {
      level: 1,
      description: "Nivel 1: Evidencia básica. Busca inconsistencias obvias.",
      timePerRound: 20,
      evidence: [
        {
          id: 'e1',
          text: "Informe Policial: 'Se encontró un objeto metálico en la escena a las 03:00 AM, mientras que el testigo afirmó haberlo visto a las 10:00 PM.'",
          isManipulated: true,
          explanation: "¡Manipulado! Hay una clara inconsistencia horaria entre el informe y el testigo.",
          category: "Inconsistencia temporal"
        },
        {
          id: 'e2',
          text: "Mensaje de Texto: 'Nos vemos a las 5 en el lugar de siempre. No olvides lo que hablamos.'",
          isManipulated: false,
          explanation: "¡Genuino! Es un mensaje común y plausible, sin detalles extraños.",
          category: "Comunicación normal"
        },
        {
          id: 'e3',
          text: "Publicación: 'El alcalde ha renunciado debido a problemas de salud (Fuente: Cuenta personal del alcalde en la deep web).'",
          isManipulated: true,
          explanation: "¡Manipulado! La 'deep web' no es una fuente oficial creíble para anuncios oficiales.",
          category: "Fuente no confiable"
        }
      ]
    },
    {
      level: 2,
      description: "Nivel 2: Manipulaciones más sutiles. Analiza el lenguaje y contexto.",
      timePerRound: 25,
      evidence: [
        {
          id: 'e4',
          text: "Correo: 'Estimado colega, le remito los datos solicitados. Adjunto el archivo y confirmo la reunión para el 15 de marzo.'",
          isManipulated: false,
          explanation: "¡Genuino! Este es un correo electrónico de negocios estándar y legítimo.",
          category: "Comunicación profesional"
        },
        {
          id: 'e5',
          text: "Noticia: 'Descubrimiento de una nueva especie de ave en Buenos Aires, con plumas azul brillante y hábitos nocturnos nunca vistos.'",
          isManipulated: true,
          explanation: "¡Manipulado! Descripción genérica sin detalles científicos o fuentes verificables, típico de IA.",
          category: "Noticia generada por IA"
        },
        {
          id: 'e6',
          text: "Audio: 'Sí, el paquete... ya está en el destino. Confirmo... que la transferencia... se realizó, sin problemas.'",
          isManipulated: true,
          explanation: "¡Manipulado! Las pausas inusuales podrían indicar un audio editado artificialmente.",
          category: "Audio sintético"
        }
      ]
    },
    {
      level: 3,
      description: "Nivel 3: Análisis crítico. Busca inconsistencias lógicas profundas.",
      timePerRound: 30,
      evidence: [
        {
          id: 'e7',
          text: "Testigo: 'Vi al sospechoso huir por Rivadavia hacia el oeste a las 18:30, mientras el sol se ponía directamente frente a él.'",
          isManipulated: true,
          explanation: "¡Manipulado! Si huye hacia el oeste y el sol se pone al oeste, tendría el sol a su espalda, no de frente.",
          category: "Error geográfico"
        },
        {
          id: 'e8',
          text: "Blog: 'La ciberseguridad ha evolucionado exponencialmente, impulsada por criptografía y machine learning. Los desafíos persisten.'",
          isManipulated: false,
          explanation: "¡Genuino! Texto técnico coherente con lenguaje natural y sin contradicciones.",
          category: "Artículo técnico"
        },
        {
          id: 'e9',
          text: "Caso: 'Juan Pérez fue arrestado por robo. Sus huellas estaban en la escena, pero testimonios contradictorios afirman que estaba en dos lugares a la vez. Caso cerrado.'",
          isManipulated: true,
          explanation: "¡Manipulado! Cerrar un caso con testimonios contradictorios es una inconsistencia lógica clara.",
          category: "Lógica inconsistente"
        }
      ]
    }
  ];

  // Manejar decisión del usuario
  const handleDecision = useCallback((userGuessGenuine: boolean) => {
    if (!gameRunning || !currentEvidence || !isInteractive) return;

    // Detener timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const isCorrect = (userGuessGenuine && !currentEvidence.isManipulated) ||
                     (!userGuessGenuine && currentEvidence.isManipulated);

    if (isCorrect) {
      setScore((prev: number) => prev + 100);
      setFeedbackType('correct');
      setFeedbackText('¡Correcto!');
    } else {
      setScore((prev: number) => prev - 50);
      setFeedbackType('incorrect');
      setFeedbackText('¡Incorrecto!');
    }

    setShowFeedback(true);
    setGameMessage(currentEvidence.explanation);
    setShowNextRound(true);

    if (onStateChange) {
      onStateChange({
        currentLevel,
        currentRound,
        score: isCorrect ? score + 100 : score - 50,
        gameRunning: true
      });
    }
  }, [gameRunning, currentEvidence, isInteractive, currentLevel, currentRound, score, onStateChange]);

  // Iniciar timer
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Tiempo agotado - auto-fail
          handleDecision(true); // Asume genuino por defecto
          setFeedbackText('¡Tiempo agotado!');
          setFeedbackType('incorrect');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleDecision]);

  // Cargar nueva ronda
  const loadNewRound = useCallback(() => {
    const levelData = levels[currentLevel];
    if (!levelData || currentRound >= levelData.evidence.length) {
      // Pasar al siguiente nivel
      if (currentLevel < levels.length - 1) {
        setCurrentLevel((prev: number) => prev + 1);
        setCurrentRound(0);
        setGameMessage(`¡Pasando al Nivel ${currentLevel + 2}!`);
        setTimeout(() => loadNewRound(), 2000);
        return;
      } else {
        // Juego completado
        setGameRunning(false);
        setGameMessage('¡Felicitaciones! Has completado todos los niveles.');
        setShowReset(true);
        return;
      }
    }

    const evidence = levelData.evidence[currentRound];
    setCurrentEvidence(evidence);
    setTimeLeft(levelData.timePerRound);
    setShowFeedback(false);
    setShowNextRound(false);
    setGameMessage(`${levelData.description}`);
    
    startTimer();
  }, [currentLevel, currentRound, startTimer]);

  // Iniciar juego
  const startGame = useCallback(() => {
    if (gameRunning || !isInteractive) return;
    
    setGameRunning(true);
    setScore(0);
    setCurrentLevel(0);
    setCurrentRound(0);
    setShowReset(false);
    
    loadNewRound();
  }, [gameRunning, isInteractive, loadNewRound]);

  // Siguiente ronda
  const handleNextRound = useCallback(() => {
    if (!isInteractive) return;
    setCurrentRound((prev: number) => prev + 1);
    loadNewRound();
  }, [isInteractive, loadNewRound]);

  // Reiniciar juego
  const handleResetGame = useCallback(() => {
    if (!isInteractive) return;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setCurrentLevel(0);
    setCurrentRound(0);
    setScore(0);
    setTimeLeft(0);
    setGameRunning(false);
    setCurrentEvidence(null);
    setGameMessage('Haz clic en "Iniciar Juego" para comenzar.');
    setShowFeedback(false);
    setShowNextRound(false);
    setShowReset(false);
  }, [isInteractive]);

  // Limpiar intervalos al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Auto-iniciar juego cuando se activa para la audiencia
  useEffect(() => {
    if (isInteractive && initialState.gameRunning && !gameRunning) {
      startGame();
    }
  }, [isInteractive, initialState.gameRunning, gameRunning, startGame]);

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-xl p-3 sm:p-6 max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="text-4xl sm:text-5xl text-blue-600 mb-3 sm:mb-4">🔍</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Verificador de Evidencia Digital
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          Identifica si la evidencia es genuina o ha sido manipulada por IA.
        </p>
      </div>

      {/* Área del juego */}
      <div className="bg-gray-50 rounded-xl p-3 sm:p-6 mb-4 sm:mb-6 min-h-[250px] sm:min-h-[300px]">
        {/* Evidencia */}
        <div className="bg-white rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200 shadow-sm min-h-[100px] sm:min-h-[120px] flex items-center justify-center">
          <p className="text-base sm:text-lg text-gray-800 text-center leading-relaxed">
            {currentEvidence ? currentEvidence.text : gameMessage}
          </p>
        </div>

        {/* Botones de decisión */}
        {gameRunning && currentEvidence && !showFeedback && (
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mb-4 sm:mb-6">
            <motion.button
              onClick={() => handleDecision(true)}
              disabled={!isInteractive}
              className={`px-6 sm:px-8 py-3 sm:py-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-300 flex items-center justify-center gap-3 text-sm sm:text-base ${!isInteractive ? 'opacity-50 cursor-not-allowed' : ''}`}
              whileHover={isInteractive ? { scale: 1.05 } : {}}
              whileTap={isInteractive ? { scale: 0.95 } : {}}
            >
              <span className="text-lg sm:text-xl">✓</span>
              Evidencia Genuina
            </motion.button>

            <motion.button
              onClick={() => handleDecision(false)}
              disabled={!isInteractive}
              className={`px-6 sm:px-8 py-3 sm:py-4 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition duration-300 flex items-center justify-center gap-3 text-sm sm:text-base ${!isInteractive ? 'opacity-50 cursor-not-allowed' : ''}`}
              whileHover={isInteractive ? { scale: 1.05 } : {}}
              whileTap={isInteractive ? { scale: 0.95 } : {}}
            >
              <span className="text-lg sm:text-xl">✗</span>
              Evidencia Manipulada
            </motion.button>
          </div>
        )}

        {/* Feedback */}
        {showFeedback && (
          <motion.div 
            className={`rounded-lg p-4 mb-4 text-center border-2 ${
              feedbackType === 'correct' 
                ? 'border-green-400 bg-green-50 text-green-800' 
                : 'border-red-400 bg-red-50 text-red-800'
            }`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className="font-bold text-lg mb-2">{feedbackText}</p>
            <p className="text-sm">{currentEvidence?.explanation}</p>
            {currentEvidence && (
              <p className="text-xs mt-2 opacity-75">
                Categoría: {currentEvidence.category}
              </p>
            )}
          </motion.div>
        )}
      </div>

      {/* Panel de información */}
      <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Puntuación</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{score}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Nivel</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{currentLevel + 1}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Ronda</p>
            <p className="text-xl sm:text-2xl font-bold text-purple-600">{currentRound + 1}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Tiempo</p>
            <p className="text-xl sm:text-2xl font-bold text-orange-600">{timeLeft}s</p>
          </div>
        </div>
      </div>

      {/* Botones de control */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
        {!gameRunning && !showReset && (
          <motion.button
            onClick={startGame}
            disabled={!isInteractive}
            className={`px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 text-sm sm:text-base ${!isInteractive ? 'opacity-50 cursor-not-allowed' : ''}`}
            whileHover={isInteractive ? { scale: 1.05 } : {}}
            whileTap={isInteractive ? { scale: 0.95 } : {}}
          >
            ▶ Iniciar Juego
          </motion.button>
        )}

        {showNextRound && (
          <motion.button
            onClick={handleNextRound}
            disabled={!isInteractive}
            className={`px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-300 text-sm sm:text-base ${!isInteractive ? 'opacity-50 cursor-not-allowed' : ''}`}
            whileHover={isInteractive ? { scale: 1.05 } : {}}
            whileTap={isInteractive ? { scale: 0.95 } : {}}
          >
            ⏭ Siguiente Ronda
          </motion.button>
        )}

        {showReset && (
          <motion.button
            onClick={handleResetGame}
            disabled={!isInteractive}
            className={`px-4 sm:px-6 py-2 sm:py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition duration-300 text-sm sm:text-base ${!isInteractive ? 'opacity-50 cursor-not-allowed' : ''}`}
            whileHover={isInteractive ? { scale: 1.05 } : {}}
            whileTap={isInteractive ? { scale: 0.95 } : {}}
          >
            🔄 Reiniciar Juego
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default VerificadorEvidenciaCanvas;