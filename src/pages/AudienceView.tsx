import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuestionStore } from '../store/questionStore';
import { useParticipantStore } from '../store/participantStore';
import { useQuizConfigStore } from '../store/quizConfigStore';
import { useWordCloudStore } from '../store/wordCloudStore';
import { useTournamentStore } from '../store/tournamentStore';
import { useContactStore } from '../store/contactStore';
import { Clock, QrCode, X, Check, Award, Cloud, Trophy, AlertCircle } from 'lucide-react'; // Added AlertCircle
import TimerSound from '../components/TimerSound';
import QRCode from 'react-qr-code';
import ParticipantRanking from '../components/ParticipantRanking';
import WordCloudParticipant from '../components/wordcloud/WordCloudParticipant';
import TournamentAudienceView from '../components/tournament/TournamentAudienceView';
import ContactsAudienceView from '../components/contacts/ContactsAudienceView';
import DocumentDownloadList from '../components/DocumentDownloadList'; // Import DocumentDownloadList
import io from 'socket.io-client';
import { playSound } from '../utils/soundManager';

export default function AudienceView() {
  const { t } = useTranslation();
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
  const { isActive: isWordCloudActive } = useWordCloudStore();
  const { isActive: isTournamentActive } = useTournamentStore();
  const { loadContacts } = useContactStore();
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [timerWarning, setTimerWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  // animationClass state is removed

  const prevQuestionIdRef = useRef<string | null | undefined>(null);
  const isInitialRenderQRRef = useRef(true);
  const prevIsRankingVisibleRef = useRef(config.isRankingVisible);


  // Cargar la configuración del quiz y contactos
  useEffect(() => {
    getConfig();
    loadContacts();
  }, [getConfig, loadContacts]);
  
  // Escuchar eventos de Socket.IO para mostrar/ocultar el ranking y actualizar la nube de palabras
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
    
    // Eventos para la nube de palabras
    socket.on('wordcloud:status', (data) => {
      console.log('Recibido evento de estado de nube de palabras:', data);
      useWordCloudStore.setState({ isActive: data.isActive });
    });
    
    socket.on('wordcloud:update', (words) => {
      console.log('Recibida actualización de nube de palabras');
      useWordCloudStore.setState({ words });
    });
    
    // Notificar que el participante se unió a la nube de palabras
    socket.emit('wordcloud:join');
    
    return () => {
      // Limpiar listeners al desmontar
      socket.off('show_ranking');
      socket.off('hide_ranking');
      socket.off('wordcloud:status');
      socket.off('wordcloud:update');
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

  // Sound for new question
  useEffect(() => {
    if (currentQuestion && currentQuestion._id !== prevQuestionIdRef.current) {
      playSound('new_question.mp3');
    }
    prevQuestionIdRef.current = currentQuestion?._id;
  }, [currentQuestion]);

  // Sound for QR code modal
  useEffect(() => {
    if (isInitialRenderQRRef.current) {
      isInitialRenderQRRef.current = false;
    } else {
      playSound('ui_click.mp3');
    }
  }, [showQR]);

  // Sound for ranking modal
  useEffect(() => {
    if (isRankingVisible && !prevIsRankingVisibleRef.current) {
      playSound('ui_click.mp3');
    }
    prevIsRankingVisibleRef.current = isRankingVisible;
  }, [isRankingVisible]);

// Removed useEffect for cycling animationClass

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
      playSound('vote_confirm.mp3');
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
      <div className="min-h-screen bg-gradient-to-b from-bg-primary to-bg-secondary flex flex-col items-center justify-center relative overflow-hidden text-text-primary">
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/10 blur-3xl rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 blur-3xl rounded-full animate-pulse-slow delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 blur-3xl rounded-full animate-spin-slow"></div>
        
        <div className="absolute top-4 right-4 z-20">
          <button 
            onClick={() => setShowQR(!showQR)}
            className="bg-bg-primary/20 dark:bg-bg-primary/30 hover:bg-bg-primary/30 dark:hover:bg-bg-primary/40 p-2 rounded-full transition-all shadow-lg shadow-accent/20"
          >
            {showQR ? <X className="h-6 w-6 text-text-primary" /> : <QrCode className="h-6 w-6 text-text-primary" />}
          </button>
        </div>
        
        {showQR ? (
          <div 
            className="text-center bg-bg-primary/90 backdrop-blur-md p-8 rounded-xl shadow-2xl relative overflow-hidden z-10 animate-fadeIn"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qrModalTitle"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-accent to-accent/80 blur-sm opacity-50 rounded-xl"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-accent/80"></div>
            <div className="relative z-10">
              <h2 id="qrModalTitle" className="text-2xl font-bold text-text-primary mb-4 bg-clip-text text-transparent bg-gradient-to-r from-accent to-text-primary">
                {t('scanToParticipate')}
              </h2>
              <div className="p-3 bg-bg-primary rounded-lg shadow-inner mb-4">
                <QRCode 
                  value="https://iazarate.com" 
                  size={200} 
                  className="mx-auto"
                />
              </div>
              <p className="mt-4 text-text-secondary font-medium flex items-center justify-center">
                <span className="mr-2">iazarate.com</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center text-text-primary relative z-10">
            <div className="mb-8 flex flex-col items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-8 bg-accent/20 blur-xl rounded-full animate-pulse-slow"></div>
                <img 
                  src="/escudo.png" 
                  alt={t('appLogoDescription')}
                  className="h-36 mb-4 drop-shadow-2xl animate-fadeIn relative z-10"
                />
              </div>
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-r from-accent/20 to-accent/10 blur-xl rounded-full"></div>
                <h1 className="text-5xl font-bold mb-3 relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-text-primary to-text-secondary">{t('interactiveQuiz')}</h1>
                <div className="h-1 w-32 mx-auto bg-gradient-to-r from-accent to-accent/70 rounded-full mb-3"></div>
                <p className="text-xl text-text-secondary relative z-10 font-medium">{t('getReadyToParticipate')}</p>
              </div>
            </div>
            
            <div className="mb-10 relative">
              <div className="absolute -inset-4 bg-accent/10 blur-lg rounded-xl"></div>
              <div className="bg-bg-primary/5 dark:bg-bg-primary/10 backdrop-blur-sm border border-border-color/30 rounded-xl p-6 relative z-10 shadow-xl">
                <h2 className="text-2xl font-semibold text-text-primary animate-fadeIn">
                  {t('waitingForPresenter')}
                </h2>
                
                <div className="mt-6 flex justify-center space-x-4">
                  <div className="animate-bounce delay-100 h-4 w-4 bg-accent rounded-full shadow-lg shadow-accent/30"></div>
                  <div className="animate-bounce delay-300 h-4 w-4 bg-accent/80 rounded-full shadow-lg shadow-accent/30"></div>
                  <div className="animate-bounce delay-500 h-4 w-4 bg-accent/60 rounded-full shadow-lg shadow-accent/30"></div>
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
    <div className="min-h-screen bg-bg-secondary text-text-primary">
      <header className="bg-bg-primary shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-text-primary">{t('liveQuiz')}</h1>
          {currentParticipant && (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-text-secondary">
                {t('participant')}: {currentParticipant.name}
              </span>
              <button 
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400" // Semantic color kept
              >
                {t('logoutButton')}
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Mostrar la nube de palabras si está activa */}
        {isTournamentActive ? (
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="bg-bg-primary shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg leading-6 font-medium text-text-primary flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-amber-500" /> {/* Semantic color kept */}
                    {t('tournamentInProgress')}
                  </h2>
                </div>
                <TournamentAudienceView />
              </div>
            </div>
          </div>
        ) : isWordCloudActive ? (
          <div className="bg-bg-primary shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg leading-6 font-medium text-text-primary flex items-center">
                  <Cloud className="h-5 w-5 text-accent mr-2" />
                  {t('interactiveWordCloud')}
                </h2>
              </div>
              <WordCloudParticipant />
            </div>
          </div>
        ) : null}
        
        {currentQuestion ? (
          <div className="bg-bg-primary shadow overflow-hidden sm:rounded-lg">
            {/* Temporizador */}
            {timeRemaining !== null && (
              <div className={`p-4 ${timerWarning ? 'bg-red-100 dark:bg-red-500/20' : 'bg-accent/10 dark:bg-accent/20'} flex items-center justify-between border-b border-border-color`}>
                <div className="flex items-center">
                  <Clock className={`h-5 w-5 ${timerWarning ? 'text-red-600 dark:text-red-400' : 'text-accent'} mr-2`} />
                  <span className={`font-medium ${timerWarning ? 'text-red-600 dark:text-red-400' : 'text-accent'}`}>
                    {t('timeRemaining')}: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                {showTimer && <TimerSound warning={timerWarning} />}
              </div>
            )}
            
            <div className="px-4 py-5 sm:p-6">
              {/* Contenido de la pregunta */}
              <h2 className="text-lg leading-6 font-medium text-text-primary mb-4">
                {currentQuestion.content}
              </h2>
              
              {currentQuestion.case && (
                <div className="bg-bg-secondary rounded-md p-4 mb-6 text-sm text-text-secondary whitespace-pre-wrap">
                  {currentQuestion.case}
                </div>
              )}
              
              {/* Mensaje cuando no se seleccionó ninguna opción y la votación está cerrada */}
              {!selectedOption && currentQuestion.votingClosed && (
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                  <div className="flex items-center text-yellow-700 dark:text-yellow-400">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-medium">{t('noOptionSelected')}</span>
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

                  // Dynamically build classes
                  let buttonClasses = `w-full text-left p-4 rounded-md flex items-start relative transition-all duration-150 ease-in-out border `;
                  let optionLetterClasses = `flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full mr-3 text-sm font-medium `;
                  let optionTextClasses = `font-medium `; // Base text color will be inherited or set by specific states
                  let correctIndicatorTextClasses = `ml-2 flex items-center `;

                  if (hasVoted || currentQuestion.votingClosed) { // Voted or results shown
                    buttonClasses += 'cursor-default ';
                    if (isSelected) { // This option was selected by the user
                      if (isCorrect) {
                        buttonClasses += 'bg-green-500/10 dark:bg-green-500/20 border-green-500/30 ';
                        optionLetterClasses += 'bg-green-500 text-white ';
                        optionTextClasses += 'text-green-600 dark:text-green-400 ';
                        correctIndicatorTextClasses += 'text-green-600 dark:text-green-400 ';
                      } else {
                        buttonClasses += 'bg-red-500/10 dark:bg-red-500/20 border-red-500/30 ';
                        optionLetterClasses += 'bg-red-500 text-white ';
                        optionTextClasses += 'text-red-600 dark:text-red-400 ';
                      }
                    } else { // This option was NOT selected by the user, but results are shown
                      buttonClasses += 'bg-bg-primary border-border-color ';
                      optionLetterClasses += 'bg-bg-secondary text-text-secondary ';
                      optionTextClasses += 'text-text-primary ';
                      if (isCorrect) { // If this unselected option was the correct one
                        buttonClasses += 'border-green-500/30 '; // Optionally highlight correct answer
                        optionTextClasses += 'text-green-700 dark:text-green-500 '; // Highlight text of correct answer
                        correctIndicatorTextClasses += 'text-green-600 dark:text-green-400 ';
                      }
                    }
                  } else { // Voting is open, user has not voted yet
                    buttonClasses += 'cursor-pointer hover:bg-bg-secondary border-border-color ';
                    optionLetterClasses += 'bg-bg-secondary text-text-secondary ';
                    optionTextClasses += 'text-text-primary ';
                    if (isSelected) { // User is currently selecting this option (before submitting vote)
                      buttonClasses += 'ring-2 ring-accent bg-accent/10 dark:bg-accent/20 border-accent ';
                      optionLetterClasses += 'bg-accent text-button-text ';
                      optionTextClasses += 'text-accent ';
                    }
                  }
                  
                  return (
                    <button
                      key={option}
                      onClick={() => !hasVoted && !currentQuestion.votingClosed && handleVote(option)}
                      disabled={hasVoted || currentQuestion.votingClosed || submitting}
                      className={buttonClasses.trim()}
                    >
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className={optionLetterClasses.trim()}>
                            {option.toUpperCase()}
                          </span>
                          <span className={optionTextClasses.trim()}>
                            {optionContent}
                          </span>
                          {isCorrect && currentQuestion.votingClosed && (
                            <span className={correctIndicatorTextClasses.trim()}>
                              <Check className="h-4 w-4 mr-1" />
                              {t('correctAnswer')}
                            </span>
                          )}
                          </div>
                      </div>
                      
                      {statForOption?.showPercentage && (
                        <div className="mt-1 text-sm text-text-secondary">
                          {statForOption.count} votos ({statForOption.percentage}%)
                        </div>
                      )}
                      
                      {statForOption?.showPercentage && (
                        <div className="mt-2 w-full bg-bg-secondary dark:bg-gray-700 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full 
                              ${isCorrect && currentQuestion.votingClosed ? 'bg-green-500' : 
                                (!isCorrect && hasVoted && isSelected && currentQuestion.votingClosed) ? 'bg-red-500' : 
                                isSelected ? 'bg-accent' : 'bg-accent/50'}`}
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
                  className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-button-text bg-accent hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-offset-bg-primary focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? t('submittingAnswerButton') : t('submitAnswerButton')}
                </button>
              )}
              
              {error && (
                <div className="mt-4 p-4 rounded-md shadow-md border-l-4 bg-red-50 border-red-500 text-sm">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {hasVoted && !currentQuestion.votingClosed && (
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-md text-sm text-green-600 dark:text-green-400 flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  {t('answerRegistered')}
                </div>
              )}

              {currentQuestion.votingClosed && currentQuestion.explanation && (
                <div className="mt-6 p-4 bg-yellow-500/10 rounded-md border border-yellow-500/30">
                  <h3 className="text-sm font-medium text-yellow-700 dark:text-yellow-500 mb-2">{t('explanation')}</h3>
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">{currentQuestion.explanation}</p>
                  
                          {currentQuestion.explanation_image && (
                            <div className="mt-4">
                              <img 
                                src={currentQuestion.explanation_image} 
                                alt={t('explanationImageAlt')}
                                className="max-w-full h-auto rounded-md"
                              />
                            </div>
                          )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-bg-primary shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6 text-center">
              <h2 className="text-lg font-medium text-text-primary mb-4">
                {t('waitingForNextQuestion')}
              </h2>
              <p className="text-text-secondary">
                {t('presenterWillStartNextQuestion')}
              </p>
        </div>
      </div>
        )}
      </main>

      {/* Modal para mostrar la clasificación si está habilitada y visible */}
      {config.showRankings && isRankingVisible && (
        <div 
          className="fixed inset-0 bg-bg-primary/80 dark:bg-bg-primary/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn transition-all duration-300"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rankingModalTitle"
        >
          <div 
            className="bg-bg-primary rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border-color"
            style={{ maxWidth: '95vw' }}
          >
            <div className="flex justify-between items-center mb-4 border-b border-border-color pb-3">
              <h3 id="rankingModalTitle" className="text-xl font-semibold flex items-center text-text-primary">
                <Award className="h-6 w-6 mr-2 text-yellow-500" /> {/* Semantic color kept */}
                {t('currentRanking')}
              </h3>
              <button 
                onClick={() => useQuizConfigStore.setState({ isRankingVisible: false })}
                className="text-text-secondary hover:text-text-primary transition-colors duration-200 rounded-full hover:bg-bg-secondary p-1"
                aria-label={t('closeButtonLabel')}
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
      
      {/* Vista de contactos */}
      <ContactsAudienceView />

      {/* Sección de Documentos Compartidos */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <DocumentDownloadList />
      </div>

      {/* Sección de Preguntas de la Audiencia */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <AudienceQA isAdmin={false} />
      </div>
    </div>
  );
}