import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

interface Transaction {
  id: string;
  amount: number;
  origin: string;
  destination: string;
  refId: string;
  flagged: boolean;
  isSuspicious: boolean;
}

interface Level {
  duration: number;
  numTransactions: number;
  maxAmount: number;
  rules: string[];
  checkSuspicious: (transaction: Transaction) => boolean;
}

interface AnomaliaFinancieraCanvasProps {
  onStateChange?: (state: any) => void;
  initialState?: any;
  isInteractive?: boolean;
}

const AnomaliaFinancieraCanvas: React.FC<AnomaliaFinancieraCanvasProps> = ({
  onStateChange,
  initialState = {},
  isInteractive = true
}) => {
  // Estados del juego
  const [currentLevel, setCurrentLevel] = useState(initialState.currentLevel || 0);
  const [score, setScore] = useState(initialState.score || 0);
  const [correctFlags, setCorrectFlags] = useState(initialState.correctFlags || 0);
  const [falseFlags, setFalseFlags] = useState(initialState.falseFlags || 0);
  const [timeLeft, setTimeLeft] = useState(initialState.timeLeft || 0);
  const [gameRunning, setGameRunning] = useState(initialState.gameRunning || false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [gameMessage, setGameMessage] = useState('Haz clic en "Iniciar Juego" para comenzar.');
  const [showNextLevel, setShowNextLevel] = useState(false);
  const [showReset, setShowReset] = useState(false);

  // Referencias para intervalos
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transactionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Configuración de niveles simplificada
  const levels: Level[] = [
    {
      duration: 20,
      numTransactions: 10,
      maxAmount: 3000,
      rules: ["Transacciones mayores a $2000 son sospechosas"],
      checkSuspicious: (transaction) => transaction.amount > 2000
    },
    {
      duration: 25,
      numTransactions: 12,
      maxAmount: 5000,
      rules: [
        "Transacciones mayores a $3000 son sospechosas",
        "Transacciones desde/hacia 'Paraíso Fiscal' son sospechosas"
      ],
      checkSuspicious: (transaction) => 
        transaction.amount > 3000 || 
        transaction.origin === 'Paraíso Fiscal' || 
        transaction.destination === 'Paraíso Fiscal'
    },
    {
      duration: 30,
      numTransactions: 15,
      maxAmount: 8000,
      rules: [
        "Transacciones mayores a $4000 son sospechosas",
        "Transacciones desde/hacia 'Paraíso Fiscal' son sospechosas",
        "Transacciones con referencia 'URGENTE' son sospechosas"
      ],
      checkSuspicious: (transaction) => 
        transaction.amount > 4000 || 
        transaction.origin === 'Paraíso Fiscal' || 
        transaction.destination === 'Paraíso Fiscal' ||
        transaction.refId === 'URGENTE'
    }
  ];

  // Ubicaciones disponibles
  const locations = ['Argentina', 'Chile', 'Uruguay', 'España', 'México', 'Paraíso Fiscal'];

  // Generar ID aleatorio
  const generateId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  // Generar transacción
  const generateTransaction = useCallback((levelConfig: Level): Transaction => {
    const id = generateId();
    const amount = Math.floor(Math.random() * levelConfig.maxAmount) + 100;
    const origin = locations[Math.floor(Math.random() * locations.length)];
    let destination = locations[Math.floor(Math.random() * locations.length)];
    
    // Evitar que origen y destino sean iguales
    while (destination === origin) {
      destination = locations[Math.floor(Math.random() * locations.length)];
    }
    
    const refId = Math.random() < 0.2 ? 'URGENTE' : generateId().substring(0, 5);

    const transaction: Transaction = {
      id,
      amount,
      origin,
      destination,
      refId,
      flagged: false,
      isSuspicious: false
    };

    // Determinar si es sospechosa
    transaction.isSuspicious = levelConfig.checkSuspicious(transaction);
    
    return transaction;
  }, []);

  // Marcar transacción
  const flagTransaction = useCallback((transaction: Transaction) => {
    if (!gameRunning || transaction.flagged || !isInteractive) return;

    setTransactions(prev => prev.map(t => {
      if (t.id === transaction.id) {
        const flaggedTransaction = { ...t, flagged: true };
        
        if (transaction.isSuspicious) {
          setCorrectFlags((prev: number) => prev + 1);
          setScore((prev: number) => prev + 100);
          setGameMessage("¡Correcto! Anomalía detectada.");
        } else {
          setFalseFlags((prev: number) => prev + 1);
          setScore((prev: number) => prev - 50);
          setGameMessage("¡Error! Esta transacción es normal.");
        }
        
        return flaggedTransaction;
      }
      return t;
    }));
  }, [gameRunning, isInteractive]);

  // Verificar fin del nivel
  const checkEndOfLevel = useCallback(() => {
    const totalSuspicious = transactions.filter(t => t.isSuspicious).length;
    const missedSuspicious = transactions.filter(t => t.isSuspicious && !t.flagged).length;
    const accuracy = totalSuspicious > 0 ? (correctFlags / totalSuspicious) : 1;
    const falsePositiveRate = (correctFlags + falseFlags) > 0 ? (falseFlags / (correctFlags + falseFlags)) : 0;

    setGameRunning(false);

    if (accuracy >= 0.7 && falsePositiveRate < 0.3) {
      setGameMessage("¡Nivel completado! Bien hecho.");
      if (currentLevel < levels.length - 1) {
        setShowNextLevel(true);
      } else {
        setGameMessage("¡Felicitaciones! Has completado todos los niveles.");
        setShowReset(true);
      }
    } else {
      setGameMessage(`Nivel fallido. Precisión: ${Math.round(accuracy * 100)}%. ¡Inténtalo de nuevo!`);
      setShowReset(true);
    }

    if (onStateChange) {
      onStateChange({
        currentLevel,
        score,
        correctFlags,
        falseFlags,
        missedFlags: missedSuspicious,
        gameRunning: false
      });
    }
  }, [transactions, correctFlags, falseFlags, currentLevel, score, onStateChange]);

  // Iniciar juego
  const startGame = useCallback(() => {
    if (gameRunning || !isInteractive) return;
    
    setGameRunning(true);
    setScore(0);
    setCorrectFlags(0);
    setFalseFlags(0);
    setTransactions([]);
    setGameMessage("¡Juego iniciado! Detecta las transacciones sospechosas.");
    setShowNextLevel(false);
    setShowReset(false);
    
    const levelConfig = levels[currentLevel];
    setTimeLeft(levelConfig.duration);

    // Limpiar intervalos existentes
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (transactionTimerRef.current) clearInterval(transactionTimerRef.current);

    // Iniciar temporizador
    gameTimerRef.current = setInterval(() => {
      setTimeLeft((prev: number) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Generar transacciones gradualmente
    const transactionDelay = (levelConfig.duration * 1000) / levelConfig.numTransactions;
    let transactionsGenerated = 0;

    transactionTimerRef.current = setInterval(() => {
      if (transactionsGenerated < levelConfig.numTransactions) {
        const newTransaction = generateTransaction(levelConfig);
        setTransactions(prev => [...prev, newTransaction]);
        transactionsGenerated++;
      } else {
        if (transactionTimerRef.current) {
          clearInterval(transactionTimerRef.current);
          transactionTimerRef.current = null;
        }
      }
    }, transactionDelay);

  }, [gameRunning, isInteractive, currentLevel, generateTransaction]);

  // Siguiente nivel
  const handleNextLevel = useCallback(() => {
    if (!isInteractive) return;
    setCurrentLevel((prev: number) => prev + 1);
    setTransactions([]);
    setGameMessage('Haz clic en "Iniciar Juego" para el siguiente nivel.');
    setShowNextLevel(false);
  }, [isInteractive]);

  // Reiniciar juego
  const handleResetGame = useCallback(() => {
    if (!isInteractive) return;
    
    // Limpiar intervalos
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (transactionTimerRef.current) clearInterval(transactionTimerRef.current);

    setCurrentLevel(0);
    setScore(0);
    setCorrectFlags(0);
    setFalseFlags(0);
    setTimeLeft(0);
    setGameRunning(false);
    setTransactions([]);
    setGameMessage('Haz clic en "Iniciar Juego" para comenzar.');
    setShowNextLevel(false);
    setShowReset(false);
  }, [isInteractive]);

  // Efecto para manejar el fin del tiempo
  useEffect(() => {
    if (timeLeft <= 0 && gameRunning) {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (transactionTimerRef.current) clearInterval(transactionTimerRef.current);
      checkEndOfLevel();
    }
  }, [timeLeft, gameRunning, checkEndOfLevel]);

  // Limpiar intervalos al desmontar
  useEffect(() => {
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (transactionTimerRef.current) clearInterval(transactionTimerRef.current);
    };
  }, []);

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-xl p-3 sm:p-6 max-w-6xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="text-4xl sm:text-5xl text-green-600 mb-3 sm:mb-4">💰</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Cazador de Anomalías Financieras
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          Detecta transacciones sospechosas antes de que se complete el tiempo.
        </p>
      </div>

      {/* Área del juego */}
      <div className="bg-gray-50 rounded-xl p-3 sm:p-6 mb-4 sm:mb-6 min-h-[300px] sm:min-h-[400px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
          {transactions.map((transaction) => (
            <motion.div
              key={transaction.id}
              className={`bg-white rounded-lg p-3 sm:p-4 shadow-md cursor-pointer transition-all duration-200 border-2 ${
                transaction.flagged
                  ? transaction.isSuspicious
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-blue-500 hover:shadow-lg'
              } ${!isInteractive ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={() => flagTransaction(transaction)}
              whileHover={isInteractive ? { scale: 1.02 } : {}}
              whileTap={isInteractive ? { scale: 0.98 } : {}}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{ touchAction: 'manipulation' }}
            >
              <div className="space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm font-mono">
                  <span className="font-semibold">ID:</span> {transaction.id}
                </p>
                <p className="text-base sm:text-lg font-bold text-orange-600">
                  ${transaction.amount.toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm">
                  <span className="font-semibold">De:</span> {transaction.origin}
                </p>
                <p className="text-xs sm:text-sm">
                  <span className="font-semibold">A:</span> {transaction.destination}
                </p>
                <p className="text-xs sm:text-sm">
                  <span className="font-semibold">Ref:</span> {transaction.refId}
                </p>
                {transaction.flagged && (
                  <div className="flex justify-end">
                    {transaction.isSuspicious ? (
                      <span className="text-green-500 text-lg sm:text-xl">✓</span>
                    ) : (
                      <span className="text-red-500 text-lg sm:text-xl">✗</span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mensaje del juego */}
        {gameMessage && (
          <motion.div
            className="text-center text-base sm:text-lg font-bold text-orange-600 mb-4 p-3 sm:p-4 bg-orange-50 rounded-lg border border-orange-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {gameMessage}
          </motion.div>
        )}
      </div>

      {/* Panel de reglas */}
      <div className="bg-blue-50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-blue-200">
        <h3 className="text-lg sm:text-xl font-bold text-blue-900 mb-3 sm:mb-4">
          Reglas de Detección (Nivel {currentLevel + 1}):
        </h3>
        <ul className="space-y-2">
          {levels[currentLevel]?.rules.map((rule, index) => (
            <li key={index} className="text-blue-800 flex items-start text-sm sm:text-base">
              <span className="text-blue-400 mr-2">•</span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Panel de puntuación */}
      <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 text-center">
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Puntuación</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{score}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Correctas</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">{correctFlags}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Errores</p>
            <p className="text-xl sm:text-2xl font-bold text-red-600">{falseFlags}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Nivel</p>
            <p className="text-xl sm:text-2xl font-bold text-purple-600">{currentLevel + 1}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Tiempo</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{timeLeft}s</p>
          </div>
        </div>
      </div>

      {/* Botones de control */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
        {!gameRunning && !showNextLevel && !showReset && (
          <motion.button
            onClick={startGame}
            disabled={!isInteractive}
            className={`px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-300 text-sm sm:text-base ${!isInteractive ? 'opacity-50 cursor-not-allowed' : ''}`}
            whileHover={isInteractive ? { scale: 1.05 } : {}}
            whileTap={isInteractive ? { scale: 0.95 } : {}}
          >
            ▶ Iniciar Juego
          </motion.button>
        )}

        {showNextLevel && (
          <motion.button
            onClick={handleNextLevel}
            disabled={!isInteractive}
            className={`px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 text-sm sm:text-base ${!isInteractive ? 'opacity-50 cursor-not-allowed' : ''}`}
            whileHover={isInteractive ? { scale: 1.05 } : {}}
            whileTap={isInteractive ? { scale: 0.95 } : {}}
          >
            ⏭ Siguiente Nivel
          </motion.button>
        )}

        {showReset && (
          <motion.button
            onClick={handleResetGame}
            disabled={!isInteractive}
            className={`px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition duration-300 text-sm sm:text-base ${!isInteractive ? 'opacity-50 cursor-not-allowed' : ''}`}
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

export default AnomaliaFinancieraCanvas;