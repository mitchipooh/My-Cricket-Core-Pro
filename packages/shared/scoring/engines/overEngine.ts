
import { MatchState, BallEvent } from '@shared/types';
import { isLegalBall } from '@shared/utils/cricket-engine.ts';

export const isOverComplete = (balls: number): boolean => {
  return balls > 0 && balls % 6 === 0;
};

export const applyDeliveryToOver = (state: MatchState, event: Partial<BallEvent>): MatchState => {
  const { runs = 0, extraRuns = 0, extraType = 'None', isWicket = false } = event;
  
  const isLegal = isLegalBall(extraType);
  const penalty = (extraType === 'Wide' || extraType === 'NoBall') ? 1 : 0;
  
  // Calculate Score Updates
  const nextScore = state.score + runs + extraRuns + penalty;
  const nextBalls = isLegal ? state.totalBalls + 1 : state.totalBalls;

  // Determine Strike Rotation
  let sId = state.strikerId;
  let nsId = state.nonStrikerId;

  // 1. Rotate on odd runs (physical runs only)
  const physicalRuns = runs + (['Bye', 'LegBye', 'Wide', 'NoBall'].includes(extraType) ? extraRuns : 0);
  if (physicalRuns % 2 !== 0) {
    [sId, nsId] = [nsId, sId];
  }

  // 2. Rotate at end of over (if legal ball completed the over)
  if (isLegal && nextBalls % 6 === 0 && nextBalls > 0) {
    [sId, nsId] = [nsId, sId];
  }

  return {
    ...state,
    score: nextScore,
    totalBalls: nextBalls,
    strikerId: sId,
    nonStrikerId: nsId
  };
};

