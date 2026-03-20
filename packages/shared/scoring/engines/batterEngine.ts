
import { MatchState } from '@shared/types';

export const handleWicket = (state: MatchState, outPlayerId: string): MatchState => {
  let sId = state.strikerId;
  let nsId = state.nonStrikerId;

  // Remove the dismissed batter from the crease
  if (sId === outPlayerId) {
    sId = '';
  } else if (nsId === outPlayerId) {
    nsId = '';
  }

  return {
    ...state,
    wickets: state.wickets + 1,
    strikerId: sId,
    nonStrikerId: nsId
  };
};

export const assignNewBatter = (state: MatchState, playerId: string, role: 'Striker' | 'NonStriker'): MatchState => {
  return {
    ...state,
    strikerId: role === 'Striker' ? playerId : state.strikerId,
    nonStrikerId: role === 'NonStriker' ? playerId : state.nonStrikerId
  };
};

