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
      <div className="bg-blue-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6 text-center">
          <h2 className="text-lg font-medium text-white mb-4">
            {t('waitingForNextQuestion')}
          </h2>
          <p className="text-blue-100">
            {t('presenterWillStartNextQuestion')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-800 shadow overflow-hidden sm:rounded-lg">
      {/* Temporizador */}
      <QuestionTimer
        timeRemaining={timeRemaining}
        timerWarning={timerWarning}
        showTimer={showTimer}
      />

      <div className="px-4 py-5 sm:p-6">
        {/* Contenido de la pregunta */}
        <h2 className="text-lg leading-6 font-medium text-white mb-4">
          {currentQuestion.content}
        </h2>

        {currentQuestion.case && (
          <div className="bg-blue-700 rounded-md p-4 mb-6 text-sm text-blue-100 whitespace-pre-wrap">
            {currentQuestion.case}
          </div>
        )}

        {/* Mensaje cuando no se seleccionó ninguna opción y la votación está cerrada */}
        {!selectedOption && currentQuestion.votingClosed && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
            <div className="flex items-center text-yellow-700 dark:text-yellow-400">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-medium">{t('noOptionSelected')}</span>
            </div>
          </div>
        )}

        {/* Opciones */}
        <div className="space-y-4 mb-6">
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
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-blue-800 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? t('submittingAnswerButton') : t('submitAnswerButton')}
          </button>
        )}

        {error && (
          <div className="mt-4 p-4 rounded-md shadow-md border-l-4 bg-red-50 border-red-500 text-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {hasVoted && !currentQuestion.votingClosed && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-md text-sm text-green-600 dark:text-green-400 flex items-center">
            <Check className="h-4 w-4 mr-2" />
            {t('answerRegistered')}
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
