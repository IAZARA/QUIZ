import React, { useEffect } from 'react';
import { playSound } from '../../utils/soundManager';

interface TimerSoundProps {
  warning: boolean;
}

export default function TimerSound({ warning }: TimerSoundProps) {
  useEffect(() => {
    if (warning) {
      playSound('countdown.mp3');
    }
  }, [warning]);

  return null;
}