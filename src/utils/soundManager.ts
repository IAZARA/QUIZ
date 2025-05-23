import { useQuizConfigStore } from '../store/quizConfigStore';

export const playSound = (soundFileName: string, specificVolume?: number): void => {
  const { config } = useQuizConfigStore.getState();

  if (!config.soundsEnabled) {
    return;
  }

  const soundFilePath = `/sounds/${soundFileName}`;
  const audio = new Audio(soundFilePath);

  // Set volume using masterVolume from the store.
  // Fallback to 0.75 if masterVolume is somehow undefined, aligning with store default.
  let effectiveVolume = config.masterVolume ?? 0.75;

  // If a specificVolume is provided, it can modulate the masterVolume.
  // For example: effectiveVolume = (config.masterVolume ?? 0.75) * (specificVolume ?? 1.0);
  // However, the subtask asked to prioritize masterVolume directly for now.
  // So, we'll stick to:
  audio.volume = effectiveVolume;

  // Ensure volume is clamped between 0 and 1, though masterVolume should already be validated by the store.
  if (audio.volume < 0) audio.volume = 0;
  if (audio.volume > 1) audio.volume = 1;

  const playPromise = audio.play();

  if (playPromise !== undefined) {
    playPromise.catch(error => {
      console.error(`Error playing sound ${soundFileName}: ${error}`);
    });
  }
};
