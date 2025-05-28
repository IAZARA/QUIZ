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
import io from 'socket.io-client';

// Importar componentes modulares
import AudienceHeader from '../components/audience/AudienceHeader';
import QuestionInterface from '../components/audience/QuestionInterface';
import WaitingScreen from '../components/audience/WaitingScreen';
import RankingModal from '../components/audience/RankingModal';
import AudienceQA from '../components/AudienceQA';
import DocumentDownloadList from '../components/DocumentDownloadList';

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

  const prevQuestionIdRef = useRef<string | null | undefined>(null);
  const isInitialRenderQRRef = useRef(true);
  const prevIsRankingVisibleRef = useRef(isRankingVisible);

  // Cargar la configuración del quiz y contactos
  useEffect(() => {
    getConfig();
    loadContacts();
    loadDocuments();
  }, [getConfig, loadContacts, loadDocuments]);

  // Escuchar eventos de Socket.IO para mostrar/ocultar el ranking y actualizar la nube de palabras
  useEffect(() => {
    // Esta lógica ahora está en el componente SocketManager
    // Pero la mantenemos aquí por ahora para evitar cambios bruscos
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

    // New listeners:
    socket.on('contacts:status', (data: { isActive: boolean }) => {
      console.log('Received contacts:status event:', data);
      useContactStore.setState({ isContactsActive: data.isActive });
    });

    socket.on('audienceQA:status', (data: { isActive: boolean }) => {
      console.log('Received audienceQA:status event:', data);
      useAudienceQAStore.setState({ isAudienceQAActive: data.isActive });
    });

    socket.on('documents:status', (data: { isActive: boolean }) => {
      console.log('Received documents:status event:', data);
      useDocumentSharingStore.setState({ isDocumentsActive: data.isActive });
    });

    socket.on('documents:list_update', (updatedDocuments) => {
      console.log('Received documents:list_update event:', updatedDocuments);
      useDocumentSharingStore.setState({ documents: updatedDocuments });
    });

    return () => {
      // Limpiar listeners al desmontar
      socket.off('show_ranking');
      socket.off('hide_ranking');
      socket.off('wordcloud:status');
      socket.off('wordcloud:update');
      socket.off('contacts:status');
      socket.off('audienceQA:status');
      socket.off('documents:status');
      socket.off('documents:list_update');
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
    return <WaitingScreen showQR={showQR} setShowQR={setShowQR} />;
  }

  // Obtenemos los datos de la función calculateStats
  const { stats } = calculateStats();

  // If there's an active question, show the voting interface
  return (
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
      </main>

      {config.showRankings && isRankingVisible && (
        <RankingModal isVisible={isRankingVisible} />
      )}
    </div>
  );
}
