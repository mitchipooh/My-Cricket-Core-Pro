
import { CompletedMatch, MatchResult } from './types.ts';

export function calculateMatchResult(match: Omit<CompletedMatch, 'result' | 'margin'>): { result: MatchResult; margin: string } {
  if (match.teamAScore === match.teamBScore) {
    return { result: 'TIE', margin: 'Match Tied' };
  }

  if (match.teamAScore > match.teamBScore) {
    const margin = match.teamAScore - match.teamBScore;
    return { 
      result: 'HOME_WIN', 
      margin: `${match.teamAName} won by ${margin} runs` 
    };
  } else {
    const wicketsLeft = 11 - match.teamBWkts; // Standard 11 players
    return { 
      result: 'AWAY_WIN', 
      margin: `${match.teamBName} won by ${wicketsLeft} wickets` 
    };
  }
}
