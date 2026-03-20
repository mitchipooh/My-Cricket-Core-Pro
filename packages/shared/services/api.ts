import { Organization, Team, MatchFixture, MediaPost, GameIssue, MatchReportSubmission, UmpireMatchReport, UserProfile } from '../types';

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001/api';

export const pushGlobalSync = async (data: {
    orgs: Organization[],
    standaloneMatches: MatchFixture[],
    mediaPosts: MediaPost[],
    issues?: GameIssue[],
    matchReports?: MatchReportSubmission[],
    umpireReports?: UmpireMatchReport[]
}) => {
    const response = await fetch(`${API_BASE_URL}/sync/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Sync failed');
    return response.json();
};

export const fetchGlobalSync = async (): Promise<{
    orgs: Organization[],
    allTeams: Team[],
    standaloneMatches: MatchFixture[],
    mediaPosts: MediaPost[],
    issues: GameIssue[],
    matchReports: MatchReportSubmission[],
    umpireReports: UmpireMatchReport[]
}> => {
    const response = await fetch(`${API_BASE_URL}/sync/pull`);
    if (!response.ok) throw new Error('Fetch failed');
    return response.json();
};

export const updateFixture = async (matchId: string, data: Partial<MatchFixture>) => {
    // This could also be a granular update, but for now we'll rely on global sync
    // unless we implement specific table endpoints
    console.log('Update fixture called for', matchId, data);
};

// ... add other user management and helper functions ...
