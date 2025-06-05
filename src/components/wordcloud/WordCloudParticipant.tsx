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
      '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ],
    enableTooltip: true,
    deterministic: false,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSizes: [16, 64] as [number, number],
    fontStyle: 'normal',
    fontWeight: 'normal',
    padding: 2,
    rotations: 2,
    rotationAngles: [-45, 45] as [number, number],
    scale: 'log' as const,
    spiral: 'rectangular' as const,
    transitionDuration: 1000,
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
              <div className="card animate-fadeInUp mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mr-4">
                    <Cloud className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-text-primary mb-1">
                      {t('participateInWordCloud')}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Comparte una palabra que represente tu opinión o sentimiento sobre el tema actual
                    </p>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="mb-8 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                <label htmlFor="word-input" className="block text-base font-medium text-text-primary mb-3">
                  {t('yourWord')}
                </label>
                <div className="flex space-x-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      id="word-input"
                      value={inputWord}
                      onChange={(e) => setInputWord(e.target.value)}
                      maxLength={20}
                      className="input-field w-full text-base"
                      placeholder={t('writeWord')}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!inputWord.trim()}
                    className="btn-primary px-6 py-2.5 flex items-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>{t('sendWord')}</span>
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className={`text-sm transition-colors duration-normal ${
                    inputWord.length > 15 ? 'text-error' :
                    inputWord.length > 10 ? 'text-warning' :
                    'text-text-muted'
                  }`}>
                    {t('charactersCount')}: {inputWord.length}/20
                  </p>
                </div>
              </form>
            </>
          ) : (
            <div className="card bg-success-light border-success/30 mb-6 animate-fadeInScale">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center mr-4">
                  <Cloud className="h-5 w-5 text-success" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-success mb-1">
                    ¡Palabra enviada con éxito!
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {t('wordAddedSuccess')} Tu contribución ya forma parte de la nube de palabras.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="card animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-light">
              <h3 className="text-lg font-semibold text-text-primary flex items-center">
                <Cloud className="h-5 w-5 mr-2 text-accent" />
                {t('realTimeWordCloud')}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-text-muted">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse-subtle"></div>
                <span>En vivo</span>
              </div>
            </div>
            <div className="relative" style={{ height: '400px' }}>
              {wordCloudData.length > 0 ? (
                <div className="h-full relative animate-fadeIn">
                  <ReactWordcloud words={wordCloudData} options={options} />
                  
                  {/* Notificación de palabra nueva */}
                  {newWords.length > 0 && (
                    <div className="absolute bottom-4 right-4 bg-accent text-white px-3 py-2 rounded-lg text-sm shadow-lg flex items-center space-x-2 animate-fadeInScale">
                      <Sparkles className="h-4 w-4" />
                      <span>{t('newWordAdded')}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="mb-6 animate-float">
                    <Cloud className="h-16 w-16 text-text-muted mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2 animate-fadeIn">
                    {t('wordCloudEmpty')}
                  </h3>
                  <p className="text-text-secondary max-w-sm animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                    ¡Sé el primero en participar! Envía una palabra para comenzar a crear la nube colaborativa.
                  </p>
                  <div className="flex space-x-2 mt-6">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-accent rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center max-w-md">
            <div className="card animate-fadeInScale">
              <div className="mb-6 animate-float">
                <Cloud className="h-12 w-12 text-text-muted mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-3">{t('wordCloudInactive')}</h3>
              <p className="text-text-secondary mb-6">
                La nube de palabras no está activa en este momento. Espera a que el administrador la active para participar.
              </p>
              <div className="flex justify-center space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-accent rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordCloudParticipant;
