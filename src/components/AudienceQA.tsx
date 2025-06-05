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
    <div className={`${isAdmin ? 'p-4 rounded-lg shadow-md bg-gray-800 text-white' : ''}`}>
      {!isAdmin && (
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
            <span className="text-lg font-semibold text-text-primary">En vivo</span>
          </div>
        </div>
      )}
      
      {isAdmin && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            Gestionar Preguntas de la Audiencia
          </h2>
        </div>
      )}

      {/* Notificación de nueva pregunta para audiencia */}
      {!isAdmin && newQuestionNotification && (
        <div className={`mb-6 p-4 border-2 rounded-2xl transition-all duration-500 backdrop-blur-sm shadow-lg ${
          newQuestionNotification.includes('enviada')
            ? 'bg-green-50/80 border-green-300 animate-bounce'
            : 'bg-blue-50/80 border-blue-300 animate-pulse'
        }`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-full mr-4 ${
              newQuestionNotification.includes('enviada')
                ? 'bg-green-200'
                : 'bg-blue-200'
            }`}>
              <MessageCircle className={`h-6 w-6 ${
                newQuestionNotification.includes('enviada')
                  ? 'text-green-600'
                  : 'text-blue-600'
              }`} />
            </div>
            <span className={`font-bold text-lg ${
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
         <div className="text-center p-8 my-8 bg-accent/10 backdrop-blur-sm border-2 border-accent/30 rounded-2xl">
          <MessageCircle className="h-16 w-16 text-accent mx-auto mb-4 opacity-50" />
          <p className="text-text-primary text-xl font-semibold">
            {t('qaNotActive')}
          </p>
          <p className="text-text-secondary mt-2">
            El presentador activará las preguntas pronto
          </p>
        </div>
      )}

      {!isAdmin && isAudienceQAActive && (
        <form onSubmit={handleSubmitQuestion} className="mb-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="questionText" className="block text-lg font-semibold text-text-primary mb-3">{t('yourQuestion')}</label>
              <textarea
                id="questionText"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder={t('writeYourQuestionHere')}
                className="w-full p-4 border-2 border-border-light/50 rounded-xl focus:ring-4 focus:ring-accent/20 focus:border-accent outline-none text-text-primary bg-bg-primary/50 backdrop-blur-sm resize-none transition-all duration-300 text-lg"
                rows={4}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="authorName" className="block text-lg font-semibold text-text-primary mb-3">{t('yourNameOptional')}</label>
              <input
                type="text"
                id="authorName"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder={t('leaveBlankForAnonymous')}
                className="w-full p-4 border-2 border-border-light/50 rounded-xl focus:ring-4 focus:ring-accent/20 focus:border-accent outline-none text-text-primary bg-bg-primary/50 backdrop-blur-sm transition-all duration-300 text-lg"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-accent hover:bg-accent/90 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center text-lg micro-scale"
              disabled={isLoading}
            >
              <MessageCircle size={24} className="mr-3" />
              {isLoading ? t('sending') : t('sendQuestion')}
            </button>
          </div>
          {submitError && <p className="text-red-500 text-center mt-4 p-3 bg-red-50 rounded-lg border border-red-200">{submitError}</p>}
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
        <div className="text-center p-8 my-8 bg-bg-primary/40 backdrop-blur-sm border-2 border-border-light/50 rounded-2xl">
          <MessageCircle className="h-16 w-16 text-accent mx-auto mb-4 opacity-50" />
          <p className="text-text-primary text-xl font-semibold mb-2">
            {t('beFirstToAsk')}
          </p>
          <p className="text-text-secondary">
            Comparte tu pregunta y comienza la conversación
          </p>
        </div>
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
                className={`group p-6 rounded-2xl shadow-lg transition-all duration-500 ease-in-out hover:shadow-xl border-2
                  ${ q.isAnswered
                    ? isAdmin ? 'bg-green-700 border-green-400' : 'bg-green-50/80 backdrop-blur-sm border-green-300 hover:bg-green-100/80'
                    : isAdmin ? (isHighlighted ? 'bg-blue-600 border-blue-400' : 'bg-gray-700 border-gray-500')
                              : 'bg-bg-primary/60 backdrop-blur-sm border-border-light/50 hover:bg-bg-primary/80 hover:border-accent/30'
                  }
                  ${isHighlighted && isAdmin ? 'ring-2 ring-blue-300' : ''}
                  ${!isAdmin ? 'hover:scale-[1.02]' : ''}
                `}
              >
                <p className={`text-xl leading-relaxed mb-4 ${isAdmin ? 'text-gray-100' : q.isAnswered ? 'text-green-800' : 'text-text-primary'}`}>
                  {q.text}
                </p>
                <div className={`text-sm flex items-center flex-wrap gap-2 mb-4 ${isAdmin ? 'text-gray-400' : q.isAnswered ? 'text-green-600' : 'text-text-secondary'}`}>
                  <span className="font-medium">{t('by')}: {q.author || t('anonymous')}</span>
                  <span>•</span>
                  <span>{new Date(q.createdAt).toLocaleString()}</span>
                  {q.isAnswered && (
                    <>
                      <span>•</span>
                      <span className={`font-bold px-2 py-1 rounded-full text-xs ${isAdmin ? 'bg-green-500 text-white' : 'bg-green-200 text-green-800'}`}>
                        {t('answered')}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center space-x-2 px-3 py-2 rounded-full ${isAdmin ? 'bg-yellow-500/20' : 'bg-accent/10'}`}>
                      <ThumbsUp size={16} className={`${isAdmin ? 'text-yellow-400' : 'text-accent'}`} />
                      <span className={`text-sm font-bold ${isAdmin ? 'text-yellow-400' : 'text-accent'}`}>
                        {q.upvotes}
                      </span>
                    </div>
                    {!isAdmin && currentParticipant && (
                      <button
                        onClick={() => handleUpvote(q._id)}
                        disabled={hasVoted || isLoading}
                        className={`p-3 rounded-full transition-all duration-300 ease-in-out
                          ${hasVoted
                            ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                            : 'text-blue-500 hover:bg-blue-100 hover:text-blue-700 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300/50'
                          } disabled:opacity-70`}
                        aria-label={hasVoted ? t('alreadyVoted') : t('voteForQuestion')}
                      >
                        <ThumbsUp size={20} className={hasVoted ? 'fill-current text-blue-500' : ''} />
                      </button>
                    )}
                    {upvoteError[q._id] && <p className="text-red-500 text-sm bg-red-50 px-2 py-1 rounded">{upvoteError[q._id]}</p>}
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
