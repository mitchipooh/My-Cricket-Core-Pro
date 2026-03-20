import { MatchState, BallEvent, MatchFixture } from '../types.ts';
import { isLegalBall, getOverString } from '../utils/cricket-engine.ts';
import { DISMISSAL_MATRIX } from './MatchSelectors.ts';

/**
 * The Brain of the Scorer. 
 * This is a pure function: State + Action -> New State
 */
export const applyBallToState = (
  state: MatchState, 
  event: Partial<BallEvent>, 
  match: MatchFixture | null
): MatchState => {
  const { runs = 0, extraRuns = 0, extraType = 'None', isWicket = false, outPlayerId, wicketType, nonStrikerId } = event;
  
  const isEvent = event.commentary?.startsWith('EVENT');
  const isLegal = isLegalBall(extraType);
  const dismissal = wicketType ? DISMISSAL_MATRIX[wicketType] : null;
  // Events (like setting opening pair) should not count as legal balls or increment score logic.
  const countBall = isEvent ? false : (dismissal && !dismissal.faced ? false : isLegal);

  const nextBalls = countBall ? state.totalBalls + 1 : state.totalBalls;
  const penalty = (extraType === 'Wide' || extraType === 'NoBall') ? 1 : 0;
  
  const nextScore = isEvent ? state.score : state.score + runs + extraRuns + penalty;
  const nextWickets = !isEvent && (dismissal ? dismissal.team : isWicket) ? state.wickets + 1 : state.wickets;

  // Identity logic for setup vs live
  let nStriker = event.strikerId || state.strikerId;
  let nNonStriker = nonStrikerId || state.nonStrikerId;
  
  // Rotation Logic
  if (!isEvent) {
    const physicalRuns = runs + (['Bye', 'LegBye', 'Wide', 'NoBall'].includes(extraType) ? extraRuns : 0);
    if (physicalRuns % 2 !== 0) [nStriker, nNonStriker] = [nNonStriker, nStriker];
    
    // Over end rotation
    if (isLegal && nextBalls % 6 === 0 && !isWicket && nextBalls > 0) [nStriker, nNonStriker] = [nNonStriker, nStriker];
    
    // Wicket: remove batter.
    if (isWicket && outPlayerId) {
      if (nStriker === outPlayerId) nStriker = '';
      else if (nNonStriker === outPlayerId) nNonStriker = '';
    }
  }

  const ball: BallEvent = {
    timestamp: Date.now(),
    over: Math.floor(state.totalBalls / 6),
    ballNumber: (state.totalBalls % 6) + 1,
    strikerId: state.strikerId, 
    nonStrikerId: state.nonStrikerId,
    bowlerId: state.bowlerId,
    runs,
    batRuns: extraType === 'Wide' ? 0 : runs,
    extraRuns,
    extraType,
    isWicket,
    outPlayerId,
    wicketType,
    dismissalType: wicketType,
    creditBowler: isWicket && (dismissal ? dismissal.credit : true),
    teamScoreAtBall: nextScore,
    commentary: isWicket ? `WICKET! ${wicketType}` : `${runs + extraRuns + penalty} runs ${extraType !== 'None' ? `(${extraType})` : ''}`,
    innings: state.innings,
    ...event
  };

  return {
    ...state,
    score: nextScore,
    wickets: nextWickets,
    totalBalls: nextBalls,
    strikerId: nStriker,
    nonStrikerId: nNonStriker,
    history: [ball, ...state.history],
    matchTimer: { ...state.matchTimer, startTime: state.matchTimer.startTime || Date.now() }
  };
};

export const undoLastEvent = (state: MatchState): MatchState => {
  if (state.history.length === 0) return state;
  const last = state.history[0];
  if (last.commentary.startsWith('EVENT')) return { ...state, history: state.history.slice(1) };

  const isLegal = isLegalBall(last.extraType);
  const penalty = (last.extraType === 'Wide' || last.extraType === 'NoBall') ? 1 : 0;
  
  return {
    ...state,
    score: Math.max(0, state.score - (last.runs + (last.extraRuns || 0) + penalty)),
    wickets: Math.max(0, state.wickets - (last.isWicket ? 1 : 0)),
    totalBalls: Math.max(0, state.totalBalls - (isLegal ? 1 : 0)),
    history: state.history.slice(1),
    strikerId: last.strikerId,
    nonStrikerId: state.strikerId === last.strikerId ? state.nonStrikerId : state.strikerId,
    isCompleted: false
  };
};