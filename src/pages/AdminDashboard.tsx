import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useQuestionStore } from '../store/questionStore';
import { useQuizConfigStore } from '../store/quizConfigStore';
import { useTournamentStore } from '../store/tournamentStore';
import { useWordCloudStore } from '../store/wordCloudStore';

// Componentes del panel de administración
import AdminHeader from '../components/admin/AdminHeader';
import NotificationToast from '../components/admin/NotificationToast';
import DashboardHome from '../components/admin/DashboardHome';
import ConfigurationPage from '../components/admin/ConfigurationPage';
import QuestionsTabContent from '../components/admin/QuestionsTabContent';
import RankingsTab from '../components/admin/RankingsTab';
import TournamentTab from '../components/tournament/TournamentTab';
import WordCloudTab from '../components/wordcloud/WordCloudTab';
import ContactsTab from '../components/contacts/ContactsTab';
import AudienceQA from '../components/AudienceQA';
import DocumentSharingTab from '../components/admin/DocumentSharingTab';
import LinkSharingTab from '../components/admin/LinkSharingTab';
import AudienceDataTable from '../components/admin/AudienceDataTable';
import ReviewView from '../components/admin/ReviewView';
import AIQuestionModule from '../components/admin/AIQuestionModule';
import CanvasInteractivosTab from '../components/admin/CanvasInteractivosTab';

// Definición de la interfaz QuestionWithId
interface QuestionWithId {
  _id: string;
  content: string;
  case?: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option?: string;
  explanation?: string;
  explanation_image?: string;
  is_active: boolean;
  timer?: number;
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { theme } = useThemeStore();
  
  // Estado para el formulario de preguntas
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [question, setQuestion] = useState({
    content: '',
    case: '',
    option_a: '',
    option_b: '',
    option_c: '',
    correct_answer: '',
    explanation: '',
    explanation_image: '',
  });
  
  // Estado para la interfaz de usuario - NUEVO DISEÑO
  const [activeView, setActiveView] = useState<'dashboard' | 'questions' | 'config' | 'rankings' | 'tournament' | 'wordcloud' | 'contacts' | 'audienceQA' | 'documents' | 'audienceData' | 'reviews' | 'aiQuestions' | 'linkSharing' | 'mlCriminalSimulator'>('dashboard');
  const [showCheatSheet, setShowCheatSheet] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  
  // Hooks de navegación y estado global
  const navigate = useNavigate();
  const signOut = useAuthStore((state) => state.signOut);
  
  // Estado de las preguntas y configuración
  const {
    questions,
    createQuestion,
    updateQuestion,
    currentQuestion,
    startVoting: startVotingAction,
    stopVoting,
    showResults,
    deleteQuestion,
    votes,
    updateQuestionTimer,
    timeRemaining,
    initialized,
    clearView
  } = useQuestionStore();
  
  const { isRankingVisible, showRanking, hideRanking, getConfig } = useQuizConfigStore();
  
  // Stores adicionales para resetear en clearView
  const { resetTournament } = useTournamentStore();
  const { resetWordCloud } = useWordCloudStore();
  
  // Estado de carga
  const [isLoading, setIsLoading] = useState(!initialized);

  // Función para mostrar notificaciones
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Efecto para inicializar y cargar datos
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (initialized && isLoading) {
      setIsLoading(false);
    }
    getConfig();
  }, [initialized, isLoading, getConfig]);
  
  // Efecto para manejar la navegación desde otras partes de la aplicación
  useEffect(() => {
    const locationState = history.state?.usr;
    if (locationState && locationState.activeView) {
      setActiveView(locationState.activeView);
    }
  }, []);

  // Manejo del formulario de preguntas
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setQuestion(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingQuestion) {
        await updateQuestion(editingQuestion, {
          content: question.content,
          case: question.case,
          option_a: question.option_a,
          option_b: question.option_b,
          option_c: question.option_c,
          correct_option: question.correct_answer,
          explanation: question.explanation,
          explanation_image: question.explanation_image,
        });
        showNotification('Pregunta actualizada correctamente', 'success');
      } else {
        await createQuestion({
          content: question.content,
          case: question.case,
          option_a: question.option_a,
          option_b: question.option_b,
          option_c: question.option_c,
          correct_option: question.correct_answer,
          explanation: question.explanation,
          explanation_image: question.explanation_image,
        });
        showNotification('Pregunta creada correctamente', 'success');
      }
      
      // Limpiar el formulario y cerrar
      setShowForm(false);
      setEditingQuestion(null);
      setQuestion({
        content: '',
        case: '',
        option_a: '',
        option_b: '',
        option_c: '',
        correct_answer: '',
        explanation: '',
        explanation_image: '',
      });
    } catch (error) {
      console.error('Error al guardar la pregunta:', error);
      showNotification('Error al guardar la pregunta', 'error');
    }
  };

  // Funciones para manejar las preguntas
  const handleEdit = (q: QuestionWithId) => {
    setEditingQuestion(q._id);
    setQuestion({
      content: q.content,
      case: q.case || '',
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      correct_answer: q.correct_option || '',
      explanation: q.explanation || '',
      explanation_image: q.explanation_image || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta pregunta?')) {
      try {
        await deleteQuestion(id);
        showNotification('Pregunta eliminada correctamente', 'success');
      } catch (error) {
        console.error('Error al eliminar la pregunta:', error);
        showNotification('Error al eliminar la pregunta', 'error');
      }
    }
  };

  const handleStartVoting = async (questionId: string) => {
    try {
      await startVotingAction(questionId);
      showNotification('Votación iniciada correctamente', 'success');
    } catch (error) {
      console.error('Error al iniciar la votación:', error);
      showNotification('Error al iniciar la votación', 'error');
    }
  };

  const handleStopVoting = async () => {
    try {
      if (currentQuestion) {
        await stopVoting(currentQuestion._id);
        showNotification('Votación detenida correctamente', 'success');
      } else {
        showNotification('No hay una pregunta activa para detener', 'error');
      }
    } catch (error) {
      console.error('Error al detener la votación:', error);
      showNotification('Error al detener la votación', 'error');
    }
  };

  const handleShowResults = async () => {
    try {
      if (currentQuestion) {
        await showResults(currentQuestion._id, '');
        showNotification('Resultados mostrados correctamente', 'success');
      }
    } catch (error) {
      console.error('Error al mostrar resultados:', error);
      showNotification('Error al mostrar los resultados', 'error');
    }
  };

  const handleToggleCheatSheet = (questionId: string) => {
    setShowCheatSheet(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };


  // FUNCIÓN MEJORADA DE LIMPIAR VISTA
  const handleClearView = async () => {
    try {
      // Detener votaciones activas
      if (currentQuestion) {
        await stopVoting(currentQuestion._id, '');
      }
      
      // Limpiar vista general
      await clearView();
      
      // Resetear módulos específicos que tienen funciones de reset
      try {
        await resetTournament();
        await resetWordCloud();
      } catch (moduleError) {
        console.warn('Error reseteando algunos módulos:', moduleError);
      }
      
      showNotification('Todas las vistas han sido limpiadas correctamente', 'success');
    } catch (error) {
      console.error('Error al limpiar las vistas:', error);
      showNotification('Error al limpiar las vistas', 'error');
    }
  };

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  // Función para manejar la selección de herramientas desde el dashboard
  const handleToolSelect = (toolId: string) => {
    setActiveView(toolId as typeof activeView);
  };

  // Función para volver al dashboard
  const handleBackToDashboard = () => {
    setActiveView('dashboard');
  };

  // Función para ir al home desde el header
  const handleGoHome = () => {
    setActiveView('dashboard');
  };

  // Función para calcular estadísticas
  const calculateStats = () => {
    if (!currentQuestion) return [];
    
    const options = ['a', 'b', 'c'];
    const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);
    
    return options.map(option => {
      const count = votes[option] || 0;
      const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      
      return {
        option,
        count,
        percentage,
        showPercentage: true
      };
    });
  };

  const handleResetSession = async () => {
    try {
      showNotification('Sesión reiniciada correctamente', 'success');
    } catch (error) {
      console.error('Error al reiniciar la sesión:', error);
      showNotification('Error al reiniciar la sesión', 'error');
    }
  };

  // Renderizado condicional basado en el estado de carga
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">{t('loading')}</h2>
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleToggleRanking = () => {
    if (isRankingVisible) {
      hideRanking();
    } else {
      showRanking();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Notificación */}
      {notification && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Encabezado */}
      <AdminHeader
        onClearView={handleClearView}
        onSignOut={handleSignOut}
        onGoHome={handleGoHome}
      />

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeView === 'dashboard' ? (
          <DashboardHome onToolSelect={handleToolSelect} />
        ) : activeView === 'config' ? (
          <ConfigurationPage onBack={handleBackToDashboard} />
        ) : activeView === 'questions' ? (
          <QuestionsTabContent
            showForm={showForm}
            editingQuestion={editingQuestion}
            questionFormData={question}
            currentQuestion={currentQuestion}
            questions={questions}
            showCheatSheet={showCheatSheet}
            votes={votes}
            timeRemaining={timeRemaining}
            onNewQuestion={() => setShowForm(true)}
            onEditQuestion={handleEdit}
            onDeleteQuestion={handleDelete}
            onStartVoting={handleStartVoting}
            onStopVoting={handleStopVoting}
            onShowResults={handleShowResults}
            onToggleCheatSheet={handleToggleCheatSheet}
            onTimerChange={updateQuestionTimer}
            onQuestionFormSubmit={handleSubmit}
            onQuestionFormChange={handleFormChange}
            onQuestionFormCancel={() => {
              setShowForm(false);
              setEditingQuestion(null);
              setQuestion({
                content: '',
                case: '',
                option_a: '',
                option_b: '',
                option_c: '',
                correct_answer: '',
                explanation: '',
                explanation_image: '',
              });
            }}
            calculateStats={calculateStats}
            newQuestionButtonText={t('newQuestionButton')}
          />
        ) : activeView === 'rankings' ? (
          <RankingsTab
            onResetSession={handleResetSession}
            showNotification={showNotification}
            setActiveTab={setActiveView}
            onToggleRanking={handleToggleRanking}
          />
        ) : activeView === 'tournament' ? (
          <TournamentTab
            showNotification={showNotification}
          />
        ) : activeView === 'wordcloud' ? (
          <WordCloudTab />
        ) : activeView === 'contacts' ? (
          <ContactsTab
            showNotification={showNotification}
          />
        ) : activeView === 'audienceQA' ? (
          <AudienceQA isAdmin={true} />
        ) : activeView === 'documents' ? (
          <DocumentSharingTab />
        ) : activeView === 'audienceData' ? (
          <AudienceDataTable />
        ) : activeView === 'reviews' ? (
          <ReviewView eventId={"active_event_001"} />
        ) : activeView === 'aiQuestions' ? (
          <AIQuestionModule />
        ) : activeView === 'linkSharing' ? (
          <LinkSharingTab />
        ) : activeView === 'mlCriminalSimulator' ? (
          <CanvasInteractivosTab />
        ) : (
          <DashboardHome onToolSelect={handleToolSelect} />
        )}
      </div>
    </div>
  );
}
