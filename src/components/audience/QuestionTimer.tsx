import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import TimerSound from '../TimerSound';

interface QuestionTimerProps {
  timeRemaining: number | null;
  timerWarning: boolean;
  showTimer: boolean;
}

const QuestionTimer: React.FC<QuestionTimerProps> = ({
  timeRemaining,
  timerWarning,
  showTimer
}) => {
  const { t } = useTranslation();

  if (timeRemaining === null) return null;

  return (
    <div className={`p-4 ${timerWarning ? 'bg-red-100 dark:bg-red-500/20' : 'bg-accent/10 dark:bg-accent/20'} flex items-center justify-between border-b border-border-color`}>
      <div className="flex items-center">
        <Clock className={`h-5 w-5 ${timerWarning ? 'text-red-600 dark:text-red-400' : 'text-accent'} mr-2`} />
        <span className={`font-medium ${timerWarning ? 'text-red-600 dark:text-red-400' : 'text-accent'}`}>
          {t('timeRemaining')}: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
        </span>
      </div>
      {showTimer && <TimerSound warning={timerWarning} />}
    </div>
  );
};

export default QuestionTimer;
