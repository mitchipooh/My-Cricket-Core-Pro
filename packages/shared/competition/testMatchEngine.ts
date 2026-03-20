
import { MatchState, BallEvent } from '../types';
import { MatchResult } from './types';

/**
 * Calculates aggregate runs for a team across all innings.
 */
export const getAggregateRuns = (state: MatchState, teamId: string, includeCurrentInnings: boolean = true): number => {
    const completedRuns = (state.inningsScores || [])
        .filter(is => is.teamId === teamId && is.isComplete)
        .reduce((sum, is) => sum + is.score, 0);

    if (includeCurrentInnings && state.battingTeamId === teamId) {
        return completedRuns + state.score;
    }
    return completedRuns;
};

/**
 * Computes lead or trail status between teams.
 */
export const getLeadStatus = (state: MatchState) => {
    const teamIds = Array.from(new Set((state.inningsScores || []).map(is => is.teamId)));
    if (teamIds.length < 2) return { leadingTeamId: null, leadRuns: 0 };

    const runs0 = getAggregateRuns(state, teamIds[0], true);
    const runs1 = getAggregateRuns(state, teamIds[1], true);

    const diff = runs0 - runs1;
    if (diff > 0) return { leadingTeamId: teamIds[0], leadRuns: diff };
    if (diff < 0) return { leadingTeamId: teamIds[1], leadRuns: Math.abs(diff) };
    return { leadingTeamId: null, leadRuns: 0 };
};

/**
 * Calculates the target for the 4th innings chase.
 */
export const getTargetIfChase = (state: MatchState): number | null => {
    if (state.innings < 4) return null;

    const battingTeamId = state.battingTeamId;
    const fieldingTeamId = state.bowlingTeamId;

    const fieldingTotal = getAggregateRuns(state, fieldingTeamId, false);
    const battingTotalPrior = getAggregateRuns(state, battingTeamId, false);

    const target = (fieldingTotal - battingTotalPrior) + 1;
    return target > 0 ? target : 1; // Minimum target is 1
};

/**
 * Checks if the current innings can or should end.
 */
export const canEndInnings = (state: MatchState): boolean => {
    if (state.wickets >= 10) return true;

    if (state.innings === 4) {
        const target = getTargetIfChase(state);
        if (target !== null && state.score >= target) return true;
    }

    return false;
};

/**
 * Triggers the Last Hour state.
 */
export const triggerLastHour = (state: MatchState): MatchState => {
    return {
        ...state,
        adjustments: {
            ...state.adjustments,
            isLastHour: true,
            lastHourOversRemaining: 15,
            dayNumber: state.adjustments?.dayNumber || 1,
            session: 'Evening',
            declared: state.adjustments?.declared || false,
        }
    };
};

/**
 * Decrements the last hour overs if active.
 * Should be called at the end of every over.
 */
export const decrementLastHour = (state: MatchState): MatchState => {
    if (!state.adjustments?.isLastHour) return state;

    const remaining = state.adjustments.lastHourOversRemaining || 0;
    if (remaining <= 0) return state;

    return {
        ...state,
        adjustments: {
            ...state.adjustments,
            lastHourOversRemaining: Math.max(0, remaining - 1),
            isLastHour: true,
            dayNumber: state.adjustments.dayNumber,
            session: state.adjustments.session || 'Evening',
            declared: state.adjustments.declared
        }
    };
};

/**
 * Checks if the follow-on can be enforced.
 * Standard rule: Lead of 200+ runs in a 5-day match (unlimited overs) after 1st innings of both sides.
 */
export const isFollowOnEligible = (state: MatchState): boolean => {
    // Must be after both teams have completed their first innings (so start of 3rd innings typically)
    // Actually, checked immediately after 2nd innings ends.
    const inningsCompleted = (state.inningsScores || []).filter(is => is.isComplete).length;
    if (inningsCompleted !== 2) return false;

    const teamIds = Array.from(new Set((state.inningsScores || []).map(is => is.teamId)));
    if (teamIds.length < 2) return false;

    const teamBattingFirst = teamIds[0]; // Assuming order in scores implies batting order, better to track strictly
    // In our model, we should check who batted in Innings 1 vs Innings 2
    const innings1 = (state.inningsScores || []).find(is => is.innings === 1);
    const innings2 = (state.inningsScores || []).find(is => is.innings === 2);

    if (!innings1 || !innings2) return false;

    const runs1 = innings1.score;
    const runs2 = innings2.score;

    // If Team 2 batted second and is behind by >= 200
    const lead = runs1 - runs2;
    const threshold = state.testConfig?.followOnMargin || 200;

    return lead >= threshold;
};

/**
 * transitions the state to the next innings
 */
export const endInnings = (
    state: MatchState,
    reason: 'ALL_OUT' | 'DECLARED' | 'FORFEITED' | 'TIME' | 'TARGET_REACHED' | 'OTHER'
): MatchState => {
    const currentInningsIndex = state.innings; // 1-based

    // 1. Mark current innings as complete
    const updatedScores = state.inningsScores.map(is =>
        is.innings === currentInningsIndex ? { ...is, isComplete: true, endReason: reason } : is
    );

    // 2. Determine Next Batting Team
    // Check follow-on eligibility first if we just finished Innings 2
    let nextBattingTeam = getNextInningsBattingTeamId({ ...state, innings: currentInningsIndex }, state.isFollowOnEnforced);

    // If we just finished innings 2, we might not know if follow-on is enforced yet.
    // The UI should handle the pause. But assuming standard transition:
    // If follow-on is NOT enforced (default), we swap.

    // Special handling: If this was the final innings (4th) or match result reachable?
    // checkForResult should be called before this or immediately after.

    const nextInningsNumber = currentInningsIndex + 1;

    // If match is over, we shouldn't really call this, but safety check:
    if (nextInningsNumber > 4) return { ...state, isCompleted: true };

    return {
        ...state,
        innings: nextInningsNumber,
        battingTeamId: nextBattingTeam || state.bowlingTeamId, // Fallback swap
        bowlingTeamId: state.battingTeamId, // Swap
        score: 0,
        wickets: 0,
        totalBalls: 0,
        strikerId: '', // Reset
        nonStrikerId: '',
        bowlerId: '',
        history: [], // Clear ball history for new innings? Or keep cumulative? usually new array for new innings context, but state.history might be global. 
        // If state.history is global, dont clear. If per innings, clear. 
        // Type def says `history: BallEvent[]`. Usually keeps full match log.
        // We should initialize the new innings score entry
        inningsScores: [
            ...updatedScores,
            {
                innings: nextInningsNumber,
                teamId: nextBattingTeam || state.bowlingTeamId,
                score: 0,
                wickets: 0,
                overs: '0.0'
            }
        ]
    };
};

/**
 * Determines the next team to bat, including follow-on handling.
 */
export const getNextInningsBattingTeamId = (
    state: MatchState,
    followOnEnforced: boolean = false
): string | null => {
    const teamIds = Array.from(new Set((state.inningsScores || []).map(is => is.teamId)));
    if (teamIds.length < 2) return null;

    const currentBattingTeamId = state.battingTeamId;
    const otherTeamId = state.bowlingTeamId;

    // After Innings 1 -> Always other team (Innings 2)
    if (state.innings === 1) return otherTeamId;

    // After Innings 2 -> Check follow-on
    if (state.innings === 2) {
        return followOnEnforced ? otherTeamId : currentBattingTeamId;
    }

    // After Innings 3 -> Always the other team (Innings 4)
    if (state.innings === 3) return otherTeamId;

    return null; // No 5th innings in Test
};

/**
 * Checks for a match-ending result.
 */
export const checkForResult = (state: MatchState): { winnerTeamId: string | null; resultType: MatchResult; margin?: string } | null => {
    const teamIds = Array.from(new Set((state.inningsScores || []).map(is => is.teamId)));
    if (teamIds.length < 2) return null;

    const teamA = teamIds[0];
    const teamB = teamIds[1];

    // Count strictly completed innings
    const completedInningsA = (state.inningsScores || []).filter(is => is.teamId === teamA && is.isComplete).length;
    const completedInningsB = (state.inningsScores || []).filter(is => is.teamId === teamB && is.isComplete).length;

    // 1. Innings Victory (One team finished 2 innings, other finished 1)
    const runsA = getAggregateRuns(state, teamA, true);
    const runsB = getAggregateRuns(state, teamB, true);

    // Case A: Team A played 1, Team B played 2, A > B
    if (completedInningsA === 1 && completedInningsB === 2) {
        if (runsA > runsB) {
            return { winnerTeamId: teamA, resultType: 'WIN_BY_INNINGS_AND_RUNS', margin: `${runsA - runsB} runs` };
        }
    }

    // Case B: Team B played 1, Team A played 2, B > A
    if (completedInningsB === 1 && completedInningsA === 2) {
        if (runsB > runsA) {
            return { winnerTeamId: teamB, resultType: 'WIN_BY_INNINGS_AND_RUNS', margin: `${runsB - runsA} runs` };
        }
    }

    // 2. 4th Innings Result
    if (state.innings === 4) {
        const target = getTargetIfChase(state);
        if (target === null) return null;

        if (state.score >= target) {
            return {
                winnerTeamId: state.battingTeamId,
                resultType: 'WIN_BY_WICKETS',
                margin: `${10 - state.wickets} wickets`
            };
        }

        // Check if chasing team is all out
        const currentInnings = (state.inningsScores || []).find(is => is.innings === 4);
        if (currentInnings?.isComplete || state.wickets >= 10) {
            if (state.score < target - 1) {
                return {
                    winnerTeamId: state.bowlingTeamId,
                    resultType: 'WIN_BY_RUNS',
                    margin: `${target - 1 - state.score} runs`
                };
            } else if (state.score === target - 1) {
                return { winnerTeamId: null, resultType: 'TIE' };
            }
        }
    }

    // 3. Time/Draw - typically handled externally or via "Concluded" flag
    if (state.adjustments?.concluded) {
        return { winnerTeamId: null, resultType: 'DRAW' };
    }

    return null;
};
