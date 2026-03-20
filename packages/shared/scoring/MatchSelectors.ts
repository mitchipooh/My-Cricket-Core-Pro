
import { MatchState, BallEvent, Team, Player, MatchFixture, Standing } from '../types.ts';
import { isLegalBall, getOverString } from '../utils/cricket-engine.ts';

export const DISMISSAL_MATRIX: Record<string, { credit: boolean; team: boolean; faced: boolean; fielder: boolean; color: string }> = {
  'Bowled': { credit: true, team: true, faced: true, fielder: false, color: 'bg-red-600' },
  'Caught': { credit: true, team: true, faced: true, fielder: true, color: 'bg-red-600' },
  'LBW': { credit: true, team: true, faced: true, fielder: false, color: 'bg-red-600' },
  'Stumped': { credit: true, team: true, faced: true, fielder: true, color: 'bg-red-600' },
  'Hit Wicket': { credit: true, team: true, faced: true, fielder: false, color: 'bg-red-600' },
  'Run Out': { credit: false, team: true, faced: true, fielder: true, color: 'bg-slate-600' },
  'Obstructing Field': { credit: false, team: true, faced: true, fielder: false, color: 'bg-slate-600' },
  'Hit Ball Twice': { credit: false, team: true, faced: true, fielder: false, color: 'bg-slate-600' },
  'Timed Out': { credit: false, team: true, faced: false, fielder: false, color: 'bg-slate-600' },
  'Retired Out': { credit: false, team: true, faced: false, fielder: false, color: 'bg-amber-600' },
  'Retired Hurt': { credit: false, team: false, faced: false, fielder: false, color: 'bg-amber-600' }
};

export const getBattingStats = (playerId: string, history: BallEvent[], currentInnings: number) => {
  const h = history.filter(b => b.strikerId === playerId && b.innings === currentInnings && !b.commentary.startsWith('EVENT'));
  const r = h.reduce((acc, b) => acc + b.runs, 0);
  const b = h.filter(x => {
    const dInfo = x.wicketType ? DISMISSAL_MATRIX[x.wicketType] : null;
    return (dInfo && !dInfo.faced) ? false : isLegalBall(x.extraType);
  }).length;
  return {
    runs: r,
    balls: b,
    sr: b > 0 ? ((r / b) * 100).toFixed(0) : '0',
    fours: h.filter(x => x.runs === 4).length,
    sixes: h.filter(x => x.runs === 6).length,
    dots: h.filter(x => x.runs === 0).length,
    ones: h.filter(x => x.runs === 1).length
  };
};

export const getBowlingStats = (playerId: string, history: BallEvent[], currentInnings: number) => {
  const h = history.filter(b => b.bowlerId === playerId && b.innings === currentInnings && !b.commentary.startsWith('EVENT'));
  const legalBalls = h.filter(x => isLegalBall(x.extraType)).length;
  const runs = h.reduce((acc, x) => {
    if (x.extraType === 'Bye' || x.extraType === 'LegBye') return acc;
    const extraPenalty = (x.extraType === 'Wide' || x.extraType === 'NoBall') ? 1 : 0;
    return acc + x.runs + extraPenalty + (x.extraType === 'Wide' ? (x.extraRuns || 0) : 0);
  }, 0);
  const wickets = h.filter(x => x.isWicket && (!x.wicketType || DISMISSAL_MATRIX[x.wicketType]?.credit)).length;
  return {
    overs: `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`,
    runs,
    wickets,
    econ: legalBalls > 0 ? (runs / (legalBalls / 6)).toFixed(1) : '0.0'
  };
};

export const getBowlerAvailability = (playerId: string, state: MatchState, match: MatchFixture | null) => {
  const matchFormat = match?.format || 'T20';
  const customOvers = match?.customOvers || (matchFormat === 'T20' ? 20 : 50);
  const totalOversAllowed = customOvers - (state.adjustments?.oversLost || 0);
  
  const maxQuota = Math.ceil(totalOversAllowed / 5);
  const h = state.history.filter(b => b.bowlerId === playerId && b.innings === state.innings && isLegalBall(b.extraType));
  const oversBowled = Math.floor(h.length / 6);
  
  const isConsecutive = state.totalBalls > 0 && state.totalBalls % 6 === 0 && state.bowlerId === playerId;
  const isQuotaFull = matchFormat !== 'Test' && oversBowled >= maxQuota;

  return {
    isConsecutive,
    isQuotaFull,
    oversBowled,
    quotaRemaining: Math.max(0, maxQuota - oversBowled)
  };
};

export const calculateTTCBPoints = (state: MatchState, match: MatchFixture | null) => {
    let teamAPoints = 0, teamBPoints = 0;
    if (state.innings === 1) {
        if (state.score >= 300) teamAPoints += 4;
        else if (state.score >= 200) teamAPoints += 2;
        if (state.wickets >= 8) teamBPoints += 3;
        else if (state.wickets >= 5) teamBPoints += 2;
    }
    return { teamAPoints, teamBPoints };
};
