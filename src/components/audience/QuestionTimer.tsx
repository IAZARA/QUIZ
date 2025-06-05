import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, AlertTriangle } from 'lucide-react';
import TimerSound from '../TimerSound';
import { playSound } from '../../utils/soundManager';

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
  const [lastTimeRemaining, setLastTimeRemaining] = useState<number | null>(null);

  // Reproducir sonido cuando el tiempo se agota
  useEffect(() => {
    if (lastTimeRemaining !== null && lastTimeRemaining > 0 && timeRemaining === 0) {
      playSound('countdown.mp3');
    }
    setLastTimeRemaining(timeRemaining);
  }, [timeRemaining, lastTimeRemaining]);

  if (timeRemaining === null) return null;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const progressPercentage = timeRemaining <= 30 ? (timeRemaining / 30) * 100 : 100;
  
  // Estados críticos del temporizador
  const isCritical = timeRemaining <= 10;
  const isUrgent = timeRemaining <= 5;
  const isExpired = timeRemaining === 0;

  // Clases dinámicas basadas en el tiempo restante
  const getTimerClasses = () => {
    if (isExpired) {
      return {
        container: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 shadow-lg',
        icon: 'text-red-600 dark:text-red-400',
        text: 'text-red-700 dark:text-red-300',
        time: 'text-red-800 dark:text-red-200',
        progress: 'bg-red-500'
      };
    } else if (isUrgent) {
      return {
        container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 animate-pulse',
        icon: 'text-red-500 dark:text-red-400 animate-bounce',
        text: 'text-red-600 dark:text-red-300',
        time: 'text-red-700 dark:text-red-200 animate-pulse',
        progress: 'bg-red-500 animate-pulse'
      };
    } else if (isCritical) {
      return {
        container: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
        icon: 'text-orange-500 dark:text-orange-400 animate-pulse',
        text: 'text-orange-600 dark:text-orange-300',
        time: 'text-orange-700 dark:text-orange-200',
        progress: 'bg-orange-500'
      };
    } else {
      return {
        container: 'bg-bg-tertiary border-border-light',
        icon: 'text-text-muted',
        text: 'text-text-secondary',
        time: 'text-text-primary',
        progress: 'bg-accent'
      };
    }
  };

  const classes = getTimerClasses();

  return (
    <div className={`p-4 border-b-2 transition-all duration-300 ${classes.container}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {isCritical ? (
            <AlertTriangle className={`h-5 w-5 transition-all duration-300 ${classes.icon}`} />
          ) : (
            <Clock className={`h-5 w-5 transition-all duration-300 ${classes.icon}`} />
          )}
          <span className={`text-sm font-medium transition-all duration-300 ${classes.text}`}>
            {isExpired ? '¡Tiempo agotado!' : t('timeRemaining')}
          </span>
        </div>
        <div className={`text-2xl font-bold tabular-nums transition-all duration-300 ${classes.time} ${
          isUrgent ? 'transform scale-110' : ''
        }`}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      </div>
      
      {/* Barra de progreso mejorada */}
      <div className="w-full bg-bg-secondary dark:bg-gray-700 rounded-full h-2 overflow-hidden shadow-inner">
        <div
          className={`h-full transition-all duration-1000 ease-linear rounded-full ${classes.progress} ${
            isUrgent ? 'animate-pulse' : ''
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {/* Mensaje de estado */}
      {isExpired && (
        <div className="mt-2 text-center">
          <span className="text-xs font-medium text-red-600 dark:text-red-400 animate-pulse">
            El tiempo ha terminado
          </span>
        </div>
      )}
      
      {showTimer && <TimerSound warning={timerWarning} />}
    </div>
  );
};

export default QuestionTimer;
