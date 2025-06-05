import React, { useEffect, useState, useRef } from 'react';
import { useAudienceQAStore } from '../store/audienceQAStore';
import { useParticipantStore } from '../store/participantStore';
import { AudienceQuestion } from '../types';
import { ThumbsUp, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AudienceQAProps {
  isAdmin: boolean;
}

const AudienceQA: React.FC<AudienceQAProps> = ({ isAdmin }) => {
  const { t } = useTranslation();
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
  const [newQuestionNotification, setNewQuestionNotification] = useState<string | null>(null);

  const prevQuestionsRef = useRef<AudienceQuestion[]>([]);

  useEffect(() => {
    initializeSocket(); // Ensure socket is connected
    fetchQuestions();
  }, [fetchQuestions, initializeSocket]);

  useEffect(() => {
    const newQuestions = questions.filter(
      (q) => !prevQuestionsRef.current.some(pq => pq._id === q._id) && new Date(q.createdAt).getTime() > Date.now() - 10000 // Consider recent as new
    );
    
    if (newQuestions.length > 0) {
      if (isAdmin) {
        // Para administradores: resaltar preguntas nuevas
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
      } else {
        // Para audiencia: mostrar notificación de nueva pregunta
        if (newQuestions.length === 1) {
          setNewQuestionNotification(`Nueva pregunta de ${newQuestions[0].author || 'Anónimo'}`);
        } else {
          setNewQuestionNotification(`${newQuestions.length} nuevas preguntas`);
        }
        
        setTimeout(() => {
          setNewQuestionNotification(null);
        }, 4000);
      }
    }
    prevQuestionsRef.current = questions;
  }, [questions, isAdmin, highlightedQuestions]);


  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) {
      setSubmitError(t('questionCannotBeEmpty'));
      return;
    }
    
    setSubmitError(null);
    
    try {
      await submitQuestion(newQuestionText, authorName.trim() || undefined);
      setNewQuestionText('');
      setAuthorName('');
      
      // Mostrar confirmación visual
      setNewQuestionNotification('¡Pregunta enviada correctamente!');
      setTimeout(() => {
        setNewQuestionNotification(null);
      }, 3000);
      
    } catch (err: any) {
      setSubmitError(err.message || t('errorSendingQuestion'));
    }
  };

  const handleUpvote = async (questionId: string) => {
    if (!currentParticipant || !currentParticipant._id) {
      setUpvoteError(prev => ({ ...prev, [questionId]: t('mustBeRegisteredToVote') }));
      return;
    }
    try {
      await upvoteQuestion(questionId, currentParticipant._id);
      setUpvoteError(prev => ({ ...prev, [questionId]: null }));
    } catch (err: any) {
      setUpvoteError(prev => ({ ...prev, [questionId]: err.message || t('errorVoting')}));
    }
  };

  if (isLoading && questions.length === 0) {
    return <div className="text-center p-4 text-text-secondary">{t('loadingQuestions')}</div>;
  }

  if (error && questions.length === 0) {
    return <div className="text-center p-4 text-red-500">{t('error')}: {error}</div>;
  }

  return (
    <div className={`p-4 rounded-lg shadow-md ${isAdmin ? 'bg-gray-800 text-white' : 'bg-bg-primary'}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {isAdmin ? 'Gestionar Preguntas de la Audiencia' : 'Preguntas de la Audiencia'}
        </h2>
        {!isAdmin && isAudienceQAActive && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-text-secondary">En vivo</span>
          </div>
        )}
      </div>

      {/* Notificación de nueva pregunta para audiencia */}
      {!isAdmin && newQuestionNotification && (
        <div className={`mb-4 p-3 border rounded-lg transition-all duration-300 ${
          newQuestionNotification.includes('enviada')
            ? 'bg-green-100 border-green-300 animate-bounce'
            : 'bg-blue-100 border-blue-300 animate-pulse'
        }`}>
          <div className="flex items-center">
            <MessageCircle className={`h-5 w-5 mr-2 ${
              newQuestionNotification.includes('enviada')
                ? 'text-green-600'
                : 'text-blue-600'
            }`} />
            <span className={`font-medium ${
              newQuestionNotification.includes('enviada')
                ? 'text-green-800'
                : 'text-blue-800'
            }`}>
              {newQuestionNotification}
            </span>
          </div>
        </div>
      )}

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
         <div className="text-center p-4 my-6 bg-accent/10 border border-accent/30 rounded-lg">
          <p className="text-text-primary">
            {t('qaNotActive')}
          </p>
        </div>
      )}

      {!isAdmin && isAudienceQAActive && (
        <form onSubmit={handleSubmitQuestion} className="mb-6 space-y-3">
          <div>
            <label htmlFor="questionText" className="block text-sm font-medium text-text-primary mb-1">{t('yourQuestion')}</label>
            <textarea
              id="questionText"
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              placeholder={t('writeYourQuestionHere')}
              className="w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none text-text-primary bg-bg-primary resize-none"
              rows={3}
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="authorName" className="block text-sm font-medium text-text-primary mb-1">{t('yourNameOptional')}</label>
            <input
              type="text"
              id="authorName"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder={t('leaveBlankForAnonymous')}
              className="w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none text-text-primary bg-bg-primary"
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-accent hover:brightness-95 text-button-text font-semibold py-2 px-6 rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-50 flex items-center"
              disabled={isLoading}
            >
              <MessageCircle size={18} className="mr-2" />
              {isLoading ? t('sending') : t('sendQuestion')}
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
        <p className="text-center text-text-secondary">
          {t('beFirstToAsk')}
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
                <p className={`text-lg ${isAdmin ? 'text-gray-100' : 'text-text-primary'}`}>{q.text}</p>
                <div className={`text-xs mt-1 flex items-center flex-wrap ${isAdmin ? 'text-gray-400' : 'text-text-secondary'}`}>
                  <span>{t('by')}: {q.author || t('anonymous')}</span>
                  <span className="mx-1">|</span>
                  <span>{new Date(q.createdAt).toLocaleString()}</span>
                  {q.isAnswered && (
                    <>
                      <span className="mx-1">|</span>
                      <span className={`font-semibold ${isAdmin ? 'text-green-300' : 'text-green-600'}`}>
                        {t('answered')}
                      </span>
                    </>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`mr-2 text-sm font-semibold ${isAdmin ? 'text-yellow-400' : 'text-accent'}`}>
                      {q.upvotes} {q.upvotes === 1 ? t('vote') : t('votes')}
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
                        aria-label={hasVoted ? t('alreadyVoted') : t('voteForQuestion')}
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
      )}
    </div>
  );
};

export default AudienceQA;
