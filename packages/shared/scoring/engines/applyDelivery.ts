
import { MatchState, BallEvent, MatchFixture } from '@shared/types';
import * as overEngine from './overEngine.ts';
import * as batterEngine from './batterEngine.ts';
import * as bowlerEngine from './bowlerEngine.ts';
import * as timerEngine from './timerEngine.ts';
import { DISMISSAL_MATRIX } from '../MatchSelectors.ts';
import { isLegalBall } from '@shared/utils/cricket-engine.ts';

export const applyDelivery = (
  currentState: MatchState, 
  event: Partial<BallEvent>,
  match: MatchFixture | null
): MatchState => {
  let state = { ...currentState };

  // 0. Handle Special Setup Events (Bypass Engine Logic)
  // This maintains compatibility with the UI's existing way of setting players
  if (event.commentary?.startsWith('EVENT')) {
      if (event.strikerId) state = batterEngine.assignNewBatter(state, event.strikerId, 'Striker');
      if (event.nonStrikerId) state = batterEngine.assignNewBatter(state, event.nonStrikerId, 'NonStriker');
      if (event.bowlerId) state = bowlerEngine.assignBowler(state, event.bowlerId);
      
      // NOTE: Timer is NOT started here anymore. It starts on the first legal/play delivery.
      
      // Update history for events too
      const setupBall: BallEvent = {
          timestamp: Date.now(),
          over: Math.floor(state.totalBalls / 6),
          ballNumber: state.totalBalls % 6,
          strikerId: state.strikerId,
          nonStrikerId: state.nonStrikerId,
          bowlerId: state.bowlerId,
          runs: 0, batRuns: 0, extraRuns: 0, extraType: 'None', isWicket: false,
          commentary: event.commentary || 'Setup Event',
          innings: state.innings,
          ...event
      } as BallEvent;
      
      return {
          ...state,
          history: [setupBall, ...state.history]
      };
  }

  // 1. Timer Engine
  state = timerEngine.startInningsTimer(state);

  // 2. Over Engine (Scoring & Basic Rotation)
  // Note: This returns the NEW state where totalBalls might have incremented if legal
  state = overEngine.applyDeliveryToOver(state, event);

  // 3. Batter Engine (Wickets)
  if (event.isWicket && event.outPlayerId) {
    state = batterEngine.handleWicket(state, event.outPlayerId);
  }

  // 4. Construct Full Ball Object for History
  // We need to verify if the bowler gets credit based on dismissal type
  const dismissal = event.wicketType ? DISMISSAL_MATRIX[event.wicketType] : null;
  const isLegal = isLegalBall(event.extraType);
  
  // Robust Ball Number Calculation:
  // If legal, totalBalls has incremented, so the current ball index is state.totalBalls.
  // If illegal, totalBalls has NOT incremented, so the current ball index is state.totalBalls + 1 (the one we are attempting).
  // Note: If totalBalls is 0 (start), illegal ball -> index 1. Legal ball -> totalBalls becomes 1 -> index 1.
  const rawBallNum = isLegal ? state.totalBalls : state.totalBalls + 1;
  const calculatedBallNum = rawBallNum % 6 === 0 ? 6 : rawBallNum % 6;
  
  // Calculate Over Number
  // If we just finished an over (legal ball 6), the ball belongs to the previous over index.
  // If illegal ball at start of over (totalBalls 6), rawBallNum is 7, so over index 1.
  const calculatedOver = Math.floor((rawBallNum - 1) / 6);

  const ball: BallEvent = {
    timestamp: Date.now(),
    over: calculatedOver,
    ballNumber: calculatedBallNum,
    strikerId: currentState.strikerId, // Record who *faced* the ball
    nonStrikerId: currentState.nonStrikerId,
    bowlerId: state.bowlerId,
    runs: event.runs || 0,
    batRuns: event.extraType === 'Wide' ? 0 : (event.runs || 0),
    extraRuns: event.extraRuns || 0,
    extraType: event.extraType || 'None',
    isWicket: event.isWicket || false,
    wicketType: event.wicketType,
    outPlayerId: event.outPlayerId,
    fielderId: event.fielderId,
    creditBowler: event.isWicket && (dismissal ? dismissal.credit : true),
    teamScoreAtBall: state.score,
    commentary: event.isWicket 
      ? `WICKET! ${event.wicketType}` 
      : `${(event.runs || 0) + (event.extraRuns || 0) + (['Wide','NoBall'].includes(event.extraType || '') ? 1 : 0)} runs ${event.extraType !== 'None' ? `(${event.extraType})` : ''}`,
    innings: state.innings,
    ...event
  };

  return {
    ...state,
    history: [ball, ...state.history]
  };
};

