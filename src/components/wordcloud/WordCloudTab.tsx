import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, RotateCcw, TrendingUp, Eye, Cloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ReactWordcloud from 'react-wordcloud';
import { useWordCloudStore } from '../../store/wordCloudStore';

interface WordCloudData {
  words: Array<{ text: string; value: number }>;
  isActive: boolean;
}

interface SocketType {
  on: (event: string, callback: (data: WordCloudData) => void) => void;
  off: (event: string) => void;
  emit: (event: string, data?: { isActive?: boolean }) => void;
}

interface WordCloudTabProps {
  socket?: SocketType;
}

const WordCloudTab: React.FC<WordCloudTabProps> = ({ socket }) => {
  const { t } = useTranslation();
  const {
    words,
    isActive,
    isLoading,
    setWordCloudData,
    setIsActive,
    setIsLoading,
    startWordCloud,
    stopWordCloud,
    resetWordCloud,
    initializeSocket
  } = useWordCloudStore();
  const wordCloudData: { text: string; value: number }[] = words.map(w => ({ text: w.text, value: w.count }));

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch('/api/wordcloud');
        const data = await response.json();
        setWordCloudData(data.words || []);
        setIsActive(data.isActive || false);
      } catch (error) {
        console.error('Error fetching word cloud data:', error);
      }
    };

    fetchInitialData();
    
    // Inicializar socket desde el store para asegurar sincronización
    initializeSocket();

    if (socket) {
      socket.on('wordCloudUpdate', (data: WordCloudData) => {
        setWordCloudData(data.words || []);
        setIsActive(data.isActive || false);
      });

      return () => {
        socket.off('wordCloudUpdate');
      };
    }
  }, [socket, setWordCloudData, setIsActive, initializeSocket]);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      await startWordCloud();
      if (socket) {
        socket.emit('wordCloudStatusChange', { isActive: true });
      }
    } catch (error) {
      console.error('Error starting word cloud:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    try {
      await stopWordCloud();
      if (socket) {
        socket.emit('wordCloudStatusChange', { isActive: false });
      }
    } catch (error) {
      console.error('Error stopping word cloud:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsLoading(true);
    try {
      await resetWordCloud();
      if (socket) {
        socket.emit('wordCloudReset');
      }
    } catch (error) {
      console.error('Error resetting word cloud:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const options = {
    colors: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'],
    enableTooltip: true,
    deterministic: false,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSizes: [20, 80] as [number, number],
    fontStyle: 'normal',
    fontWeight: 'bold',
    padding: 4,
    rotations: 2,
    rotationAngles: [-90, 0] as [number, number],
    scale: 'sqrt' as const,
    spiral: 'archimedean' as const,
    transitionDuration: 1000,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

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
          {t('wordCloud.title', 'Nube de Palabras')}
        </h2>
        <p className="text-text-secondary max-w-2xl mx-auto">
          {t('wordCloud.description', 'Los participantes pueden enviar palabras que aparecerán en tiempo real en la nube de palabras.')}
        </p>
      </motion.div>

      {/* Controls */}
      <motion.div 
        className="flex flex-wrap justify-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <motion.button
          onClick={handleStart}
          disabled={isActive || isLoading}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
            isActive || isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105'
          }`}
          whileHover={!isActive && !isLoading ? { scale: 1.05 } : {}}
          whileTap={!isActive && !isLoading ? { scale: 0.95 } : {}}
        >
          <Play className="h-5 w-5" />
          <span>{t('wordCloud.start', 'Iniciar')}</span>
        </motion.button>

        <motion.button
          onClick={handleStop}
          disabled={!isActive || isLoading}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
            !isActive || isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:scale-105'
          }`}
          whileHover={isActive && !isLoading ? { scale: 1.05 } : {}}
          whileTap={isActive && !isLoading ? { scale: 0.95 } : {}}
        >
          <Square className="h-5 w-5" />
          <span>{t('wordCloud.stop', 'Detener')}</span>
        </motion.button>

        <motion.button
          onClick={handleReset}
          disabled={isLoading}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
            isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105'
          }`}
          whileHover={!isLoading ? { scale: 1.05 } : {}}
          whileTap={!isLoading ? { scale: 0.95 } : {}}
        >
          <RotateCcw className="h-5 w-5" />
          <span>{t('wordCloud.reset', 'Reiniciar')}</span>
        </motion.button>
      </motion.div>

      {/* Status */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${
          isActive 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-gray-100 text-gray-600 border border-gray-200'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          }`} />
          <span>
            {isActive 
              ? t('wordCloud.active', 'Activa - Los participantes pueden enviar palabras') 
              : t('wordCloud.inactive', 'Inactiva - Los participantes no pueden enviar palabras')
            }
          </span>
        </div>
      </motion.div>

      {/* Word Cloud Visualization */}
      <motion.div 
        className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="relative p-8" style={{ height: '500px' }}>
          {wordCloudData.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="h-full relative"
            >
              {/* Background effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 via-blue-100/30 to-teal-100/30 rounded-xl"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_70%)] rounded-xl"></div>
              
              {/* Word cloud */}
              <div className="relative z-10 h-full">
                <ReactWordcloud words={wordCloudData} options={options} />
              </div>
              
              {/* Floating particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-purple-300 rounded-full opacity-30"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [-20, 20, -20],
                    x: [-10, 10, -10],
                    opacity: [0.3, 0.7, 0.3],
                    scale: [1, 1.5, 1]
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2
                  }}
                />
              ))}
              
              {/* Real-time statistics */}
              <motion.div 
                className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {wordCloudData.length} únicas
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {wordCloudData.reduce((sum: number, word: { text: string; value: number }): number => sum + word.value, 0)} total
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity 
                }}
                className="mb-6"
              >
                <Cloud className="h-20 w-20 text-purple-300" />
              </motion.div>
              <motion.h3 
                className="text-xl font-semibold text-gray-600 mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                Nube de Palabras Vacía
              </motion.h3>
              <motion.p 
                className="text-text-secondary text-center max-w-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {isActive ? 
                  'La nube está activa. Los participantes pueden enviar palabras que aparecerán aquí en tiempo real.' :
                  'Inicia la nube de palabras para que los participantes puedan enviar sus contribuciones.'
                }
              </motion.p>
              {/* Animated waiting indicator */}
              <motion.div 
                className="flex space-x-2 mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 bg-purple-400 rounded-full"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      delay: i * 0.3 
                    }}
                  />
                ))}
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default WordCloudTab;
