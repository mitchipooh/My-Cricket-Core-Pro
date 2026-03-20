
import { PointsConfig, BonusThreshold } from '../types';

export interface MatchScoringPayload {
    resultType: 'OUTRIGHT_WIN' | 'OUTRIGHT_TIE' | 'ABANDONED' | 'NO_RESULT' | 'DRAW';
    firstInningsWinnerId: string | null; // ID of team with first innings lead/tie
    firstInningsResult: 'LEAD' | 'TIE' | 'LOSS' | null;
    isIncomplete: boolean;
    teamARuns: number;
    teamBRuns: number;
    teamAWickets: number;
    teamBWickets: number;
}

/**
 * Calculates bonus points based on thresholds
 */
export function calculateBonusPoints(value: number, tiers: BonusThreshold[], max: number): number {
    let earned = 0;
    // Tiers are typically sorted by threshold ascending
    const sortedTiers = [...tiers].sort((a, b) => a.threshold - b.threshold);

    for (const tier of sortedTiers) {
        if (value >= tier.threshold) {
            earned = tier.points;
        }
    }

    return Math.min(earned, max);
}

/**
 * Calculates total points for a team in a single match
 */
export function calculateTeamPoints(
    isTeamA: boolean,
    payload: MatchScoringPayload,
    config: PointsConfig
): {
    matchPoints: number;
    inningPoints: number;
    battingBonus: number;
    bowlingBonus: number;
    total: number;
    isValid: boolean;
    error?: string;
} {
    let matchPoints = 0;
    let inningPoints = 0;

    const isIncomplete = payload.isIncomplete;

    // 1. Outright Match Points
    if (!isIncomplete) {
        if (payload.resultType === 'OUTRIGHT_WIN') {
            // Determine if this team is the winner
            // Note: This assumes we know who won. We'll simplify: 
            // If result is WIN, we need to know for which team we are calculating.
            // We'll pass the winnerId or side in a real implementation.
        }
    }

    // Refined approach: calculate for a specific side
    const teamRuns = isTeamA ? payload.teamARuns : payload.teamBRuns;
    const teamWickets = isTeamA ? payload.teamAWickets : payload.teamBWickets;
    const opponentWickets = isTeamA ? payload.teamBWickets : payload.teamAWickets;

    // OUTRIGHT RESULT
    if (!isIncomplete) {
        if (payload.resultType === 'OUTRIGHT_WIN') {
            // Logic for winner/loser
            // Assume MatchScoringPayload includes winnerSide: 'A' | 'B' | 'TIE'
        }
    }

    return null as any; // placeholder for refined logic below
}

// Rewriting for clarity based on user side parameter
export function calculatePointsForSide(
    side: 'A' | 'B',
    payload: MatchScoringPayload & { winnerSide?: 'A' | 'B' | 'TIE' | 'NONE' },
    config: PointsConfig
) {
    let matchPoints = 0;
    let inningPoints = 0;

    const isWinner = payload.winnerSide === side;
    const isMatchTie = payload.winnerSide === 'TIE';

    // 1. Outright Match Points
    if (!payload.isIncomplete) {
        if (isWinner) matchPoints = config.win_outright;
        else if (isMatchTie) matchPoints = config.tie_match;
    }

    // 2. Inning Points (First Innings Lead/Tie/Loss)
    // Determine if this side won first innings
    const didLead = payload.firstInningsWinnerId === (side === 'A' ? 'teamA' : 'teamB'); // placeholder logic for IDs
    // To make it robust, we'll use a result field in payload

    // Revised Payload for robust calculation:
    // firstInningsResultSideA: 'LEAD' | 'TIE' | 'LOSS' | 'NONE'

    const actualInningResult = side === 'A' ? payload.firstInningsResult : (
        payload.firstInningsResult === 'LEAD' ? 'LOSS' : (payload.firstInningsResult === 'LOSS' ? 'LEAD' : payload.firstInningsResult)
    );

    if (actualInningResult === 'LEAD') inningPoints = config.first_inning_lead;
    else if (actualInningResult === 'TIE') inningPoints = config.first_inning_tie;
    else if (actualInningResult === 'LOSS') inningPoints = config.first_inning_loss;

    // Incomplete match logic: "prioritize Inning Points over Outright Win points"
    // This means if isIncomplete is true, matchPoints should definitely be 0.
    if (payload.isIncomplete) {
        matchPoints = 0;
    }

    // 3. Bonus Points
    const teamRuns = side === 'A' ? payload.teamARuns : payload.teamBRuns;
    const opponentWicketsTaken = side === 'A' ? payload.teamBWickets : payload.teamAWickets;

    const battingBonus = calculateBonusPoints(teamRuns, config.batting_bonus_tiers, config.bonus_batting_max);
    const bowlingBonus = calculateBonusPoints(opponentWicketsTaken, config.bowling_bonus_tiers, config.bonus_bowling_max);

    const total = matchPoints + inningPoints + battingBonus + bowlingBonus;

    const isValid = total <= config.max_total_per_match;

    return {
        matchPoints,
        inningPoints,
        battingBonus,
        bowlingBonus,
        total,
        isValid,
        error: isValid ? undefined : `Total points (${total}) exceeds maximum allowed per match (${config.max_total_per_match})`
    };
}
