import { MatchFixture, MediaPost, MatchState } from '../types';
import { generateId } from './idGenerator';

/**
 * Generates an AI-style news article for a completed match.
 */
export const generateMatchNews = (match: MatchFixture, state: MatchState): MediaPost => {
    const winnerId = match.winnerId;
    const teamA = match.teamAName;
    const teamB = match.teamBName;

    const teamAScoreRec = state.inningsScores.find(i => i.teamId === match.teamAId);
    const teamBScoreRec = state.inningsScores.find(i => i.teamId === match.teamBId);

    const scoreA = `${teamAScoreRec?.score || 0}/${teamAScoreRec?.wickets || 0}`;
    const scoreB = `${teamBScoreRec?.score || 0}/${teamBScoreRec?.wickets || 0}`;

    let headline = '';
    let body = '';

    // Determine Winner Context
    const winningTeamName = winnerId === match.teamAId ? teamA : match.teamBId ? teamB : 'Match Drawn';

    if (match.result?.includes('won by')) {
        headline = `${winningTeamName} Dominates in Thrilling Contest against ${winnerId === match.teamAId ? teamB : teamA}`;
    } else {
        headline = `${teamA} vs ${teamB} Ends in ${match.result}`;
    }

    // Identify Top Performers (Mock logic for now, ideally parse stats)
    // We can extract best batsman/bowler from stats if available, or just generic commentary.
    const bestBat = "Top Order"; // Placeholder
    const bestBowl = "Bowling Attack"; // Placeholder

    body = `
In a gripping encounter at ${match.venue}, ${winningTeamName} secured a victory.
${teamA} posted ${scoreA}, while ${teamB} managed ${scoreB}.
The ${bestBat} performed exceptionally well, supported by a disciplined ${bestBowl}.

Status: ${match.status}
Result: ${match.result}
    `.trim();

    return {
        id: generateId('news'),
        type: 'NEWS',
        authorName: 'Cricket Core AI',
        authorAvatar: '', // Use a default AI avatar later
        title: headline,
        caption: body,
        timestamp: Date.now(),
        likes: [],
        dislikes: [],
        shares: 0,
        comments: [],
        matchId: match.id
    };
};

/**
 * Generates a Live Status update for an ongoing match.
 */
export const generateLiveStatusUpdate = (match: MatchFixture, state: MatchState): MediaPost => {
    const teamA = match.teamAName;
    const teamB = match.teamBName;
    const battingTeamId = state.battingTeamId;
    const battingTeamName = battingTeamId === match.teamAId ? teamA : teamB;

    const currentScore = `${state.score}/${state.wickets}`;
    const overs = Math.floor(state.totalBalls / 6) + '.' + (state.totalBalls % 6);

    return {
        id: generateId('live'),
        type: 'LIVE_STATUS',
        authorName: 'Match Centre',
        title: `LIVE: ${battingTeamName} ${currentScore} (${overs})`,
        caption: `Live update from ${match.venue}. ${battingTeamName} are currently batting at ${currentScore} after ${overs} overs.`,
        timestamp: Date.now(),
        likes: [],
        dislikes: [],
        shares: 0,
        comments: [],
        matchId: match.id,
        contentUrl: '' // If we had a screenshot URL, it would go here
    };
};
