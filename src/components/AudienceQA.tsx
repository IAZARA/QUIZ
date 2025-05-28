import React, { useEffect, useState, useRef } from 'react';
import { useAudienceQAStore } from '../store/audienceQAStore';
import { useParticipantStore } from '../store/participantStore'; // Import participant store
import { AudienceQuestion } from '../types';
import { ThumbsUp, MessageCircle } from 'lucide-react'; // Icons

interface AudienceQAProps {
  isAdmin: boolean;
}

const AudienceQA: React.FC<AudienceQAProps> = ({ isAdmin }) => {
  const {
    questions,
    isLoading,
    error,
    fetchQuestions,
    submitQuestion,
    markAsAnswered,
    deleteQuestion,
    upvoteQuestion, // Added upvoteQuestion
    initializeSocket,
    isAudienceQAActive,
    activateAudienceQA,
    deactivateAudienceQA,
  } = useAudienceQAStore();

  const { currentParticipant } = useParticipantStore(); // Get current participant

  const [newQuestionText, setNewQuestionText] = useState('');
  const [authorName, setAuthorName] = useState(''); // State for author's name
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [upvoteError, setUpvoteError] = useState<Record<string, string | null>>({});
  const [highlightedQuestions, setHighlightedQuestions] = useState<Set<string>>(new Set());

  const prevQuestionsRef = useRef<AudienceQuestion[]>([]);

  useEffect(() => {
    initializeSocket(); // Ensure socket is connected
    fetchQuestions();
  }, [fetchQuestions, initializeSocket]);

  useEffect(() => {
    if (isAdmin) {
      const newQuestions = questions.filter(
        (q) => !prevQuestionsRef.current.some(pq => pq._id === q._id) && new Date(q.createdAt).getTime() > Date.now() - 5000 // Consider recent as new
      );
      if (newQuestions.length > 0) {
        const newIds = new Set(highlightedQuestions);
        newQuestions.forEach(q => newIds.add(q._id));
        setHighlightedQuestions(newIds);

        newQuestions.forEach(q => {
          setTimeout(() => {
            setHighlightedQuestions(prevIds => {
              const updatedIds = new Set(prevIds);
              updatedIds.delete(q._id);
              return updatedIds;
            });
          }, 5000); // Highlight duration
        });
      }
    }
    prevQuestionsRef.current = questions;
  }, [questions, isAdmin]);


  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) {
      setSubmitError('La pregunta no puede estar vacía.');
      return;
    }
    try {
      await submitQuestion(newQuestionText, authorName.trim() || undefined); // Pass authorName
      setNewQuestionText('');
      setAuthorName(''); // Clear author name after submission
      setSubmitError(null);
    } catch (err: any) {
      setSubmitError(err.message || 'Error al enviar la pregunta.');
    }
  };

  const handleUpvote = async (questionId: string) => {
    if (!currentParticipant || !currentParticipant._id) {
      setUpvoteError(prev => ({ ...prev, [questionId]: 'Debes estar registrado para votar.' }));
      return;
    }
    try {
      await upvoteQuestion(questionId, currentParticipant._id);
      setUpvoteError(prev => ({ ...prev, [questionId]: null }));
    } catch (err: any) {
      setUpvoteError(prev => ({ ...prev, [questionId]: err.message || 'Error al votar.'}));
    }
  };

  if (isLoading && questions.length === 0) {
    return <div className="text-center p-4">Cargando preguntas...</div>;
  }

  if (error && questions.length === 0) {
    return <div className="text-center p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className={`p-4 rounded-lg shadow-md ${isAdmin ? 'bg-gray-800 text-white' : 'bg-white'}`}>
      <h2 className="text-2xl font-bold mb-6 text-center">
        {isAdmin ? 'Gestionar Preguntas de la Audiencia' : 'Preguntas de la Audiencia'}
      </h2>

      {isAdmin && (
        <div className="mb-6 p-4 border border-gray-600 rounded-lg bg-gray-700">
          <h3 className="text-lg font-semibold mb-3 text-gray-100">Control de Visibilidad para Audiencia</h3>
          <button
            onClick={async () => {
              try {
                if (isAudienceQAActive) {
                  await deactivateAudienceQA();
                } else {
                  await activateAudienceQA();
                }
              } catch (err) {
                // Error is set in the store, and will be displayed by the {error && ...} block below
                console.error("Error toggling Audience Q&A activation", err);
              }
            }}
            disabled={isLoading} 
            className={`w-full px-4 py-2 font-semibold rounded-md transition-colors duration-150 ease-in-out
              ${isAudienceQAActive 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'}
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 
              ${isAudienceQAActive ? 'focus:ring-red-500' : 'focus:ring-green-500'}
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading 
              ? (isAudienceQAActive ? 'Desactivando...' : 'Activando...') 
              : (isAudienceQAActive ? 'Desactivar Q&A para Audiencia' : 'Activar Q&A para Audiencia')}
          </button>
          {/* Display error from store if any occurred during activation/deactivation */}
          {error && <p className="text-red-400 text-sm mt-2">Error: {error}</p>}
        </div>
      )}

      {!isAdmin && !isAudienceQAActive && (
         <div className="text-center p-4 my-6 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700">
            La sección de preguntas y respuestas de la audiencia no está activa en este momento.
          </p>
        </div>
      )}

      {!isAdmin && isAudienceQAActive && (
        <form onSubmit={handleSubmitQuestion} className="mb-6 space-y-3">
          <div>
            <label htmlFor="questionText" className="block text-sm font-medium text-gray-700 mb-1">Tu Pregunta:</label>
            <textarea
              id="questionText"
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              placeholder="Escribe tu pregunta aquí..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700 resize-none"
              rows={3}
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="authorName" className="block text-sm font-medium text-gray-700 mb-1">Tu Nombre (Opcional):</label>
            <input
              type="text"
              id="authorName"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Déjalo en blanco para anónimo"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700"
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-50 flex items-center"
              disabled={isLoading}
            >
              <MessageCircle size={18} className="mr-2" />
              {isLoading ? 'Enviando...' : 'Enviar Pregunta'}
            </button>
          </div>
          {submitError && <p className="text-red-500 text-sm mt-1">{submitError}</p>}
        </form>
      )}

      {/* Show this message to admins if Q&A is active but no questions */}
      {isAdmin && isAudienceQAActive && questions.length === 0 && !isLoading && (
         <p className="text-center text-gray-400 my-4">
           El Q&A está activo para la audiencia. Aún no hay preguntas.
         </p>
      )}
      
      {/* Show this message to admins if Q&A is not active */}
      {isAdmin && !isAudienceQAActive && (
         <p className="text-center text-gray-400 my-4">
           El Q&A para la audiencia está actualmente desactivado. Actívalo para que puedan enviar preguntas.
         </p>
      )}

      {/* For non-admins, only show "no questions" message if Q&A is active */}
      {!isAdmin && isAudienceQAActive && questions.length === 0 && !isLoading && (
        <p className="text-center text-gray-500">
          Sé el primero en hacer una pregunta.
        </p>
      )}
      
      {/* Only render questions list if Q&A is active OR if user is admin (to allow management) */}
      {(isAudienceQAActive || isAdmin) && (
        <div className="space-y-4">
        {questions.map((q) => {
          const hasVoted = q.voters && currentParticipant?._id ? q.voters.includes(currentParticipant._id) : false;
          const isHighlighted = highlightedQuestions.has(q._id);
          return (
            <div
              key={q._id}
              className={`p-4 rounded-lg shadow transition-all duration-300 ease-in-out 
                ${ q.isAnswered
                  ? isAdmin ? 'bg-green-700 border-l-4 border-green-400' : 'bg-green-100 border-l-4 border-green-500 text-green-800'
                  : isAdmin ? (isHighlighted ? 'bg-blue-600 border-l-4 border-blue-400' : 'bg-gray-700 border-l-4 border-gray-500') 
                            : 'bg-gray-50 border-l-4 border-gray-300'
                }
                ${isHighlighted && isAdmin ? 'ring-2 ring-blue-300' : ''}
              `}
            >
              <p className={`text-lg ${isAdmin ? 'text-gray-100' : 'text-gray-800'}`}>{q.text}</p>
              <div className={`text-xs mt-1 flex items-center flex-wrap ${isAdmin ? 'text-gray-400' : 'text-gray-500'}`}>
                <span>Por: {q.author || 'Anónimo'}</span>
                <span className="mx-1">|</span>
                <span>{new Date(q.createdAt).toLocaleString()}</span>
                {q.isAnswered && (
                  <>
                    <span className="mx-1">|</span>
                    <span className={`font-semibold ${isAdmin ? 'text-green-300' : 'text-green-600'}`}>
                      Respondida
                    </span>
                  </>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center">
                  <span className={`mr-2 text-sm font-semibold ${isAdmin ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    {q.upvotes} {q.upvotes === 1 ? 'voto' : 'votos'}
                  </span>
                  {!isAdmin && currentParticipant && (
                    <button
                      onClick={() => handleUpvote(q._id)}
                      disabled={hasVoted || isLoading}
                      className={`p-1 rounded-full transition-colors duration-150 ease-in-out
                        ${hasVoted 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-blue-500 hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300'
                        } disabled:opacity-70`}
                      aria-label={hasVoted ? 'Ya votaste' : 'Votar'}
                    >
                      <ThumbsUp size={18} className={hasVoted ? 'fill-current text-blue-500' : ''} />
                    </button>
                  )}
                  {upvoteError[q._id] && <p className="text-red-500 text-xs ml-2">{upvoteError[q._id]}</p>}
                </div>

                {isAdmin && (
                <div className="flex gap-2">
                {!q.isAnswered && (
                  <button
                    onClick={() => markAsAnswered(q._id)}
                    className="bg-green-500 hover:bg-green-600 text-white font-medium py-1 px-3 rounded-md text-sm transition duration-150 ease-in-out disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Marcar como Respondida
                  </button>
                )}
                  <button
                    onClick={() => deleteQuestion(q._id)}
                    className="bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded-md text-sm transition duration-150 ease-in-out disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Eliminar
                  </button>
                </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default AudienceQA;
