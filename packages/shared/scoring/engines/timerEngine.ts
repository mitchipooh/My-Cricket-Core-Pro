
import { MatchState } from '@shared/types';

export const startInningsTimer = (state: MatchState): MatchState => {
  if (state.matchTimer.startTime) return state; // Already started
  return {
    ...state,
    matchTimer: {
      ...state.matchTimer,
      startTime: Date.now(),
      isPaused: false
    }
  };
};

export const pauseInningsTimer = (state: MatchState): MatchState => {
  if (state.matchTimer.isPaused) return state;
  return {
    ...state,
    matchTimer: {
      ...state.matchTimer,
      isPaused: true,
      lastPauseTime: Date.now()
    }
  };
};

export const resumeInningsTimer = (state: MatchState): MatchState => {
  if (!state.matchTimer.isPaused) return state;
  
  // Calculate downtime to adjust start time or allowances if needed
  // For simplicity in this architecture, we just flip the flag
  return {
    ...state,
    matchTimer: {
      ...state.matchTimer,
      isPaused: false,
      lastPauseTime: null
    }
  };
};

export const endInningsTimer = (state: MatchState): MatchState => {
  // Logic to freeze timer or record duration could go here
  return {
    ...state,
    matchTimer: {
      ...state.matchTimer,
      isPaused: true
    }
  };
};

