import React, { useEffect, useRef } from 'react';

interface TimerSoundProps {
  timeRemaining: number | null;
  isActive: boolean;
}

export default function TimerSound({ timeRemaining, isActive }: TimerSoundProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isActive && timeRemaining !== null && timeRemaining <= 10 && timeRemaining > 0) {
      audioRef.current?.play();
    } else {
      audioRef.current?.pause();
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    }
  }, [timeRemaining, isActive]);

  return (
    <audio
      ref={audioRef}
      src="https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"
      preload="auto"
    />
  );
}