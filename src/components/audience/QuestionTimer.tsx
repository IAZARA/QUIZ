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

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const progressPercentage = timeRemaining <= 30 ? (timeRemaining / 30) * 100 : 100;

  return (
    <div className={`p-4 border-b border-border-light transition-all duration-normal ${
      timerWarning ? 'bg-warning-light' : 'bg-bg-tertiary'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Clock className={`h-4 w-4 transition-colors duration-normal ${
            timerWarning ? 'text-warning animate-pulse' : 'text-text-muted'
          }`} />
          <span className={`text-sm font-medium transition-colors duration-normal ${
            timerWarning ? 'text-warning' : 'text-text-secondary'
          }`}>
            {t('timeRemaining')}
          </span>
        </div>
        <div className={`text-lg font-bold tabular-nums transition-colors duration-normal ${
          timerWarning ? 'text-warning' : 'text-text-primary'
        }`}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      </div>
      
      {/* Barra de progreso minimalista */}
      <div className="w-full bg-bg-secondary rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear rounded-full ${
            timerWarning ? 'bg-warning' : 'bg-accent'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {showTimer && <TimerSound warning={timerWarning} />}
    </div>
  );
};

export default QuestionTimer;
