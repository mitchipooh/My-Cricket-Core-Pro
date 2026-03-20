import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataProvider';
import { TournamentDashboard } from '../dashboard/TournamentDashboard';
import { PlayerRegistry } from '../search/PlayerRegistry';
import { OrganizationView } from '../dashboard/OrganizationView';
import { Organization, Tournament, MatchFixture } from '../../types';

export const EmbedViewer: React.FC = () => {
    const { orgs } = useData();
    const params = new URLSearchParams(window.location.search);

    // Embed Parameters
    const view = params.get('view');
    const entityId = params.get('id');
    const orgId = params.get('orgId');
    const tournamentId = params.get('tournamentId');
    const groupId = params.get('groupId');

    // Find Entity Helpers
    const findTournament = (tId: string | null): { tournament: Tournament, org: Organization } | null => {
        if (!tId) return null;
        for (const org of orgs) {
            const trn = org.tournaments.find(t => t.id === tId);
            if (trn) return { tournament: trn, org };
        }
        return null;
    };

    const findOrg = (oId: string | null): Organization | null => {
        return orgs.find(o => o.id === oId) || null;
    };

    // Aggregate all data for registry
    const allPlayers = useMemo(() =>
        orgs.flatMap(o => o.memberTeams.flatMap(t => t.players)),
        [orgs]);

    const allTeams = useMemo(() =>
        orgs.flatMap(o => o.memberTeams),
        [orgs]);

    // Render Logic
    if (view === 'tournament' || view === 'standings' || view === 'fixtures' || view === 'bracket' || view === 'groups') {
        const tId = tournamentId || entityId;
        const data = findTournament(tId);

        if (!data) return <div className="p-8 text-center text-slate-500 font-bold">Tournament not found</div>;

        let tab: any = 'OVERVIEW';
        if (view === 'standings') tab = 'STANDINGS';
        if (view === 'fixtures') tab = 'FIXTURES';
        if (view === 'bracket') tab = 'BRACKET';
        if (view === 'groups') tab = 'GROUPS';

        return (
            <div className="bg-slate-50 min-h-screen p-4">
                <TournamentDashboard
                    tournament={data.tournament}
                    organization={data.org}
                    onBack={() => { }} // No back button in embed
                    onStartMatch={() => { }} // Read-only usually
                    onGenerateFixtures={() => { }}
                    onAddGroup={() => { }}
                    onUpdateGroupTeams={() => { }}
                    onViewTeam={() => { }}
                    onViewMatch={() => { }}
                    embedMode={true}
                    initialTab={tab}
                    allOrganizations={orgs}
                />
            </div>
        );
    }

    if (view === 'player_search') {
        return (
            <div className="bg-slate-50 min-h-screen p-4">
                <PlayerRegistry
                    allPlayers={allPlayers}
                    allTeams={allTeams}
                    onViewPlayer={() => { }}
                    onBack={() => { }}
                />
            </div>
        );
    }

    if (view === 'team_list' && orgId) {
        const org = findOrg(orgId);
        if (!org) return <div className="p-8 text-center text-slate-500 font-bold">Organization not found</div>;

        const orgPlayers: any[] = org.memberTeams.flatMap(team =>
            team.players.map(p => ({ ...p, teamId: team.id, orgId: org.id }))
        );

        return (
            <div className="bg-slate-50 min-h-screen p-4">
                <OrganizationView
                    organization={org}
                    userRole="Guest"
                    onBack={() => { }}
                    onViewTournament={() => { }}
                    onViewPlayer={() => { }}
                    onRequestAddTeam={() => { }}
                    onRequestAddTournament={() => { }}
                    onUpdateOrg={(org) => { }}
                    onRemoveTeam={(id) => { }}
                    players={orgPlayers}
                    onViewTeam={() => { }}
                    isFollowed={false}
                    onToggleFollow={() => { }}
                    globalUsers={[]}
                    onAddMember={() => { }}
                    embedMode={true}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 text-slate-400 font-bold uppercase tracking-widest text-sm">
            <span>Invalid Embed Configuration</span>
            <span className="text-[10px] mt-2 opacity-70">Code: {view} | ID: {entityId}</span>
        </div>
    );
};
