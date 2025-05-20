import React, { useEffect, useState } from 'react';
import { useQuestionStore } from '../store/questionStore';
import { useParticipantStore } from '../store/participantStore';
import { useQuizConfigStore } from '../store/quizConfigStore';
import { Clock, QrCode, X, Check, Award } from 'lucide-react';
import TimerSound from '../components/TimerSound';
import QRCode from 'react-qr-code';
import ParticipantRanking from '../components/ParticipantRanking';
import io from 'socket.io-client';

export default function AudienceView() {
  const { 
    currentQuestion, 
    votes, 
    submitVote, 
    hasVoted,
    setHasVoted,
    timeRemaining
  } = useQuestionStore();
  
  const { config, getConfig, isRankingVisible } = useQuizConfigStore();
  const { currentParticipant, logout } = useParticipantStore();
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [timerWarning, setTimerWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  // Cargar la configuración del quiz
  useEffect(() => {
    getConfig();
  }, [getConfig]);
  
  // Escuchar eventos de Socket.IO para mostrar/ocultar el ranking
  useEffect(() => {
    // Crear un nuevo socket para escuchar eventos
    const socket = io({
      path: '/socket.io',
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    // Evento para mostrar el ranking
    socket.on('show_ranking', () => {
      console.log('Recibido evento para mostrar ranking');
      useQuizConfigStore.setState({ isRankingVisible: true });
    });
    
    // Evento para ocultar el ranking
    socket.on('hide_ranking', () => {
      console.log('Recibido evento para ocultar ranking');
      useQuizConfigStore.setState({ isRankingVisible: false });
    });
    
    return () => {
      // Limpiar listeners al desmontar
      socket.off('show_ranking');
      socket.off('hide_ranking');
      socket.disconnect();
    };
  }, []);

  // Cargar estado de voto desde localStorage cuando cambia la pregunta
  useEffect(() => {
    if (currentQuestion) {
      // Limpiar siempre la selección para preguntas nuevas
      setSelectedOption(null);
      setHasVoted(false);
      
      // Solo cargar el estado de localStorage si el usuario realmente ha votado anteriormente
      const voteKey = 'hasVoted_' + currentQuestion._id;
      const optionKey = 'selectedOption_' + currentQuestion._id;
      
      const hasVotedInStorage = localStorage.getItem(voteKey) === 'true';
      const selectedOptionInStorage = localStorage.getItem(optionKey);
      
      console.log('Estado de voto al cargar:', {
        id: currentQuestion._id,
        hasVotedInStorage,
        selectedOptionInStorage
      });
      
      // Sólo restaurar el estado de voto si realmente existe en localStorage Y los dos valores son válidos
      if (hasVotedInStorage && selectedOptionInStorage && ['a', 'b', 'c'].includes(selectedOptionInStorage)) {
        setHasVoted(true);
        setSelectedOption(selectedOptionInStorage);
      } else {
        // Asegurarnos de que no haya ninguna opción seleccionada
        localStorage.removeItem(voteKey);
        localStorage.removeItem(optionKey);
        setSelectedOption(null);
        setHasVoted(false);
      }
    }
  }, [currentQuestion, setHasVoted]);

  // Reiniciar el estado de selección y voto cuando cambia la pregunta activa o su estado
  useEffect(() => {
    // Este efecto se mantiene por compatibilidad, pero ahora el estado principal viene del localStorage
    // y se controla en el efecto de arriba
  }, [currentQuestion?._id, currentQuestion?.is_active, currentQuestion?.votingClosed]);

  // Efecto para cambiar la clase de animación cada 5 segundos
  useEffect(() => {
    const animations = [
      'animate-fadeIn',
      'animate-bounce',
      'animate-pulse',
      'animate-pulse-slow'
    ];
    let index = 0;
    
    const interval = setInterval(() => {
      setAnimationClass(animations[index]);
      index = (index + 1) % animations.length;
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Activar/desactivar el sonido del temporizador cuando queden pocos segundos
  useEffect(() => {
    if (!currentQuestion) return;
    
    if (timeRemaining !== null && timeRemaining <= 5 && timeRemaining > 0) {
      setTimerWarning(true);
      setShowTimer(true);
    } else {
      setTimerWarning(false);
      if (timeRemaining === null || timeRemaining === 0) {
        setShowTimer(false);
      }
    }
  }, [timeRemaining, currentQuestion]);

  const handleLogout = () => {
    logout();
  };

  const calculateStats = () => {
    const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);
    
    // Si no hay pregunta activa o está cerrada, mostrar los resultados
    const showResultsCondition = !currentQuestion || 
                                currentQuestion.votingClosed || 
                                (config.showRankings && hasVoted);
    
    const statsData = ['a', 'b', 'c'].map(option => {
      const count = votes[option] || 0;
      const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      return { option, count, percentage, showPercentage: showResultsCondition };
    });
    
    return { stats: statsData, totalVotes, showResults: showResultsCondition };
  };

  const handleVote = async (option: string) => {
    // Verificar si se puede votar:
    // - Debe haber una pregunta activa
    // - El usuario no debe haber votado ya
    // - La pregunta debe estar activa
    // - La votación no debe estar cerrada
    if (!currentQuestion || hasVoted || !currentQuestion.is_active || currentQuestion.votingClosed) return;

    // Normalizar la opción a minúscula para consistencia
    const normalizedOption = option.toLowerCase();
    
    // Solo actualizar el estado visual después de verificar que es una opción válida
    if (['a', 'b', 'c'].includes(normalizedOption)) {
      setSelectedOption(normalizedOption);
    } else {
      return; // No continuar si la opción no es válida
    }
    
    try {
      // Enviar voto al servidor
      await submitVote(currentQuestion._id, normalizedOption);
      
      // Sólo guardar en localStorage tras éxito en el servidor
      localStorage.setItem('hasVoted_' + currentQuestion._id, 'true');
      localStorage.setItem('selectedOption_' + currentQuestion._id, normalizedOption);
      
      // Actualizar el estado global
      setHasVoted(true);
      
      console.log('Voto registrado correctamente:', {
        id: currentQuestion._id,
        selectedOption: normalizedOption
      });
    } catch (error) {
      console.error('Error al enviar voto:', error);
      setError('Error al enviar tu voto. Intenta de nuevo.');
      // Revertir la selección visual si falla
      setSelectedOption(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Pantalla de conexión
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-950 to-blue-900 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/10 blur-3xl rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-400/10 blur-3xl rounded-full animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 blur-3xl rounded-full animate-spin-slow"></div>
        
        <div className="absolute top-4 right-4 z-20">
          <button 
            onClick={() => setShowQR(!showQR)}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-all shadow-lg shadow-blue-500/20"
          >
            {showQR ? <X className="h-6 w-6 text-white" /> : <QrCode className="h-6 w-6 text-white" />}
          </button>
        </div>
        
        {showQR ? (
          <div className="text-center bg-white/90 backdrop-blur-md p-8 rounded-xl shadow-2xl relative overflow-hidden z-10 animate-fadeIn">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 blur-sm opacity-50 rounded-xl"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-blue-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
                ¡Escanea para participar!
              </h2>
              <div className="p-3 bg-white rounded-lg shadow-inner mb-4">
                <QRCode 
                  value="https://iazarate.com" 
                  size={200} 
                  className="mx-auto"
                />
              </div>
              <p className="mt-4 text-gray-600 font-medium flex items-center justify-center">
                <span className="mr-2">iazarate.com</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center text-white relative z-10">
            <div className="mb-8 flex flex-col items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-8 bg-blue-500/20 blur-xl rounded-full animate-pulse-slow"></div>
                <img 
                  src="/escudo.png" 
                  alt="Escudo" 
                  className="h-36 mb-4 drop-shadow-2xl animate-fadeIn relative z-10"
                />
              </div>
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 blur-xl rounded-full"></div>
                <h1 className="text-5xl font-bold mb-3 relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-white">Quiz Interactivo</h1>
                <div className="h-1 w-32 mx-auto bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mb-3"></div>
                <p className="text-xl text-blue-200 relative z-10 font-medium">¡Prepárate para participar!</p>
              </div>
            </div>
            
            <div className="mb-10 relative">
              <div className="absolute -inset-4 bg-blue-500/10 blur-lg rounded-xl"></div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 relative z-10 shadow-xl">
                <h2 className={`text-2xl font-semibold ${animationClass}`}>
                  Esperando a que el presentador inicie una pregunta...
                </h2>
                
                <div className="mt-6 flex justify-center space-x-4">
                  <div className="animate-bounce delay-100 h-4 w-4 bg-blue-400 rounded-full shadow-lg shadow-blue-400/30"></div>
                  <div className="animate-bounce delay-300 h-4 w-4 bg-indigo-400 rounded-full shadow-lg shadow-indigo-400/30"></div>
                  <div className="animate-bounce delay-500 h-4 w-4 bg-purple-400 rounded-full shadow-lg shadow-purple-400/30"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Obtenemos los datos de la función calculateStats
  const { stats, showResults } = calculateStats();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Quiz en vivo</h1>
          {currentParticipant && (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                Participante: {currentParticipant.name}
              </span>
              <button 
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Salir
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {currentQuestion ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            {/* Temporizador */}
            {timeRemaining !== null && (
              <div className={`p-4 ${timerWarning ? 'bg-red-100' : 'bg-blue-50'} flex items-center justify-between border-b`}>
                <div className="flex items-center">
                  <Clock className={`h-5 w-5 ${timerWarning ? 'text-red-600' : 'text-blue-500'} mr-2`} />
                  <span className={`font-medium ${timerWarning ? 'text-red-600' : 'text-blue-700'}`}>
                    Tiempo restante: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                {showTimer && <TimerSound warning={timerWarning} />}
              </div>
            )}
            
            <div className="px-4 py-5 sm:p-6">
              {/* Contenido de la pregunta */}
              <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {currentQuestion.content}
              </h2>
              
              {currentQuestion.case && (
                <div className="bg-gray-50 rounded-md p-4 mb-6 text-sm text-gray-700 whitespace-pre-wrap">
                  {currentQuestion.case}
                </div>
              )}
              
              {/* Mensaje cuando no se seleccionó ninguna opción y la votación está cerrada */}
              {!selectedOption && currentQuestion.votingClosed && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center text-yellow-700">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-medium">No seleccionaste ninguna opción para esta pregunta.</span>
                  </div>
                </div>
              )}
              
              {/* Opciones */}
              <div className="space-y-4 mb-6">
                {['a', 'b', 'c'].map((option) => {
                  const optionKey = `option_${option}` as keyof typeof currentQuestion;
                  const optionContent = currentQuestion[optionKey] as string;
                  const statForOption = stats.find(s => s.option === option);
                  const isCorrect = currentQuestion.votingClosed && 
                                    currentQuestion.correct_option?.toLowerCase() === option;
                  const isSelected = selectedOption === option;

                  return (
                    <button
                      key={option}
                      onClick={() => !hasVoted && !currentQuestion.votingClosed && handleVote(option)}
                      disabled={hasVoted || currentQuestion.votingClosed || submitting}
                      className={`w-full text-left p-4 rounded-md flex items-start relative
                        ${hasVoted || currentQuestion.votingClosed ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50'}
                        ${isSelected && !hasVoted ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                        ${hasVoted && isSelected && !currentQuestion.votingClosed ? 'bg-blue-50 border border-blue-200' : ''}
                        ${isCorrect && currentQuestion.votingClosed ? 'bg-green-50 border border-green-200' : ''}
                        ${!isCorrect && hasVoted && isSelected && currentQuestion.votingClosed ? 'bg-red-50 border border-red-200' : ''}
                        ${!isSelected ? 'border border-gray-200' : ''}
                        ${showResults ? 'relative' : ''}
                      `}
                    >
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className={`flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full mr-3 text-sm
                            ${isCorrect && currentQuestion.votingClosed ? 'bg-green-500 text-white' : 
                              isSelected && hasVoted && !isCorrect && currentQuestion.votingClosed ? 'bg-red-500 text-white' : 
                              isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}
                          `}>
                            {option.toUpperCase()}
                          </span>
                          <span className={`font-medium ${isCorrect && currentQuestion.votingClosed ? 'text-green-700' : 
                            isSelected && hasVoted && !isCorrect && currentQuestion.votingClosed ? 'text-red-700' : 'text-gray-700'}`}>
                            {optionContent}
                          </span>
                          {isCorrect && currentQuestion.votingClosed && (
                            <span className="ml-2 text-green-600 flex items-center">
                              <Check className="h-4 w-4 mr-1" />
                              Correcta
                            </span>
                          )}
                          </div>
                      </div>
                      
                      {statForOption?.showPercentage && (
                        <div className="mt-1 text-sm text-gray-500">
                          {statForOption.count} votos ({statForOption.percentage}%)
                        </div>
                      )}
                      
                      {statForOption?.showPercentage && (
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${isCorrect && currentQuestion.votingClosed ? 'bg-green-500' : 
                              isSelected && hasVoted && !isCorrect && currentQuestion.votingClosed ? 'bg-red-500' : 
                              isSelected ? 'bg-blue-500' : 
                              statForOption.percentage > 50 ? 'bg-yellow-500' : 
                              statForOption.percentage > 20 ? 'bg-orange-500' : 'bg-blue-500'}`}
                            style={{ width: `${statForOption.percentage}%` }}
                          ></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Botón de enviar */}
              {!hasVoted && !currentQuestion.votingClosed && (
                <button
                  onClick={() => selectedOption && handleVote(selectedOption)}
                  disabled={!selectedOption || submitting}
                  className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Enviando...' : 'Enviar respuesta'}
                </button>
              )}
              
              {error && (
                <div className="mt-4 p-4 bg-red-50 rounded-md text-sm text-red-700">
                  {error}
                </div>
              )}

              {hasVoted && !currentQuestion.votingClosed && (
                <div className="mt-4 p-4 bg-green-50 rounded-md text-sm text-green-700 flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  Tu respuesta ha sido registrada. Esperando resultados...
                </div>
              )}

              {currentQuestion.votingClosed && currentQuestion.explanation && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-md border border-yellow-200">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">Explicación:</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{currentQuestion.explanation}</p>
                  
                          {currentQuestion.explanation_image && (
                            <div className="mt-4">
                              <img 
                                src={currentQuestion.explanation_image} 
                        alt="Explicación"
                        className="max-w-full h-auto rounded-md"
                              />
                            </div>
                          )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6 text-center">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Esperando a que comience la siguiente pregunta...
              </h2>
              <p className="text-gray-500">
                El presentador iniciará la próxima pregunta en breve. Mantén esta página abierta.
              </p>
        </div>
      </div>
        )}
      </main>

      {/* Modal para mostrar la clasificación si está habilitada y visible */}
      {config.showRankings && isRankingVisible && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn transition-all duration-300">
          <div 
            className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200"
            style={{ maxWidth: '95vw' }}
          >
            <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-3">
              <h3 className="text-xl font-semibold flex items-center text-gray-800">
                <Award className="h-6 w-6 mr-2 text-yellow-500" />
                Clasificación Actual
              </h3>
              <button 
                onClick={() => useQuizConfigStore.setState({ isRankingVisible: false })}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-full hover:bg-gray-100 p-1"
                aria-label="Cerrar clasificación"
              >
                <X size={20} />
              </button>
            </div>
            <div className="rounded-lg overflow-hidden">
              <ParticipantRanking className="shadow-none border-0 bg-transparent" />
            </div>
          </div>
        </div>
      )}

      {/* Contenedor para el QR Code (modal) */}
    </div>
  );
}