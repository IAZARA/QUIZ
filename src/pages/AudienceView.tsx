import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuestionStore } from '../store/questionStore';
import { useParticipantStore } from '../store/participantStore';
import { useQuizConfigStore } from '../store/quizConfigStore';
import { useWordCloudStore } from '../store/wordCloudStore';
import { useRankingStore } from '../store/rankingStore';
import { useTournamentStore } from '../store/tournamentStore';
import { useContactStore } from '../store/contactStore';
import { useAudienceQAStore } from '../store/audienceQAStore';
import { useDocumentSharingStore } from '../store/documentSharingStore';
import { useLinkSharingStore } from '../store/linkSharingStore';
import { useAudienceDataStore } from '../store/audienceDataStore';
import { useReviewStore } from '../store/reviewStore';
import { useThemeStore } from '../store/themeStore';
import WordCloudParticipant from '../components/wordcloud/WordCloudParticipant';
import RankingAudienceView from '../components/ranking/RankingAudienceView';
import TournamentAudienceView from '../components/tournament/TournamentAudienceView';
import ContactsAudienceView from '../components/contacts/ContactsAudienceView';
import { playSound } from '../utils/soundManager';
import { X, MessageCircle, Sun, Moon, FileText, Users, Link } from 'lucide-react';

// Importar componentes modulares
import AudienceHeader from '../components/audience/AudienceHeader';
import QuestionInterface from '../components/audience/QuestionInterface';
import WaitingScreen from '../components/audience/WaitingScreen';
import RankingModal from '../components/audience/RankingModal';
import AudienceQA from '../components/AudienceQA';
import DocumentDownloadList from '../components/DocumentDownloadList';
import LinkSharingView from '../components/audience/LinkSharingView';

// Importar componente y utilidades de socket
import SocketManager from '../components/audience/SocketManager';
import { setupSocketListeners, cleanupSocketListeners, SocketStores } from '../utils/socketUtils';
import AudienceDataForm from '../components/audience/AudienceDataForm'; // Import the new form
import FeedbackForm from '../components/audience/FeedbackForm'; // Import FeedbackForm
import { debugRankingWebSocket } from '../utils/rankingDebug';

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

  const { config, getConfig, isRankingVisible, initializeSocket: initializeQuizConfigSocket } = useQuizConfigStore();
  const { currentParticipant, logout } = useParticipantStore();
  const { isActive: isWordCloudActive } = useWordCloudStore();
  const { isActive: isRankingActive, initializeSocket: initializeRankingSocket } = useRankingStore();
  const { isActive: isTournamentActive } = useTournamentStore();
  const { isContactsActive, loadContacts, initializeSocketListeners: initializeContactSocket } = useContactStore();
  const { isAudienceQAActive, initializeSocket: initializeAudienceQASocket } = useAudienceQAStore();
  const { isDocumentsActive, loadDocuments, initializeSocketListeners: initializeDocumentSocket } = useDocumentSharingStore();
  const { isLinkSharingActive, initializeSocket: initializeLinkSharingSocket } = useLinkSharingStore();
  const { isAudienceDataActive, initializeSocket: initializeAudienceDataSocket } = useAudienceDataStore();
  const { initializeSocket: initializeWordCloudSocket } = useWordCloudStore();
  const { isReviewsActive } = useReviewStore();
  const { theme, toggleTheme } = useThemeStore();

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [timerWarning, setTimerWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  const prevQuestionIdRef = useRef<string | null | undefined>(null);
  const isInitialRenderQRRef = useRef(true);
  const prevIsRankingVisibleRef = useRef(isRankingVisible);

  // Cargar la configuración del quiz y contactos
  useEffect(() => {
    getConfig();
    loadContacts();
    loadDocuments();
  }, [getConfig, loadContacts, loadDocuments]);

  // Inicializar sockets
  useEffect(() => {
    console.log('🚀 Inicializando todos los sockets en AudienceView...');
    initializeAudienceDataSocket();
    initializeWordCloudSocket();
    initializeRankingSocket();
    initializeAudienceQASocket();
    initializeContactSocket();
    initializeDocumentSocket();
    initializeLinkSharingSocket();
    initializeQuizConfigSocket();
    
    // Ejecutar debugging después de un breve delay para permitir inicialización
    setTimeout(() => {
      console.log('🔍 Ejecutando debug de ranking WebSocket...');
      debugRankingWebSocket();
    }, 2000);
  }, [initializeAudienceDataSocket, initializeWordCloudSocket, initializeRankingSocket, initializeAudienceQASocket, initializeContactSocket, initializeDocumentSocket, initializeLinkSharingSocket, initializeQuizConfigSocket]);

  // Configurar los listeners de Socket.IO (sin ranking, ya que se maneja en su propio store)
  useEffect(() => {
    // Crear un objeto con las funciones setState de las tiendas
    const stores: SocketStores = {
      setWordCloud: useWordCloudStore.setState,
      setContact: useContactStore.setState,
      setAudienceQA: useAudienceQAStore.setState,
      setDocumentSharing: useDocumentSharingStore.setState,
      setLinkSharing: useLinkSharingStore.setState,
      setAudienceData: (state: { isAudienceDataActive?: boolean }) =>
        useAudienceDataStore.setState(state),
      setReviews: useReviewStore.setState
    };
    
    // Configurar los listeners
    setupSocketListeners(stores);
    
    // Limpiar listeners al desmontar
    return () => {
      cleanupSocketListeners();
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
    console.log('🔄 Cambio en isRankingVisible detectado:', {
      isRankingVisible,
      prevValue: prevIsRankingVisibleRef.current,
      configShowRankings: config.showRankings,
      shouldShowModal: config.showRankings && isRankingVisible
    });
    
    if (isRankingVisible && !prevIsRankingVisibleRef.current) {
      console.log('🎵 Reproduciendo sonido para ranking modal');
      playSound('ui_click.mp3');
    }
    prevIsRankingVisibleRef.current = isRankingVisible;
  }, [isRankingVisible, config.showRankings]);

  // Activar/desactivar el sonido del temporizador cuando queden pocos segundos
  useEffect(() => {
    if (!currentQuestion) return;

    if (timeRemaining !== null && timeRemaining <= 5 && timeRemaining > 0) {
      setTimerWarning(true);
      setShowTimer(true);
      
      // Reproducir sonido de advertencia cuando queden 5 segundos
      if (timeRemaining === 5) {
        playSound('ui_click.mp3');
      }
      
      // Reproducir sonido de cuenta regresiva en los últimos 3 segundos
      if (timeRemaining <= 3) {
        playSound('ui_click.mp3');
      }
    } else {
      setTimerWarning(false);
      if (timeRemaining === null || timeRemaining === 0) {
        setShowTimer(false);
        
        // Reproducir sonido cuando se acaba el tiempo
        if (timeRemaining === 0) {
          playSound('countdown.mp3');
        }
      }
    }
  }, [timeRemaining, currentQuestion]);

  const handleLogout = () => {
    logout();
  };

  const calculateStats = () => {
    const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);

    // Mostrar resultados cuando:
    // 1. No hay pregunta activa
    // 2. La votación está cerrada Y hay respuesta correcta (resultados mostrados)
    // 3. La configuración permite mostrar rankings y el usuario ha votado
    const showResultsCondition = Boolean(!currentQuestion ||
                               (currentQuestion.votingClosed && currentQuestion.correct_option) ||
                               (config.showRankings && hasVoted));

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

  // Check for active features first, before checking for currentQuestion
  // This ensures that special features take precedence over the quiz
  if (isTournamentActive) {
    return <TournamentAudienceView />;
  }
  
  if (isRankingActive) {
    return <RankingAudienceView />;
  }
  
  if (isWordCloudActive) {
    return (
      <div className="h-screen bg-bg-primary overflow-hidden relative">
        {/* Controles discretos para móvil */}
        <div className="absolute top-4 right-4 z-50 flex items-center space-x-2">
          {currentParticipant && (
            <>
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-bg-secondary/80 backdrop-blur-md rounded-lg border border-border-light">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse-subtle"></div>
                <span className="text-sm font-medium text-text-secondary">
                  {currentParticipant.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 bg-bg-secondary/80 backdrop-blur-md rounded-lg border border-border-light text-error hover:text-error/80 transition-colors duration-normal micro-scale"
                aria-label={t('logoutButton')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </>
          )}
        </div>
        
        {/* Contenido principal sin restricciones de ancho */}
        <main className="h-full w-full">
          <WordCloudParticipant />
        </main>
      </div>
    );
  }
  
  if (isContactsActive) {
    return <ContactsAudienceView />;
  }
  
  if (isAudienceQAActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary/20 to-bg-primary relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-success/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/3 rounded-full blur-3xl"></div>
        </div>

        {/* Controles flotantes */}
        <div className="absolute top-6 right-6 z-10">
          <div className="flex items-center space-x-3">
            {/* Selector de tema */}
            <button
              onClick={toggleTheme}
              className="p-3 bg-bg-secondary/80 hover:bg-bg-secondary backdrop-blur-md rounded-full border border-border-light/50 shadow-lg transition-all duration-normal micro-scale"
              title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5 text-text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-text-primary" />
              )}
            </button>

            {/* Información del participante y logout */}
            {currentParticipant && (
              <>
                <div className="flex items-center space-x-2 px-4 py-2 bg-bg-secondary/80 backdrop-blur-md rounded-full border border-border-light/50 shadow-lg">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse-subtle"></div>
                  <span className="text-sm font-medium text-text-secondary">
                    {currentParticipant.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 bg-error/10 hover:bg-error/20 text-error rounded-full transition-all duration-normal micro-scale backdrop-blur-md border border-error/20"
                  title={t('logoutButton')}
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <main className="relative z-10 max-w-4xl mx-auto py-12 px-6">
          {/* Header mejorado */}
          <div className="text-center mb-16 animate-fadeInUp">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-accent/10 rounded-full mb-6 animate-fadeInScale">
              <MessageCircle className="h-10 w-10 text-accent" />
            </div>
            <h1 className="text-4xl font-bold text-text-primary mb-4 bg-gradient-to-r from-text-primary to-accent bg-clip-text">
              {t('audienceQA')}
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Comparte tus preguntas y participa en la conversación
            </p>
          </div>

          {/* Componente Q&A con diseño mejorado */}
          <div className="bg-bg-secondary/40 backdrop-blur-md rounded-2xl p-8 border border-border-light/50 shadow-xl">
            <AudienceQA isAdmin={false} />
          </div>
        </main>
      </div>
    );
  }
  
  if (isDocumentsActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary/20 to-bg-primary relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-success/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/3 rounded-full blur-3xl"></div>
        </div>

        {/* Controles flotantes */}
        <div className="absolute top-6 right-6 z-10">
          <div className="flex items-center space-x-3">
            {/* Selector de tema */}
            <button
              onClick={toggleTheme}
              className="p-3 bg-bg-secondary/80 hover:bg-bg-secondary backdrop-blur-md rounded-full border border-border-light/50 shadow-lg transition-all duration-normal micro-scale"
              title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5 text-text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-text-primary" />
              )}
            </button>

            {/* Información del participante y logout */}
            {currentParticipant && (
              <>
                <div className="flex items-center space-x-2 px-4 py-2 bg-bg-secondary/80 backdrop-blur-md rounded-full border border-border-light/50 shadow-lg">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse-subtle"></div>
                  <span className="text-sm font-medium text-text-secondary">
                    {currentParticipant.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 bg-error/10 hover:bg-error/20 text-error rounded-full transition-all duration-normal micro-scale backdrop-blur-md border border-error/20"
                  title={t('logoutButton')}
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <main className="relative z-10 max-w-4xl mx-auto py-12 px-6">
          {/* Header mejorado */}
          <div className="text-center mb-16 animate-fadeInUp">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-accent/10 rounded-full mb-6 animate-fadeInScale">
              <FileText className="h-10 w-10 text-accent" />
            </div>
            <h1 className="text-4xl font-bold text-text-primary mb-4 bg-gradient-to-r from-text-primary to-accent bg-clip-text">
              {t('sharedDocuments')}
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Descarga y accede a los documentos compartidos
            </p>
          </div>

          {/* Componente de documentos con diseño mejorado */}
          <div className="bg-bg-secondary/40 backdrop-blur-md rounded-2xl p-8 border border-border-light/50 shadow-xl">
            <DocumentDownloadList />
          </div>
        </main>
      </div>
    );
  }
  
  if (isLinkSharingActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary/20 to-bg-primary relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-success/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/3 rounded-full blur-3xl"></div>
        </div>

        {/* Controles flotantes */}
        <div className="absolute top-6 right-6 z-10">
          <div className="flex items-center space-x-3">
            {/* Selector de tema */}
            <button
              onClick={toggleTheme}
              className="p-3 bg-bg-secondary/80 hover:bg-bg-secondary backdrop-blur-md rounded-full border border-border-light/50 shadow-lg transition-all duration-normal micro-scale"
              title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5 text-text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-text-primary" />
              )}
            </button>

            {/* Información del participante y logout */}
            {currentParticipant && (
              <>
                <div className="flex items-center space-x-2 px-4 py-2 bg-bg-secondary/80 backdrop-blur-md rounded-full border border-border-light/50 shadow-lg">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse-subtle"></div>
                  <span className="text-sm font-medium text-text-secondary">
                    {currentParticipant.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 bg-error/10 hover:bg-error/20 text-error rounded-full transition-all duration-normal micro-scale backdrop-blur-md border border-error/20"
                  title={t('logoutButton')}
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <main className="relative z-10 max-w-4xl mx-auto py-12 px-6">
          {/* Header mejorado */}
          <div className="text-center mb-16 animate-fadeInUp">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-accent/10 rounded-full mb-6 animate-fadeInScale">
              <Link className="h-10 w-10 text-accent" />
            </div>
            <h1 className="text-4xl font-bold text-text-primary mb-4 bg-gradient-to-r from-text-primary to-accent bg-clip-text">
              {t('sharedLinks') || 'Enlaces Compartidos'}
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Accede a los enlaces compartidos por el presentador
            </p>
          </div>

          {/* Componente de links con diseño mejorado */}
          <div className="bg-bg-secondary/40 backdrop-blur-md rounded-2xl p-8 border border-border-light/50 shadow-xl">
            <LinkSharingView />
          </div>
        </main>
      </div>
    );
  }

  // Mostrar formulario de datos de audiencia si está activo
  if (isAudienceDataActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary/20 to-bg-primary relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-success/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/3 rounded-full blur-3xl"></div>
        </div>

        {/* Controles flotantes */}
        <div className="absolute top-6 right-6 z-10">
          <div className="flex items-center space-x-3">
            {/* Selector de tema */}
            <button
              onClick={toggleTheme}
              className="p-3 bg-bg-secondary/80 hover:bg-bg-secondary backdrop-blur-md rounded-full border border-border-light/50 shadow-lg transition-all duration-normal micro-scale"
              title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5 text-text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-text-primary" />
              )}
            </button>

            {/* Información del participante y logout */}
            {currentParticipant && (
              <>
                <div className="flex items-center space-x-2 px-4 py-2 bg-bg-secondary/80 backdrop-blur-md rounded-full border border-border-light/50 shadow-lg">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse-subtle"></div>
                  <span className="text-sm font-medium text-text-secondary">
                    {currentParticipant.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 bg-error/10 hover:bg-error/20 text-error rounded-full transition-all duration-normal micro-scale backdrop-blur-md border border-error/20"
                  title={t('logoutButton')}
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <main className="relative z-10 flex items-center justify-center min-h-screen py-12 px-6">
          <div className="w-full max-w-2xl">
            {/* Header mejorado */}
            <div className="text-center mb-12 animate-fadeInUp">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-accent/10 rounded-full mb-6 animate-fadeInScale">
                <Users className="h-10 w-10 text-accent" />
              </div>
              <h1 className="text-4xl font-bold text-text-primary mb-4 bg-gradient-to-r from-text-primary to-accent bg-clip-text">
                {t('audienceDataForm.headerTitle') || t('audienceDataForm.title')}
              </h1>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
                Comparte tu información para una mejor experiencia
              </p>
            </div>

            {/* Formulario con diseño mejorado */}
            <div className="bg-bg-secondary/40 backdrop-blur-md rounded-2xl p-8 border border-border-light/50 shadow-xl animate-fadeInUp" style={{ animationDelay: '200ms' }}>
              <AudienceDataForm onSubmitSuccess={() => {}} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Pantalla de conexión cuando no hay pregunta activa ni funciones especiales activas
  if (!currentQuestion) {
    return <WaitingScreen showQR={showQR} setShowQR={setShowQR} />;
  }

  // Obtenemos los datos de la función calculateStats
  const { stats } = calculateStats();

  // If there's an active question, show the voting interface
  return (
    <SocketManager>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 relative">
      {/* Controles flotantes */}
      <div className="absolute top-6 right-6 z-10">
        <div className="flex items-center space-x-3">
          {/* Selector de tema */}
          <button
            onClick={toggleTheme}
            className="p-3 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 backdrop-blur-md rounded-full border border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 hover:scale-105"
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            ) : (
              <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            )}
          </button>

          {/* Información del participante y logout */}
          {currentParticipant && (
            <>
              <div className="flex items-center space-x-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-full border border-gray-200 dark:border-gray-700 shadow-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {currentParticipant.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full transition-all duration-300 hover:scale-105 backdrop-blur-md border border-red-200 dark:border-red-800"
                title={t('logoutButton')}
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <main className="max-w-4xl mx-auto py-8 px-6 relative z-0">
        <QuestionInterface
          currentQuestion={currentQuestion}
          timeRemaining={timeRemaining}
          timerWarning={timerWarning}
          showTimer={showTimer}
          selectedOption={selectedOption}
          hasVoted={hasVoted}
          submitting={submitting}
          error={error}
          stats={stats}
          handleVote={handleVote}
        />

        {/* Section for Feedback Form - Only show when reviews are active */}
        {isReviewsActive && (
          <section className="mt-12 mb-8 p-4 md:p-6 max-w-2xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100 border-b pb-2">
              {t('feedbackForm.title') || 'Deja tu Reseña del Evento'}
            </h2>
            {/* TODO: Replace "active_event_001" with a dynamic eventId from a store or prop */}
            <FeedbackForm eventId={"active_event_001"} />
          </section>
        )}
      </main>

      {(() => {
        const shouldShowModal = config.showRankings && isRankingVisible;
        console.log('🎯 Evaluando renderizado de RankingModal:', {
          configShowRankings: config.showRankings,
          isRankingVisible,
          shouldShowModal,
          timestamp: new Date().toISOString()
        });
        
        return shouldShowModal ? (
          <RankingModal isVisible={isRankingVisible} />
        ) : null;
      })()}
    </div>
    </SocketManager>
  );
}
