
import { useState, useCallback } from 'react';
import { MatchState, BallEvent, WicketEvent, Player } from '@shared/types';
import { applyDelivery } from '../engines/applyDelivery.ts';
import { getOverString } from '@shared/utils/cricket-engine.ts';
import { calculateLead, TEST_MATCH_DEFAULTS } from '../../components/scoring/logic/TestMatchLogic.ts';
import { decrementLastHour, triggerLastHour as triggerLastHourHelper } from '../../competition/testMatchEngine.ts';

export const useMatchEngine = (initialState: MatchState) => {
  const [state, setState] = useState<MatchState>(initialState);
  const [history, setHistory] = useState<MatchState[]>([]);

  const applyBall = useCallback((ball: Partial<BallEvent>) => {
    setHistory(prev => [...prev, state]);
    setState(prev => {
      const next = applyDelivery(prev, ball, null);

      // Update Test Match Metadata (Overs Today, Lead)
      if (next.testConfig) {
        // Calculate new lead
        next.lead = calculateLead(next);

        // Handling Overs Today
        // Detect if over changed
        // Detect if over changed
        if (Math.floor(next.totalBalls / 6) > Math.floor(prev.totalBalls / 6)) {
          console.log('Over Changed. Prev OversToday:', prev.oversToday);
          next.oversToday = (prev.oversToday || 0) + 1;

          // Decrement Last Hour
          if (next.adjustments?.isLastHour) {
            const updated = decrementLastHour(next);
            next.adjustments = updated.adjustments;
          }
        }

        // Logic to transition session / day could go here or be manual
      }
      return next;
    });
  }, [state]);

  const recordWicket = useCallback((event: WicketEvent) => {
    applyBall({
      runs: 0,
      extraRuns: 0,
      extraType: 'None',
      isWicket: true,
      wicketType: event.wicketType,
      outPlayerId: event.batterId,
      fielderId: event.fielderId,
      commentary: `WICKET! ${event.wicketType}`
    });
  }, [applyBall]);

  const undoBall = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setState(previous);
    setHistory(prev => prev.slice(0, -1));
  }, [history]);

  const editBall = useCallback((ballTimestamp: number, updates: Partial<BallEvent>) => {
    setHistory(prev => [...prev, state]);
    setState(prev => {
      const allEvents = [...prev.history].reverse();
      const targetIndex = allEvents.findIndex(b => b.timestamp === ballTimestamp);
      if (targetIndex === -1) return prev;

      allEvents[targetIndex] = { ...allEvents[targetIndex], ...updates };

      let replayedState: MatchState = {
        ...prev,
        score: 0,
        wickets: 0,
        totalBalls: 0,
        history: [],
      };

      const firstInningsBall = allEvents.find(b => b.innings === prev.innings);
      if (firstInningsBall) {
        replayedState.strikerId = firstInningsBall.strikerId;
        replayedState.nonStrikerId = firstInningsBall.nonStrikerId;
        replayedState.bowlerId = firstInningsBall.bowlerId;
      }

      allEvents.forEach(ball => {
        if (ball.innings === prev.innings) {
          replayedState = applyDelivery(replayedState, ball, null);
        } else {
          replayedState.history = [ball, ...replayedState.history];
        }
      });

      return replayedState;
    });
  }, [state]);

  const correctPlayerIdentity = useCallback((oldId: string, newId: string, role: 'striker' | 'nonStriker' | 'bowler') => {
    setHistory(prev => [...prev, state]);
    setState(prev => {
      const next = { ...prev };
      if (role === 'striker' && next.strikerId === oldId) next.strikerId = newId;
      if (role === 'nonStriker' && next.nonStrikerId === oldId) next.nonStrikerId = newId;
      if (role === 'bowler' && next.bowlerId === oldId) next.bowlerId = newId;

      next.history = next.history.map(ball => {
        const b = { ...ball };
        if (role === 'striker' && b.strikerId === oldId) b.strikerId = newId;
        if (role === 'nonStriker' && b.nonStrikerId === oldId) b.nonStrikerId = newId;
        if (role === 'bowler' && b.bowlerId === oldId) b.bowlerId = newId;
        if (b.outPlayerId === oldId) b.outPlayerId = newId;
        return b;
      });
      return next;
    });
  }, [state]);

  const retireBatter = useCallback((playerId: string, reason: 'Retired Hurt' | 'Retired Out') => {
    applyBall({
      isWicket: reason === 'Retired Out',
      wicketType: reason,
      outPlayerId: playerId,
      commentary: `EVENT: ${reason}`,
      innings: state.innings
    });
  }, [applyBall, state.innings]);

  const replaceBowlerMidOver = useCallback((newBowlerId: string) => {
    applyBall({
      commentary: 'EVENT: Injury Replacement (Bowler)',
      bowlerId: newBowlerId,
      innings: state.innings
    });
  }, [applyBall, state.innings]);

  const declareInnings = useCallback(() => {
    setHistory(prev => [...prev, state]);
    setState(prev => ({
      ...prev,
      adjustments: {
        ...prev.adjustments,
        declared: true,
        oversLost: prev.adjustments?.oversLost || 0,
        isLastHour: prev.adjustments?.isLastHour || false,
        dayNumber: prev.adjustments?.dayNumber || 1,
        session: prev.adjustments?.session || '',
      }
    }));
  }, [state]);

  const concludeInnings = useCallback(() => {
    setHistory(prev => [...prev, state]);
    setState(prev => ({
      ...prev,
      adjustments: {
        ...prev.adjustments,
        concluded: true,
      }
    }));
  }, [state]);

  const startInnings = useCallback((battingTeamId: string, bowlingTeamId: string, target?: number, isFollowOn?: boolean) => {
    setHistory(prev => [...prev, state]);
    setState(prev => ({
      ...prev,
      innings: prev.innings + 1,
      battingTeamId,
      bowlingTeamId,
      score: 0,
      wickets: 0,
      totalBalls: 0,
      strikerId: '',
      nonStrikerId: '',
      bowlerId: '',
      target,
      isFollowOnEnforced: isFollowOn || prev.isFollowOnEnforced,
      adjustments: { ...prev.adjustments, declared: false, concluded: false }
    }));
  }, [state]);

  const endInnings = useCallback((completeMatch: boolean = false) => {
    setHistory(prev => [...prev, state]);
    setState(prev => ({
      ...prev,
      inningsScores: [...prev.inningsScores, {
        innings: prev.innings,
        teamId: prev.battingTeamId,
        score: prev.score,
        wickets: prev.wickets,
        overs: getOverString(prev.totalBalls)
      }],
      isCompleted: completeMatch || prev.isCompleted
    }));
  }, [state]);

  const updateMetadata = useCallback((updates: Partial<MatchState>) => {
    setHistory(prev => [...prev, state]);
    setState(prev => ({ ...prev, ...updates }));
  }, [state]);

  // Test Match Specific Actions
  const startNewDay = useCallback(() => {
    setHistory(prev => [...prev, state]);
    setState(prev => ({
      ...prev,
      currentDay: (prev.currentDay || 1) + 1,
      oversToday: 0,
      adjustments: { ...prev.adjustments, session: 'Morning' }
    }));
  }, [state]);

  const enforceFollowOn = useCallback(() => {
    setHistory(prev => [...prev, state]);
    setState(prev => ({
      ...prev,
      isFollowOnEnforced: true,
      // Start Innings 3 but with same batting team as Innings 2 (Team B)
      innings: 3,
      score: 0,
      wickets: 0,
      totalBalls: 0,
      strikerId: '',
      nonStrikerId: '',
      bowlerId: '',
      // Batting team stays same (Team B), Bowling team stays same (Team A)
      battingTeamId: prev.battingTeamId,
      bowlingTeamId: prev.bowlingTeamId,
      adjustments: { ...prev.adjustments, declared: false, concluded: false }
    }));
  }, [state]);

  const triggerLastHour = useCallback(() => {
    setHistory(prev => [...prev, state]);
    setState(prev => triggerLastHourHelper(prev));
  }, [state]);

  return {
    state,
    history,
    applyBall,
    recordWicket,
    undoBall,
    editBall,
    canUndo: history.length > 0,
    startInnings,
    endInnings,
    correctPlayerIdentity,
    retireBatter,
    replaceBowlerMidOver,
    declareInnings,
    concludeInnings,
    updateMetadata, // NEW EXPORT
    startNewDay,
    enforceFollowOn,
    triggerLastHour
  };
};

