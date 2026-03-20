
import { MatchResult } from './types.ts';
import { PointsConfig } from '../types.ts';

export const PRESET_TEST: PointsConfig = {
  win: 16, // Match Win
  loss: 0,
  tie: 8,
  noResult: 8,
  win_outright: 16,
  tie_match: 8,
  first_inning_lead: 8,
  first_inning_tie: 5,
  first_inning_loss: 2,
  bonus_batting_max: 6,
  bonus_bowling_max: 3,
  max_total_per_match: 28,
  batting_bonus_tiers: [
    { threshold: 150, points: 1 },
    { threshold: 200, points: 2 },
    { threshold: 250, points: 3 },
    { threshold: 300, points: 4 },
    { threshold: 350, points: 5 },
    { threshold: 400, points: 6 }
  ],
  bowling_bonus_tiers: [
    { threshold: 3, points: 1 },
    { threshold: 5, points: 2 },
    { threshold: 8, points: 3 }
  ]
};

export const PRESET_T20: PointsConfig = {
  win: 3,
  loss: 0,
  tie: 1,
  noResult: 1,
  win_outright: 3,
  tie_match: 1,
  first_inning_lead: 0,
  first_inning_tie: 0,
  first_inning_loss: 0,
  bonus_batting_max: 0,
  bonus_bowling_max: 0,
  max_total_per_match: 5,
  batting_bonus_tiers: [],
  bowling_bonus_tiers: []
};

export const DEFAULT_POINTS_CONFIG: PointsConfig = PRESET_T20;

export function calculatePoints(result: MatchResult, side: 'A' | 'B', config: PointsConfig = DEFAULT_POINTS_CONFIG): number {
  switch (result) {
    case 'TIE':
      return config.tie;
    case 'NO_RESULT':
    case 'ABANDONED':
      return config.noResult;
    case 'HOME_WIN':
      return side === 'A' ? config.win : config.loss;
    case 'AWAY_WIN':
      return side === 'B' ? config.win : config.loss;
    default:
      return 0;
  }
}
