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

  // Dynamically build classes
  let buttonClasses = `w-full text-left p-4 rounded-md flex items-start relative transition-all duration-150 ease-in-out border `;
  let optionLetterClasses = `flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full mr-3 text-sm font-medium `;
  let optionTextClasses = `font-medium `; 
  let correctIndicatorTextClasses = `ml-2 flex items-center `;

  if (hasVoted || votingClosed) { // Voted or results shown
    buttonClasses += 'cursor-default ';
    if (isSelected) { // This option was selected by the user
      if (isCorrect) {
        buttonClasses += 'bg-green-500/10 dark:bg-green-500/20 border-green-500/30 ';
        optionLetterClasses += 'bg-green-500 text-white ';
        optionTextClasses += 'text-green-600 dark:text-green-400 ';
        correctIndicatorTextClasses += 'text-green-600 dark:text-green-400 ';
      } else {
        buttonClasses += 'bg-red-500/10 dark:bg-red-500/20 border-red-500/30 ';
        optionLetterClasses += 'bg-red-500 text-white ';
        optionTextClasses += 'text-red-600 dark:text-red-400 ';
      }
    } else { // This option was NOT selected by the user, but results are shown
      buttonClasses += 'bg-bg-primary border-border-color ';
      optionLetterClasses += 'bg-bg-secondary text-text-secondary ';
      optionTextClasses += 'text-text-primary ';
      if (isCorrect) { // If this unselected option was the correct one
        buttonClasses += 'border-green-500/30 '; // Optionally highlight correct answer
        optionTextClasses += 'text-green-700 dark:text-green-500 '; // Highlight text of correct answer
        correctIndicatorTextClasses += 'text-green-600 dark:text-green-400 ';
      }
    }
  } else { // Voting is open, user has not voted yet
    buttonClasses += 'cursor-pointer hover:bg-bg-secondary border-border-color ';
    optionLetterClasses += 'bg-bg-secondary text-text-secondary ';
    optionTextClasses += 'text-text-primary ';
    if (isSelected) { // User is currently selecting this option (before submitting vote)
      buttonClasses += 'ring-2 ring-accent bg-accent/10 dark:bg-accent/20 border-accent ';
      optionLetterClasses += 'bg-accent text-button-text ';
      optionTextClasses += 'text-accent ';
    }
  }

  return (
    <button
      onClick={() => !hasVoted && !votingClosed && handleVote(option)}
      disabled={hasVoted || votingClosed || submitting}
      className={buttonClasses.trim()}
    >
      <div className="flex-1">
        <div className="flex items-center">
          <span className={optionLetterClasses.trim()}>
            {option.toUpperCase()}
          </span>
          <span className={optionTextClasses.trim()}>
            {content}
          </span>
          {isCorrect && votingClosed && (
            <span className={correctIndicatorTextClasses.trim()}>
              <Check className="h-4 w-4 mr-1" />
              {t('correctAnswer')}
            </span>
          )}
        </div>
      </div>

      {statForOption?.showPercentage && (
        <div className="mt-1 text-sm text-text-secondary">
          {statForOption.count} votos ({statForOption.percentage}%)
        </div>
      )}

      {statForOption?.showPercentage && (
        <div className="mt-2 w-full bg-bg-secondary dark:bg-gray-700 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full
            ${isCorrect && votingClosed ? 'bg-green-500' :
              (!isCorrect && hasVoted && isSelected && votingClosed) ? 'bg-red-500' :
              isSelected ? 'bg-accent' : 'bg-accent/50'}`}
            style={{ width: `${statForOption.percentage}%` }}
          ></div>
        </div>
      )}
    </button>
  );
};

export default QuestionOption;
