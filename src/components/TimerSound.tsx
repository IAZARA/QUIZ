import React, { useEffect, useRef } from 'react';

interface TimerSoundProps {
  warning: boolean;
}

export default function TimerSound({ warning }: TimerSoundProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (warning) {
      audioRef.current?.play();
    } else {
      audioRef.current?.pause();
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    }
  }, [warning]);

  return (
    <audio
      ref={audioRef}
      src="https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"
      preload="auto"
    />
  );
}