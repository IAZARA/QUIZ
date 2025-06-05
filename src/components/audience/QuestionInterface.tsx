import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Check } from 'lucide-react';
import QuestionTimer from './QuestionTimer';
import QuestionOption from './QuestionOption';
import QuestionExplanation from './QuestionExplanation';

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

  if (currentQuestion.votingClosed) {
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

  return (
    <div className="card animate-fadeInUp">
      {/* Temporizador */}
      <QuestionTimer
        timeRemaining={timeRemaining}
        timerWarning={timerWarning}
        showTimer={showTimer}
      />

      <div className="space-y-6">
        {/* Contenido de la pregunta */}
        <div className="animate-fadeIn">
          <h2 className="text-xl font-semibold text-text-primary mb-4 leading-relaxed">
            {currentQuestion.content}
          </h2>

          {currentQuestion.case && (
            <div className="bg-bg-tertiary border border-border-light rounded-lg p-4 mb-6 text-sm text-text-secondary whitespace-pre-wrap">
              {currentQuestion.case}
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

            return (
              <QuestionOption
                key={option}
                option={option}
                content={optionContent}
                statForOption={statForOption}
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

        {/* Botón de enviar */}
        {!hasVoted && !currentQuestion.votingClosed && (
          <button
            onClick={() => selectedOption && handleVote(selectedOption)}
            disabled={!selectedOption || submitting}
            className="btn-primary w-full py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            {submitting ? t('submittingAnswerButton') : t('submitAnswerButton')}
          </button>
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

        {currentQuestion.votingClosed && currentQuestion.explanation && (
          <QuestionExplanation
            explanation={currentQuestion.explanation}
            explanationImage={currentQuestion.explanation_image}
          />
        )}
      </div>
    </div>
  );
};

export default QuestionInterface;
