import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Check } from 'lucide-react';
import QuestionTimer from './QuestionTimer';
import QuestionOption from './QuestionOption';
import QuestionExplanation from './QuestionExplanation';
import PersonalResult from './PersonalResult';

interface OptionStat {
  option: string;
  count: number;
  percentage: number;
  showPercentage: boolean;
}

interface QuestionInterfaceProps {
  currentQuestion: any;
  timeRemaining: number | null;
  timerWarning: boolean;
  showTimer: boolean;
  selectedOption: string | null;
  hasVoted: boolean;
  submitting: boolean;
  error: string | null;
  stats: OptionStat[];
  handleVote: (option: string) => void;
}

const QuestionInterface: React.FC<QuestionInterfaceProps> = ({
  currentQuestion,
  timeRemaining,
  timerWarning,
  showTimer,
  selectedOption,
  hasVoted,
  submitting,
  error,
  stats,
  handleVote
}) => {
  const { t } = useTranslation();

  // Determinar qué mostrar según el estado de la pregunta
  const getAudienceView = () => {
    // Pregunta finalizada - no activa, votación cerrada, SIN respuesta correcta
    // Solo mostrar "esperando siguiente pregunta" si la pregunta está completamente finalizada
    if (!currentQuestion.is_active && currentQuestion.votingClosed && currentQuestion.correct_option) {
      return (
        <div className="card animate-fadeInScale">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              {t('waitingForNextQuestion')}
            </h2>
            <p className="text-text-secondary">
              {t('presenterWillStartNextQuestion')}
            </p>
            <div className="flex justify-center space-x-2 mt-6">
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-accent/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      );
    }
    
    // Votación cerrada pero sin respuesta correcta - esperando al presentador
    // Solo mostrar este mensaje si la votación está cerrada PERO no hay respuesta correcta aún
    if (currentQuestion.votingClosed && !currentQuestion.correct_option) {
      const message = timeRemaining === 0
        ? "⏰ Tiempo agotado, esperando resultados del presentador..."
        : "⏸️ Votación detenida, esperando resultados del presentador...";
      
      return (
        <div className="card animate-fadeInScale">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              {message}
            </h2>
            <p className="text-text-secondary">
              El presentador decidirá cuándo mostrar la respuesta correcta.
            </p>
            <div className="flex justify-center space-x-2 mt-6">
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-accent/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      );
    }
    
    // Si hay respuesta correcta, continuar con la interfaz normal para mostrar resultados
    // Si la votación está activa, continuar con la interfaz normal para votar
    return null;
  };

  // Verificar si debe mostrar vista especial
  const specialView = getAudienceView();
  if (specialView) {
    return specialView;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Temporizador mejorado */}
      <div className="mb-6">
        <QuestionTimer
          timeRemaining={timeRemaining}
          timerWarning={timerWarning}
          showTimer={showTimer}
        />
      </div>

      {/* Contenedor principal con diseño mejorado */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fadeInUp">
        <div className="p-8 space-y-8">
          {/* Contenido de la pregunta con diseño mejorado */}
          <div className="animate-fadeIn">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">?</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-relaxed">
                {currentQuestion.content}
              </h2>
            </div>

            {currentQuestion.case && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-1">
                    <span className="text-white text-xs font-bold">i</span>
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {currentQuestion.case}
                  </div>
                </div>
              </div>
            )}
          </div>

        {/* Mensaje cuando no se seleccionó ninguna opción y la votación está cerrada */}
        {!selectedOption && currentQuestion.votingClosed && (
          <div className="mb-6 p-4 bg-warning-light border border-warning/30 rounded-lg animate-fadeIn">
            <div className="flex items-center text-warning">
              <svg className="h-5 w-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-medium">{t('noOptionSelected')}</span>
            </div>
          </div>
        )}

        {/* Opciones */}
        <div className="space-y-3 mb-6">
          {['a', 'b', 'c'].map((option) => {
            const optionKey = `option_${option}` as keyof typeof currentQuestion;
            const optionContent = currentQuestion[optionKey] as string;
            const statForOption = stats.find(s => s.option === option);
            const isCorrect = currentQuestion.votingClosed &&
                               currentQuestion.correct_option?.toLowerCase() === option;
            const isSelected = selectedOption === option;

            // Mostrar estadísticas cuando:
            // 1. La votación está cerrada Y hay respuesta correcta (resultados mostrados)
            // 2. O cuando la votación está cerrada (estado de espera)
            const statForAudience = (currentQuestion.votingClosed && currentQuestion.correct_option) ? statForOption :
                                   currentQuestion.votingClosed ? undefined : undefined;

            return (
              <QuestionOption
                key={option}
                option={option}
                content={optionContent}
                statForOption={statForAudience}
                isCorrect={isCorrect}
                isSelected={isSelected}
                hasVoted={hasVoted}
                votingClosed={currentQuestion.votingClosed}
                submitting={submitting}
                handleVote={handleVote}
              />
            );
          })}
        </div>

        {/* Botón de enviar mejorado */}
        {!hasVoted && !currentQuestion.votingClosed && (
          <div className="mt-8">
            <button
              onClick={() => selectedOption && handleVote(selectedOption)}
              disabled={!selectedOption || submitting}
              className={`btn-enhanced w-full py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-300 transform ${
                !selectedOption || submitting
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 animate-glow'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>{t('submittingAnswerButton')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('submitAnswerButton')}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </div>
            </button>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-error-light border border-error/30 rounded-lg animate-fadeIn">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-error mt-0.5" />
              </div>
              <div className="ml-3">
                <p className="text-error font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {hasVoted && !currentQuestion.votingClosed && (
          <div className="mt-6 p-4 bg-success-light border border-success/30 rounded-lg animate-fadeInScale">
            <div className="flex items-center text-success">
              <Check className="h-5 w-5 mr-3 flex-shrink-0" />
              <span className="font-medium">{t('answerRegistered')}</span>
            </div>
          </div>
        )}

        {/* Mostrar resultado personal cuando la votación esté cerrada */}
        {currentQuestion.votingClosed && currentQuestion.correct_option && (
          <PersonalResult
            selectedOption={selectedOption}
            correctOption={currentQuestion.correct_option}
            hasVoted={hasVoted}
            question={currentQuestion}
          />
        )}

        {currentQuestion.votingClosed && currentQuestion.explanation && (
          <QuestionExplanation
            explanation={currentQuestion.explanation}
            explanationImage={currentQuestion.explanation_image}
          />
        )}
        </div>
      </div>
    </div>
  );
};

export default QuestionInterface;
