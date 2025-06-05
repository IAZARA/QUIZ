import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

interface OptionStat {
  option: string;
  count: number;
  percentage: number;
  showPercentage: boolean;
}

interface QuestionOptionProps {
  option: string;
  content: string;
  statForOption: OptionStat | undefined;
  isCorrect: boolean;
  isSelected: boolean;
  hasVoted: boolean;
  votingClosed: boolean;
  submitting: boolean;
  handleVote: (option: string) => void;
}

const QuestionOption: React.FC<QuestionOptionProps> = ({
  option,
  content,
  statForOption,
  isCorrect,
  isSelected,
  hasVoted,
  votingClosed,
  submitting,
  handleVote
}) => {
  const { t } = useTranslation();

  // Determinar el estado visual de la opción
  const getOptionStyles = () => {
    if (hasVoted || votingClosed) {
      if (isSelected) {
        if (isCorrect) {
          return {
            button: 'bg-success-light border-success/30 cursor-default',
            letter: 'bg-success text-white',
            text: 'text-success',
            indicator: 'text-success'
          };
        } else {
          return {
            button: 'bg-error-light border-error/30 cursor-default',
            letter: 'bg-error text-white',
            text: 'text-error',
            indicator: 'text-error'
          };
        }
      } else {
        return {
          button: `bg-bg-secondary border-border cursor-default ${isCorrect ? 'border-success/30' : ''}`,
          letter: 'bg-bg-tertiary text-text-muted',
          text: `text-text-primary ${isCorrect ? 'text-success' : ''}`,
          indicator: 'text-success'
        };
      }
    } else {
      if (isSelected) {
        return {
          button: 'bg-accent/10 border-accent cursor-pointer micro-scale ring-2 ring-accent/20',
          letter: 'bg-accent text-white',
          text: 'text-accent font-medium',
          indicator: ''
        };
      } else {
        return {
          button: 'bg-bg-secondary border-border cursor-pointer micro-hover hover:border-accent/30 hover:bg-accent/5',
          letter: 'bg-bg-tertiary text-text-muted group-hover:bg-accent/20 group-hover:text-accent',
          text: 'text-text-primary group-hover:text-accent',
          indicator: ''
        };
      }
    }
  };

  const styles = getOptionStyles();

  return (
    <button
      onClick={() => !hasVoted && !votingClosed && handleVote(option)}
      disabled={hasVoted || votingClosed || submitting}
      className={`w-full text-left p-6 rounded-xl border-2 transition-all duration-300 ease-out group animate-fadeInScale shadow-sm hover:shadow-lg ${styles.button} ${
        isSelected && !hasVoted && !votingClosed ? 'animate-bounceIn' : ''
      }`}
      style={{ animationDelay: `${(option.charCodeAt(0) - 97) * 100}ms` }}
    >
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <span className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full mr-4 text-lg font-bold transition-all duration-300 shadow-sm ${styles.letter}`}>
              {option.toUpperCase()}
            </span>
            <span className={`text-lg font-medium transition-all duration-300 ${styles.text}`}>
              {content}
            </span>
          </div>
          
          {isCorrect && votingClosed && (
            <div className={`flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 transition-all duration-300 ${styles.indicator}`}>
              <Check className="h-4 w-4 mr-1" />
              <span className="text-sm font-semibold">{t('correctAnswer')}</span>
            </div>
          )}
        </div>
        
        {statForOption?.showPercentage && votingClosed && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {statForOption.count} {statForOption.count === 1 ? 'voto' : 'votos'}
              </span>
              <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {statForOption.percentage}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${
                  isCorrect && votingClosed ? 'bg-gradient-to-r from-green-400 to-green-500' :
                  (!isCorrect && hasVoted && isSelected && votingClosed) ? 'bg-gradient-to-r from-red-400 to-red-500' :
                  isSelected ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'
                }`}
                style={{
                  width: `${Math.max(statForOption.percentage, 2)}%`,
                  transitionDelay: '300ms'
                }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </button>
  );
};

export default QuestionOption;
