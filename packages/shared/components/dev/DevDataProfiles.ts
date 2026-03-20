import { Organization, MatchFixture, Team, Player, MatchState, Group, Tournament } from '@shared/types';

export interface DevProfile {
    id: string;
    name: string;
    description: string;
    icon: string;
    generate: () => { orgs: Organization[], matches: MatchFixture[] };
}

const generatePlayers = (count: number, prefix: string): Player[] => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `pl-${prefix}-${i}`,
        name: `${prefix} Player ${i + 1}`,
        role: i === 0 ? 'Wicket-keeper' : i < 5 ? 'Batsman' : i < 9 ? 'All-rounder' : 'Bowler',
        stats: { runs: 0, wickets: 0, ballsFaced: 0, ballsBowled: 0, runsConceded: 0, matches: 0, catches: 0, runOuts: 0, stumpings: 0, fours: 0, sixes: 0, hundreds: 0, fifties: 0, ducks: 0, threeWickets: 0, fiveWickets: 0, maidens: 0 }
    }));
};

const generateTeam = (id: string, name: string, prefix: string): Team => ({
    id,
    name,
    players: generatePlayers(15, prefix),
    logoUrl: ''
});

export const DEV_PROFILES: DevProfile[] = [
    {
        id: 'reset',
        name: 'Reset Data',
        description: 'Clear all data and start fresh.',
        icon: '🗑️',
        generate: () => ({ orgs: [], matches: [] })
    },
    {
        id: 'quick_match',
        name: 'Quick Match Ready',
        description: 'Two teams and a match ready to start.',
        icon: '⚡',
        generate: () => {
            const teamA = generateTeam('tm-qm-1', 'Super Strikers', 'Strikers');
            const teamB = generateTeam('tm-qm-2', 'Thunder Bolts', 'Thunder');

            const match: MatchFixture = {
                id: `mx-qm-${Date.now()}`,
                teamAId: teamA.id,
                teamBId: teamB.id,
                date: new Date().toISOString(),
                teamAName: teamA.name,
                teamBName: teamB.name,
                venue: 'Dev Ground',
                status: 'Scheduled'
            };

            const org: Organization = {
                id: 'org-dev-qm',
                name: 'Quick Play',
                type: 'CLUB',
                memberTeams: [teamA, teamB],
                fixtures: [],
                tournaments: [],
                groups: [],
                members: [],
                applications: [],
                sponsors: [],
                establishedYear: 2026,
                isPublic: false
            };

            return { orgs: [org], matches: [match] };
        }
    },
    {
        id: 'tournament',
        name: 'Tournament Mode',
        description: 'Full tournament with 8 teams and groups.',
        icon: '🏆',
        generate: () => {
            const teams = Array.from({ length: 8 }).map((_, i) =>
                generateTeam(`tm-tr-${i}`, `Team ${String.fromCharCode(65 + i)}`, `Team ${String.fromCharCode(65 + i)}`)
            );

            const groupA: Group = { id: 'grp-A', name: 'Group A', teams: teams.slice(0, 4) };
            const groupB: Group = { id: 'grp-B', name: 'Group B', teams: teams.slice(4, 8) };

            const tournament: Tournament = {
                id: 'trn-dev-1',
                name: 'Dev Cup 2026',
                format: 'T20',
                overs: 20,
                groups: [groupA, groupB],
                status: 'Ongoing',
                pointsConfig: {
                    win: 2, loss: 0, tie: 1, noResult: 1,
                    win_outright: 2, tie_match: 1,
                    first_inning_lead: 0, first_inning_tie: 0, first_inning_loss: 0,
                    bonus_batting_max: 0, bonus_bowling_max: 0, max_total_per_match: 2,
                    batting_bonus_tiers: [], bowling_bonus_tiers: []
                }
            };

            const org: Organization = {
                id: 'org-dev-trn',
                name: 'Dev League',
                type: 'GOVERNING_BODY',
                memberTeams: teams,
                fixtures: [],
                tournaments: [tournament],
                groups: [],
                members: [],
                applications: [],
                sponsors: [],
                establishedYear: 2026,
                isPublic: true
            };

            return { orgs: [org], matches: [] };
        }
    },
    {
        id: 'central_zone_full',
        name: 'Central Zone Setup',
        description: 'Seeds the 24 Central Zone clubs with admins, captains, and squads.',
        icon: '🇹🇹',
        generate: () => {
            const teamNames = [
                "Balmain United", "Brickfield Sports", "Orangefield Sports", "Caparo Sports",
                "Centric Academy", "Countryside", "Couva Sports", "Agostini Sports",
                "Esmeralda Sports", "Ragoonanan Road Sports", "Exchange 2", "Felicity Sports",
                "Friendship Hall Sports", "Koreans Sports", "Lange Park Sports", "Line and Length",
                "Madras Divergent Academy", "Mc Bean Sports", "Petersfield Sports",
                "Preysal Valley Boys", "Renoun Sports", "Sital Felicity Youngsters",
                "Supersonic Sports", "Waterloo Sports"
            ];

            const teams = teamNames.map((name, i) => {
                const slug = name.toLowerCase().replace(/\s+/g, '-');
                const team = generateTeam(`tm-cz-${slug}`, name, name.split(' ')[0]);
                // Customize description for customization request
                team.management = 'Managed by ' + name + ' Board';
                team.location = 'Central Trinidad';
                return team;
            });

            // Generate Members: 1 Admin and 1 Captain per team
            const members: any[] = [];

            teams.forEach(team => {
                const slug = team.id.replace('tm-cz-', '');
                const baseHandle = slug.split('-')[0];

                // Club Admin (PW: admin)
                members.push({
                    userId: `adm-${slug}`,
                    name: `${team.name} Admin`,
                    handle: `@admin_${baseHandle}`,
                    role: 'Administrator',
                    addedAt: Date.now(),
                    permissions: { canEditOrg: true, canManageMembers: true, canEditSquad: true, canSubmitReport: true }
                });

                // Club Captain (PW: Captain) - Assign to first player
                const captPlayer = team.players[0];
                members.push({
                    userId: captPlayer.id,
                    name: captPlayer.name,
                    handle: `@capt_${baseHandle}`,
                    role: 'Player',
                    addedAt: Date.now(),
                    permissions: { canSubmitReport: true, canEditSquad: true, canViewReports: true }
                });

                // Club Coach (PW: coach)
                members.push({
                    userId: `coach-${slug}`,
                    name: `Coach ${team.name.split(' ')[0]}`,
                    handle: `@coach_${baseHandle}`,
                    role: 'Coach',
                    addedAt: Date.now(),
                    permissions: { canEditSquad: true, canViewReports: true, canManagePractice: true }
                });

                // Club Scorer (PW: scorer)
                members.push({
                    userId: `scorer-${slug}`,
                    name: `Scorer ${team.name.split(' ')[0]}`,
                    handle: `@scorer_${baseHandle}`,
                    role: 'Scorer',
                    addedAt: Date.now(),
                    permissions: { canScoreMatch: true, canEditScorecard: true, canViewReports: true }
                });
            });

            // 2 Zone Umpires (PW: umpire)
            members.push(
                {
                    userId: 'umpire-cz-1',
                    name: 'Umpire Steve',
                    handle: '@ump_steve',
                    role: 'Umpire',
                    addedAt: Date.now(),
                    permissions: { canOfficiate: true, canViewReports: true }
                },
                {
                    userId: 'umpire-cz-2',
                    name: 'Umpire Mike',
                    handle: '@ump_mike',
                    role: 'Umpire',
                    addedAt: Date.now(),
                    permissions: { canOfficiate: true, canViewReports: true }
                }
            );

            const org: Organization = {
                id: 'org-central-zone',
                name: 'Central Zone',
                type: 'GOVERNING_BODY', // Acting as the zone wrapper
                description: 'The official governing body for the Central Zone containing all member clubs.',
                memberTeams: teams,
                fixtures: [],
                tournaments: [],
                groups: [],
                members: members,
                applications: [],
                sponsors: [],
                establishedYear: 1980,
                isPublic: true,
                allowUserContent: true,
                country: 'Trinidad & Tobago'
            };

            return { orgs: [org], matches: [] };
        }
    }
];
