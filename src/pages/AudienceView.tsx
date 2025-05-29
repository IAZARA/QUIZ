import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuestionStore } from '../store/questionStore';
import { useParticipantStore } from '../store/participantStore';
import { useQuizConfigStore } from '../store/quizConfigStore';
import { useWordCloudStore } from '../store/wordCloudStore';
import { useTournamentStore } from '../store/tournamentStore';
import { useContactStore } from '../store/contactStore';
import { useAudienceQAStore } from '../store/audienceQAStore';
import { useDocumentSharingStore } from '../store/documentSharingStore';
import WordCloudParticipant from '../components/wordcloud/WordCloudParticipant';
import TournamentAudienceView from '../components/tournament/TournamentAudienceView';
import ContactsAudienceView from '../components/contacts/ContactsAudienceView';
import { playSound } from '../utils/soundManager';

// Importar componentes modulares
import AudienceHeader from '../components/audience/AudienceHeader';
import QuestionInterface from '../components/audience/QuestionInterface';
import WaitingScreen from '../components/audience/WaitingScreen';
import RankingModal from '../components/audience/RankingModal';
import AudienceQA from '../components/AudienceQA';
import DocumentDownloadList from '../components/DocumentDownloadList';

// Importar componente y utilidades de socket
import SocketManager from '../components/audience/SocketManager';
import { setupSocketListeners, cleanupSocketListeners, SocketStores } from '../utils/socketUtils';
import AudienceDataForm from '../components/audience/AudienceDataForm'; // Import the new form
import FeedbackForm from '../components/audience/FeedbackForm'; // Import FeedbackForm

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
  const { isContactsActive, loadContacts } = useContactStore();
  const { isAudienceQAActive } = useAudienceQAStore();
  const { isDocumentsActive, loadDocuments } = useDocumentSharingStore();

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [timerWarning, setTimerWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showAudienceDataForm, setShowAudienceDataForm] = useState(true); // State to control form visibility

  const prevQuestionIdRef = useRef<string | null | undefined>(null);
  const isInitialRenderQRRef = useRef(true);
  const prevIsRankingVisibleRef = useRef(isRankingVisible);

  // Cargar la configuración del quiz y contactos
  useEffect(() => {
    getConfig();
    loadContacts();
    loadDocuments();
  }, [getConfig, loadContacts, loadDocuments]);

  // Configurar los listeners de Socket.IO
  useEffect(() => {
    // Crear un objeto con las funciones setState de las tiendas
    const stores: SocketStores = {
      setQuizConfig: useQuizConfigStore.setState,
      setWordCloud: useWordCloudStore.setState,
      setContact: useContactStore.setState,
      setAudienceQA: useAudienceQAStore.setState,
      setDocumentSharing: useDocumentSharingStore.setState
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
    if (isRankingVisible && !prevIsRankingVisibleRef.current) {
      playSound('ui_click.mp3');
    }
    prevIsRankingVisibleRef.current = isRankingVisible;
  }, [isRankingVisible]);

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

  // Check for active features first, before checking for currentQuestion
  // This ensures that special features take precedence over the quiz
  if (isTournamentActive) {
    return <TournamentAudienceView />;
  }
  
  if (isWordCloudActive) {
    return (
      <div className="min-h-screen bg-bg-secondary text-text-primary">
        <AudienceHeader 
          title={t('interactiveWordCloud')}
          currentParticipant={currentParticipant}
          onLogout={handleLogout}
        />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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
      <div className="min-h-screen bg-bg-secondary text-text-primary">
        <AudienceHeader 
          title={t('audienceQA')}
          currentParticipant={currentParticipant}
          onLogout={handleLogout}
        />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <AudienceQA isAdmin={false} />
        </main>
      </div>
    );
  }
  
  if (isDocumentsActive) {
    return (
      <div className="min-h-screen bg-bg-secondary text-text-primary">
        <AudienceHeader 
          title={t('sharedDocuments')}
          currentParticipant={currentParticipant}
          onLogout={handleLogout}
        />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <DocumentDownloadList />
        </main>
      </div>
    );
  }

  // Pantalla de conexión cuando no hay pregunta activa ni funciones especiales activas
  if (!currentQuestion) {
    // Show data form if no question and showAudienceDataForm is true
    if (showAudienceDataForm) {
      return (
        <div className="min-h-screen bg-bg-secondary text-text-primary flex flex-col items-center justify-center p-4">
          <AudienceHeader 
            title={t('audienceDataForm.headerTitle') || t('quizEndedThanks')} // Provide a fallback title
            currentParticipant={currentParticipant}
            onLogout={handleLogout}
          />
          <main className="w-full max-w-lg">
            <AudienceDataForm onSubmitSuccess={() => setShowAudienceDataForm(false)} />
            <button 
              onClick={() => setShowAudienceDataForm(false)} 
              className="mt-4 text-sm text-accent hover:underline"
            >
              {t('audienceDataForm.skipButton') || 'Skip for now'}
            </button>
          </main>
        </div>
      );
    }
    return <WaitingScreen showQR={showQR} setShowQR={setShowQR} />;
  }

  // Obtenemos los datos de la función calculateStats
  const { stats } = calculateStats();

  // If there's an active question, show the voting interface
  return (
    <SocketManager>
    <div className="min-h-screen bg-bg-secondary text-text-primary">
      <AudienceHeader 
        title={t('liveQuiz')}
        currentParticipant={currentParticipant}
        onLogout={handleLogout}
      />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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

        {/* Section for Feedback Form */}
        <section className="mt-12 mb-8 p-4 md:p-6 max-w-2xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100 border-b pb-2">
            {t('feedbackForm.title') || 'Deja tu Reseña del Evento'}
          </h2>
          {/* TODO: Replace "active_event_001" with a dynamic eventId from a store or prop */}
          <FeedbackForm eventId={"active_event_001"} />
        </section>
      </main>

      {config.showRankings && isRankingVisible && (
        <RankingModal isVisible={isRankingVisible} />
      )}
    </div>
    </SocketManager>
  );
}
