
import { MatchState } from '@shared/types';

export const canSelectBowler = (state: MatchState, bowlerId: string): boolean => {
  // Simple check: In standard rules, a bowler cannot bowl consecutive overs
  // We check if the current bowlerId (who just finished an over) is the same as the new selection
  // Note: This logic assumes state.bowlerId holds the bowler of the *just completed* over
  if (state.totalBalls > 0 && state.totalBalls % 6 === 0) {
     return state.bowlerId !== bowlerId;
  }
  return true;
};

export const assignBowler = (state: MatchState, bowlerId: string): MatchState => {
  return {
    ...state,
    bowlerId
  };
};

