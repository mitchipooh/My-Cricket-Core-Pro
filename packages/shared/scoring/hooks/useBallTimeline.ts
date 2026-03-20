import { useMemo } from 'react';
import { MatchState, BallEvent } from '@shared/types';

/**
 * Metadata for a single ball in the timeline
 */
export type TimelineBall = {
  id: string;
  ball: BallEvent;
  label: string;
  type: 'score' | 'wicket' | 'extra' | 'boundary' | 'dot';
  color: string;
  displayOver: string;
};

/**
 * Upgraded Ball Timeline Hook
 * Transforms raw BallEvent history into a UI-ready format for 
 * ticker tapes, match records, and over-by-over summaries.
 */
export const useBallTimeline = (state: MatchState): TimelineBall[] => {
  return useMemo(() => {
    // state.history is stored latest-first. 
    // We filter out non-ball events (setup markers) for the timeline.
    return state.history
      .filter(ball => !ball.commentary?.startsWith('EVENT'))
      .map((ball, index) => {
        let label = `${ball.runs + (ball.extraRuns || 0)}`;
        let type: TimelineBall['type'] = 'score';
        let color = 'bg-slate-900';

        // 1. Wickets take priority for visual markers
        if (ball.isWicket) {
          label = 'W';
          type = 'wicket';
          color = 'bg-red-600';
        } 
        // 2. Extras (Wide/NoBall usually carry penalty of 1)
        else if (ball.extraType === 'Wide') {
          const total = 1 + (ball.extraRuns || 0);
          label = `${total}wd`;
          type = 'extra';
          color = 'bg-blue-600';
        } 
        else if (ball.extraType === 'NoBall') {
          // NoBall usually includes runs off the bat + 1 penalty
          const total = 1 + ball.runs + (ball.extraRuns || 0);
          label = `${total}nb`;
          type = 'extra';
          color = 'bg-purple-600';
        } 
        else if (ball.extraType === 'Bye' || ball.extraType === 'LegBye') {
          label = `${ball.extraRuns}${ball.extraType === 'Bye' ? 'b' : 'lb'}`;
          type = 'extra';
          color = 'bg-amber-600';
        }
        // 3. Boundaries
        else if (ball.batRuns === 4) {
          label = '4';
          type = 'boundary';
          color = 'bg-indigo-600';
        } 
        else if (ball.batRuns === 6) {
          label = '6';
          type = 'boundary';
          color = 'bg-emerald-600';
        }
        // 4. Dot Balls
        else if (ball.runs === 0 && (!ball.extraType || ball.extraType === 'None')) {
          label = '•';
          type = 'dot';
          color = 'bg-slate-700';
        }

        return {
          id: `timeline-${ball.timestamp}-${index}`,
          ball,
          label,
          type,
          color,
          displayOver: `${ball.over}.${ball.ballNumber}`
        };
      });
  }, [state.history]);
};

