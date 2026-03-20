
import { MatchState, Team } from '@shared/types';

export type EndReason = 'All Out' | 'Overs Completed' | 'Target Chased' | 'Declared' | 'Match Concluded' | null;

export const checkEndOfInnings = (state: MatchState, totalOversAllowed: number, battingTeamPlayers: number = 11, allowFlexibleSquad: boolean = false, matchFormat: string = 'T20'): EndReason => {
  // 0. Declaration / Conclusion Check
  if (state.adjustments?.declared) return 'Declared';
  if (state.adjustments?.concluded) return 'Match Concluded';

  // 1. Wickets Logic
  // Ensure we have a valid player count (fallback to 11 if data missing)
  const effectivePlayers = battingTeamPlayers > 0 ? battingTeamPlayers : 11;

  // In cricket, you need a pair to bat. So max wickets is players - 1.
  const maxPossibleWickets = Math.max(0, effectivePlayers - 1);

  // If not flexible (Standard Rules), cap wickets at 10.
  const wicketLimit = allowFlexibleSquad ? maxPossibleWickets : Math.min(10, maxPossibleWickets);

  if (state.wickets >= wicketLimit) return 'All Out';

  // 2. Overs Completed
  // For Test matches, overs are per day, not hard limit for innings usually, 
  // but if custom overs are set (e.g. 450), we might respect it. 
  // Generally, Test innings end on wickets or declaration.
  if (matchFormat !== 'Test') {
    if (state.totalBalls >= totalOversAllowed * 6) return 'Overs Completed';
  }

  // 3. Target Chased
  // Limited Overs: 2nd innings chase.
  // Test: 4th innings chase.
  if (state.target !== undefined && state.score >= state.target) {
    return 'Target Chased';
  }

  return null;
};

export const endInnings = (state: MatchState, reason: string): MatchState => {
  return {
    ...state,
  };
};

