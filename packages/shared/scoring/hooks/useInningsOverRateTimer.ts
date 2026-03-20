
import { useEffect, useState } from 'react';

type TimerConfig = {
  oversPerHour?: number; 
};

export function useInningsOverRateTimer(
  matchStartTime: number | null,
  legalBallsBowled: number,
  inningsActive: boolean,
  config?: TimerConfig
) {
  // Default to ~14.1 overs/hr (T20 Standard)
  const oversPerHour = config?.oversPerHour ?? 14.11;
  const secondsPerOver = 3600 / oversPerHour;

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Sync timer with match start time
  useEffect(() => {
    if (!matchStartTime || !inningsActive) return;

    // Initial sync
    setElapsedSeconds(Math.floor((Date.now() - matchStartTime) / 1000));

    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - matchStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [matchStartTime, inningsActive]);

  const actualOvers = legalBallsBowled / 6;
  const expectedOvers = elapsedSeconds / secondsPerOver;
  
  // Logic: Behind rate if actual is less than expected (with 0.5 over grace period)
  // Only flag after 2 overs to avoid noise at the very start
  const behindRate = (actualOvers < expectedOvers - 0.5) && legalBallsBowled > 12;

  return {
    elapsedSeconds,
    actualOvers,
    expectedOvers,
    behindRate,
    // Note: Pause/Resume logic is handled by the engine's matchStartTime adjustment in this architecture
  };
}
