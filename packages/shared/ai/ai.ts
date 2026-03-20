import { MatchFixture } from '../types';

export interface BattingStats {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOut: boolean;
  wicketDescription?: string;
}

export interface BowlingStats {
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
}

export interface DigitizedPlayer {
  name: string;
  team: string;
  innings?: number;
  role?: string;
  batting?: BattingStats;
  bowling?: BowlingStats;
  catches?: number;
  stumpings?: number;
  runOuts?: number;
}

export interface MatchAnalysis {
  isTestMatch: boolean;
  inningsCount: number;
  matchFormat: string;
  matchTitle: string;
  tournament: string;
  venue: string;
  date: string;
  toss: string;
  winner?: string;
  matchSummaryText?: string;
}

export interface BatterEntry {
  name: string;
  howOut: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
}

export interface BowlerEntry {
  name: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
}

export interface InningsData {
  inningsNumber: number;
  battingTeam: string;
  bowlingTeam: string;
  batters: BatterEntry[];
  extras: { byes: number; legByes: number; wides: number; noBalls: number; total: number };
  totalScore: string;
  overs: string;
  didNotBat: string[];
  bowlers: BowlerEntry[];
}

export interface DigitizedMatchData {
  matchInfo: MatchAnalysis;
  teams: {
    name: string;
    score: string;
    overs: string;
    extras?: { byes: number; legByes: number; wides: number; noBalls: number; total: number };
  }[];
  players: DigitizedPlayer[];
  innings?: InningsData[];
}
