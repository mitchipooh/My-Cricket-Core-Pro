
import React, { useState, useMemo } from 'react';
import { Organization, UserProfile, PlayerWithContext, OrgMember, OrgApplication, Team, Player, MatchFixture } from '../../types.ts';
import { Can } from '../common/Can.tsx';
import { PlayerProfileModal } from '../modals/PlayerProfileModal.tsx';
import { EditOrgModal } from '../modals/EditOrgModal.tsx';
import { BulkActionModal } from '../modals/BulkActionModal.tsx';
import { AddPlayerModal } from '../modals/AddPlayerModal.tsx';
import { UserProfileModal } from '../modals/UserProfileModal.tsx';
import { AddMemberModal } from '../modals/AddMemberModal.tsx';
import { GlobalTeamSearchModal } from '../modals/GlobalTeamSearchModal.tsx';
import { EditTeamModal } from '../modals/EditTeamModal.tsx';
import { EditTournamentModal } from '../modals/EditTournamentModal.tsx';
import { Tournament } from '../../types.ts';
import { CreateUserModal } from '../modals/CreateUserModal.tsx'; // NEW
import { AccessControlPanel } from './org/AccessControlPanel.tsx';
import { OrgSquadsTab } from './org/OrgSquadsTab.tsx';
import { OrgTournamentsTab } from './org/OrgTournamentsTab.tsx';
import { OrgFixturesTab } from './org/OrgFixturesTab.tsx';

interface OrganizationViewProps {
    organization: Organization;
    userRole: UserProfile['role'];
    onBack: () => void;
    onViewTournament: (id: string) => void;
    onViewPlayer: (player: PlayerWithContext) => void;
    onRequestAddTeam: () => void;
    onRequestAddTournament: () => void;
    players: PlayerWithContext[];
    onViewTeam: (teamId: string) => void;
    isFollowed: boolean;
    onToggleFollow: () => void;
    globalUsers: UserProfile[];
    onAddMember: (member: OrgMember) => void;
    onUpdateOrg?: (id: string, data: Partial<Organization>) => void;
    onRemoveTeam?: (orgId: string, teamId: string) => void;
    onRemoveTournament?: (orgId: string, tournamentId: string) => void;
    onUpdateTournament?: (orgId: string, tournamentId: string, data: Partial<Tournament>) => void;
    onRemoveFixture?: (orgId: string, fixtureId: string) => void; // ADDED
    onProcessApplication?: (orgId: string, appId: string, action: 'APPROVED' | 'REJECTED' | 'REVIEW', role?: 'Administrator' | 'Scorer' | 'Player' | 'Club') => void;
    allOrganizations?: Organization[];
    embedMode?: boolean;
    currentUserProfile?: UserProfile | null;
    onRequestCaptainHub?: () => void;
    onUpdateFixture?: (orgId: string, fixtureId: string, data: Partial<MatchFixture>) => void;
    onApplyForOrg?: (orgId: string) => void;
    onRequestAffiliation?: (targetOrgId: string, applicantOrg: Organization) => void;
    onSelectHubTeam?: (teamId: string) => void;
    onCreateUser?: (user: UserProfile, password: string) => Promise<{ success: boolean; userId?: string; error?: { message: string } }>; // UPDATED to async
}

type OrgTab = 'SQUADS' | 'PLAYERS' | 'TOURNAMENTS' | 'MEMBERS' | 'REQUESTS' | 'AFFILIATIONS' | 'OFFICIALS' | 'ACCESS' | 'ASSIGNMENTS' | 'MATCHES';

export const OrganizationView: React.FC<OrganizationViewProps> = ({
    organization, userRole, onBack, onViewTournament, onViewPlayer,
    onRequestAddTeam, onRequestAddTournament, players, onViewTeam,
    isFollowed, onToggleFollow, globalUsers, onAddMember, onUpdateOrg, onRemoveTeam, onRemoveTournament, onUpdateTournament, onRemoveFixture, onProcessApplication,
    allOrganizations = [], currentUserProfile, embedMode = false,
    onRequestCaptainHub, onSelectHubTeam, onUpdateFixture, onApplyForOrg, onRequestAffiliation,
    onCreateUser // NEW
}) => {
    const isClub = organization.type === 'CLUB';
    const [activeTab, setActiveTab] = useState<OrgTab>('SQUADS');
    const [playerSearch, setPlayerSearch] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithContext | null>(null);

    // Member Management State
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false); // NEW
    const [viewingMember, setViewingMember] = useState<OrgMember | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Bulk Actions & Team Management
    const [bulkAction, setBulkAction] = useState<'TEAMS' | 'PLAYERS' | null>(null);
    const [viewingActionsFor, setViewingActionsFor] = useState<OrgMember | null>(null);
    const [targetTeam, setTargetTeam] = useState<Team | null>(null);
    const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);

    // Global Team Search State
    const [isTeamSearchOpen, setIsTeamSearchOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

    // Direct Add Player by ID
    const [addPlayerId, setAddPlayerId] = useState('');

    // Application Approval State
    const [appToApprove, setAppToApprove] = useState<OrgApplication | null>(null);

    // Affiliation State
    const [affiliationSearch, setAffiliationSearch] = useState('');

    const pendingApps = useMemo(() => organization.applications?.filter(a => a.status === 'PENDING' || a.status === 'REVIEW') || [], [organization.applications]);

    const currentUserMember = useMemo(() => organization.members.find(m => m.userId === currentUserProfile?.id), [organization.members, currentUserProfile?.id]);

    // PERMISSION LOGIC UPDATE: Check Parent Orgs
    const isParentOrgAdmin = useMemo(() => {
        if (!currentUserProfile?.id) return false;
        // Find if current user is admin in ANY parent organization
        return allOrganizations
            .filter(o => organization.parentOrgIds?.includes(o.id))
            .some(parent => parent.members.some(m => m.userId === currentUserProfile.id && m.role === 'Administrator'));
    }, [allOrganizations, organization.parentOrgIds, currentUserProfile?.id]);

    const isOrgAdmin = (currentUserMember?.role === 'Administrator' && !currentUserMember.managedTeamId) || userRole === 'Administrator' || isParentOrgAdmin;
    const isTeamAdmin = currentUserMember?.role === 'Administrator' && !!currentUserMember.managedTeamId;
    const isCouncilAdmin = currentUserProfile?.handle === '@cz_admin';
    const isMainAdmin = organization.createdBy === currentUserProfile?.id || userRole === 'Administrator' || isParentOrgAdmin;
    const isUmpireAssociation = organization.type === 'UMPIRE_ASSOCIATION';

    const canEditTeam = (teamId: string) => {
        if (isCouncilAdmin || isOrgAdmin || isMainAdmin) return true;
        if (!organization.allowMemberEditing) return false;
        return currentUserMember?.managedTeamId === teamId;
    };


    // Resolve Affiliated Teams
    const affiliatedTeams = useMemo(() => {
        if (!organization.childOrgIds || organization.childOrgIds.length === 0) return [];
        const childOrgs = allOrganizations.filter(o => organization.childOrgIds?.includes(o.id));
        return childOrgs.flatMap(o => o.memberTeams.map(t => ({ ...t, orgName: o.name })));
    }, [organization.childOrgIds, allOrganizations]);

    // Derived Global Teams (for search)
    // Flatten all teams from all organizations to create a "Global Database" simulation
    // Ideally this would be fetched from a 'teams' table directly, but this works for client-side demo
    const globalTeams = useMemo(() => {
        return allOrganizations.flatMap(o => o.memberTeams);
    }, [allOrganizations]);

    // Officials Logic
    const officials = useMemo(() => organization.members.filter(m => m.role === 'Umpire' || m.role === 'Match Official'), [organization.members]);

    const getOfficialStats = (userId: string) => {
        return organization.fixtures.filter(f => f.umpires?.includes(userId)).length;
    };

    const handlePlayerClick = (p: PlayerWithContext) => {
        setSelectedPlayer(p);
        onViewPlayer(p);
    };

    const handleLinkTeam = (team: Team) => {
        if (!onUpdateOrg) return;

        // Check if already in this org
        if (organization.memberTeams.some(t => t.id === team.id)) {
            alert("This team is already in your organization.");
            return;
        }

        // Add to memberTeams
        const updatedTeams = [...organization.memberTeams, team];
        onUpdateOrg(organization.id, { memberTeams: updatedTeams });
        setIsTeamSearchOpen(false);
        alert(`${team.name} linked to ${organization.name} successfully!`);
    };

    const handleManualAddMember = (user: UserProfile, role: string, targetTeamId?: string) => {
        // 1. Add to Org Members
        const newMember: OrgMember = {
            userId: user.id,
            name: user.name,
            handle: user.handle,
            role: role as any,
            addedAt: Date.now()
        };

        // We need to use onUpdateOrg to persist this properly if we want to do both member + team update
        if (onUpdateOrg) {
            let updatedMembers = [...organization.members, newMember];
            let updatedTeams = organization.memberTeams;

            // 2. If Player and Team Selected, add to Squad
            if (role === 'Player' && targetTeamId) {
                const newPlayer: Player = {
                    id: user.id,
                    name: user.name,
                    role: user.playerDetails?.primaryRole || 'All-rounder',
                    photoUrl: user.avatarUrl,
                    stats: { runs: 0, wickets: 0, ballsFaced: 0, ballsBowled: 0, runsConceded: 0, matches: 0, catches: 0, runOuts: 0, stumpings: 0, fours: 0, sixes: 0, hundreds: 0, fifties: 0, ducks: 0, threeWickets: 0, fiveWickets: 0, maidens: 0 }
                };
                updatedTeams = updatedTeams.map(t => t.id === targetTeamId ? { ...t, players: [...t.players, newPlayer] } : t);
            }

            onUpdateOrg(organization.id, { members: updatedMembers, memberTeams: updatedTeams });
        } else {
            onAddMember(newMember);
        }
    };

    const finalizeApplication = (role?: 'Administrator' | 'Scorer' | 'Player' | 'Club') => {
        if (appToApprove && onProcessApplication) {
            onProcessApplication(organization.id, appToApprove.id, 'APPROVED', role);
            setAppToApprove(null);
        }
    };

    const handleAddSinglePlayer = (name: string, role: string) => {
        if (!onUpdateOrg || !targetTeam) return;

        const newPlayer: Player = {
            id: `pl-${Date.now()}`,
            name: name,
            role: role as any,
            stats: { runs: 0, wickets: 0, ballsFaced: 0, ballsBowled: 0, runsConceded: 0, matches: 0, catches: 0, runOuts: 0, stumpings: 0, fours: 0, sixes: 0, hundreds: 0, fifties: 0, ducks: 0, threeWickets: 0, fiveWickets: 0, maidens: 0 }
        };

        const updatedTeams = organization.memberTeams.map(t =>
            t.id === targetTeam.id ? { ...t, players: [...t.players, newPlayer] } : t
        );

        onUpdateOrg(organization.id, { memberTeams: updatedTeams });
        setTargetTeam(null);
    };

    const handleAddPlayerByID = () => {
        if (!onUpdateOrg || !addPlayerId) return;

        const user = globalUsers.find(u => u.id === addPlayerId);

        if (user) {
            if (organization.memberTeams.length === 0) {
                alert("Please create a team/squad first.");
                return;
            }
            const targetTeamId = organization.memberTeams[0].id;

            const newPlayer: Player = {
                id: user.id,
                name: user.name,
                role: user.playerDetails?.primaryRole || 'All-rounder',
                photoUrl: user.avatarUrl,
                stats: { runs: 0, wickets: 0, ballsFaced: 0, ballsBowled: 0, runsConceded: 0, matches: 0, catches: 0, runOuts: 0, stumpings: 0, fours: 0, sixes: 0, hundreds: 0, fifties: 0, ducks: 0, threeWickets: 0, fiveWickets: 0, maidens: 0 }
            };

            const updatedTeams = organization.memberTeams.map(t =>
                t.id === targetTeamId ? { ...t, players: [...t.players, newPlayer] } : t
            );

            onUpdateOrg(organization.id, { memberTeams: updatedTeams });
            setAddPlayerId('');
            alert(`${user.name} added to ${organization.memberTeams[0].name}.`);
        } else {
            alert("User ID not found in global directory.");
        }
    };

    const handleBulkData = (data: string[]) => {
        if (!onUpdateOrg) return;

        if (bulkAction === 'TEAMS') {
            const newTeams = data.map(name => ({
                id: `tm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                name: name.trim(),
                players: []
            }));
            const updatedMemberTeams = [...organization.memberTeams, ...newTeams];
            onUpdateOrg(organization.id, { memberTeams: updatedMemberTeams });
        } else if (bulkAction === 'PLAYERS') {
            let targetId = targetTeam?.id;

            if (!targetId) {
                if (organization.memberTeams.length === 0) {
                    const newTeam = { id: `tm-gen-${Date.now()}`, name: 'General Squad', players: [] };
                    organization.memberTeams.push(newTeam);
                    targetId = newTeam.id;
                } else {
                    targetId = organization.memberTeams[0].id;
                }
            }

            const newPlayers = data.map((line, idx) => {
                const [name, roleRaw] = line.split('-').map(s => s.trim());
                const role = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'].includes(roleRaw) ? roleRaw : 'All-rounder';

                return {
                    id: `pl-bulk-${Date.now()}-${idx}`,
                    name: name,
                    role: role as any,
                    stats: { runs: 0, wickets: 0, ballsFaced: 0, ballsBowled: 0, runsConceded: 0, matches: 0, catches: 0, runOuts: 0, stumpings: 0, fours: 0, sixes: 0, hundreds: 0, fifties: 0, ducks: 0, threeWickets: 0, fiveWickets: 0, maidens: 0 }
                };
            });

            const updatedTeams = organization.memberTeams.map(t =>
                t.id === targetId ? { ...t, players: [...t.players, ...newPlayers] } : t
            );

            onUpdateOrg(organization.id, { memberTeams: updatedTeams });
        }
        setBulkAction(null);
        setTargetTeam(null);
    };

    // Default tabs for everyone (Squads usually restricted to view own, Tournaments read-only)
    let availableTabs: OrgTab[] = ['SQUADS', 'MATCHES', 'TOURNAMENTS'];

    // Org Admins get full access
    if (isOrgAdmin || isMainAdmin || isCouncilAdmin) {
        availableTabs = ['SQUADS', 'PLAYERS', 'TOURNAMENTS', 'MEMBERS', 'OFFICIALS', 'REQUESTS'];
        if (isMainAdmin || isCouncilAdmin) {
            availableTabs.push('AFFILIATIONS');
            availableTabs.push('ACCESS');
        }
    } else {
        // Team Admins / Players: Strictly SQUADS and TOURNAMENTS only
        // Ensure PLAYERS tab is NOT included here
    }

    if (isUmpireAssociation && (isOrgAdmin || isMainAdmin || isCouncilAdmin)) {
        availableTabs.push('ASSIGNMENTS');
    }

    const parentOrgs = allOrganizations.filter(o => organization.parentOrgIds?.includes(o.id));

    const incomingAffiliations = pendingApps.filter(a => a.type === 'ORG_AFFILIATE');
    const userRequests = pendingApps.filter(a => a.type === 'USER_JOIN' || a.type === 'PLAYER_CLAIM');

    // Helper to find player name for claims
    const getTargetPlayerName = (playerId?: string) => {
        if (!playerId) return 'Unknown Profile';
        const p = organization.memberTeams.flatMap(t => t.players).find(p => p.id === playerId);
        return p?.name || 'Unknown Profile';
    };

    const isLockdown = organization.allowMemberEditing === false &&
        !allOrganizations.filter(o => organization.parentOrgIds?.includes(o.id))
            .some(parent => parent.members.some(m => m.userId === currentUserProfile?.id && m.role === 'Administrator'));

    const isCaptain = currentUserProfile?.role === 'Captain' || organization.members.some(m => m.userId === currentUserProfile?.id && m.role === 'Captain');
    const isCoach = currentUserProfile?.role === 'Coach' || organization.members.some(m => m.userId === currentUserProfile?.id && m.role === 'Coach');
    const isPlayer = currentUserProfile?.role === 'Player';

    const myTeamId = React.useMemo(() => {
        // ... (rest of logic)
        // If the user has a managedTeamId, prioritize that.
        if (currentUserProfile?.managedTeamId) return currentUserProfile.managedTeamId;
        // Fallback: Check if they are a captain/player in the roster manually (less reliable if duplicates exist)
        const memberRef = organization.memberTeams.find(t => t.players.some(p => p.email === currentUserProfile?.email)); // Using email/id match
        return memberRef?.id;
    }, [currentUserProfile, organization.memberTeams]);

    const myTeam = React.useMemo(() => organization.memberTeams.find(t => t.id === myTeamId), [organization.memberTeams, myTeamId]);
    const needsTeamAssignment = (isTeamAdmin || isCaptain || isCoach) && !isOrgAdmin && !myTeamId;

    const [focusMyTeam, setFocusMyTeam] = useState(false);

    // Auto-view my team if I am a team admin and not browsing
    React.useEffect(() => {
        if (myTeamId && (isTeamAdmin || isCaptain || isCoach) && !isOrgAdmin && activeTab === 'SQUADS') {
            // We don't setViewingTeam here to avoid loops, but we conditionally render below
        }
        // For Admins with teams, if they click the button, we focus
    }, [myTeamId, isTeamAdmin, isCaptain, isCoach, isOrgAdmin, activeTab]);

    return (
        <div className="animate-in slide-in-from-right-8 duration-500 max-w-[100vw] overflow-x-hidden">
            {isLockdown && (
                <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 mb-4 rounded-r shadow-sm flex items-center gap-3">
                    <span className="text-xl">🔒</span>
                    <div>
                        <p className="font-bold text-sm">Organization Locked</p>
                        <p className="text-xs">Your governing body has restricted editing for this organization. You cannot add or remove players/teams at this time.</p>
                    </div>
                </div>
            )}

            {/* CAPTAIN'S HUB WELCOME / TEAM LINKING */}
            {needsTeamAssignment && activeTab === 'SQUADS' && (
                <div className="bg-indigo-900 rounded-[2.5rem] p-12 text-center text-white mb-8 shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="text-5xl mb-4">👋</div>
                        <h2 className="text-3xl font-black mb-2">Welcome, Captain!</h2>
                        <p className="text-indigo-200 text-sm font-bold uppercase tracking-widest mb-8">Please link your account to your squad to verify your roster.</p>
                        <button
                            onClick={() => setIsTeamSearchOpen(true)}
                            className="bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl hover:scale-105"
                        >
                            🔗 Select My Team
                        </button>
                    </div>
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -ml-16 -mb-16"></div>
                </div>
            )}

            <UserProfileModal member={viewingMember} isOpen={!!viewingMember} onClose={() => setViewingMember(null)} allOrganizations={allOrganizations} />

            {/* ... Modals ... */}
            <AddMemberModal
                isOpen={isAddMemberModalOpen}
                onClose={() => setIsAddMemberModalOpen(false)}
                globalUsers={globalUsers}
                orgTeams={organization.memberTeams}
                existingMemberIds={organization.members.map(m => m.userId)}
                onAdd={handleManualAddMember}
            />

            {/* Global Team Search Modal */}
            <GlobalTeamSearchModal
                isOpen={isTeamSearchOpen}
                onClose={() => setIsTeamSearchOpen(false)}
                allTeams={globalTeams}
                onSelectTeam={(team) => {
                    // Logic to link team to current user if self-assigning
                    if (needsTeamAssignment && onUpdateOrg) {
                        handleLinkTeam(team);
                        const updatedMembers = organization.members.map(m =>
                            m.userId === currentUserProfile?.id ? { ...m, role: 'Captain' as const, managedTeamId: team.id } : m
                        );
                        onUpdateOrg(organization.id, { members: updatedMembers } as any);
                    } else {
                        handleLinkTeam(team);
                    }
                }}
                currentOrgName={organization.name}
            />

            {editingTeam && onUpdateOrg && (
                <EditTeamModal
                    team={editingTeam}
                    onClose={() => setEditingTeam(null)}
                    onSave={(updates) => {
                        const updatedTeams = organization.memberTeams.map(t =>
                            t.id === editingTeam.id ? { ...t, ...updates } : t
                        );
                        onUpdateOrg(organization.id, { memberTeams: updatedTeams });
                    }}
                    onDelete={() => {
                        if (onRemoveTeam) {
                            onRemoveTeam(organization.id, editingTeam.id);
                        } else {
                            const updatedTeams = organization.memberTeams.filter(t => t.id !== editingTeam.id);
                            onUpdateOrg(organization.id, { memberTeams: updatedTeams });
                        }
                    }}
                />
            )}

            <PlayerProfileModal
                isOpen={!!selectedPlayer}
                player={selectedPlayer}
                onClose={() => setSelectedPlayer(null)}
                isFollowed={false}
                onToggleFollow={() => { }}
                allFixtures={organization.fixtures}
                onUpdatePlayer={selectedPlayer && (isCouncilAdmin || canEditTeam(selectedPlayer.teamId)) && onUpdateOrg ? (updatedPlayer) => {
                    const teams = organization.memberTeams.map(t => {
                        if (t.id === selectedPlayer?.teamId) {
                            return {
                                ...t,
                                players: t.players.map(p => p.id === selectedPlayer.id ? { ...p, ...updatedPlayer } : p)
                            };
                        }
                        return t;
                    });
                    onUpdateOrg(organization.id, { memberTeams: teams });
                    setSelectedPlayer(prev => prev ? { ...prev, ...updatedPlayer } : null);
                } : undefined}
                onDeletePlayer={selectedPlayer && (isCouncilAdmin || canEditTeam(selectedPlayer.teamId)) && onUpdateOrg ? (playerId) => {
                    const teams = organization.memberTeams.map(t => {
                        if (t.id === selectedPlayer?.teamId) {
                            return {
                                ...t,
                                players: t.players.filter(p => p.id !== playerId)
                            };
                        }
                        return t;
                    });
                    onUpdateOrg(organization.id, { memberTeams: teams });
                    setSelectedPlayer(null);
                } : undefined}
            />

            {isEditModalOpen && onUpdateOrg && (
                <EditOrgModal
                    organization={organization}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={onUpdateOrg}
                    currentUserProfile={currentUserProfile}
                />
            )}

            {editingTournament && onUpdateTournament && onRemoveTournament && (
                <EditTournamentModal
                    tournament={editingTournament}
                    onClose={() => setEditingTournament(null)}
                    onSave={(data) => {
                        onUpdateTournament(organization.id, editingTournament.id, data);
                        setEditingTournament(null);
                    }}
                    onDelete={() => {
                        onRemoveTournament(organization.id, editingTournament.id);
                        setEditingTournament(null);
                    }}
                />
            )}

            {bulkAction && (
                <BulkActionModal
                    isOpen={true}
                    mode={bulkAction}
                    onClose={() => { setBulkAction(null); setTargetTeam(null); }}
                    onConfirm={handleBulkData}
                    currentUserPassword={currentUserProfile?.password}
                />
            )}

            <AddPlayerModal
                isOpen={isAddPlayerModalOpen}
                teamName={targetTeam?.name || ''}
                onClose={() => { setIsAddPlayerModalOpen(false); setTargetTeam(null); }}
                onSave={handleAddSinglePlayer}
            />

            {!embedMode && (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-start mb-6 md:mb-8 gap-4">
                        <div className="flex items-center gap-3 md:gap-5 w-full">
                            <button onClick={onBack} className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50 hover:text-black transition-all shadow-sm flex-none">←</button>
                            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                                <div className="w-14 h-14 md:w-16 md:h-16 bg-white p-1 rounded-xl shadow-md border border-slate-100 flex-none">
                                    {organization.logoUrl ? (
                                        <img src={organization.logoUrl} className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center font-black text-slate-300 text-xl">{organization.name.charAt(0)}</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight truncate">{organization.name}</h1>
                                        {isClub && <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[7px] md:text-[8px] font-black uppercase tracking-widest align-middle whitespace-nowrap">Club</span>}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            📊 {organization.memberTeams.length + affiliatedTeams.length} Squads
                                        </p>
                                        {organization.establishedYear && (
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                🗓️ Est. {organization.establishedYear}
                                            </p>
                                        )}
                                        {(organization.address || organization.groundLocation) && (
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 truncate">
                                                📍 {organization.address || organization.groundLocation}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto justify-start md:justify-end flex-wrap">
                            {(myTeam || (isTeamAdmin || isOrgAdmin) && onRequestCaptainHub) && (
                                <button
                                    onClick={() => {
                                        if (isOrgAdmin && myTeam) {
                                            setFocusMyTeam(!focusMyTeam);
                                            setActiveTab('SQUADS');
                                        } else if (onRequestCaptainHub) {
                                            onRequestCaptainHub();
                                        }
                                    }}
                                    className={`px-4 py-2.5 rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-widest transition-all shadow-md ${focusMyTeam ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                                >
                                    {focusMyTeam ? 'Org View 🏢' : 'Team Hub ⚡'}
                                </button>
                            )}
                            {isOrgAdmin && onUpdateOrg && !isTeamAdmin && (
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center text-lg transition-all"
                                    title="Settings"
                                >
                                    ⚙️
                                </button>
                            )}
                            <button onClick={onToggleFollow} className={`px-4 py-2.5 rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-widest transition-all whitespace-nowrap ${isFollowed ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                                {isFollowed ? `Following` : `Follow`}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-1 rounded-xl flex w-full gap-1 mb-6 md:mb-8 border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
                        {availableTabs.map(tab => {
                            const count = tab === 'REQUESTS' ? userRequests.length : tab === 'AFFILIATIONS' ? incomingAffiliations.length : 0;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-none px-4 md:px-6 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
                                >
                                    {tab === 'TOURNAMENTS' && isClub ? 'LEAGUES' : tab}
                                    {count > 0 && (
                                        <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[8px]">{count}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            <OrgTournamentsTab
                organization={organization}
                isClub={isClub}
                isOrgAdmin={isOrgAdmin}
                isActive={activeTab === 'TOURNAMENTS'}
                onRequestAddTournament={onRequestAddTournament}
                onViewTournament={onViewTournament}
                onUpdateTournament={onUpdateTournament}
                onRemoveTournament={onRemoveTournament}
                setEditingTournament={setEditingTournament}
            />

            <OrgFixturesTab
                organization={organization}
                isActive={activeTab === 'MATCHES'}
                onUpdateFixture={onUpdateFixture}
            />

            <OrgSquadsTab
                organization={organization}
                isMainAdmin={isMainAdmin}
                isCouncilAdmin={isCouncilAdmin}
                isOrgAdmin={isOrgAdmin}
                isLockdown={isLockdown}
                isActive={activeTab === 'SQUADS'}
                focusMyTeam={focusMyTeam}
                myTeam={myTeam}
                isClub={isClub}
                affiliatedTeams={affiliatedTeams}
                onLinkTeam={() => setIsTeamSearchOpen(true)}
                onBulkAddTeams={() => setBulkAction('TEAMS')}
                onRequestAddTeam={onRequestAddTeam}
                onViewTeam={onViewTeam}
                onRemoveTeam={onRemoveTeam}
                onUpdateOrg={onUpdateOrg}
                onSelectHubTeam={onSelectHubTeam}
                onAddPlayer={(team) => { setTargetTeam(team); setIsAddPlayerModalOpen(true); }}
                onBulkImportPlayers={(team) => { setTargetTeam(team); setBulkAction('PLAYERS'); }}
                onEditTeam={setEditingTeam}
                canEditTeam={canEditTeam}
            />


            {
                activeTab === 'PLAYERS' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4">
                            <div className="flex gap-2">
                                <input value={playerSearch} onChange={e => setPlayerSearch(e.target.value)} placeholder={`Search ${isClub ? 'club' : 'organizational'} roster...`} className="flex-1 bg-slate-50 border-none outline-none p-4 rounded-xl font-bold text-sm" />
                                {isOrgAdmin && (
                                    <button onClick={() => setBulkAction('PLAYERS')} className="bg-slate-900 text-white px-6 py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-700 shadow-lg">Bulk Import</button>
                                )}
                            </div>
                            {isOrgAdmin && (
                                <div className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                                    <input
                                        value={addPlayerId}
                                        onChange={e => setAddPlayerId(e.target.value)}
                                        placeholder="Add Player by User ID..."
                                        className="flex-1 bg-white border-none outline-none px-4 py-3 rounded-lg font-mono text-xs"
                                    />
                                    <button onClick={handleAddPlayerByID} className="bg-indigo-600 text-white px-4 py-3 rounded-lg font-black uppercase text-xs tracking-widest hover:bg-indigo-500">Add</button>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {players.filter(p => p.name.toLowerCase().includes(playerSearch.toLowerCase())).map(p => (
                                <div key={p.id} onClick={() => handlePlayerClick(p)} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm cursor-pointer hover:border-indigo-400 transition-all flex items-center gap-4 group hover:shadow-lg">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-lg overflow-hidden border border-slate-200 group-hover:border-indigo-300"><img src={p.photoUrl || `https://ui-avatars.com/api/?name=${p.name}&background=random`} alt={p.name} className="w-full h-full object-cover" /></div>
                                    <div><div className="font-black text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{p.name}</div><div className="text-[10px] font-bold text-slate-400 uppercase">{p.teamName}</div><div className="text-[9px] font-bold text-indigo-400 uppercase mt-0.5">{p.role}</div></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* MEMBERS TAB */}
            {
                activeTab === 'MEMBERS' && (
                    <div className="space-y-8 animate-in fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Registered Members</h3>
                            {isOrgAdmin && (
                                <div className="flex gap-2">
                                    {onCreateUser && (
                                        <button
                                            onClick={() => setIsCreateUserModalOpen(true)}
                                            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-500 shadow-lg transition-all"
                                        >
                                            + Create User
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsAddMemberModalOpen(true)}
                                        className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-700 shadow-lg transition-all"
                                    >
                                        Add Existing
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Create User Modal */}
                        {isCreateUserModalOpen && onCreateUser && (
                            <CreateUserModal
                                isOpen={true}
                                onClose={() => setIsCreateUserModalOpen(false)}
                                onCreate={async (user, password) => {
                                    try {
                                        console.log("Creating user...", user);

                                        // 1. Create global user with auth
                                        const result = await onCreateUser(user, password);

                                        if (!result.success) {
                                            alert(`Failed to create user: ${result.error?.message || 'Unknown error'}`);
                                            return;
                                        }

                                        // 2. Add as member to this org automatically
                                        const createdUser = { ...user, id: result.userId! };
                                        handleManualAddMember(createdUser, user.role);

                                        setIsCreateUserModalOpen(false);
                                        alert(`User ${user.handle} created successfully!\n\nPassword: ${password}\n\nThey can now sign in with their handle and password.`);
                                    } catch (err: any) {
                                        console.error("User creation failed:", err);
                                        alert(`Failed to create user: ${err.message || 'Unknown error'}`);
                                    }
                                }}
                                organizationName={organization.name}
                            />
                        )}

                        {/* Group members by role for clearer display */}
                        {['Administrator', 'Captain', 'Scorer', 'Umpire', 'Coach', 'Player'].map(role => {
                            const roleMembers = organization.members.filter(m => m.role === role);
                            if (roleMembers.length === 0) return null;

                            return (
                                <div key={role} className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">{role}s</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {roleMembers.map(member => (
                                            <div
                                                key={member.userId}
                                                onClick={() => setViewingMember(member)}
                                                className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-indigo-300 transition-all group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-md ${role === 'Administrator' ? 'bg-purple-600' :
                                                        role === 'Scorer' ? 'bg-teal-500' :
                                                            role === 'Umpire' ? 'bg-amber-500' :
                                                                role === 'Captain' ? 'bg-indigo-600' :
                                                                    'bg-slate-800'
                                                        }`}>
                                                        {member.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{member.name}</h4>
                                                        <p className="text-xs font-bold text-slate-400">{member.handle}</p>
                                                    </div>
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
                                                    View
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {organization.members.length === 0 && (
                            <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold uppercase text-xs">
                                No members found. Add some to get started.
                            </div>
                        )}
                    </div>
                )
            }

            {/* REQUESTS TAB */}
            {
                activeTab === 'REQUESTS' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Pending Applications</h3>
                        </div>
                        {userRequests.length === 0 ? (
                            <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold uppercase text-xs">
                                No pending membership requests.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {userRequests.map(app => (
                                    <div key={app.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center font-black text-slate-400">
                                                {app.applicantImage ? <img src={app.applicantImage} className="w-full h-full object-cover" /> : app.applicantName.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900">{app.applicantName}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{app.applicantHandle || '@user'}</p>
                                                {app.type === 'PLAYER_CLAIM' && (
                                                    <div className="mt-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                                                        <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5">Claiming Profile</p>
                                                        <p className="text-xs font-black text-indigo-700">{getTargetPlayerName(app.targetPlayerId)}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setAppToApprove(app)} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/20">Accept</button>
                                            <button onClick={() => onProcessApplication?.(organization.id, app.id, 'REJECTED')} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Decline</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )
            }

            {/* AFFILIATIONS TAB */}
            {
                activeTab === 'AFFILIATIONS' && (
                    <div className="space-y-6 animate-in fade-in">
                        {/* Outgoing Requests / Find Zone */}
                        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <h3 className="text-xl font-black mb-2">Connect with Zone</h3>
                                    <p className="text-xs text-indigo-200 font-bold uppercase tracking-widest max-w-md">
                                        Link your {organization.type === 'UMPIRE_ASSOCIATION' ? 'association' : 'club'} to a governing body to receive official fixtures.
                                    </p>
                                </div>
                                <div className="w-full md:w-auto relative">
                                    <input
                                        type="text"
                                        placeholder="Search Governing Bodies..."
                                        className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm font-bold placeholder-indigo-300 w-full md:w-64 focus:bg-white/20 transition-all outline-none"
                                        value={affiliationSearch}
                                        onChange={(e) => setAffiliationSearch(e.target.value)}
                                    />
                                    <span className="absolute right-4 top-3.5 text-indigo-300">🔍</span>
                                </div>
                            </div>

                            {/* Search Results */}
                            {affiliationSearch && (
                                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-2">
                                    {allOrganizations
                                        .filter(o => o.type === 'GOVERNING_BODY' && !organization.parentOrgIds?.includes(o.id))
                                        .filter(o => o.name.toLowerCase().includes(affiliationSearch.toLowerCase()))
                                        .slice(0, 4)
                                        .map(org => {
                                            const hasPendingApp = organization.applications?.some(a => a.type === 'ORG_AFFILIATE' && a.applicantId === org.id && a.status === 'PENDING') // Wait, this is for incoming. For outgoing, we need to check if WE have applied to THEM.
                                            // Actually, the application lives on the TARGET org (the parent).
                                            // So we actually don't know easily if we have a pending application unless we check ALL orgs or if we keep track of outgoing apps.
                                            // In App.tsx handleRequestAffiliation, we added the app to the TARGET org.
                                            // We did NOT add it to the Applicant org.
                                            // So the Applicant org has no record of the pending application unless we read all organizations and check their applications.

                                            // Let's use allOrganizations to check.
                                            const pendingOnTarget = allOrganizations.find(o => o.id === org.id)?.applications?.some(a => a.type === 'ORG_AFFILIATE' && a.applicantId === organization.id && a.status === 'PENDING');

                                            return (
                                                <div key={org.id} className="bg-white/10 border border-white/10 p-4 rounded-xl flex items-center justify-between hover:bg-white/20 transition-all">
                                                    <div>
                                                        <div className="font-black">{org.name}</div>
                                                        <div className="text-[10px] uppercase tracking-widest text-indigo-300">{org.country || 'Global'}</div>
                                                    </div>
                                                    {pendingOnTarget ? (
                                                        <button
                                                            disabled
                                                            className="bg-white/50 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-not-allowed"
                                                        >
                                                            Pending...
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => onRequestAffiliation?.(org.id, organization)}
                                                            className="bg-white text-indigo-900 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                                        >
                                                            Request Link
                                                        </button>
                                                    )}
                                                </div>
                                            )
                                        })
                                    }
                                    {allOrganizations.filter(o => o.type === 'GOVERNING_BODY' && o.name.toLowerCase().includes(affiliationSearch.toLowerCase())).length === 0 && (
                                        <div className="col-span-full text-center text-indigo-300 text-xs font-bold uppercase py-4">No governing bodies found matching "{affiliationSearch}"</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* List of Current Affiliations */}
                        {organization.parentOrgIds && organization.parentOrgIds.length > 0 && (
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-200">
                                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Active Affiliations</h3>
                                <div className="flex flex-wrap gap-4">
                                    {allOrganizations.filter(o => organization.parentOrgIds?.includes(o.id)).map(parent => (
                                        <div key={parent.id} className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl flex items-center gap-3">
                                            <span className="text-lg">🏛️</span>
                                            <span className="font-black text-indigo-900 text-sm">{parent.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-4 pt-6 border-t border-slate-100">
                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Incoming Organization Ties</h3>
                        </div>
                        {incomingAffiliations.length === 0 ? (
                            <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold uppercase text-xs">
                                No pending affiliation requests.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {incomingAffiliations.map(app => (
                                    <div key={app.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xl">
                                                🤝
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900">{app.applicantName}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wants to affiliate</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => onProcessApplication?.(organization.id, app.id, 'APPROVED')} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20">Grant Affiliation</button>
                                            <button onClick={() => onProcessApplication?.(organization.id, app.id, 'REJECTED')} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Decline</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )
            }

            {/* OFFICIALS TAB */}
            {
                activeTab === 'OFFICIALS' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Official Panel</h3>
                            {isOrgAdmin && (
                                <button
                                    onClick={() => setIsAddMemberModalOpen(true)}
                                    className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-700"
                                >
                                    + Register Official
                                </button>
                            )}
                        </div>
                        {officials.length === 0 ? (
                            <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold uppercase text-xs">
                                No officials registered. Use the 'Add Member' feature to add Umpires.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {officials.map(member => (
                                    <div
                                        key={member.userId}
                                        onClick={() => setViewingMember(member)}
                                        className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-indigo-300 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg">
                                                {member.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900">{member.name}</h4>
                                                <p className="text-xs font-bold text-slate-400">{member.role}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-indigo-600">{getOfficialStats(member.userId)}</div>
                                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Games</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )
            }

            {/* ACCESS CONTROL TAB */}
            {
                activeTab === 'ACCESS' && (
                    <AccessControlPanel
                        organization={organization}
                        onUpdateOrg={onUpdateOrg}
                        isParentAdmin={allOrganizations.filter(o => organization.parentOrgIds?.includes(o.id))
                            .some(parent => parent.members.some(m => m.userId === currentUserProfile?.id && m.role === 'Administrator'))
                        }
                        isMainAdmin={isMainAdmin}
                        isOrgAdmin={isOrgAdmin}
                    />
                )
            }

            {/* ASSIGNMENTS TAB (Umpire Associations Only) */}
            {
                activeTab === 'ASSIGNMENTS' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="bg-slate-900 text-white p-6 rounded-[2rem] mb-6">
                            <h3 className="text-xl font-black mb-2">Officiating Assignments</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Assign your officials to affiliated matches</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {allOrganizations
                                .filter(o => organization.parentOrgIds?.includes(o.id))
                                .flatMap(o => o.fixtures.map(f => ({ ...f, orgName: o.name, orgId: o.id })))
                                .filter(f => f.status !== 'Completed')
                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                .map(fixture => (
                                    <div key={fixture.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded text-slate-500">{fixture.orgName}</span>
                                                <span className="text-[9px] font-bold text-slate-400">{new Date(fixture.date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="font-black text-slate-900">{fixture.teamAName} vs {fixture.teamBName}</div>
                                            <div className="text-xs text-slate-400 font-bold uppercase mt-1">
                                                {fixture.umpires && fixture.umpires.length > 0 ? (
                                                    <span className="text-emerald-600 flex items-center gap-1">
                                                        ✓ {fixture.umpires.length} Assigned
                                                        <span className="text-slate-400 font-normal normal-case">
                                                            ({organization.members.filter(m => fixture.umpires?.includes(m.userId)).map(m => m.name).join(', ')})
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <span className="text-amber-500">⚠ Unassigned</span>
                                                )}
                                            </div>
                                        </div>

                                        {isOrgAdmin && (
                                            <div className="flex items-center gap-2">
                                                <select
                                                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500"
                                                    onChange={(e) => {
                                                        if (e.target.value && onUpdateFixture) {
                                                            const currentUmpires = fixture.umpires || [];
                                                            if (!currentUmpires.includes(e.target.value)) {
                                                                onUpdateFixture(fixture.orgId, fixture.id, { umpires: [...currentUmpires, e.target.value] });
                                                            }
                                                        }
                                                    }}
                                                    value=""
                                                >
                                                    <option value="">+ Assign Official</option>
                                                    {officials.map(off => (
                                                        <option key={off.userId} value={off.userId} disabled={fixture.umpires?.includes(off.userId)}>
                                                            {off.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>
                )
            }

            {/* Role Selection / Approval Modal */}
            {appToApprove && (
                <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-xl font-black text-slate-900 mb-2">Accept Application</h3>
                        <p className="text-slate-500 text-xs mb-6">Approve <span className="font-bold text-slate-900">{appToApprove.applicantName}</span>. They will be notified.</p>
                        <div className="space-y-3">
                            <button onClick={() => finalizeApplication('Player')} className="w-full p-4 rounded-xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group">
                                <div className="font-black text-slate-900 group-hover:text-indigo-700">Add as Player</div>
                                <div className="text-[10px] text-slate-400 group-hover:text-indigo-600/70">Assign to team roster.</div>
                            </button>
                            <button onClick={() => finalizeApplication('Scorer')} className="w-full p-4 rounded-xl border-2 border-slate-100 hover:border-teal-500 hover:bg-teal-50 transition-all text-left group">
                                <div className="font-black text-slate-900 group-hover:text-teal-700">Scorer / Staff</div>
                                <div className="text-[10px] text-slate-400 group-hover:text-teal-600/70">Can score matches.</div>
                            </button>
                            <button onClick={() => finalizeApplication('Club')} className="w-full p-4 rounded-xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group">
                                <div className="font-black text-slate-900 group-hover:text-emerald-700">Add as Club / Team</div>
                                <div className="text-[10px] text-slate-400 group-hover:text-emerald-600/70">Create new team & assign admin.</div>
                            </button>
                        </div>
                        <button onClick={() => setAppToApprove(null)} className="mt-6 w-full py-3 text-slate-400 font-black uppercase text-xs hover:text-slate-600">Cancel</button>
                    </div>
                </div>
            )}
            {/* Edit Member/Role Modal */}
            {viewingMember && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-black text-slate-400">
                                {viewingMember.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900">{viewingMember.name}</h3>
                                <p className="text-sm font-bold text-slate-400">{viewingMember.handle}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Current Role</label>
                                <div className="p-4 bg-slate-50 rounded-xl font-bold text-slate-900 border border-slate-100">
                                    {viewingMember.role}
                                </div>
                            </div>

                            {isOrgAdmin && viewingMember.role !== 'Administrator' && ( /* Prevent demoting self if only admin? Simplified for now */
                                <div>
                                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-2">Change Role To</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Administrator', 'Scorer', 'Umpire', 'Coach', 'Player', 'Captain'].filter(r => r !== viewingMember.role).map(role => (
                                            <button
                                                key={role}
                                                onClick={() => {
                                                    // Update logic
                                                    if (onUpdateOrg) { // Using onUpdateOrg to simulate member update for now, ideally needs a specific API
                                                        // In a real app this would be a dedicated updateMember call
                                                        // For now, we'll alert as this requires backend wiring deeper than UI
                                                        alert(`Role change for ${viewingMember.name} to ${role} would happen here. (Backend Hook Needed)`);
                                                    }
                                                }}
                                                className="py-3 px-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:border-indigo-500 hover:text-indigo-600 transition-all"
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-slate-100">
                                <button onClick={() => setViewingMember(null)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-xs">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
