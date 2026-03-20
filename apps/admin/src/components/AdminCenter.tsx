
/**
 * Cricket-Core 2026 Management System
 * Created by mitchipoohdevs
 */

import React, { useState, useMemo } from 'react';
import { Organization, MatchFixture, UserProfile, Team, Player, Tournament, TournamentFormat, PlayerWithContext, Group, MediaPost, OrgMember, GameIssue } from '../../types.ts';
import { generateRoundRobin } from '../../utils/cricket-engine.ts';
import { GlobalDashboard } from '../dashboard/GlobalDashboard.tsx';
import { OrganizationView } from '../dashboard/OrganizationView.tsx';
import { DEFAULT_POINTS_CONFIG, PRESET_TEST } from '../../competition/pointsEngine.ts';
import { TournamentDashboard } from '../dashboard/TournamentDashboard.tsx';
import { DeleteOrgModal } from '../modals/DeleteOrgModal.tsx';
import { HRPortal } from './HRPortal.tsx';
import { TransferMarket } from '../market/TransferMarket.tsx';
import { SponsorManager } from './SponsorManager.tsx';
import { CreateOrgModal } from '../modals/CreateOrgModal.tsx';
import { IssueResolutionModal } from '../modals/IssueResolutionModal.tsx';
import { EmbedCodeModal } from '../modals/EmbedCodeModal.tsx';

interface AdminProps {
  organizations: Organization[];
  standaloneMatches: MatchFixture[];
  userRole: UserProfile['role'];
  onStartMatch: (match: MatchFixture) => void;
  onViewMatch: (match: MatchFixture) => void;
  onRequestSetup: () => void;
  onUpdateOrgs: (orgs: Organization[]) => void;
  onCreateOrg: (orgData: Partial<Organization>) => void;
  onAddTeam: (orgId: string, teamData: Omit<Team, 'id'>) => void;
  onRemoveTeam?: (orgId: string, teamId: string) => void;
  onRemoveTournament?: (orgId: string, tournamentId: string) => void;
  onUpdateTournament?: (orgId: string, tournamentId: string, data: Partial<Tournament>) => void;
  onUpdateFixture?: (orgId: string, fixtureId: string, data: Partial<MatchFixture>) => void;
  onRemoveFixture?: (orgId: string, fixtureId: string) => void;
  allOrganizations?: Organization[];
  onBulkAddPlayers: (teamId: string, newPlayers: Player[]) => void;
  onAddGroup: (orgId: string, groupName: string) => void;
  onUpdateGroupTeams: (orgId: string, groupId: string, teamIds: string[]) => void;
  onAddTournament: (orgId: string, tournament: Tournament) => void;
  mediaPosts: MediaPost[];
  onAddMediaPost: (post: MediaPost) => void;
  onViewTeam: (teamId: string) => void;
  onOpenMediaStudio: () => void;
  following: { teams: string[], players: string[], orgs: string[] };
  onToggleFollow: (type: 'TEAM' | 'PLAYER' | 'ORG', id: string) => void;
  mockGlobalUsers?: UserProfile[];
  onAddMemberToOrg?: (orgId: string, member: OrgMember) => void;
  onProcessApplication?: (orgId: string, appId: string, action: 'APPROVED' | 'REJECTED' | 'REVIEW', role?: 'Administrator' | 'Scorer' | 'Player') => void;
  hireableScorers?: UserProfile[];
  currentUserId?: string;
  onApplyForOrg?: (orgId: string) => void;
  onUpgradeProfile?: () => void;
  onTransferPlayer?: (playerId: string, toTeamId: string) => void;
  currentUserProfile?: UserProfile | null;
  showCaptainHub?: boolean;
  onOpenCaptainHub?: () => void;
  onRequestMatchReports?: () => void;
  onUpdateProfile?: (profile: UserProfile) => void;
  onRequestTransferMarket?: () => void;
  issues?: GameIssue[];
  onUpdateIssues?: (issues: GameIssue[]) => void;
  onSelectHubTeam?: (teamId: string) => void;
  onRequestAffiliation?: (targetOrgId: string, applicantOrg: Organization) => void;
  onViewOrg?: (orgId: string) => void;
  onCreateUser?: (user: UserProfile, password: string) => Promise<{ success: boolean; userId?: string; error?: { message: string } }>;
  activeViewRole?: UserProfile['role'];
  onSwitchViewRole?: (role: UserProfile['role']) => void;
}

type ViewScope = 'GLOBAL' | 'ORG_LEVEL' | 'TOURNAMENT_LEVEL' | 'HR' | 'MARKET' | 'SPONSORS' | 'REPORTS' | 'ISSUES';

export const AdminCenter: React.FC<AdminProps> = ({
  organizations, standaloneMatches, userRole, onStartMatch, onViewMatch, onRequestSetup,
  onUpdateOrgs, onCreateOrg, onAddTeam, onRemoveTeam, onBulkAddPlayers, onAddGroup,
  onUpdateGroupTeams, onAddTournament, mediaPosts, onAddMediaPost, onViewTeam, onOpenMediaStudio,
  following, onToggleFollow, mockGlobalUsers = [], onAddMemberToOrg = () => { }, onProcessApplication, hireableScorers = [],
  currentUserId, onApplyForOrg, onUpgradeProfile, onTransferPlayer, currentUserProfile,
  showCaptainHub, onOpenCaptainHub, onRequestMatchReports, onUpdateProfile,
  onRequestTransferMarket,
  issues = [], onUpdateIssues,
  onRemoveTournament, onUpdateTournament, onUpdateFixture, onRemoveFixture, allOrganizations = [],
  onSelectHubTeam, onRequestAffiliation, onViewOrg, onCreateUser,
  activeViewRole, onSwitchViewRole
}) => {
  const [viewScope, setViewScope] = useState<ViewScope>('GLOBAL');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [modals, setModals] = useState({ createOrg: false, deleteOrg: false, addTeam: false, addTournament: false });
  const [pendingOrg, setPendingOrg] = useState<Organization | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<GameIssue | null>(null);
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);

  const [teamForm, setTeamForm] = useState({ name: '', location: '' });
  const [trnForm, setTrnForm] = useState<{ name: string, format: TournamentFormat, startDate: string, endDate: string, gameStartTime: string, description: string }>({
    name: '',
    format: 'T20',
    startDate: '',
    endDate: '',
    gameStartTime: '',
    description: ''
  });

  const activeOrg = useMemo(() => organizations.find(o => o.id === selectedOrgId), [organizations, selectedOrgId]);
  const activeTrn = useMemo(() => activeOrg?.tournaments.find(t => t.id === selectedTournamentId), [activeOrg, selectedTournamentId]);

  const allTeams = useMemo(() => organizations.flatMap(org => org.memberTeams), [organizations]);
  const globalPlayers = useMemo((): PlayerWithContext[] => organizations.flatMap(org => org.memberTeams.flatMap(t => t.players.map(p => ({ ...p, teamName: t.name, teamId: t.id, orgId: org.id, orgName: org.name })))), [organizations]);
  const globalFixtures = useMemo((): MatchFixture[] => [...organizations.flatMap(org => org.fixtures), ...standaloneMatches].sort((a, b) => { const weight = { 'Live': 0, 'Scheduled': 1, 'Completed': 2 }; const diff = (weight[a.status] || 1) - (weight[b.status] || 1); return diff !== 0 ? diff : a.status === 'Completed' ? new Date(b.date).getTime() - new Date(a.date).getTime() : new Date(a.date).getTime() - new Date(b.date).getTime(); }), [organizations, standaloneMatches]);

  const incompleteMatches = useMemo(() => {
    return globalFixtures.filter(f => f.status === 'Live' && f.scorerId === currentUserId);
  }, [globalFixtures, currentUserId]);

  const topBatsmen = useMemo(() => [...globalPlayers].sort((a, b) => b.stats.runs - a.stats.runs).slice(0, 5), [globalPlayers]);
  const topBowlers = useMemo(() => [...globalPlayers].sort((a, b) => b.stats.wickets - a.stats.wickets).slice(0, 5), [globalPlayers]);
  const currentOrgPlayers = useMemo((): PlayerWithContext[] => activeOrg ? activeOrg.memberTeams.flatMap(t => t.players.map(p => ({ ...p, teamName: t.name, teamId: t.id, orgId: activeOrg.id, orgName: activeOrg.name }))) : [], [activeOrg]);

  const currentUserMemberInActiveOrg = useMemo(() => activeOrg?.members.find(m => m.userId === currentUserId), [activeOrg, currentUserId]);
  const isOrgAdminOfActiveOrg = (currentUserMemberInActiveOrg?.role === 'Administrator' && !currentUserMemberInActiveOrg.managedTeamId) || userRole === 'Administrator';
  const isTeamAdminOfActiveOrg = currentUserMemberInActiveOrg?.role === 'Administrator' && !!currentUserMemberInActiveOrg.managedTeamId;

  const accessibleOrgs = useMemo(() => {
    if (userRole === 'Administrator') return organizations;
    return organizations.filter(org => org.members.some(m => m.userId === currentUserId));
  }, [organizations, userRole, currentUserId]);

  const myManagedTeams = useMemo(() => {
    return organizations
      .filter(org => org.members.some(m => m.userId === currentUserId && m.role === 'Administrator'))
      .flatMap(org => org.memberTeams);
  }, [organizations, currentUserId]);

  const handleDeleteConfirm = () => { if (pendingOrg) { onUpdateOrgs(organizations.filter(o => o.id !== pendingOrg.id)); setModals({ ...modals, deleteOrg: false }); setPendingOrg(null); if (selectedOrgId === pendingOrg.id) setSelectedOrgId(null); } };

  const handleRequestCreateOrg = () => {
    setModals({ ...modals, createOrg: true });
  };

  const handleAddTeam = () => { if (selectedOrgId && teamForm.name) { onAddTeam(selectedOrgId, { ...teamForm, players: [] }); setModals({ ...modals, addTeam: false }); setTeamForm({ name: '', location: '' }); } };
  const handleCreateTournament = () => { if (selectedOrgId) { onAddTournament(selectedOrgId, { id: `trn-${Date.now()}`, name: trnForm.name, format: trnForm.format, startDate: trnForm.startDate, endDate: trnForm.endDate, gameStartTime: trnForm.gameStartTime, description: trnForm.description, overs: trnForm.format === 'Test' ? 90 : 20, groups: [], teamIds: [], pointsConfig: trnForm.format === 'Test' ? PRESET_TEST : DEFAULT_POINTS_CONFIG, status: 'Upcoming', createdBy: currentUserId }); setModals({ ...modals, addTournament: false }); setTrnForm({ name: '', format: 'T20', startDate: '', endDate: '', gameStartTime: '', description: '' }); } };
  const handleTournamentAddGroup = (tournamentId: string, groupName: string) => { if (!activeOrg) return; const newGroup: Group = { id: `grp-${Date.now()}`, name: groupName, teams: [] }; onUpdateOrgs(organizations.map(org => org.id === activeOrg.id ? { ...org, tournaments: org.tournaments.map(t => t.id === tournamentId ? { ...t, groups: [...(t.groups || []), newGroup] } : t) } : org)); };
  const handleTournamentUpdateTeams = (tournamentId: string, groupId: string, teamIds: string[]) => {
    if (!activeOrg) return;
    const allAvailableTeams = organizations.flatMap(o => o.memberTeams);
    const selectedTeams = allAvailableTeams.filter(t => teamIds.includes(t.id));
    onUpdateOrgs(organizations.map(org =>
      org.id === activeOrg.id
        ? {
          ...org, tournaments: org.tournaments.map(t =>
            t.id === tournamentId
              ? {
                ...t, groups: (t.groups || []).map(g =>
                  g.id === groupId ? { ...g, teams: selectedTeams } : g
                )
              }
              : t
          )
        }
        : org
    ));
  };
  const handleGenerateFixtures = () => { if (!activeOrg || !activeTrn) return; const newFix = (activeTrn.groups || []).flatMap(g => generateRoundRobin(g.teams, activeTrn.id, g.id)); onUpdateOrgs(organizations.map(o => o.id === activeOrg.id ? { ...o, fixtures: [...o.fixtures, ...newFix] } : o)); };
  const handleAddFixture = (fixture: Partial<MatchFixture>) => {
    if (!activeOrg) return;

    // Preserve ALL fields from fixture, only set defaults for truly missing required fields
    const completeFixture: MatchFixture = {
      tournamentId: activeTrn?.id || '',
      teamAId: '',
      teamBId: '',
      teamAName: '',
      teamBName: '',
      date: new Date().toISOString(),
      venue: '',
      format: 'T20',
      status: 'Scheduled',
      // Spread fixture AFTER defaults so it overwrites with actual values
      ...fixture,
      // Ensure ID is set if not provided
      id: fixture.id || `fix-${Date.now()}`
    } as MatchFixture;

    onUpdateOrgs(organizations.map(o =>
      o.id === activeOrg.id
        ? { ...o, fixtures: [...o.fixtures, completeFixture] }
        : o
    ));
  };


  const handleUpdateOrgDetails = (id: string, data: Partial<Organization>) => {
    onUpdateOrgs(organizations.map(o => o.id === id ? { ...o, ...data } : o));
  };

  const handleProcessApplication = (orgId: string, appId: string, action: 'APPROVED' | 'REJECTED' | 'REVIEW', role?: 'Administrator' | 'Scorer' | 'Player') => {
    const parentOrg = organizations.find(o => o.id === orgId);
    const app = parentOrg?.applications.find(a => a.id === appId);

    if (!parentOrg || !app) return;

    const isAffiliation = app.type === 'ORG_AFFILIATE';
    const childOrgId = app.applicantId;

    const updatedOrgs = organizations.map(org => {
      if (org.id === orgId) {
        const updatedApps = org.applications.map(a => a.id === appId ? { ...a, status: action } : a);
        let newChildIds = org.childOrgIds || [];
        if (action === 'APPROVED' && isAffiliation && !newChildIds.includes(childOrgId)) {
          newChildIds = [...newChildIds, childOrgId];
        }
        let newMembers = org.members;
        let updatedTeams = org.memberTeams;

        if (action === 'APPROVED' && !isAffiliation && role) {
          if (!org.members.some(m => m.userId === app.applicantId)) {
            newMembers = [...org.members, {
              userId: app.applicantId,
              name: app.applicantName,
              handle: app.applicantHandle || '',
              role: role as any,
              addedAt: Date.now()
            }];
          }
          if (role === 'Player' && org.memberTeams.length > 0) {
            const firstTeam = org.memberTeams[0];
            const newPlayer: Player = {
              id: app.applicantId,
              name: app.applicantName,
              role: 'All-rounder',
              photoUrl: app.applicantImage,
              stats: { runs: 0, wickets: 0, ballsFaced: 0, ballsBowled: 0, runsConceded: 0, matches: 0, catches: 0, runOuts: 0, stumpings: 0, fours: 0, sixes: 0, hundreds: 0, fifties: 0, ducks: 0, threeWickets: 0, fiveWickets: 0, maidens: 0 }
            };
            updatedTeams = org.memberTeams.map(t => t.id === firstTeam.id ? { ...t, players: [...t.players, newPlayer] } : t);
          }
        }
        return { ...org, applications: updatedApps, childOrgIds: newChildIds, members: newMembers, memberTeams: updatedTeams };
      }
      if (org.id === childOrgId && action === 'APPROVED' && isAffiliation) {
        const newParentIds = org.parentOrgIds || [];
        if (!newParentIds.includes(orgId)) {
          return { ...org, parentOrgIds: [...newParentIds, orgId] };
        }
      }
      return org;
    });

    if (onProcessApplication) {
      onProcessApplication(orgId, appId, action, role);
    } else {
      onUpdateOrgs(updatedOrgs);
    }
  };

  const handleResolveIssue = (issueId: string, resolution: 'UPHELD' | 'DISMISSED' | 'ACKNOWLEDGED', response: string) => {
    const newStatus = resolution === 'DISMISSED' ? 'DISMISSED' : 'RESOLVED';
    const updatedIssues = issues.map(i => i.id === issueId ? { ...i, status: newStatus as any, resolution, adminResponse: response, resolvedAt: Date.now() } : i);
    if (onUpdateIssues) onUpdateIssues(updatedIssues);
    setIsResolutionModalOpen(false);
  };

  const centralZone = organizations.find(o => o.id === 'org-central-zone');
  const currentMember = centralZone?.members.find(m => m.userId === currentUserId);
  const hasPermission = (perm: string) => userRole === 'Administrator' || !!currentMember?.permissions?.[perm];

  return (
    <div className="max-w-7xl mx-auto px-1.5 py-4 md:p-8 min-h-screen">
      <CreateOrgModal
        isOpen={modals.createOrg}
        onClose={() => setModals({ ...modals, createOrg: false })}
        onCreate={onCreateOrg}
        userRole={userRole}
      />
      <IssueResolutionModal
        issue={selectedIssue}
        isOpen={isResolutionModalOpen}
        onClose={() => setIsResolutionModalOpen(false)}
        onResolve={handleResolveIssue}
      />
      {/* INCOMPLETE GAMES WARNING */}
      {incompleteMatches.length > 0 && (
        <div className="mb-8 bg-red-500/10 border-2 border-red-500/30 rounded-[2.5rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center text-xl animate-pulse">⚠</div>
            <div>
              <h3 className="text-red-600 dark:text-red-400 font-black uppercase text-xs tracking-widest mb-1">Incomplete Games Detected</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-bold">You have {incompleteMatches.length} match{incompleteMatches.length > 1 ? 'es' : ''} in progress. Pick back up where you left off!</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onSwitchViewRole && onSwitchViewRole('Scorer')}
              className="px-6 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-lg"
            >
              Continue Scoring
            </button>
          </div>
        </div>
      )}

      {/* ROLE SWITCHER - Mobile Dropdown / Desktop Grid */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-4 duration-500">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1 italic">Welcome Back, {currentUserProfile?.name}</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Unified Profile Active
          </p>
        </div>

        {/* Mobile Dropdown */}
        <div className="md:hidden w-full">
          <select
            value={activeViewRole}
            onChange={(e) => onSwitchViewRole && onSwitchViewRole(e.target.value as any)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-black text-slate-900 dark:text-white outline-none focus:ring-2 ring-indigo-500/20"
          >
            {['Administrator', 'Scorer', 'Player', 'Umpire', 'Captain', 'Coach'].map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex flex-wrap bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner gap-1">
          {['Administrator', 'Scorer', 'Player', 'Umpire', 'Captain', 'Coach'].map(role => (
            <button
              key={role}
              onClick={() => onSwitchViewRole && onSwitchViewRole(role as any)}
              className={`px-4 md:px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeViewRole === role ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* GLOBAL NAV TABS - Mobile Dropdown / Desktop Tabs */}
      {viewScope === 'GLOBAL' && (userRole === 'Administrator' || hasPermission('view_protests')) && (
        <div className="mb-8">
          {/* Mobile Dropdown */}
          <div className="md:hidden mb-4">
            <div className="relative">
              <select
                value={viewScope}
                onChange={(e) => setViewScope(e.target.value as ViewScope)}
                className="w-full appearance-none bg-slate-900 text-white rounded-xl px-6 py-4 font-black uppercase tracking-widest outline-none border border-slate-800 shadow-lg"
              >
                <option value="GLOBAL">Dashboard</option>
                {userRole === 'Administrator' && (
                  <>
                    <option value="HR">HR & Talent</option>
                    <option value="MARKET">Transfer Market</option>
                    <option value="SPONSORS">Sponsors</option>
                    <option value="REPORTS">Reports {globalFixtures.some(f => f.reportSubmission?.status === 'PENDING') ? '(Pending!)' : ''}</option>
                  </>
                )}
                {hasPermission('view_protests') && <option value="ISSUES">Issues</option>}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white pointer-events-none text-xs">▼</div>
            </div>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden md:flex gap-4">
            <button onClick={() => setViewScope('GLOBAL')} className="text-2xl font-black text-slate-900 border-b-4 border-slate-900 pb-1">Dashboard</button>
            {userRole === 'Administrator' && (
              <>
                <button onClick={() => setViewScope('HR')} className="text-2xl font-black text-slate-300 hover:text-slate-500 border-b-4 border-transparent hover:border-slate-200 pb-1 transition-all">HR & Talent</button>
                <button onClick={() => setViewScope('MARKET')} className="text-2xl font-black text-slate-300 hover:text-slate-500 border-b-4 border-transparent hover:border-slate-200 pb-1 transition-all">Transfer Market</button>
                <button onClick={() => setViewScope('SPONSORS')} className="text-2xl font-black text-slate-300 hover:text-slate-500 border-b-4 border-transparent hover:border-slate-200 pb-1 transition-all">Sponsors</button>
                {organizations.some(o => o.members.length === 0) && (
                  <button
                    onClick={() => {
                      if (confirm("Found orphaned organizations. Claim them to your account?")) {
                        const claimedOrgs = organizations.map(o => {
                          if (o.members.length === 0) {
                            return {
                              ...o,
                              members: [{
                                userId: currentUserId || 'unknown',
                                name: currentUserProfile?.name || 'Admin',
                                handle: currentUserProfile?.handle || '@admin',
                                role: 'Administrator' as const,
                                addedAt: Date.now()
                              }]
                            };
                          }
                          return o;
                        });
                        onUpdateOrgs(claimedOrgs);
                        alert("Orphaned organizations claimed! They should now appear in your dashboard.");
                      }
                    }}
                    className="text-2xl font-black text-red-500 hover:text-red-700 border-b-4 border-transparent hover:border-red-200 pb-1 transition-all animate-pulse"
                  >
                    ⚠ Fix Profile Pinning
                  </button>
                )}
              </>
            )}
            {hasPermission('view_protests') && (
              <button onClick={() => setViewScope('ISSUES')} className="text-2xl font-black text-slate-300 hover:text-slate-500 border-b-4 border-transparent hover:border-slate-200 pb-1 transition-all relative">
                Issues
                <span className="absolute -top-1 -right-2 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white"></span>
              </button>
            )}
            {userRole === 'Administrator' && (
              <button onClick={() => setViewScope('REPORTS')} className="text-2xl font-black text-slate-300 hover:text-slate-500 border-b-4 border-transparent hover:border-slate-200 pb-1 relative transition-all">
                Reports
                {globalFixtures.some(f => f.reportSubmission?.status === 'PENDING') && (
                  <span className="absolute -top-1 -right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {viewScope === 'HR' && (<div><button onClick={() => setViewScope('GLOBAL')} className="mb-6 text-slate-400 font-bold uppercase text-xs tracking-widest hover:text-slate-900">← Back to Dashboard</button><HRPortal scorers={hireableScorers} /></div>)}
      {viewScope === 'MARKET' && (<div><button onClick={() => setViewScope('GLOBAL')} className="mb-6 text-slate-400 font-bold uppercase text-xs tracking-widest hover:text-slate-900">← Back to Dashboard</button><TransferMarket players={globalPlayers} myTeams={myManagedTeams} onTransfer={(pId, tId) => onTransferPlayer && onTransferPlayer(pId, tId)} onBack={() => setViewScope('GLOBAL')} /></div>)}
      {viewScope === 'SPONSORS' && (
        <div>
          <button onClick={() => setViewScope('GLOBAL')} className="mb-6 text-slate-400 font-bold uppercase text-xs tracking-widest hover:text-slate-900">← Back to Dashboard</button>
          {/* Default to central zone for global sponsors, or select specific org */}
          <SponsorManager organization={organizations.find(o => o.id === 'org-central-zone') || organizations[0]} onUpdateOrg={handleUpdateOrgDetails} />
        </div>
      )}

      {viewScope === 'ISSUES' && (
        <div className="animate-in fade-in duration-500">
          <button onClick={() => setViewScope('GLOBAL')} className="mb-6 text-slate-400 font-bold uppercase text-xs tracking-widest hover:text-slate-900">← Back to Dashboard</button>
          <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100">
            <h3 className="text-3xl font-black text-slate-900 mb-8 italic">Protests & Issues</h3>
            <div className="space-y-4">
              {issues.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 rounded-[2rem] border border-slate-100">
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No Active Issues or Protests</p>
                </div>
              ) : (
                issues
                  .filter(issue => centralZone?.memberTeams.some(t => t.id === issue.teamId) || true)
                  .map(issue => (
                    <div key={issue.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-indigo-200 transition-all">
                      <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ${issue.type === 'PROTEST' ? 'bg-red-100 text-red-500' : 'bg-orange-100 text-orange-500'}`}>
                          {issue.type === 'PROTEST' ? '!' : '⚠'}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-lg">{issue.title}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {(organizations.flatMap(o => o.memberTeams).find(t => t.id === issue.teamId)?.name || 'Unknown Team')} • {new Date(issue.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${issue.status === 'OPEN' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {issue.status}
                        </span>
                        <button
                          onClick={() => { setSelectedIssue(issue); setIsResolutionModalOpen(true); }}
                          className="px-6 py-2 bg-white text-slate-900 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-md transition-all"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {viewScope === 'REPORTS' && (
        <div className="animate-in fade-in duration-500">
          <button onClick={() => setViewScope('GLOBAL')} className="mb-6 text-slate-400 font-bold uppercase text-xs tracking-widest hover:text-slate-900">← Back to Dashboard</button>
          <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100">
            <h3 className="text-3xl font-black text-slate-900 mb-8 italic">Match Report Submissions</h3>
            <div className="space-y-4">
              {globalFixtures.filter(f => f.reportSubmission).length === 0 && (
                <p className="text-slate-400 text-center py-20 font-black uppercase text-xs tracking-widest">No match reports submitted yet</p>
              )}
              {globalFixtures.filter(f => f.reportSubmission).map(fixture => (
                <div key={fixture.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-indigo-200 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-500 text-xl font-black">
                      {fixture.reportSubmission?.status === 'PENDING' ? '?' : fixture.reportSubmission?.status === 'VERIFIED' ? '✓' : '✕'}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-lg">{fixture.teamAName} vs {fixture.teamBName}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted on {new Date(fixture.reportSubmission!.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${fixture.reportSubmission?.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-600' :
                      fixture.reportSubmission?.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                        'bg-indigo-100 text-indigo-600'
                      }`}>
                      {fixture.reportSubmission?.status}
                    </span>
                    <button
                      onClick={() => onViewMatch(fixture)}
                      className="px-6 py-2 bg-white text-slate-900 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-md transition-all"
                    >
                      {fixture.reportSubmission?.status === 'PENDING' ? 'Review & Verify' : 'View Details'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewScope === 'GLOBAL' && (
        <GlobalDashboard
          organizations={organizations}
          onSelectOrg={(id) => { setSelectedOrgId(id); setViewScope('ORG_LEVEL'); }}
          onRequestDeleteOrg={(org) => { setPendingOrg(org); setModals({ ...modals, deleteOrg: true }); }}
          onRequestCreateOrg={handleRequestCreateOrg}
          onRequestQuickMatch={onRequestSetup} onOpenMediaStudio={onOpenMediaStudio}
          fixtures={globalFixtures} topBatsmen={topBatsmen} topBowlers={topBowlers}
          onStartMatch={onStartMatch} onViewMatch={onViewMatch} onViewTeam={onViewTeam}
          currentUserId={currentUserId}
          onApplyForOrg={onApplyForOrg}
          onUpgradeProfile={onUpgradeProfile}
          following={following}
          onToggleFollow={onToggleFollow}
          onRequestCaptainHub={onOpenCaptainHub}
          onRequestMatchReports={onRequestMatchReports}
          showCaptainHub={showCaptainHub}
          profile={currentUserProfile!}
          onUpdateProfile={onUpdateProfile!}
          onRequestTransferMarket={onRequestTransferMarket}
          onViewOrg={onViewOrg}
          onCreateUser={onCreateUser}
          globalUsers={mockGlobalUsers}
          onRemoveFixture={(fId) => {
            const org = organizations.find(o => o.fixtures.some(f => f.id === fId));
            if (org && onRemoveFixture) {
              onRemoveFixture(org.id, fId);
            }
          }}
        />
      )}

      {viewScope === 'ORG_LEVEL' && activeOrg && (
        <OrganizationView
          organization={activeOrg} userRole={userRole}
          onBack={() => setViewScope('GLOBAL')}
          onViewTournament={(id) => { setSelectedTournamentId(id); setViewScope('TOURNAMENT_LEVEL'); }}
          onViewPlayer={() => { }} onRequestAddTeam={() => setModals({ ...modals, addTeam: true })}
          onRequestAddTournament={() => setModals({ ...modals, addTournament: true })}
          players={currentOrgPlayers} onViewTeam={onViewTeam}
          isFollowed={following.orgs.includes(activeOrg.id)}
          onToggleFollow={() => onToggleFollow('ORG', activeOrg.id)}
          globalUsers={mockGlobalUsers || []}
          onAddMember={(member) => onAddMemberToOrg && onAddMemberToOrg(activeOrg.id, member)}
          onUpdateOrg={handleUpdateOrgDetails}
          onRemoveTeam={onRemoveTeam}
          onProcessApplication={handleProcessApplication}
          allOrganizations={organizations}
          currentUserProfile={currentUserProfile}
          onRequestCaptainHub={onOpenCaptainHub}
          onSelectHubTeam={onSelectHubTeam}
          onUpdateFixture={onUpdateFixture}
          onRemoveFixture={onRemoveFixture}
          onApplyForOrg={onApplyForOrg}
          onRequestAffiliation={onRequestAffiliation}
          onRemoveTournament={onRemoveTournament}
          onUpdateTournament={onUpdateTournament}
          onCreateUser={onCreateUser}
        />
      )}

      {viewScope === 'TOURNAMENT_LEVEL' && activeTrn && activeOrg && (
        <TournamentDashboard
          tournament={activeTrn} organization={activeOrg} onBack={() => setViewScope('ORG_LEVEL')}
          onStartMatch={onStartMatch} onGenerateFixtures={handleGenerateFixtures}
          onAddGroup={handleTournamentAddGroup} onUpdateGroupTeams={handleTournamentUpdateTeams} onViewTeam={onViewTeam}
          onViewMatch={onViewMatch}
          onAddFixture={handleAddFixture}
          onUpdateFixture={(fId, data) => onUpdateFixture && onUpdateFixture(activeOrg.id, fId, data)}
          onUpdateTournament={(tId, data) => onUpdateTournament && onUpdateTournament(activeOrg.id, tId, data)}
          allOrganizations={organizations}
          isOrgAdmin={isOrgAdminOfActiveOrg}
          onSelectHubTeam={onSelectHubTeam}
        />
      )}

      {modals.deleteOrg && pendingOrg && <DeleteOrgModal organization={pendingOrg} onConfirm={handleDeleteConfirm} onCancel={() => setModals({ ...modals, deleteOrg: false })} />}

      {modals.addTeam && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-900 mb-8">New Squad</h3>
            <input value={teamForm.name} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })} placeholder="Squad Name" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 font-bold outline-none mb-4" />
            <input value={teamForm.location} onChange={e => setTeamForm({ ...teamForm, location: e.target.value })} placeholder="Home Ground" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 font-bold outline-none mb-8" />
            <div className="flex gap-4"><button onClick={() => setModals({ ...modals, addTeam: false })} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs">Cancel</button><button onClick={handleAddTeam} className="flex-1 py-4 bg-indigo-600 text-white font-black uppercase text-xs rounded-xl shadow-xl">Confirm</button></div>
          </div>
        </div>
      )}
      {modals.addTournament && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-black text-slate-900 mb-8">Tournament Management</h3>

            {/* Existing Tournaments */}
            {activeOrg && activeOrg.tournaments.length > 0 && (
              <div className="mb-8">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Existing Tournaments</h4>
                <div className="space-y-3">
                  {activeOrg.tournaments.map(t => (
                    <div
                      key={t.id}
                      className="relative bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-all group"
                    >
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${t.name}"? This action cannot be undone.`)) {
                            if (onRemoveTournament) {
                              onRemoveTournament(activeOrg.id, t.id);
                            }
                          }
                        }}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-100 hover:bg-red-500 text-red-500 hover:text-white rounded-full flex items-center justify-center font-black text-sm transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Tournament"
                      >
                        ×
                      </button>
                      <div className="pr-8">
                        <p className="font-black text-slate-900">{t.name}</p>
                        <p className="text-xs text-slate-400 uppercase tracking-widest">{t.format} • {t.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 my-6"></div>
              </div>
            )}

            {/* Create New Tournament Form */}
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Create New Tournament</h4>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Tournament Name</label>
                <input value={trnForm.name} onChange={e => setTrnForm({ ...trnForm, name: e.target.value })} placeholder="e.g. Summer League 2026" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 font-bold outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Format</label>
                  <select value={trnForm.format} onChange={e => setTrnForm({ ...trnForm, format: e.target.value as any })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 font-bold outline-none">
                    <option value="T20">Twenty20</option><option value="T10">T10 Series</option><option value="50-over">One Day Series</option><option value="Test">Multi-day Series</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Default Start Time</label>
                  <input type="time" value={trnForm.gameStartTime} onChange={e => setTrnForm({ ...trnForm, gameStartTime: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 font-bold outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Start Date</label>
                  <input type="date" value={trnForm.startDate} onChange={e => setTrnForm({ ...trnForm, startDate: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">End Date</label>
                  <input type="date" value={trnForm.endDate} onChange={e => setTrnForm({ ...trnForm, endDate: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 font-bold outline-none" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Description / About</label>
                <textarea value={trnForm.description} onChange={e => setTrnForm({ ...trnForm, description: e.target.value })} placeholder="Details about this tournament..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 font-bold outline-none min-h-[80px] resize-none" />
              </div>
            </div>

            <div className="flex gap-4 mt-8"><button onClick={() => setModals({ ...modals, addTournament: false })} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs">Cancel</button><button onClick={handleCreateTournament} className="flex-1 py-4 bg-slate-900 text-white font-black uppercase text-xs rounded-xl shadow-xl">Deploy</button></div>
          </div>
        </div>
      )}
      {/* Embed Code Modal */}
      <EmbedCodeModal
        isOpen={showEmbedModal}
        onClose={() => setShowEmbedModal(false)}
        activeOrg={activeOrg}
        activeTournament={activeTrn}
      />

      {/* Floating Embed Button */}
      <button
        onClick={() => setShowEmbedModal(true)}
        className="fixed bottom-6 right-6 bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-600 transition-colors z-40 flex items-center gap-2 group"
        title="Generate Embed Codes"
      >
        <span className="text-xl">🔗</span>
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap text-xs font-black uppercase tracking-widest">
          Embed & Share
        </span>
      </button>
    </div>
  );
};
