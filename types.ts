import React from 'react';

/**
 * Cricket-Core 2026 Management System
 * Created by mitchipoohdevs
 */

export type Notification = {
  id: string;
  type: 'ALERT' | 'MESSAGE' | 'INVITE';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionLink?: string;
};

export type SponsorSettings = {
  mediaTopHeight?: number;
  mediaBottomHeight?: number;
  scoreboardTopHeight?: number;
  scoreboardBottomHeight?: number;
};

export type Sponsor = {
  id: string;
  name: string;
  logoUrl: string;
  website?: string;
  isActive: boolean;
  placements: ('MEDIA_TOP' | 'MEDIA_BOTTOM' | 'SCOREBOARD_TOP' | 'SCOREBOARD_BOTTOM')[];
};

export type UserProfile = {
  id: string;
  name: string;
  handle: string;
  email?: string;
  password?: string;
  googleId?: string;
  avatarUrl?: string;
  role: 'Administrator' | 'Scorer' | 'Umpire' | 'Fan' | 'Coach' | 'Player' | 'Captain' | 'Guest';
  managedTeamId?: string; // ID of the team they manage (for Captains/Coaches)
  createdAt: number;
  joinedClubIds?: string[];
  notifications?: Notification[];
  scorerDetails?: {
    isHireable: boolean;
    hourlyRate?: number;
    experienceYears?: number;
    bio?: string;
  };
  coachDetails?: {
    level: string;
    specialty: 'Batting' | 'Bowling' | 'Fielding' | 'General';
    experienceYears: number;
  };
  umpireDetails?: {
    certificationLevel: 'Level 1' | 'Level 2' | 'Level 3' | 'International';
    experienceYears: number;
    specializations?: ('T20' | 'ODI' | 'Test' | 'Youth')[];
    bio?: string;
    matchesOfficiated?: number;
  };
  playerDetails?: {
    battingStyle: 'Right-hand' | 'Left-hand';
    bowlingStyle: string;
    primaryRole: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicket-keeper';
    lookingForClub: boolean;
    isHireable: boolean;
    bio?: string;
    phone?: string;
    jerseyNumber?: number;
    // New Personalized Fields
    nickname?: string;
    age?: string;
    favoritePlayer?: string;
    favoriteWorldCupMoment?: string;
    favoriteGround?: string;
  };
};

export type UserCreationResult = {
  success: boolean;
  userId?: string;
  error?: { message: string };
};

export type CareerPhase = {
  teamId: string;
  teamName: string;
  startYear: number;
  endYear?: number;
};

export type PlayerDetails = {
  battingStyle: 'Right-hand' | 'Left-hand';
  bowlingStyle: string;
  primaryRole: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicket-keeper';
  lookingForClub: boolean;
  isHireable: boolean;
  age?: string;
  teamRole?: string;
  nickname?: string;
  favoritePlayer?: string;
  favoriteWorldCupMoment?: string;
  favoriteGround?: string;
};

export type Player = {
  id: string;
  userId?: string; // NEW: Linked User Profile ID
  name: string;
  email?: string; // Optional contact email
  role: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicket-keeper';
  photoUrl?: string;
  bio?: string;
  highlightVideoUrl?: string;
  careerHistory?: CareerPhase[];
  playerDetails?: PlayerDetails;
  stats: {
    runs: number;
    wickets: number;
    ballsFaced: number;
    ballsBowled: number;
    runsConceded: number;
    matches: number;
    catches: number;
    runOuts: number;
    stumpings: number;
    highestScore?: number;
    bestBowling?: string;
    fours: number;
    sixes: number;
    hundreds: number;
    fifties: number;
    ducks: number;
    threeWickets: number;
    fiveWickets: number;
    maidens: number;
  };
};

export interface PlayerMatchPerformance {
  playerId: string;
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  wickets: number;
  overs: number;
  maidens: number;
  runsConceded: number;
  catches: number;
  stumpings: number;
  runOuts: number;
}

export interface MatchReportSubmission {
  id: string;
  matchId: string;
  submittedBy: string; // User ID of the captain
  timestamp: number;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  scorecardPhotoUrl?: string;
  teamAScore: number;
  teamAWickets: number;
  teamAOvers: string;
  teamBScore: number;
  teamBWickets: number;
  teamBOvers: string;
  playerPerformances: PlayerMatchPerformance[];
  adminFeedback?: string;
  umpires?: string[];
  umpireRatings?: Record<string, { rating: number; comment?: string }>;
  facilityRating?: { pitch: number; outfield: number; facilities: number; comment?: string };
  spiritRating?: { rating: number; comment?: string };
}

export interface UmpireMatchReport {
  id: string;
  matchId: string;
  fixtureId: string;
  submittedBy: string; // Umpire User ID
  umpireName: string;
  timestamp: number;
  status: 'PENDING' | 'REVIEWED' | 'ARCHIVED';
  matchOutcome: {
    winningTeam: 'teamA' | 'teamB' | 'draw' | 'tie' | 'no_result';
    teamAScore: number;
    teamAWickets: number;
    teamAOvers: string;
    teamBScore: number;
    teamBWickets: number;
    teamBOvers: string;
  };
  conductNotes?: string;
  ruleViolations?: {
    teamId: string;
    playerId?: string;
    violation: string;
    action: 'warning' | 'penalty' | 'suspension';
    description: string;
  }[];
  playerBehaviorRatings?: {
    teamASpirit: number; // 1-5
    teamBSpirit: number; // 1-5
    notes?: string;
  };
  facilityReport?: {
    pitchCondition: number; // 1-5
    outfieldCondition: number; // 1-5
    facilitiesRating: number; // 1-5
    comments?: string;
  };
  incidentReports?: {
    timestamp: string;
    description: string;
    severity: 'minor' | 'moderate' | 'serious';
  }[];
  supportingDocuments?: string[]; // URLs to uploaded files
  organizationId: string; // Umpiring body/organization to receive report
  reviewedBy?: string; // Admin who reviewed
  reviewNotes?: string;
}


export type IssueType = 'PROTEST' | 'GAME_ISSUE' | 'FEEDBACK';
export type IssueStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';

export interface GameIssue {
  id: string;
  matchId?: string;
  lodgedBy: string; // User ID
  teamId: string;
  type: IssueType;
  title: string;
  description: string;
  status: IssueStatus;
  evidenceUrls?: string[];
  timestamp: number;
  adminComments?: string[];
  resolution?: 'UPHELD' | 'DISMISSED' | 'ACKNOWLEDGED';
  adminResponse?: string;
  resolvedAt?: number;
}

export type WicketType =
  | 'Bowled'
  | 'Caught'
  | 'LBW'
  | 'Run Out'
  | 'Stumped'
  | 'Hit Wicket'
  | 'Handled Ball'
  | 'Obstructing Field'
  | 'Timed Out'
  | 'Retired Out'
  | 'Retired Hurt';

export interface WicketEvent {
  type: 'WICKET';
  wicketType: WicketType;
  batterId: string;
  bowlerId?: string;
  fielderId?: string;
}

export type PlayerWithContext = Player & {
  teamName: string;
  teamId: string;
  orgId: string;
  orgName: string;
};

export type Team = {
  id: string;
  // orgId removed - teams now belong to multiple orgs via junction table
  name: string;
  logoUrl?: string;
  location?: string;
  management?: string;
  players: Player[];
};

export type Group = {
  id: string;
  name: string;
  teams: Team[];
};

export type TournamentFormat = 'Test' | 'T10' | 'T20' | '40-over' | '50-over';

export type BonusThreshold = {
  threshold: number;
  points: number;
};

export type PointsConfig = {
  // Simple match results (legacy/backup)
  win: number;
  loss: number;
  tie: number;
  noResult: number;

  // Advanced Regulatory Logic
  win_outright: number;
  tie_match: number;
  first_inning_lead: number;
  first_inning_tie: number;
  first_inning_loss: number;

  // Bonus Limits
  bonus_batting_max: number;
  bonus_bowling_max: number;
  max_total_per_match: number;

  // Dynamic Tiers
  batting_bonus_tiers: BonusThreshold[];
  bowling_bonus_tiers: BonusThreshold[];
};

export type Standing = {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  drawn: number;
  tied: number;
  points: number;
  bonusPoints: number; // Added bonusPoints
  nrr: number;
  runsFor: number;
  oversFor: number;
  runsAgainst: number;
  oversAgainst: number;
};

export type Tournament = {
  id: string;
  name: string;
  format: TournamentFormat;
  groups: Group[];
  pointsConfig: PointsConfig;
  overs: number;
  status?: 'Upcoming' | 'Ongoing' | 'Completed' | 'Draft';
  startDate?: string;
  endDate?: string;
  gameStartTime?: string;
  description?: string;
  teamIds?: string[]; // Added teamIds for linking
  orgId?: string; // Added orgId ref
  createdBy?: string; // Added createdBy ref
};

export type OrgMember = {
  userId: string;
  name: string;
  handle: string;
  role: 'Administrator' | 'Scorer' | 'Umpire' | 'Coach' | 'Player' | 'Captain' | 'Match Official';
  addedAt: number;
  permissions?: Record<string, boolean>;
  managedTeamId?: string; // NEW: Scopes admin/captain to a specific team
};

export type OrgApplication = {
  id: string;
  type: 'USER_JOIN' | 'ORG_AFFILIATE' | 'PLAYER_CLAIM' | 'CLUB_INVITE'; // Added CLUB_INVITE
  applicantId: string;
  applicantName: string;
  applicantHandle?: string;
  applicantImage?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVIEW';
  targetRole?: 'Player' | 'Umpire' | 'Coach' | 'Scorer';
  targetTeamId?: string;
  targetPlayerId?: string; // NEW: For claim requests
  timestamp: number;
};

export type Organization = {
  id: string;
  name: string;
  type: 'GOVERNING_BODY' | 'CLUB' | 'UMPIRE_ASSOCIATION' | 'COACHES_ASSOCIATION';
  createdBy?: string; // User ID of creator - ROBUST ownership tracking
  description?: string;
  logoUrl?: string;
  address?: string;
  establishedYear?: number;
  managerName?: string;
  ownerName?: string;
  country?: string;
  groundLocation?: string;
  isPublic?: boolean;
  allowUserContent?: boolean;
  allowMemberEditing?: boolean; // NEW: Global switch for the council
  pushToGlobalFeed?: boolean; // NEW: Controls if org matches appear in global Media Center feed (default: true)
  parentOrgIds?: string[];
  childOrgIds?: string[];
  tournaments: Tournament[];
  groups: Group[];
  memberTeams: Team[];
  fixtures: MatchFixture[];
  members: OrgMember[];
  applications: OrgApplication[];
  sponsors?: Sponsor[];
  sponsorSettings?: SponsorSettings;
};

export type Coordinates = { x: number; y: number };

export type BallEvent = {
  timestamp: number;
  over: number;
  ballNumber: number;
  strikerId: string;
  nonStrikerId?: string;
  bowlerId: string;
  runs: number;
  batRuns?: number;
  extraRuns?: number;
  extraType?: 'Wide' | 'NoBall' | 'Bye' | 'LegBye' | 'None';
  isWicket: boolean;
  wicketType?: string;
  dismissalType?: string;
  creditBowler?: boolean;
  outPlayerId?: string;
  fielderId?: string;
  assistFielderId?: string;
  commentary: string;
  innings: number;
  teamScoreAtBall?: number;
  pitchCoords?: Coordinates;
  shotCoords?: Coordinates;
  shotHeight?: 'Ground' | 'Aerial';
};

export type TestMatchConfig = {
  maxDays: number;
  oversPerDay: number;
  lastHourOvers: number;
  followOnMargin: number;
};

export type MatchState = {
  activeScorerId?: string;
  testConfig?: TestMatchConfig;
  battingTeamId: string;
  bowlingTeamId: string;
  score: number;
  wickets: number;
  totalBalls: number;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  innings: number;
  target?: number;
  history: BallEvent[];
  inningsScores: {
    innings: number;
    teamId: string;
    score: number;
    wickets: number;
    overs: string;
    isComplete?: boolean;
    isDeclared?: boolean;
    isForfeited?: boolean;
    endReason?: 'ALL_OUT' | 'DECLARED' | 'FORFEITED' | 'TIME' | 'TARGET_REACHED' | 'INNINGS_VICTORY' | 'OTHER';
  }[];
  isCompleted: boolean;
  isSuperOver?: boolean;
  isFollowOnEnforced?: boolean;
  isFollowOnEligible?: boolean;

  // Test Match Metadata
  currentDay?: number;
  oversToday?: number;
  lead?: number; // Positive = batting team leads, Negative = batting team trails
  tossWinnerId?: string;
  tossDecision?: 'Bat' | 'Bowl';
  umpires?: string[];
  teamASquadIds?: string[];
  teamBSquadIds?: string[];
  matchTimer: {
    startTime: number | null;
    totalAllowances: number;
    isPaused: boolean;
    lastPauseTime: number | null;
  };
  adjustments?: {
    oversLost: number;
    isLastHour: boolean;
    lastHourOversRemaining?: number;
    dayNumber: number;
    session: string;
    declared: boolean;
    concluded?: boolean;
  }
};

export type MatchPointsData = {
  resultType: 'OUTRIGHT_WIN' | 'OUTRIGHT_TIE' | 'ABANDONED' | 'NO_RESULT' | 'DRAW';
  winnerSide: 'A' | 'B' | 'TIE' | 'NONE';
  firstInningsWinnerId: string | null;
  firstInningsResult: 'LEAD' | 'TIE' | 'LOSS' | null;
  isIncomplete: boolean;
  teamARuns: number;
  teamBRuns: number;
  teamAWickets: number;
  teamBWickets: number;
};

export type MatchFixture = {
  id: string;
  tournamentId?: string;
  tournamentName?: string; // NEW: For display purposes
  groupId?: string;
  groupName?: string; // NEW: For display purposes
  stage?: 'Group' | 'Semi-Final' | 'Final' | 'Qualifier' | 'Eliminator';
  relatedMatchId?: string;
  format?: TournamentFormat;
  customOvers?: number;
  followOnMargin?: number;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  date: string;
  timestamp?: number; // NEW: Unix timestamp for duplicate detection
  venue: string;
  venueLatitude?: number; // NEW: For maps integration
  venueLongitude?: number; // NEW: For maps integration
  venueAddress?: string; // NEW: Full address for geocoding
  status: 'Scheduled' | 'Live' | 'Completed';
  isOfficial?: boolean;
  isArchived?: boolean;
  result?: string;
  winnerId?: string;
  teamAScore?: string;
  teamBScore?: string;
  tossWinnerId?: string;
  tossDecision?: 'Bat' | 'Bowl';
  umpires?: string[];
  scorerId?: string;
  teamASquadIds?: string[];
  teamBSquadIds?: string[];
  savedState?: MatchState;
  allowFlexibleSquad?: boolean;
  initialPlayers?: {
    strikerId: string;
    nonStrikerId: string;
    bowlerId: string;
  };
  reportSubmission?: MatchReportSubmission;
  assignedUmpireIds?: string[]; // User IDs of assigned umpires
  umpireReport?: UmpireMatchReport; // Umpire's official match report
  pointsData?: MatchPointsData;
  // NEW: Duplicate Detection Fields
  gameId?: string; // Unique identifier for the actual game (teamA_teamB_date)
  isDuplicate?: boolean; // Is this a duplicate match report?
  primaryMatchId?: string; // If duplicate, reference to the primary match
  duplicateReason?: string; // Why this is marked as duplicate
  orgId?: string; // NEW: Organization ID for permission checks
  createdBy?: string; // NEW: Creator ID for standalone matches
};

export type ExtrasBreakdown = {
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  penalty: number;
  total: number;
};

export type FallOfWicket = {
  score: number;
  wicketNumber: number;
  over: string;
  batterName: string;
};

export interface BattingCardRow {
  playerId: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  scoringSequence: string[];
  dismissal?: string;
  bowlerName?: string;
  isOut: boolean;
  atCrease: boolean;
}

export interface InningsStats {
  rows: BattingCardRow[];
  extras: ExtrasBreakdown;
  totalScore: string;
  overs: string;
  runRate: string;
  fow: FallOfWicket[];
  didNotBat: Player[];
}

export interface Comment {
  id: string;
  userId: string;
  author: string;
  text: string;
  timestamp: number;
}

export interface MediaPost {
  id: string;
  type: 'IMAGE' | 'VIDEO' | 'LIVE_STATUS' | 'NEWS';
  authorName: string;
  authorAvatar?: string;
  userId?: string; // Linked Author ID
  title?: string;
  contentUrl?: string;
  caption: string;
  timestamp: number;
  likes: string[]; // User IDs who liked
  dislikes: string[]; // User IDs who disliked
  reactions?: Record<string, string[]>; // Emoji -> User IDs
  shares: number;
  comments: Comment[];
  matchId?: string;
  sponsorId?: string;
}

