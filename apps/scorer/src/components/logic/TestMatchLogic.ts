import { MatchState, TestMatchConfig } from '../../../types';

export const TEST_MATCH_DEFAULTS: TestMatchConfig = {
    maxDays: 5,
    oversPerDay: 90,
    lastHourOvers: 15,
    followOnMargin: 200,
};

/**
 * Calculates the current lead or trail.
 * Positive = Batting team leads.
 * Negative = Batting team trails.
 */
export const calculateLead = (state: MatchState): number => {
    const { innings, score, inningsScores, battingTeamId, bowlingTeamId } = state;

    // Get scores for batting and bowling teams across innings
    const battingTeamScores = inningsScores.filter(i => i.teamId === battingTeamId).reduce((acc, i) => acc + (i.score || 0), 0);
    const bowlingTeamScores = inningsScores.filter(i => i.teamId === bowlingTeamId).reduce((acc, i) => acc + (i.score || 0), 0);

    // Add current innings score to the total batting team score
    const currentBattingTotal = battingTeamScores + score;

    return currentBattingTotal - bowlingTeamScores;
};

/**
 * Checks if the follow-on can be enforced.
 * Logic: Match must be in Innings 2 (completed), and the trail must be >= margin.
 */
export const canEnforceFollowOn = (state: MatchState): boolean => {
    if (state.innings !== 2 || !state.adjustments?.concluded) return false;

    const lead = calculateLead(state); // will be negative if trailing
    const margin = state.testConfig?.followOnMargin || TEST_MATCH_DEFAULTS.followOnMargin;

    // If trail is greater than margin (e.g. lead is -250, margin is 200)
    return lead <= -margin;
};

/**
 * Calculates the target for the 4th innings.
 * Formula: (Inn1 + Inn3) - Inn2 + 1
 */
export const calculateTestTarget = (state: MatchState): number => {
    // Only valid to calculate target if we are setting up for or in Innings 4
    if (state.innings < 3) return 0;

    const inn1 = state.inningsScores.find(i => i.innings === 1)?.score || 0;
    const inn2 = state.inningsScores.find(i => i.innings === 2)?.score || 0;

    // If calculating at end of Innings 3
    const inn3 = state.innings === 3 ? state.score : (state.inningsScores.find(i => i.innings === 3)?.score || 0);

    return (inn1 + inn3) - inn2 + 1;
};

/**
 * Checks for Match End Conditions specifically for Test Matches.
 */
export const checkTestMatchStatus = (state: MatchState): { isComplete: boolean; result?: string; winnerId?: string } => {
    const config = state.testConfig || TEST_MATCH_DEFAULTS;

    // 1. Draw Conditions (Time Limit)
    // If we are past the last day, or it's the last hour and overs are done
    if (state.currentDay && state.currentDay > config.maxDays) {
        return { isComplete: true, result: 'Match Drawn', winnerId: 'DRAW' };
    }

    // 2. Win by Innings
    // If Innings 2 checks out and they are still trailing Innings 1 score
    // Note: In cricket, if you are all out in the 2nd innings (assuming follow on or not) and still behind Inn 1 total?
    // Wait, standard Win by Innings is: Team A bats (500). Team B bats (200). Team B Follows on (150). Total 350 vs 500. Team A wins by Innings & 150 runs.

    // Let's implement simpler check:
    // If Enforcing Follow On, we are in Innings 3 (Team B batting again).
    // If standard sequence, Innings 3 is Team A batting again.

    // We strictly check end of match conditions here, which usually happen:
    // - End of Innings 4 (Chasing team wins or All out)
    // - End of Innings 3 (if Follow on involved and they didn't cross the lead? No, that's just Innings Defeat)

    // Win by Wickets (Chasing team reaches target)
    if (state.innings === 4 && state.target && state.score >= state.target) {
        return { isComplete: true, result: `${state.battingTeamId} won by ${10 - state.wickets} wickets`, winnerId: state.battingTeamId };
    }

    // Win by Runs (Chasing team all out before target)
    if (state.innings === 4 && state.target && state.wickets >= 10 && state.score < state.target) {
        return { isComplete: true, result: `${state.bowlingTeamId} won by ${state.target - state.score - 1} runs`, winnerId: state.bowlingTeamId };
    }

    // Innings Victory Condition
    // If Innings 3 is over (Team B followed on) AND they still haven't crossed Innings 1 score
    // OR If Innings 2 is over AND declared/all-out, but match isn't necessarily over unless logic says so (usually just going to Inn 3)

    return { isComplete: false };
};
