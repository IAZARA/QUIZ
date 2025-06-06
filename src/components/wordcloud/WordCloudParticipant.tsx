import React, { useState, useEffect, useRef } from 'react';
import { Send, Cloud, Sparkles, Zap, Star } from 'lucide-react';
import { useWordCloudStore } from '../../store/wordCloudStore';
import ReactWordcloud from 'react-wordcloud';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useMobileGestures } from '../../hooks/useMobileGestures';
import { useMobileViewport, useVirtualKeyboard } from '../../hooks/useMobileViewport';

const WordCloudParticipant: React.FC = () => {
  const { t } = useTranslation();
  const { isActive, words, addWord, fetchWords, initializeSocket } = useWordCloudStore();
  const [inputWord, setInputWord] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newWords, setNewWords] = useState<string[]>([]);
  const [showGestureHint, setShowGestureHint] = useState(false);
  const [gestureEffect, setGestureEffect] = useState<string | null>(null);
  const prevWordsRef = useRef<Array<{text: string, count: number}>>([]);
  
  // Hooks para optimización móvil
  const viewport = useMobileViewport();
  const isKeyboardOpen = useVirtualKeyboard();

  // Configurar gestos táctiles
  const gestureRef = useMobileGestures({
    onSwipeUp: () => {
      if (inputWord.trim() && !submitted && isActive) {
        setGestureEffect('swipe-up');
        setTimeout(() => setGestureEffect(null), 500);
        handleSubmit(new Event('submit') as any);
      } else {
        // Mostrar feedback visual si no se puede enviar
        setGestureEffect('swipe-disabled');
        setTimeout(() => setGestureEffect(null), 300);
      }
    },
    onDoubleTap: () => {
      if (!submitted) {
        setGestureEffect('double-tap');
        setTimeout(() => setGestureEffect(null), 300);
        setShowGestureHint(true);
        setTimeout(() => setShowGestureHint(false), 3000);
      }
    }
  });

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
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
      '#14b8a6', '#f472b6', '#a855f7', '#22c55e', '#fb7185'
    ],
    enableTooltip: false, // Desactivado para móvil
    deterministic: true, // Más consistente en móvil
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSizes: [14, 56] as [number, number], // Rango optimizado para móvil
    fontStyle: 'normal',
    fontWeight: 'bold',
    padding: 1, // Menos padding para aprovechar espacio
    rotations: 1, // Menos rotaciones para mejor legibilidad
    rotationAngles: [0, 90] as [number, number], // Solo horizontal y vertical
    scale: 'log' as const,
    spiral: 'rectangular' as const,
    transitionDuration: 800, // Más rápido para móvil
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
    <div
      ref={gestureRef as any}
      className={`mobile-wordcloud-container h-full w-full flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 ${
        isKeyboardOpen ? 'keyboard-open' : ''
      } ${gestureEffect ? `gesture-${gestureEffect}` : ''}`}
      style={{
        height: isKeyboardOpen ? `${viewport.height}px` : '100vh'
      }}
    >
      {/* Indicador visual de gestos */}
      {gestureEffect && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          {gestureEffect === 'swipe-up' && (
            <div className="bg-green-600 text-white px-6 py-3 rounded-full animate-fadeInScale shadow-lg border-2 border-green-400">
              ↑ Enviando...
            </div>
          )}
          {gestureEffect === 'swipe-disabled' && (
            <div className="bg-orange-500 text-white px-6 py-3 rounded-full animate-fadeInScale shadow-lg border-2 border-orange-300">
              ⚠️ Escribe una palabra primero
            </div>
          )}
          {gestureEffect === 'double-tap' && (
            <div className="bg-blue-600 text-white px-6 py-3 rounded-full animate-fadeInScale shadow-lg border-2 border-blue-400">
              👆 Gesto detectado
            </div>
          )}
        </div>
      )}
      {isActive ? (
        <>
          {/* Área principal de la nube de palabras - ocupa la mayor parte de la pantalla */}
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0 p-4">
              {wordCloudData.length > 0 ? (
                <div className="h-full relative">
                  <ReactWordcloud words={wordCloudData} options={options} />
                  
                  {/* Indicador de estado en vivo - discreto */}
                  <div className="absolute top-4 left-4 flex items-center space-x-2 bg-white/90 backdrop-blur-md rounded-full px-3 py-1.5 border border-gray-200 shadow-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-subtle"></div>
                    <span className="text-xs font-medium text-gray-700">En vivo</span>
                  </div>
                  
                  {/* Notificación de palabra nueva */}
                  {newWords.length > 0 && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-accent text-white px-4 py-2 rounded-full text-sm shadow-lg flex items-center space-x-2 animate-fadeInScale z-10">
                      <Sparkles className="h-4 w-4" />
                      <span>¡Nueva palabra!</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <div className="mb-8 animate-float">
                    <Cloud className="h-20 w-20 text-gray-400 mx-auto opacity-60" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 animate-fadeIn">
                    {t('wordCloudEmpty')}
                  </h3>
                  <p className="text-gray-600 text-center animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                    ¡Sé el primero en participar!<br />
                    Envía una palabra para comenzar
                  </p>
                  <div className="flex space-x-2 mt-6">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Zona de entrada optimizada para el pulgar - parte inferior */}
          <div className="mobile-input-zone bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg">
            <div className="safe-area-bottom p-4">
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* Instrucción minimalista con hint de gestos */}
                  <div className="text-center relative">
                    <p className="text-sm text-gray-700 mb-1">
                      Comparte una palabra sobre el tema
                    </p>
                    <p className="text-xs text-gray-500 opacity-80">
                      💡 Toca dos veces para ver tips • Desliza ↑ para enviar rápido
                    </p>
                    {showGestureHint && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm animate-fadeInScale shadow-lg">
                        <div className="text-center">
                          <div className="mb-1">🚀 Gestos disponibles:</div>
                          <div className="text-xs">
                            • Desliza hacia arriba para enviar<br/>
                            • Toca dos veces para ver este tip
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Input y botón optimizados para móvil */}
                  <div className="flex space-x-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={inputWord}
                        onChange={(e) => setInputWord(e.target.value)}
                        maxLength={20}
                        className="w-full px-4 py-3 text-lg bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-800 shadow-sm"
                        placeholder="Tu palabra..."
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!inputWord.trim()}
                      className="mobile-touch-target mobile-touch-feedback px-6 py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2 min-w-[80px] justify-center shadow-lg"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Contador de caracteres */}
                  <div className="flex justify-center">
                    <span className={`text-xs transition-colors duration-200 ${
                      inputWord.length > 15 ? 'text-red-500' :
                      inputWord.length > 10 ? 'text-orange-500' :
                      'text-gray-500'
                    }`}>
                      {inputWord.length}/20
                    </span>
                  </div>
                </form>
              ) : (
                <div className="text-center py-4">
                  <div className="inline-flex items-center space-x-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 shadow-sm">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Cloud className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-semibold text-green-700">
                        ¡Palabra enviada!
                      </h3>
                      <p className="text-xs text-gray-600">
                        Ya forma parte de la nube
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="h-full flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="mb-8 animate-float">
              <Cloud className="h-16 w-16 text-gray-400 mx-auto opacity-60" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('wordCloudInactive')}</h3>
            <p className="text-gray-600 text-center">
              La nube de palabras no está activa en este momento. Espera a que el administrador la active para participar.
            </p>
            <div className="flex justify-center space-x-2 mt-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordCloudParticipant;
