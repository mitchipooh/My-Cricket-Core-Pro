import { MatchFixture } from '../types';

/**
 * Generates a unique game ID based on teams and date
 * This ensures the same teams playing on the same day get the same gameId
 * regardless of which match was created first
 */
export function generateGameId(
    teamAId: string,
    teamBId: string,
    date: string | number
): string {
    // Sort team IDs to ensure consistency regardless of order
    const [team1, team2] = [teamAId, teamBId].sort();

    // Convert date to YYYY-MM-DD format
    let dateStr: string;
    if (typeof date === 'number') {
        dateStr = new Date(date).toISOString().split('T')[0];
    } else {
        // Assume date is already in a parseable format
        dateStr = new Date(date).toISOString().split('T')[0];
    }

    return `${team1}_${team2}_${dateStr}`;
}

/**
 * Checks if a new fixture would be a duplicate of an existing match
 */
export function checkForDuplicateMatch(
    newFixture: Partial<MatchFixture>,
    existingFixtures: MatchFixture[]
): {
    isDuplicate: boolean;
    primaryMatch?: MatchFixture;
    gameId: string;
} {
    if (!newFixture.teamAId || !newFixture.teamBId || (!newFixture.date && !newFixture.timestamp)) {
        // Can't check for duplicates without required fields
        return {
            isDuplicate: false,
            gameId: ''
        };
    }

    const gameId = generateGameId(
        newFixture.teamAId,
        newFixture.teamBId,
        newFixture.timestamp || newFixture.date!
    );

    // Find existing match with same gameId
    const existingMatch = existingFixtures.find(f => f.gameId === gameId);

    return {
        isDuplicate: !!existingMatch,
        primaryMatch: existingMatch,
        gameId
    };
}

/**
 * Marks a fixture as duplicate and links it to the primary match
 */
export function markAsDuplicate(
    fixture: MatchFixture,
    primaryMatch: MatchFixture,
    reason?: string
): MatchFixture {
    return {
        ...fixture,
        isDuplicate: true,
        primaryMatchId: primaryMatch.id,
        duplicateReason: reason || `Duplicate of match ${primaryMatch.id}`,
        gameId: primaryMatch.gameId
    };
}

/**
 * Filters out duplicate matches from a list of fixtures
 * Used for stats calculation to ensure duplicates don't count
 */
export function filterNonDuplicateMatches(fixtures: MatchFixture[]): MatchFixture[] {
    return fixtures.filter(f => !f.isDuplicate);
}

/**
 * Gets all duplicates of a primary match
 */
export function getDuplicateMatches(
    primaryMatchId: string,
    allFixtures: MatchFixture[]
): MatchFixture[] {
    return allFixtures.filter(f => f.primaryMatchId === primaryMatchId);
}

/**
 * Checks if two fixtures represent the same game
 */
export function isSameGame(fixture1: MatchFixture, fixture2: MatchFixture): boolean {
    if (fixture1.gameId && fixture2.gameId) {
        return fixture1.gameId === fixture2.gameId;
    }

    // Fallback: check teams and date
    const sameTeams = (
        (fixture1.teamAId === fixture2.teamAId && fixture1.teamBId === fixture2.teamBId) ||
        (fixture1.teamAId === fixture2.teamBId && fixture1.teamBId === fixture2.teamAId)
    );

    const date1 = new Date(fixture1.timestamp || fixture1.date).toISOString().split('T')[0];
    const date2 = new Date(fixture2.timestamp || fixture2.date).toISOString().split('T')[0];

    return sameTeams && date1 === date2;
}
