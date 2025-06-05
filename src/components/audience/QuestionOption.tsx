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
      className={`w-full text-left p-4 rounded-lg border transition-all duration-normal ease-out group animate-fadeIn ${styles.button}`}
      style={{ animationDelay: `${option.charCodeAt(0) - 97 * 100}ms` }}
    >
      <div className="flex-1">
        <div className="flex items-center">
          <span className={`flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-full mr-3 text-sm font-semibold transition-all duration-normal ${styles.letter}`}>
            {option.toUpperCase()}
          </span>
          <span className={`transition-all duration-normal ${styles.text}`}>
            {content}
          </span>
          {isCorrect && votingClosed && (
            <span className={`ml-3 flex items-center text-sm font-medium transition-all duration-normal ${styles.indicator}`}>
              <Check className="h-4 w-4 mr-1" />
              {t('correctAnswer')}
            </span>
          )}
        </div>
        
        {statForOption?.showPercentage && (
          <div className="mt-3 text-sm text-text-muted">
            {statForOption.count} {statForOption.count === 1 ? 'voto' : 'votos'} ({statForOption.percentage}%)
          </div>
        )}

        {statForOption?.showPercentage && (
          <div className="mt-2 w-full bg-bg-tertiary rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-slower ease-out ${
                isCorrect && votingClosed ? 'bg-success' :
                (!isCorrect && hasVoted && isSelected && votingClosed) ? 'bg-error' :
                isSelected ? 'bg-accent' : 'bg-accent/60'
              }`}
              style={{
                width: `${statForOption.percentage}%`,
                transitionDelay: '200ms'
              }}
            ></div>
          </div>
        )}
      </div>
    </button>
  );
};

export default QuestionOption;
