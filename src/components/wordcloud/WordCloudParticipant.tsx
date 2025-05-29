import React, { useState, useEffect, useRef } from 'react';
import { Send, Cloud } from 'lucide-react';
import { useWordCloudStore } from '../../store/wordCloudStore';
import ReactWordcloud from 'react-wordcloud';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const WordCloudParticipant: React.FC = () => {
  const { t } = useTranslation();
  const { isActive, words, addWord, fetchWords } = useWordCloudStore();
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
    
    // Configurar socket para escuchar actualizaciones en tiempo real
    // Esto se implementaría con socket.io
    
    return () => {
      // Limpiar socket
    };
  }, [fetchWords]);
  
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
    colors: ['#8b9dff', '#6f80ff', '#5363ff', '#3746ff', '#1b29ff'], // Blue shades
    enableTooltip: true,
    deterministic: false,
    fontFamily: 'impact',
    fontSizes: [15, 70] as [number, number], // Adjusted font sizes
    fontStyle: 'normal',
    fontWeight: 'normal',
    padding: 1,
    rotations: 2, // Reduced rotations
    rotationAngles: [0, 45] as [number, number], // Adjusted rotation angles
    scale: 'sqrt' as const, // Changed scale for better differentiation
    spiral: 'archimedean' as const,
    transitionDuration: 1000, // Increased transition duration
    // Callbacks para animar palabras
    getWordTooltip: (word: WordCloudWord) => {
      return `${word.text}: ${word.value} ${word.value === 1 ? t('time') : t('times')}`;
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
              <div className="bg-accent/10 border-l-4 border-accent p-4 mb-6 rounded-r-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Cloud className="h-5 w-5 text-accent" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-text-primary">
                      {t('participateInWordCloud')}
                    </p>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="mb-8">
                <label htmlFor="word-input" className="block text-sm font-medium text-text-primary mb-1">
                  {t('yourWord')}
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="word-input"
                    value={inputWord}
                    onChange={(e) => setInputWord(e.target.value)}
                    maxLength={20}
                    className="flex-1 shadow-sm focus:ring-accent focus:border-accent block w-full sm:text-sm border-border-color rounded-md bg-bg-primary text-text-primary"
                    placeholder={t('writeWord')}
                  />
                  <motion.button
                    type="submit"
                    disabled={!inputWord.trim()}
                    className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-button-text bg-accent hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {t('sendWord')}
                  </motion.button>
                </div>
                <p className="mt-1 text-xs text-text-secondary">
                  {t('charactersCount')}: {inputWord.length}/20
                </p>
              </form>
            </>
          ) : (
            <motion.div 
              className="bg-green-500/10 border-l-4 border-green-500 p-4 mb-6 rounded-r-md"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      repeatType: "loop", 
                      repeatDelay: 2 
                    }}
                  >
                    <Cloud className="h-5 w-5 text-green-500" />
                  </motion.div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-text-primary">
                    {t('wordAddedSuccess')}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          
          <div className="bg-bg-primary rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 border-b border-border-color bg-bg-secondary">
              <h3 className="text-sm font-medium text-text-primary">{t('realTimeWordCloud')}</h3>
            </div>
            <div className="p-6" style={{ height: '400px' }}>
              {wordCloudData.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="h-full"
                >
                  <ReactWordcloud words={wordCloudData} options={options} />
                  
                  {/* Animaciones para palabras nuevas */}
                  <AnimatePresence>
                    {newWords.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute bottom-4 right-4 bg-accent text-button-text px-3 py-1 rounded-full text-sm shadow-lg"
                      >
                        {t('newWordAdded')}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <motion.p 
                    className="text-text-secondary text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {t('wordCloudEmpty')}
                  </motion.p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-bg-secondary border border-border-color rounded-md p-6 text-center">
          <Cloud className="h-12 w-12 text-text-secondary opacity-50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">{t('wordCloudInactive')}</h3>
          <p className="text-text-secondary">
            {t('wordCloudInactive')}
          </p>
        </div>
      )}
    </div>
  );
};

export default WordCloudParticipant;
