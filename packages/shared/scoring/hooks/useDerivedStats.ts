
import { useMemo } from 'react';
import { MatchState, Team, BallEvent } from '@shared/types';
import { isLegalBall, getOverString } from '@shared/utils/cricket-engine.ts';

type BatterStats = {
  runs: number;
  balls: number;
  ones: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  runRate: number; // Personal RR (Runs per 6 balls)
  isOut: boolean;
  dismissal?: string;
};

type BowlerStats = {
  balls: number;
  runs: number;
  wickets: number;
  maidens: number;
  overs: string;
  economy: number;
};

export const useDerivedStats = (
  state: MatchState,
  totalOversAllowed: number,
  battingTeam?: Team,
  bowlingTeam?: Team
) => {
  /* =====================
     BATTER STATS
  ===================== */

  const batterStats = useMemo(() => {
    const stats: Record<string, BatterStats> = {};

    battingTeam?.players.forEach(p => {
      stats[p.id] = {
        runs: 0,
        balls: 0,
        ones: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        runRate: 0,
        isOut: false
      };
    });

    state.history.forEach(ball => {
      if (ball.innings !== state.innings || ball.commentary?.startsWith('EVENT')) return;
      if (!ball.strikerId) return;

      const batter = stats[ball.strikerId];
      if (!batter) return;

      // Balls faced (exclude Wides/NB for valid balls faced stats)
      const isLegal = isLegalBall(ball.extraType);
      if (isLegal) {
        batter.balls += 1;
      }

      // Runs calculation
      // Wides don't count for batter runs
      if (ball.extraType !== 'Wide') {
        const r = ball.batRuns ?? ball.runs ?? 0;
        batter.runs += r;
        if (r === 1) batter.ones += 1;
        if (r === 4) batter.fours += 1;
        if (r === 6) batter.sixes += 1;
      }

      // Wicket
      if (ball.isWicket && ball.outPlayerId === ball.strikerId) {
        batter.isOut = true;
        batter.dismissal = ball.dismissalType || ball.wicketType;
      }
    });

    Object.values(stats).forEach(b => {
      b.strikeRate =
        b.balls > 0 ? parseFloat(((b.runs / b.balls) * 100).toFixed(1)) : 0;
      b.runRate =
        b.balls > 0 ? parseFloat(((b.runs / b.balls) * 6).toFixed(2)) : 0;
    });

    return stats;
  }, [state.history, state.innings, battingTeam]);

  /* =====================
     BOWLER STATS
  ===================== */

  const bowlerStats = useMemo(() => {
    const stats: Record<string, BowlerStats> = {};
    const oversData: Record<number, { bowlerId: string; runs: number; legalBalls: number }> = {};

    bowlingTeam?.players.forEach(p => {
      stats[p.id] = {
        balls: 0,
        runs: 0,
        wickets: 0,
        maidens: 0,
        overs: '0.0',
        economy: 0
      };
    });

    state.history.forEach(ball => {
      if (ball.innings !== state.innings || ball.commentary?.startsWith('EVENT')) return;
      if (!ball.bowlerId) return;

      const bowler = stats[ball.bowlerId];
      if (!bowler) return;

      const penalty = (ball.extraType === 'Wide' || ball.extraType === 'NoBall') ? 1 : 0;
      if (ball.extraType !== 'Bye' && ball.extraType !== 'LegBye') {
        bowler.runs += (ball.runs + (ball.extraRuns || 0) + penalty);
      }

      if (ball.isWicket && ball.creditBowler) {
        bowler.wickets += 1;
      }

      if (isLegalBall(ball.extraType)) {
        bowler.balls += 1;
      }

      const overIdx = ball.over;
      if (!oversData[overIdx]) {
        oversData[overIdx] = { bowlerId: ball.bowlerId, runs: 0, legalBalls: 0 };
      }

      if (isLegalBall(ball.extraType)) {
        oversData[overIdx].legalBalls += 1;
      }

      if (ball.extraType !== 'Bye' && ball.extraType !== 'LegBye') {
        oversData[overIdx].runs += (ball.runs + (ball.extraRuns || 0) + penalty);
      }
    });

    Object.values(oversData).forEach(o => {
      if (o.legalBalls === 6 && o.runs === 0 && stats[o.bowlerId]) {
        stats[o.bowlerId].maidens += 1;
      }
    });

    Object.values(stats).forEach(b => {
      b.overs = getOverString(b.balls);
      const totalOvers = b.balls / 6;
      b.economy = totalOvers > 0 ? parseFloat((b.runs / totalOvers).toFixed(2)) : 0;
    });

    return stats;
  }, [state.history, state.innings, bowlingTeam]);

  const runRate = useMemo(() => {
    return state.totalBalls > 0
      ? parseFloat(((state.score / state.totalBalls) * 6).toFixed(2))
      : 0;
  }, [state.score, state.totalBalls]);

  const requiredRate = useMemo(() => {
    if (state.innings !== 2 || !state.target) return 0;
    const runsNeeded = state.target - state.score;
    const ballsRemaining = (totalOversAllowed * 6) - state.totalBalls;
    if (ballsRemaining <= 0) return 0;
    return parseFloat(((runsNeeded / ballsRemaining) * 6).toFixed(2));
  }, [state.innings, state.target, state.score, state.totalBalls, totalOversAllowed]);

  return {
    batterStats,
    bowlerStats,
    runRate,
    requiredRate,
    overs: getOverString(state.totalBalls)
  };
};

