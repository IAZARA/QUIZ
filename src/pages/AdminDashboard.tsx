import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useQuestionStore } from '../store/questionStore';
import { PlusCircle, Play, StopCircle, LogOut, Trash2, Eye, EyeOff, Clock, Edit2, Check, RefreshCw, Upload, Settings, Award } from 'lucide-react';
import { uploadImage } from '../lib/api';
import QuizConfigPanel from '../components/QuizConfigPanel';
import ParticipantRanking from '../components/ParticipantRanking';

export default function AdminDashboard() {
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [showCheatSheet, setShowCheatSheet] = useState<Record<string, boolean>>({});
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
  
  // Estado para controlar la pestaña activa
  const [activeTab, setActiveTab] = useState<'questions' | 'config' | 'rankings'>('questions');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para controlar qué pregunta está en modo de selección de respuesta correcta
  const [selectingCorrectAnswer, setSelectingCorrectAnswer] = useState<string | null>(null);
  const [selectedCorrectOption, setSelectedCorrectOption] = useState<string>('');
  
  // Estado para manejar notificaciones temporales
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  
  // Función para mostrar notificaciones temporales
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    // Limpiar la notificación después de 5 segundos
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };
  
  const navigate = useNavigate();
  // isAuthenticated se usa implícitamente a través del ProtectedRoute
  const signOut = useAuthStore((state) => state.signOut);
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
  
  const [isLoading, setIsLoading] = useState(!initialized);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setEditingQuestion(null);
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
    }
    setShowForm(false);
    setQuestion({ content: '', case: '', option_a: '', option_b: '', option_c: '', correct_answer: '', explanation: '', explanation_image: '' });
  };

  useEffect(() => {
    if (initialized && isLoading) {
      setIsLoading(false);
    }
  }, [initialized, isLoading]);

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
  
  const handleEdit = (q: QuestionWithId) => {
    setQuestion({
      content: q.content,
      case: q.case || '',
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      correct_answer: q.correct_option || '',
      explanation: q.explanation ? String(q.explanation) : '',
      explanation_image: q.explanation_image || '',
    });
    setEditingQuestion(q._id);
    setShowForm(true);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin');
  };

  const handleStartVoting = async (questionId: string) => {
    try {
      await startVotingAction(questionId);
    } catch (error) {
      console.error('Error al iniciar la votación:', error);
    }
  };

  const calculateStats = () => {
    const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);
    const stats = ['A', 'B', 'C'].map(option => {
      const count = votes[option] || 0;
      const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      return { option, count, percentage };
    });
    return { stats, totalVotes };
  };

  const toggleCheatSheet = (questionId: string) => {
    setShowCheatSheet(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const handleTimerChange = (questionId: string, seconds: number) => {
    updateQuestionTimer(questionId, seconds);
  };

  // Calcular estadísticas para los votos actuales
  const { stats, totalVotes } = calculateStats();
  
  // Función para obtener estadísticas actualizadas en tiempo real
  // No usamos parámetros por ahora, pero la estructura está lista para futuras mejoras
  const getStatsForActiveQuestion = () => {
    return { stats, totalVotes };
  };

  // Componente de notificación
  const NotificationToast = () => {
    if (!notification) return null;
    
    const bgColor = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500'
    }[notification.type];
    
    return (
      <div className={`fixed top-4 right-4 ${bgColor} text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center transition-opacity duration-300 ease-in-out`}>
        <span>{notification.message}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <NotificationToast />
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Panel de Administración</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Pestañas de navegación */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('questions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'questions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Preguntas
            </button>
            <button
              onClick={() => setActiveTab('rankings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rankings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center">
                <Award size={16} className="mr-2" />
                Estadísticas
              </span>
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'config'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center">
                <Settings size={16} className="mr-2" />
                Configuración
              </span>
            </button>
          </div>
        </div>

        {/* Contenido de la pestaña activa */}
        {activeTab === 'questions' ? (
          <div>
            {!showForm && (
              <div className="px-4 py-5 sm:p-6 flex space-x-4">
                <button
                  onClick={() => {
                    setEditingQuestion(null);
                    setQuestion({ content: '', case: '', option_a: '', option_b: '', option_c: '', correct_answer: '', explanation: '', explanation_image: '' });
                    setShowForm(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nueva Pregunta
                </button>
                
                <button
                  onClick={async () => {
                    try {
                      await clearView();
                      showNotification('Vista de audiencia limpiada correctamente', 'success');
                    } catch (error) {
                      console.error('Error al limpiar la vista:', error);
                      showNotification('Error al limpiar la vista', 'error');
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700"
                  title="Limpiar la vista de audiencia y mostrar la pantalla principal"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Limpiar Vista de Audiencia
                </button>
              </div>
            )}

            {showForm && (
              <div className="bg-white shadow sm:rounded-lg m-4">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {editingQuestion ? 'Editar Pregunta' : 'Crear Nueva Pregunta'}
                  </h3>
                  <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    <div>
                      <label htmlFor="case" className="block text-sm font-medium text-gray-700">
                        Caso (opcional)
                      </label>
                      <textarea
                        id="case"
                        rows={2}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        value={question.case}
                        onChange={(e) => setQuestion({ ...question, case: e.target.value })}
                        placeholder="Describe el caso o contexto para la pregunta..."
                      />
                    </div>
                    <div>
                      <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                        Pregunta
                      </label>
                      <textarea
                        id="content"
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        value={question.content}
                        onChange={(e) => setQuestion({ ...question, content: e.target.value })}
                        required
                      />
                    </div>
                    {['a', 'b', 'c'].map((option) => (
                      <div key={option}>
                        <label
                          htmlFor={`option_${option}`}
                          className="block text-sm font-medium text-gray-700"
                        >
                          Opción {option.toUpperCase()}
                        </label>
                        <input
                          type="text"
                          id={`option_${option}`}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                          value={question[`option_${option}` as keyof typeof question]}
                          onChange={(e) =>
                            setQuestion({
                              ...question,
                              [`option_${option}`]: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    ))}
                    <div>
                      <label htmlFor="correct_answer" className="block text-sm font-medium text-gray-700">
                        Respuesta Correcta
                      </label>
                      <div className="relative">
                        <select
                          id="correct_answer"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white appearance-none pr-8"
                          value={question.correct_answer}
                          onChange={(e) => setQuestion({ ...question, correct_answer: e.target.value })}
                          required
                        >
                          <option value="">Seleccionar respuesta correcta</option>
                          <option value="A">Opción A</option>
                          <option value="B">Opción B</option>
                          <option value="C">Opción C</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 mt-1">
                          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="explanation" className="block text-sm font-medium text-gray-700">
                        Explicación de la Respuesta
                      </label>
                      <textarea
                        id="explanation"
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        value={question.explanation}
                        onChange={(e) => setQuestion({ ...question, explanation: e.target.value })}
                        placeholder="Explica por qué esta es la respuesta correcta..."
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="explanation_image" className="block text-sm font-medium text-gray-700">
                        Imagen para la Explicación (opcional)
                      </label>
                      <div className="mt-1 flex items-center space-x-2">
                        <input
                          type="text"
                          id="explanation_image"
                          className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
                          value={question.explanation_image}
                          onChange={(e) => setQuestion({ ...question, explanation_image: e.target.value })}
                          placeholder="URL de la imagen o sube un archivo"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Subiendo...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Subir
                            </>
                          )}
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            try {
                              setIsUploading(true);
                              setUploadError('');
                              
                              // Comprobar tamaño del archivo
                              if (file.size > 19 * 1024 * 1024) {
                                throw new Error('El archivo es demasiado grande. El tamaño máximo es de 19MB.');
                              }
                              
                              const result = await uploadImage(file);
                              setQuestion({ ...question, explanation_image: result.imageUrl });
                              
                              // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            } catch (error: any) {
                              console.error('Error al subir la imagen:', error);
                              const errorMessage = error.message || 'Error al subir la imagen. Inténtalo de nuevo.';
                              setUploadError(errorMessage);
                            } finally {
                              setIsUploading(false);
                            }
                          }}
                        />
                      </div>
                      
                      {uploadError && (
                        <p className="mt-1 text-sm text-red-600">{uploadError}</p>
                      )}
                      
                      {question.explanation_image && (
                        <div className="mt-2 p-2 border border-gray-200 rounded-md bg-gray-50">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-xs text-gray-500">Vista previa:</p>
                            <button
                              type="button"
                              onClick={() => setQuestion({ ...question, explanation_image: '' })}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Eliminar imagen
                            </button>
                          </div>
                          <div className="relative bg-gray-100 rounded overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 pointer-events-none"></div>
                            <img 
                              src={question.explanation_image} 
                              alt="Vista previa de la imagen" 
                              className="max-h-40 max-w-full object-contain rounded mx-auto"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                // Solo ocultar la imagen sin mostrar mensaje de error
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setEditingQuestion(null);
                          setQuestion({ content: '', case: '', option_a: '', option_b: '', option_c: '', correct_answer: '', explanation: '', explanation_image: '' });
                        }}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        {editingQuestion ? 'Guardar Cambios' : 'Crear'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="mt-8">
              <h3 className="text-lg leading-6 font-medium text-gray-900 px-4">
                Banco de Preguntas
              </h3>
              <div className="mt-4 space-y-4">
                {questions.map((q) => (
                  <div
                    key={q._id}
                    className={`bg-white shadow sm:rounded-lg m-4 ${
                      currentQuestion?._id === q._id ? 'ring-2 ring-indigo-500' : ''
                    }`}
                  >
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-grow">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-medium text-gray-900">
                              {q.case && (
                                <div className="mb-2 text-sm text-gray-600 font-normal">
                                  <strong>Caso:</strong> {q.case}
                                </div>
                              )}
                              {q.content}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <select
                                  value={q.timer || ''}
                                  onChange={(e) => handleTimerChange(q._id, Number(e.target.value))}
                                  className="border border-gray-300 rounded-md text-sm"
                                  disabled={q.is_active}
                                >
                                  <option value="">Sin límite</option>
                                  <option value="30">30 segundos</option>
                                  <option value="60">1 minuto</option>
                                  <option value="120">2 minutos</option>
                                  <option value="300">5 minutos</option>
                                </select>
                              </div>
                              <button
                                onClick={() => toggleCheatSheet(q._id)}
                                className="ml-2 text-gray-400 hover:text-gray-600"
                                title={showCheatSheet[q._id] ? "Ocultar machete" : "Mostrar machete"}
                              >
                                {showCheatSheet[q._id] ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                              <button
                                onClick={() => handleEdit(q)}
                                className="text-blue-600 hover:text-blue-700"
                                title="Editar pregunta"
                                disabled={q.is_active}
                              >
                                <Edit2 className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                          {showCheatSheet[q._id] && (
                            <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                              <p className="text-sm text-yellow-800">
                                <strong>Respuesta correcta:</strong> Opción {q.correct_option}
                              </p>
                              {q.explanation && (
                                <p className="text-sm text-yellow-800 mt-1">
                                  <strong>Explicación:</strong> {typeof q.explanation === 'object' ? JSON.stringify(q.explanation) : String(q.explanation)}
                                </p>
                              )}
                            </div>
                          )}
                          <div className="space-y-3">
                            {['A', 'B', 'C'].map((option) => {
                              const stat = stats.find(s => s.option === option);
                              const isActive = currentQuestion?._id === q._id;
                              
                              return (
                                <div key={option} className="space-y-1">
                                  <div className="flex justify-between items-center">
                                    <p className="text-sm text-gray-600">
                                      {option}: {String(q[`option_${option.toLowerCase()}` as keyof typeof q] || '')}
                                    </p>
                                    {isActive && (
                                      <span className="text-sm text-gray-500">
                                        {stat?.percentage}% ({stat?.count} votos)
                                      </span>
                                    )}
                                  </div>
                                  {isActive && (
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-indigo-500 transition-all duration-500"
                                        style={{ width: `${stat?.percentage || 0}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => deleteQuestion(q._id)}
                            className="text-red-600 hover:text-red-700"
                            title="Eliminar pregunta"
                            disabled={q.is_active}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-4">
                        {!q.is_active ? (
                          <button
                            onClick={() => handleStartVoting(q._id)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Iniciar Votación
                          </button>
                        ) : (
                          <div className="space-y-3">
                            <div className="text-sm text-gray-500">
                              {q.is_active && (
                                <>
                                  Total de votos: {getStatsForActiveQuestion().totalVotes}
                                  {timeRemaining !== null && (
                                    <span className="ml-4" style={{ color: timeRemaining <= 5 ? '#ef4444' : '' }}>
                                      Tiempo restante: {timeRemaining} segundos
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            {/* Solo mostrar el selector si estamos seleccionando una respuesta correcta y la pregunta no tiene una respuesta correcta configurada */}
                            {selectingCorrectAnswer === q._id && !q.correct_option ? (
                              <div className="flex items-center space-x-2">
                                <div className="relative">
                                  <select
                                    value={selectedCorrectOption}
                                    onChange={(e) => setSelectedCorrectOption(e.target.value)}
                                    className="border border-gray-300 rounded-md shadow-sm p-2 bg-white appearance-none pr-8"
                                  >
                                    <option value="">Seleccionar respuesta correcta</option>
                                    <option value="A">Opción A</option>
                                    <option value="B">Opción B</option>
                                    <option value="C">Opción C</option>
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </div>
                                </div>
                                <button
                                  onClick={async () => {
                                    try {
                                      if (selectedCorrectOption) {
                                        await stopVoting(q._id, selectedCorrectOption);
                                        setSelectingCorrectAnswer(null);
                                        setSelectedCorrectOption('');
                                        // Mostrar notificación temporal de éxito
                                        showNotification(`Respuesta correcta seleccionada y mostrada: ${selectedCorrectOption}`, 'success');
                                      }
                                    } catch (error) {
                                      console.error('Error al detener la votación:', error);
                                      // Mostrar notificación de error
                                      showNotification('Error al detener la votación', 'error');
                                    }
                                  }}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                  disabled={!selectedCorrectOption}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Confirmar
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectingCorrectAnswer(null);
                                    setSelectedCorrectOption('');
                                  }}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  // Siempre usar la opción correcta ya configurada
                                  // Si la pregunta tiene una respuesta correcta configurada, usarla directamente
                                  if (q.correct_option) {
                                    stopVoting(q._id, q.correct_option);
                                    // Mostrar notificación temporal de éxito
                                    showNotification(`Respuesta correcta mostrada: ${q.correct_option}`, 'success');
                                  } else {
                                    // Si por alguna razón no tiene respuesta correcta configurada
                                    // (esto no debería ocurrir si se creó correctamente)
                                    // Usar opción A por defecto
                                    stopVoting(q._id, 'A');
                                    showNotification('Respuesta mostrada: Opción A (por defecto)', 'info');
                                  }
                                }}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                              >
                                <StopCircle className="h-4 w-4 mr-2" />
                                Detener y Mostrar Respuesta Correcta
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'rankings' ? (
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Estadísticas de Participantes</h2>
              <button
                onClick={async () => {
                  // Confirmar antes de reiniciar la sesión
                  if (window.confirm('¿Estás seguro de que deseas reiniciar la sesión? Esto eliminará todos los participantes y sus datos. Esta acción no se puede deshacer.')) {
                    try {
                      // Corregimos la URL de reinicio de sesión
                      const response = await fetch('/api/admin/reset-session', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        }
                      });
                      
                      if (!response.ok) {
                        throw new Error('Error al reiniciar la sesión');
                      }
                      
                      // Mostrar notificación de éxito
                      showNotification('Sesión reiniciada correctamente. Todos los participantes deberán registrarse nuevamente.', 'success');
                    } catch (error) {
                      console.error('Error al reiniciar la sesión:', error);
                      showNotification('Error al reiniciar la sesión', 'error');
                    }
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reiniciar Sesión
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Aquí puedes ver el ranking de participantes basado en respuestas correctas y tiempo de respuesta.
              Los participantes se ordenan por puntos (mayor a menor) y en caso de empate, por tiempo total (menor a mayor).
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Reiniciar sesión:</strong> Al usar esta función, se eliminarán todos los participantes y sus datos. Todos deberán registrarse nuevamente para participar.
                  </p>
                </div>
              </div>
            </div>
            
            <ParticipantRanking className="mt-4" />
          </div>
        ) : (
          // Contenido de la pestaña de configuración
          <QuizConfigPanel onSaved={() => showNotification('Configuración guardada correctamente', 'success')} />
        )}
      </div>
    </div>
  );
}