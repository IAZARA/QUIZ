import React, { useState, useEffect, useRef } from 'react';
import { Send, Cloud, Sparkles, Zap, Star } from 'lucide-react';
import { useWordCloudStore } from '../../store/wordCloudStore';
import ReactWordcloud from 'react-wordcloud';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const WordCloudParticipant: React.FC = () => {
  const { t } = useTranslation();
  const { isActive, words, addWord, fetchWords, initializeSocket } = useWordCloudStore();
  const [inputWord, setInputWord] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newWords, setNewWords] = useState<string[]>([]);
  const prevWordsRef = useRef<Array<{text: string, count: number}>>([]);

  useEffect(() => {
    const loadWords = async () => {
      setLoading(true);
      await fetchWords();
      setLoading(false);
    };
    
    loadWords();
    
    // Inicializar socket para escuchar actualizaciones en tiempo real
    initializeSocket();
    
    return () => {
      // Limpiar socket
    };
  }, [fetchWords, initializeSocket]);
  
  // Detectar palabras nuevas para animarlas
  useEffect(() => {
    if (words.length > 0 && prevWordsRef.current.length > 0) {
      // Encontrar palabras nuevas o que han cambiado de conteo
      const newWordsDetected = words.filter(word => {
        const prevWord = prevWordsRef.current.find(w => w.text === word.text);
        return !prevWord || prevWord.count < word.count;
      }).map(word => word.text);
      
      if (newWordsDetected.length > 0) {
        setNewWords(newWordsDetected);
        
        // Limpiar las palabras nuevas después de un tiempo para quitar la animación
        const timer = setTimeout(() => {
          setNewWords([]);
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
    
    // Actualizar la referencia de palabras anteriores
    prevWordsRef.current = [...words];
  }, [words]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputWord.trim() || !isActive || submitted) {
      return;
    }
    
    try {
      await addWord(inputWord.trim());
      setSubmitted(true);
      setInputWord('');
    } catch (error) {
      console.error('Error al enviar la palabra:', error);
    }
  };

  // Convertir las palabras al formato esperado por react-wordcloud
  const wordCloudData = words.map(word => ({
    text: word.text,
    value: word.count,
    // Añadir propiedades para animación y estilo
    color: newWords.includes(word.text) ? '#ff6b6b' : undefined,
    fontWeight: newWords.includes(word.text) ? 'bold' : 'normal',
    fontFamily: newWords.includes(word.text) ? 'Arial, sans-serif' : 'impact'
  }));

  // Definir la interfaz para la palabra en el tooltip
  interface WordCloudWord {
    text: string;
    value: number;
  }

  const options = {
    colors: [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ],
    enableTooltip: true,
    deterministic: false,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSizes: [18, 80] as [number, number],
    fontStyle: 'normal',
    fontWeight: 'bold',
    padding: 3,
    rotations: 4,
    rotationAngles: [-45, 0, 45, 90] as [number, number, number, number],
    scale: 'log' as const,
    spiral: 'rectangular' as const,
    transitionDuration: 1500,
    getWordTooltip: (word: WordCloudWord) => {
      return `✨ ${word.text}: ${word.value} ${word.value === 1 ? t('time') : t('times')} ✨`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-text-secondary flex flex-col items-center">
          <div className="w-12 h-12 mb-4 rounded-full bg-bg-secondary"></div>
          <div className="h-4 bg-bg-secondary rounded w-48 mb-2"></div>
          <div className="h-3 bg-bg-secondary rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {isActive ? (
        <div className="space-y-6">
          {!submitted ? (
            <>
              <motion.div 
                className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-teal-500/10 border border-purple-300/30 p-6 mb-6 rounded-xl backdrop-blur-sm"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center">
                  <motion.div 
                    className="flex-shrink-0 mr-4"
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      repeatType: "loop" 
                    }}
                  >
                    <div className="relative">
                      <Cloud className="h-8 w-8 text-purple-500" />
                      <Sparkles className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                    </div>
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-text-primary mb-1 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {t('participateInWordCloud')}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Comparte una palabra que represente tu opinión o sentimiento sobre el tema actual
                    </p>
                  </div>
                </div>
              </motion.div>
              
              <motion.form 
                onSubmit={handleSubmit} 
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <label htmlFor="word-input" className="block text-lg font-semibold text-text-primary mb-3">
                  {t('yourWord')}
                </label>
                <div className="relative">
                  <div className="flex space-x-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        id="word-input"
                        value={inputWord}
                        onChange={(e) => setInputWord(e.target.value)}
                        maxLength={20}
                        className="w-full px-4 py-3 text-lg border-2 border-purple-200 rounded-xl bg-white/80 backdrop-blur-sm text-gray-800 placeholder-gray-500 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all duration-300 shadow-lg"
                        placeholder={t('writeWord')}
                      />
                      <motion.div 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        animate={{ 
                          scale: inputWord.length > 0 ? [1, 1.2, 1] : 1,
                          rotate: inputWord.length > 0 ? [0, 10, -10, 0] : 0
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        <Star className={`h-5 w-5 ${inputWord.length > 0 ? 'text-yellow-400' : 'text-gray-300'}`} />
                      </motion.div>
                    </div>
                    <motion.button
                      type="submit"
                      disabled={!inputWord.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-2"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      animate={{
                        boxShadow: inputWord.trim() ? [
                          '0 4px 15px rgba(139, 92, 246, 0.3)',
                          '0 8px 25px rgba(139, 92, 246, 0.5)',
                          '0 4px 15px rgba(139, 92, 246, 0.3)'
                        ] : '0 4px 15px rgba(139, 92, 246, 0.1)'
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Send className="h-5 w-5" />
                      <span>{t('sendWord')}</span>
                      {inputWord.trim() && <Zap className="h-4 w-4 animate-pulse" />}
                    </motion.button>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <motion.p 
                      className="text-sm text-text-secondary"
                      animate={{ 
                        color: inputWord.length > 15 ? '#ef4444' : inputWord.length > 10 ? '#f59e0b' : '#6b7280'
                      }}
                    >
                      {t('charactersCount')}: {inputWord.length}/20
                    </motion.p>
                    <motion.div 
                      className="flex space-x-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: inputWord.length > 0 ? 1 : 0 }}
                    >
                      {[...Array(Math.min(5, Math.ceil(inputWord.length / 4)))].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-purple-400 rounded-full"
                          animate={{ 
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{ 
                            duration: 1, 
                            repeat: Infinity, 
                            delay: i * 0.2 
                          }}
                        />
                      ))}
                    </motion.div>
                  </div>
                </div>
              </motion.form>
            </>
          ) : (
            <motion.div 
              className="bg-gradient-to-r from-green-400/20 via-emerald-400/20 to-teal-400/20 border border-green-300/50 p-6 mb-6 rounded-xl backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
            >
              <div className="flex items-center">
                <motion.div 
                  className="flex-shrink-0 mr-4"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    rotate: [0, 360]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    repeatType: "loop"
                  }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-400 rounded-full blur-md opacity-50 animate-pulse"></div>
                    <Cloud className="h-8 w-8 text-green-500 relative z-10" />
                    <motion.div
                      className="absolute -top-1 -right-1"
                      animate={{ 
                        scale: [1, 1.5, 1],
                        rotate: [0, 180, 360]
                      }}
                      transition={{ 
                        duration: 1, 
                        repeat: Infinity 
                      }}
                    >
                      <Sparkles className="h-4 w-4 text-yellow-400" />
                    </motion.div>
                  </div>
                </motion.div>
                <div className="flex-1">
                  <motion.h3 
                    className="text-lg font-bold text-green-600 mb-1"
                    animate={{ 
                      textShadow: [
                        '0 0 0px rgba(34, 197, 94, 0)',
                        '0 0 10px rgba(34, 197, 94, 0.5)',
                        '0 0 0px rgba(34, 197, 94, 0)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ¡Palabra enviada con éxito!
                  </motion.h3>
                  <p className="text-sm text-text-secondary">
                    {t('wordAddedSuccess')} Tu contribución ya forma parte de la nube de palabras.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          
          <motion.div 
            className="bg-gradient-to-br from-white/90 to-purple-50/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-purple-200/50"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="p-6 border-b border-purple-200/50 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center">
                  <Cloud className="h-6 w-6 mr-2 text-purple-500" />
                  {t('realTimeWordCloud')}
                </h3>
                <motion.div 
                  className="flex items-center space-x-2 text-sm text-purple-600"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>En vivo</span>
                </motion.div>
              </div>
            </div>
            <div className="relative p-8" style={{ height: '500px' }}>
              {wordCloudData.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                  className="h-full relative"
                >
                  {/* Fondo con efectos */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 via-blue-100/30 to-teal-100/30 rounded-xl"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_70%)] rounded-xl"></div>
                  
                  {/* Nube de palabras */}
                  <div className="relative z-10 h-full">
                    <ReactWordcloud words={wordCloudData} options={options} />
                  </div>
                  
                  {/* Partículas flotantes */}
                  {[...Array(6)].map((_, i) => (
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
                  
                  {/* Notificación de palabra nueva */}
                  <AnimatePresence>
                    {newWords.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.5, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: -50 }}
                        transition={{ duration: 0.6, type: "spring", bounce: 0.5 }}
                        className="absolute bottom-6 right-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm shadow-xl flex items-center space-x-2"
                      >
                        <Sparkles className="h-4 w-4 animate-spin" />
                        <span>{t('newWordAdded')}</span>
                        <motion.div
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          ✨
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                    {t('wordCloudEmpty')}
                  </motion.h3>
                  <motion.p 
                    className="text-text-secondary text-center max-w-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    ¡Sé el primero en participar! Envía una palabra para comenzar a crear la nube colaborativa.
                  </motion.p>
                  {/* Indicador de espera animado */}
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
      ) : (
        <motion.div 
          className="bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 rounded-2xl p-12 text-center shadow-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity 
            }}
            className="mb-6"
          >
            <Cloud className="h-16 w-16 text-gray-400 mx-auto" />
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-600 mb-3">{t('wordCloudInactive')}</h3>
          <p className="text-gray-500 text-lg max-w-md mx-auto">
            La nube de palabras no está activa en este momento. Espera a que el administrador la active para participar.
          </p>
          <motion.div 
            className="flex justify-center space-x-2 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-gray-400 rounded-full"
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.8, 0.3]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  delay: i * 0.4 
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default WordCloudParticipant;
