import React, { useState, useEffect } from 'react';
import { Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useQuestionStore } from '../store/questionStore';
import { useQuizConfigStore } from '../store/quizConfigStore';
import QuizConfigPanel from '../components/QuizConfigPanel';

// Componentes del panel de administración
import AdminHeader from '../components/admin/AdminHeader';
import NotificationToast from '../components/admin/NotificationToast';
import QuestionForm from '../components/admin/QuestionForm';
import QuestionsList from '../components/admin/QuestionsList';
import RankingsTab from '../components/admin/RankingsTab';
import TournamentTab from '../components/tournament/TournamentTab';
import WordCloudTab from '../components/wordcloud/WordCloudTab';
import ContactsTab from '../components/contacts/ContactsTab';
import AdminFileSharingTab from '../components/admin/AdminFileSharingTab';
import AdminQATab from '../components/admin/AdminQATab'; // Import AdminQATab

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
  // Estado para el formulario de preguntas
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  // const [socketClient, setSocketClient] = useState<SocketIOClient.Socket | null>(null); // Removed as AdminQATab handles its own socket
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
  
  // Estado para la interfaz de usuario
  const [activeTab, setActiveTab] = useState<'questions' | 'config' | 'rankings' | 'tournament' | 'wordcloud' | 'contacts' | 'sharedFiles' | 'qa'>('questions'); // Added 'qa'
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
    deleteQuestion,
    votes,
    updateQuestionTimer,
    timeRemaining,
    initialized,
    clearView
  } = useQuestionStore();
  
  const { config, isRankingVisible, showRanking, hideRanking, getConfig } = useQuizConfigStore();
  
  // Estado de carga
  const [isLoading, setIsLoading] = useState(!initialized);

  // Función para mostrar notificaciones
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    // Limpiar la notificación después de 5 segundos
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Efecto para inicializar y cargar datos
  useEffect(() => {
    if (initialized && isLoading) {
      setIsLoading(false);
    }
    
    // Cargar la configuración del quiz
    getConfig();
  }, [initialized, isLoading, getConfig]);
  
  // Efecto para manejar la navegación desde otras partes de la aplicación
  useEffect(() => {
    const locationState = history.state?.usr;
    if (locationState && locationState.activeTab) {
      setActiveTab(locationState.activeTab);
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
        await stopVoting(currentQuestion._id, currentQuestion.correct_option || '');
        showNotification('Votación detenida correctamente', 'success');
      } else {
        showNotification('No hay una pregunta activa para detener', 'error');
      }
    } catch (error) {
      console.error('Error al detener la votación:', error);
      showNotification('Error al detener la votación', 'error');
    }
  };

  const handleToggleCheatSheet = (questionId: string) => {
    setShowCheatSheet(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const handleTimerChange = (questionId: string, seconds: number) => {
    updateQuestionTimer(questionId, seconds);
  };

  const handleClearView = async () => {
    try {
      await clearView();
      showNotification('Vista de audiencia limpiada correctamente', 'success');
    } catch (error) {
      console.error('Error al limpiar la vista:', error);
      showNotification('Error al limpiar la vista', 'error');
    }
  };

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  // Función para calcular estadísticas
  const calculateStats = () => {
    if (!currentQuestion) return [];
    
    const options = ['a', 'b', 'c'];
    const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);
    
    // Depuración para ver los votos recibidos
    console.log('Votos actuales:', votes);
    console.log('Total de votos:', totalVotes);
    
    return options.map(option => {
      const count = votes[option] || 0;
      const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      
      // Depuración para cada opción
      console.log(`Opción ${option.toUpperCase()}: ${count} votos (${percentage}%)`);
      
      return {
        option,
        count,
        percentage,
        showPercentage: true // Siempre mostrar porcentajes
      };
    });
  };

  // Función para manejar el reinicio de sesión
  const handleResetSession = async () => {
    try {
      // Esta función será implementada en el componente RankingsTab
      showNotification('Sesión reiniciada correctamente', 'success');
    } catch (error) {
      console.error('Error al reiniciar la sesión:', error);
      showNotification('Error al reiniciar la sesión', 'error');
    }
  };

  // Renderizado condicional basado en el estado de carga
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Cargando...</h2>
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

  return (
    <div className="min-h-screen bg-gray-100">
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
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSignOut={handleSignOut}
      />

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === 'questions' ? (
          <div> {/* Contenedor para el contenido de la pestaña 'questions' */}
            <div className="mb-6 flex justify-end space-x-2">
              <button
                onClick={handleClearView}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Limpiar Vista de Audiencia
              </button>
              {config.showRankings && (
                <button
                  onClick={isRankingVisible ? hideRanking : showRanking}
                  className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white ${
                    isRankingVisible ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-purple-600 hover:bg-purple-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
                >
                  <Award className="h-4 w-4 mr-2" />
                  {isRankingVisible ? 'Ocultar Clasificación' : 'Mostrar Clasificación'}
                </button>
              )}
            </div>
            {showForm ? (
              <div className="mt-6">
                <div className="bg-white shadow-lg overflow-hidden sm:rounded-xl">
                  <div className="p-0">
                    <QuestionForm
                      initialQuestion={question}
                      isEditing={!!editingQuestion}
                      onSubmit={handleSubmit}
                      onCancel={() => {
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
                      onChange={handleFormChange}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <QuestionsList
                questions={questions}
                currentQuestion={currentQuestion}
                showCheatSheet={showCheatSheet}
                votes={votes}
                timeRemaining={timeRemaining}
                onNewQuestion={() => setShowForm(true)}
                onEditQuestion={handleEdit}
                onDeleteQuestion={handleDelete}
                onStartVoting={handleStartVoting}
                onStopVoting={handleStopVoting}
                onToggleCheatSheet={handleToggleCheatSheet}
                onTimerChange={handleTimerChange}
                calculateStats={calculateStats}
              />
            )}
          </div>
        ) : activeTab === 'rankings' ? (
          <RankingsTab
            onResetSession={handleResetSession}
            showNotification={showNotification}
            setActiveTab={setActiveTab}
          />
        ) : activeTab === 'tournament' ? (
          <TournamentTab
            showNotification={showNotification}
          />
        ) : activeTab === 'wordcloud' ? (
          <WordCloudTab
            showNotification={showNotification}
          />
        ) : activeTab === 'contacts' ? (
          <ContactsTab
            showNotification={showNotification}
          />
        ) : activeTab === 'sharedFiles' ? (
          <AdminFileSharingTab />
        ) : activeTab === 'qa' ? (
          // AdminQATab will manage its own socket connection as AdminDashboard does not have a central one.
          <AdminQATab socket={null} /> // Passing null as it initializes its own
        ) : ( // QuizConfigPanel como caso por defecto (o el primero en la lista)
          <QuizConfigPanel 
            onSaved={() => showNotification('Configuración guardada correctamente', 'success')} 
          />
        )}
      </div>
    </div>
  );
}
