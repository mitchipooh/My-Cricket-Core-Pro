
import { useMemo } from 'react';
import { MatchFixture, MatchState, Team } from '@shared/types';
import { isLegalBall } from '@shared/utils/cricket-engine.ts';

export const useMatchRules = (
  match: MatchFixture | null,
  state: MatchState,
  bowlingTeam: Team | undefined
) => {
  /* =====================
     FORMAT & OVERS
  ===================== */

  const matchFormat = match?.format || 'T20';
  const customOvers = match?.customOvers;

  const rawOvers =
    customOvers ??
    (matchFormat === 'T10'
      ? 10
      : matchFormat === 'T20'
      ? 20
      : matchFormat === '40-over'
      ? 40
      : matchFormat === '50-over'
      ? 50
      : 90); // Test default day

  const oversLost = state.adjustments?.oversLost || 0;
  // SAFETY: Ensure totalOversAllowed is never 0 for limited overs to avoid quota deadlock
  const totalOversAllowed = Math.max(1, (rawOvers || 20) - oversLost);

  /* =====================
     1/5 BOWLING QUOTA RULE
  ===================== */

  const baseQuota = Math.floor(totalOversAllowed / 5);
  const remainderQuota = totalOversAllowed % 5;
  const maxQuota = Math.ceil(totalOversAllowed / 5);

  const bowlerStats = useMemo(() => {
    const stats: Record<
      string,
      { balls: number; overs: number }
    > = {};

    if (bowlingTeam) {
        bowlingTeam.players.forEach(p => {
            stats[p.id] = { balls: 0, overs: 0 };
        });
    }

    state.history.forEach(ball => {
      if (
        ball.innings === state.innings &&
        isLegalBall(ball.extraType) &&
        !ball.commentary.startsWith('EVENT')
      ) {
        if (!stats[ball.bowlerId]) {
          stats[ball.bowlerId] = { balls: 0, overs: 0 };
        }
        stats[ball.bowlerId].balls++;
        stats[ball.bowlerId].overs = Math.floor(
          stats[ball.bowlerId].balls / 6
        );
      }
    });

    return stats;
  }, [state.history, state.innings, bowlingTeam]);

  const bowlersUsingBonusOvers = useMemo(() => {
    return Object.values(bowlerStats).filter(
      (s: { balls: number }) => s.balls > baseQuota * 6
    ).length;
  }, [bowlerStats, baseQuota]);

  /* =====================
     BOWLER AVAILABILITY
  ===================== */

  const getBowlerAvailability = (playerId: string) => {
    const stats = bowlerStats[playerId] || { balls: 0, overs: 0 };
    const oversBowled = stats.overs;
    const ballsIntoOver = stats.balls % 6;

    // Consecutive over rule
    let isConsecutive = false;
    if (state.totalBalls > 0 && state.totalBalls % 6 === 0) {
      if (state.bowlerId === playerId) {
        isConsecutive = true;
      }
    }

    // Quota rules (not Test)
    if (matchFormat !== 'Test') {
      if (oversBowled >= maxQuota) {
        return {
          allowed: false,
          reason: 'Quota Full',
          isConsecutive,
          oversBowled
        };
      }

      if (
        oversBowled === baseQuota &&
        ballsIntoOver === 0 &&
        bowlersUsingBonusOvers >= remainderQuota &&
        remainderQuota > 0
      ) {
        return {
          allowed: false,
          reason: 'Max Bonus Overs Used',
          isConsecutive,
          oversBowled
        };
      }
    }

    return {
      allowed: !isConsecutive,
      reason: isConsecutive ? 'Consecutive Over' : 'OK',
      isConsecutive,
      oversBowled
    };
  };

  /* =====================
     OVER RATE EXPECTATION
  ===================== */

  const expectedMsPerOver = 4.25 * 60 * 1000;
  const targetDurationMs = totalOversAllowed * expectedMsPerOver;

  /* =====================
     EXPORT
  ===================== */

  return {
    matchFormat,
    totalOversAllowed,

    // Quotas
    baseQuota,
    remainderQuota,
    maxQuota,

    // Bowlers
    bowlerStats,
    getBowlerAvailability,

    // Time
    targetDurationMs
  };
};

