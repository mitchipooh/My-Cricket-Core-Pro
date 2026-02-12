
/**
 * Cricket-Core 2026 Management System
 * Created by mitchipoohdevs
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/common/Layout.tsx';
import { AdminCenter } from './components/admin/AdminCenter.tsx';
import { MatchSetup } from './components/setup/MatchSetup.tsx';
import { StatsAnalytics } from './components/analytics/StatsAnalytics.tsx';
import { ProfileSetup } from './components/setup/ProfileSetup.tsx';
import { MediaCenter } from './components/media/MediaCenter.tsx';
import { TeamProfileModal } from './components/modals/TeamProfileModal.tsx';
import { PlayerProfileModal } from './components/modals/PlayerProfileModal.tsx';
import { ApplicationModal } from './components/modals/ApplicationModal.tsx';
import { PlayerCareer } from './components/dashboard/PlayerCareer.tsx';
import { ScorerProfile } from './components/dashboard/ScorerProfile.tsx';
import { ScoreboardWindow } from './components/display/ScoreboardWindow.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import { Organization, Team, MatchFixture, UserProfile, Player, MatchState, Group, Tournament, MediaPost, PlayerWithContext, OrgMember, OrgApplication, MatchReportSubmission, GameIssue, UserCreationResult } from './types.ts';
import { OrganizationView } from './components/dashboard/OrganizationView.tsx';
import { useData } from './contexts/DataProvider.tsx';
import { Scorer } from './components/scoring/Scorer.tsx';
import { CaptainsProfile } from './components/captains/CaptainsProfile.tsx';
import { PlayerRegistry } from './components/search/PlayerRegistry.tsx'; // Import Registry
import { TeamRegistry } from './components/search/TeamRegistry.tsx'; // Import Team Registry
import { TeamSelector } from './components/captains/TeamSelector.tsx'; // Import Team Selector
import { UmpireProfile } from './components/umpire/UmpireProfile.tsx'; // Import Umpire Profile
import { ReportVerification } from './components/admin/ReportVerification.tsx';
import { TransferMarket } from './components/search/TransferMarket.tsx'; // [NEW] Transfer Market
import { ScoringConflictModal } from './components/modals/ScoringConflictModal.tsx';
import {
    updateFixture, fetchGlobalSync,
    pushGlobalSync,
    claimPlayerProfile,
    approvePlayerClaim,
    updateAffiliationStatus,
    requestAffiliation,
    removeTeamFromOrg,
    deleteTournament,
    deleteMediaPost,
    deleteMatchFixture
} from './services/centralZoneService.ts';
import { useAuth } from './hooks/useAuth';
import { LoginModal } from './components/auth/LoginModal';
import { TournamentView } from './components/dashboard/TournamentView'; // Import
import { updatePlayerStatsFromReport } from './utils/cricket-engine.ts';
import { EmbedViewer } from './components/display/EmbedViewer.tsx';
import { MatchSummary } from './components/display/MatchSummary.tsx';
import { supabase } from './lib/supabase';
import { DEFAULT_POINTS_CONFIG, PRESET_TEST } from './competition/pointsEngine';
import { generateId } from './utils/idGenerator';

// Re-defining for local use if needed, though mostly handled by Provider default
const MOCK_GUEST_PROFILE: UserProfile = { id: 'guest', name: 'Visitor', handle: 'guest', role: 'Guest', createdAt: Date.now() };

const App: React.FC = () => {
    // --- STANDALONE SCOREBOARD ROUTE CHECK ---
    const urlParams = new URLSearchParams(window.location.search);
    const isScoreboardMode = urlParams.get('mode') === 'scoreboard';

    if (isScoreboardMode) {
        return <ScoreboardWindow />;
    }

    // --- EMBED MODE ---
    const isEmbedMode = urlParams.get('mode') === 'embed';
    if (isEmbedMode) {
        return (
            <div className="embed-root">
                <EmbedViewer />
            </div>
        );
    }

    // --- APP LOADING STATE ---
    const [isAppLoading, setIsAppLoading] = useState(true);

    // --- CONTEXT DATA ---
    const {
        orgs, standaloneMatches, mediaPosts, allTeams, profile, settings, following,
        setOrgs, setStandaloneMatches, setMediaPosts, setAllTeams,
        setOrgsSilent, setStandaloneMatchesSilent, // Destructure Silent Setters
        issues, setIssues, matchReports, setMatchReports, umpireReports, setUmpireReports,
        updateProfile, updateSettings, updateFollowing,
        pullNow, forcePush
    } = useData();

    const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('cc_theme') as 'dark' | 'light') || 'light');

    const [activeTab, setActiveTab] = useState<'home' | 'setup' | 'scorer' | 'stats' | 'media' | 'career' | 'my_club' | 'captain_hub' | 'registry' | 'team_registry' | 'umpire_hub' | 'tournament_details' | 'transfer_market' | 'my_matches' | 'my_tournaments' | 'profile' | 'my_teams' | 'my_clubs' | 'create_tournament' | 'register_club' | 'following'>(() => {
        // Support deep linking via ?tab=registry
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        const validTabs = ['home', 'setup', 'scorer', 'stats', 'media', 'career', 'my_club', 'captain_hub', 'registry', 'team_registry', 'umpire_hub', 'tournament_details', 'transfer_market', 'my_matches', 'my_tournaments', 'profile', 'my_teams', 'my_clubs', 'create_tournament', 'register_club', 'following'];
        if (tab && validTabs.includes(tab)) {
            return tab as any;
        }
        return 'media';
    });
    const [activeMatch, setActiveMatch] = useState<MatchFixture | null>(null);
    const [pendingSetupFixture, setPendingSetupFixture] = useState<MatchFixture | null>(null);
    const [viewMatchId, setViewMatchId] = useState<string | null>(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('matchId');
    });
    const [viewingTeamId, setViewingTeamId] = useState<string | null>(null);
    const [viewingPlayerId, setViewingPlayerId] = useState<string | null>(null);
    const [viewingTournamentId, setViewingTournamentId] = useState<string | null>(null);
    const [viewingOrgId, setViewingOrgId] = useState<string | null>(null);
    const [selectedHubTeamId, setSelectedHubTeamId] = useState<string | null>(null); // NEW: Overrides myTeam for Admins
    const [editingProfile, setEditingProfile] = useState(false);
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [isApplyingForOrg, setIsApplyingForOrg] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
    const [profileSetupMode, setProfileSetupMode] = useState<'CREATE' | 'LOGIN'>('CREATE');
    const [trnCreationMode, setTrnCreationMode] = useState<'SELECT' | 'STANDALONE'>('SELECT');
    // Unified Profile & Scoring Conflicts
    const [activeViewRole, setActiveViewRole] = useState<UserProfile['role']>(profile.role);
    const [conflictMatches, setConflictMatches] = useState<MatchFixture[]>([]);
    const [showConflictModal, setShowConflictModal] = useState(false);

    // Shared Link Match Summary
    const [summaryMatch, setSummaryMatch] = useState<MatchFixture | null>(null);

    // Removed readOnlyMode state - derived from activeMatch and profile instead

    // Global User Directory (Client-side simulation)
    const [globalUsers, setGlobalUsers] = useState<UserProfile[]>([]);

    // Auth integration
    const { user, loading: authLoading, getUserProfile, signOut } = useAuth();

    // Sync Supabase auth with app profile
    useEffect(() => {
        if (user && !authLoading) {
            getUserProfile().then(authProfile => {
                if (authProfile) {
                    updateProfile(authProfile);
                    if (activeViewRole === 'Guest') {
                        setActiveViewRole(authProfile.role);
                    }
                }
            });
        }
        /* 
           DISABLE AUTO-LOGOUT: 
           Since we support handle-based "Lite" login which doesn't have a Supabase Auth session,
           we shouldn't force logout just because `user` is null. DataProvider handles persistence.
        */
        // else if (!user && !authLoading && profile.role !== 'Guest') {
        //     // User logged out, reset to guest
        //     updateProfile({ id: 'guest', name: 'Visitor', handle: 'guest', role: 'Guest', createdAt: Date.now() });
        // }
    }, [user, authLoading]);

    // --- INITIALIZATION EFFECT ---
    useEffect(() => {
        const logoPath = window.wpApiSettings?.plugin_url ? `${window.wpApiSettings.plugin_url}logo.jpg` : 'logo.jpg';
        const img = new Image();
        img.src = logoPath;
        const timer = setTimeout(() => {
            setIsAppLoading(false);
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    // --- PREVENT ACCIDENTAL APP CLOSURE ---
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Only warn if there's an active match being scored
            if (activeMatch && activeMatch.status === 'Live' && activeMatch.scorerId === profile.id) {
                e.preventDefault();
                e.returnValue = 'You have an active match in progress. Are you sure you want to leave?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [activeMatch, profile.id]);

    // --- HANDLE VISIBILITY CHANGES ---
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                console.log('App hidden - pausing background activity');
                // App is hidden, could pause non-critical sync
            } else {
                console.log('App visible - resuming activity');
                // App is visible again, resume sync
                pullNow();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [pullNow]);

    // --- DATA LOADING EFFECT ---
    useEffect(() => {
        const loadData = async () => {
            try {
                // Initialize Global Users from existing org members
                if (orgs.length > 0) {
                    const allMembers = orgs.flatMap(o => o.members).map(m => ({
                        id: m.userId,
                        name: m.name,
                        handle: m.handle,
                        role: m.role,
                        createdAt: m.addedAt || Date.now()
                    } as UserProfile));

                    // Deduplicate by ID
                    const uniqueUsers = Array.from(new Map(allMembers.map(item => [item.id, item])).values());
                    setGlobalUsers(uniqueUsers);
                }
            } catch (err) {
                console.error("Failed to load initial data", err);
            }
        };
        loadData();
    }, [orgs]);

    // Initialize Central Zone if no orgs exist
    // DISABLED: Now loading from Supabase with 24 teams
    // useEffect(() => {
    //     if (orgs.length === 0) {
    //         const centralZone: Organization = {
    //             id: 'org-central-zone',
    //             name: 'Central Zone',
    //             type: 'GOVERNING_BODY',
    //             country: 'Global',
    //             description: 'The primary governing body for the Cricket-Core League.',
    //             isPublic: true,
    //             allowUserContent: true,
    //             tournaments: [],
    //             groups: [],
    //             memberTeams: [],
    //             fixtures: [],
    //             members: [],
    //             applications: [],
    //             sponsors: [],
    //             establishedYear: 2026
    //         };
    //         setOrgs([centralZone]);
    //     }
    // }, [orgs.length]);

    // --- AUTO ARCHIVE LOGIC ---
    useEffect(() => {
        const archiveThreshold = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 Days Ago
        let needsUpdate = false;

        const newStandalone = standaloneMatches.map(m => {
            if (m.status === 'Completed' && !m.isArchived && new Date(m.date).getTime() < archiveThreshold) {
                needsUpdate = true;
                return { ...m, isArchived: true };
            }
            return m;
        });

        const newOrgs = orgs.map(org => ({
            ...org,
            fixtures: org.fixtures.map(f => {
                if (f.status === 'Completed' && !f.isArchived && new Date(f.date).getTime() < archiveThreshold) {
                    needsUpdate = true;
                    return { ...f, isArchived: true };
                }
                return f;
            })
        }));

        if (needsUpdate) {
            setStandaloneMatches(newStandalone);
            setOrgs(newOrgs);
            // Push handled by setters
            console.log("Auto-archived old matches.");
        }
    }, [standaloneMatches, orgs]);

    // --- ACTIVE MATCH SYNC ---
    // If cloud updates the active match (e.g. another scorer), we should reflect it.
    useEffect(() => {
        if (activeMatch) {
            const cloudMatch = (standaloneMatches || []).find(m => m.id === activeMatch.id) ||
                (orgs || []).flatMap(o => o.fixtures).find(f => f.id === activeMatch.id);
            if (cloudMatch && cloudMatch.savedState && JSON.stringify(cloudMatch.savedState) !== JSON.stringify(activeMatch.savedState)) {
                setActiveMatch(cloudMatch);
            }
        }
    }, [standaloneMatches, orgs, activeMatch?.id]);

    // --- REALTIME FIXTURE UPDATES ---
    useEffect(() => {
        const fixtureChannel = supabase
            .channel('fixtures_realtime')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'fixtures' },
                (payload) => {
                    const updated = payload.new as any;
                    console.log('Real-time fixture update received:', updated);

                    const updateLocalFixture = (f: MatchFixture): MatchFixture => {
                        if (f.id === updated.id) {
                            return {
                                ...f,
                                status: updated.status,
                                teamAScore: updated.scores?.teamAScore || f.teamAScore,
                                teamBScore: updated.scores?.teamBScore || f.teamBScore,
                                savedState: updated.saved_state || f.savedState,
                                result: updated.result || f.result,
                                winnerId: updated.winner_id || f.winnerId
                            };
                        }
                        return f;
                    };

                    setStandaloneMatchesSilent(prev => prev.map(updateLocalFixture));
                    setOrgsSilent(prev => prev.map(org => ({
                        ...org,
                        fixtures: org.fixtures.map(updateLocalFixture)
                    })));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(fixtureChannel);
        };
    }, [standaloneMatches, orgs, setStandaloneMatchesSilent, setOrgsSilent]);

    useEffect(() => {
        if (profile?.role === 'Guest' && !['media', 'scorer', 'setup'].includes(activeTab)) {
            setActiveTab('media');
        }
    }, [profile, activeTab]);

    useEffect(() => { localStorage.setItem('cc_theme', theme); if (theme === 'light') document.body.classList.add('light-theme'); else document.body.classList.remove('light-theme'); }, [theme]);





    // Derived Data
    const allPlayers = useMemo((): PlayerWithContext[] => {
        const playersList: PlayerWithContext[] = [];
        // Use global allTeams instead of just org memberTeams
        allTeams.forEach(t => {
            // Find parent org if any
            const org = orgs.find(o => o.memberTeams?.some(mt => mt.id === t.id));
            t.players.forEach(p => {
                playersList.push({
                    ...p,
                    teamName: t.name,
                    teamId: t.id,
                    orgId: org?.id || '',
                    orgName: org?.name || 'Independent'
                });
            });
        });
        return playersList;
    }, [allTeams, orgs]);


    const allFixtures = useMemo(() => {
        const orgFixtures = orgs.flatMap(o => o.fixtures.map(f => ({ ...f, orgId: o.id })));
        return [...standaloneMatches, ...orgFixtures];
    }, [standaloneMatches, orgs]);

    const ongoingMatch = useMemo(() => {
        if (!profile || profile.role === 'Guest') return null;
        // Find any live match where the user is the scorer
        return allFixtures.find(f => f.status === 'Live' && f.scorerId === profile.id);
    }, [allFixtures, profile]);


    const myTeam = useMemo(() => {
        if (!profile) return null;

        // Priority 1: Explicitly selected hub team (for Admins)
        if (selectedHubTeamId) {
            const team = allTeams.find(t => t.id === selectedHubTeamId);
            if (team) return team;
        }

        // Priority 2: Direct player membership (via Claim or Link)
        const playerTeam = allTeams.find(t => t.players.some(p => p.id === profile.id || p.userId === profile.id));
        if (playerTeam) return playerTeam;

        // Priority 3: Managed team ID from an organization membership (e.g., Team Admin)
        for (const org of orgs) {
            const member = org.members.find(m => m.userId === profile.id);
            if (member?.managedTeamId) {
                const team = allTeams.find(t => t.id === member.managedTeamId);
                if (team) return team;
            }
        }
        return null;
    }, [profile, allTeams, orgs, selectedHubTeamId]);

    const myCaptainTeams = useMemo(() => {
        if (!orgs || !allTeams || !profile) return [];
        const teams: Team[] = [];

        // 1. Teams where user is a player/member
        const memberTeams = allTeams.filter(t => t.players.some(p => p.id === profile.id || p.userId === profile.id));
        teams.push(...memberTeams);

        // 2. Teams managed via Org membership (e.g. Org Admin managing a team)
        for (const org of orgs) {
            const member = org.members.find(m => m.userId === profile.id);
            if (member?.managedTeamId) {
                const team = allTeams.find(t => t.id === member.managedTeamId);
                if (team) teams.push(team);
            }
        }

        // Deduplicate
        const uniqueTeams = Array.from(new Map(teams.map(t => [t.id, t])).values());
        return uniqueTeams;
    }, [profile, allTeams, orgs]);

    const viewMatch = useMemo(() => {
        return allFixtures.find(f => f.id === viewMatchId);
    }, [viewMatchId, allFixtures]);

    // --- ACTIVE MATCH PERSISTENCE & REDIRECTION ---
    useEffect(() => {
        if (activeMatch) {
            localStorage.setItem('cc_active_match_id', activeMatch.id);
        } else {
            localStorage.removeItem('cc_active_match_id');
        }
    }, [activeMatch?.id]);

    // Auto-restore / Direct Scorer Routing
    useEffect(() => {
        if (allFixtures.length > 0 && profile?.role !== 'Guest') {
            const params = new URLSearchParams(window.location.search);
            const matchIdParam = params.get('matchId');
            const savedId = localStorage.getItem('cc_active_match_id');

            // Priority 1: Match ID in URL
            if (matchIdParam) {
                const urlMatch = allFixtures.find(f => f.id === matchIdParam);
                if (urlMatch) {
                    setActiveMatch(urlMatch);
                    setActiveTab('scorer');
                }
            }

            // Priority 2: Persistent active match in storage (ask to resume)
            if (!activeMatch && savedId && !showResumeModal) {
                const match = allFixtures.find(f => f.id === savedId && f.status === 'Live');
                if (match && match.scorerId === profile.id) {
                    // We don't auto-set activeMatch here to avoid jumping views unexpectedly on every refresh
                    // unless they just opened the app.
                    setShowResumeModal(true);
                }
            }
        }
    }, [allFixtures.length, profile?.id]);

    // DERIVED READ-ONLY STATE
    const isReadOnly = useMemo(() => {
        if (!activeMatch) return false;
        if (!profile || profile.role === 'Guest') return true;

        // Writes allowed if:
        // 1. Assigned Scorer
        if (activeMatch.scorerId === profile.id) return false;
        // 2. Creator
        if (activeMatch.createdBy === profile.id) return false;
        // 3. Admin of the Organization
        if (profile.role === 'Administrator' && activeMatch.orgId) {
            const org = orgs.find(o => o.id === activeMatch.orgId);
            if (org?.members.some(m => m.userId === profile.id && m.role === 'Administrator')) return false;
        }
        // 4. Super Admin
        if (profile.handle === 'Trinity' || profile.handle === '@Trinity') return false;

        return true;
    }, [activeMatch, profile, orgs]);


    const hireableScorers = useMemo(() => {
        if (profile && profile.role === 'Scorer' && profile.scorerDetails?.isHireable) {
            return [profile];
        }
        return [];
    }, [profile]);




    const toggleFollowing = (type: 'TEAM' | 'PLAYER' | 'ORG', id: string) => {
        if (profile?.role === 'Guest') { setEditingProfile(true); return; }

        const list = type === 'TEAM' ? following.teams : type === 'PLAYER' ? following.players : following.orgs;
        const newList = list.includes(id) ? list.filter(x => x !== id) : [...list, id];

        updateFollowing({
            ...following,
            [type === 'TEAM' ? 'teams' : type === 'PLAYER' ? 'players' : 'orgs']: newList
        });
    };

    // --- SCOREBOARD SYNC UPDATE ---
    useEffect(() => {
        if (activeMatch && activeMatch.savedState && 'BroadcastChannel' in window) {
            try {
                const hostOrg = orgs.find(o => o.fixtures.some(f => f.id === activeMatch.id));
                const channel = new BroadcastChannel('cricket_sync_channel');

                const teamA = allTeams.find(t => t.id === activeMatch.teamAId);
                const teamB = allTeams.find(t => t.id === activeMatch.teamBId);

                channel.postMessage({
                    type: 'UPDATE',
                    state: activeMatch.savedState,
                    teams: { batting: teamA, bowling: teamB },
                    sponsors: hostOrg?.sponsors || []
                });
            } catch (e) {
                console.warn("BroadcastChannel error", e);
            }
        }
    }, [activeMatch, orgs, allTeams]);

    const handleRequestSetup = (fixture: MatchFixture | null = null) => {
        const myActiveMatches = allFixtures.filter(f => f.status === 'Live' && f.scorerId === profile.id);
        if (myActiveMatches.length > 0) {
            setConflictMatches(myActiveMatches);
            setPendingSetupFixture(fixture);
            setShowConflictModal(true);
        } else {
            setPendingSetupFixture(fixture);
            setActiveTab('setup');
        }
    };

    const handleCloseAllConflicts = async () => {
        const nextOrgs = orgs.map(org => ({
            ...org,
            fixtures: org.fixtures.map(f => conflictMatches.some(cm => cm.id === f.id) ? { ...f, status: 'Completed' as const } : f)
        }));
        setOrgs(nextOrgs);

        const nextStandalone = standaloneMatches.map(m => conflictMatches.some(cm => cm.id === m.id) ? { ...m, status: 'Completed' as const } : m);
        setStandaloneMatches(nextStandalone);

        setShowConflictModal(false);
        setActiveTab('setup');
    };

    const handleSetupComplete = (newMatch: MatchFixture) => {
        let nextMatches = [...standaloneMatches];
        let nextOrgs = [...orgs];
        const matchWithScorer = { ...newMatch, scorerId: profile?.id };
        if (pendingSetupFixture) {
            const updatedMatch = { ...matchWithScorer, id: pendingSetupFixture.id };
            nextMatches = nextMatches.map(m => m.id === updatedMatch.id ? updatedMatch : m);
            nextOrgs = nextOrgs.map(org => ({
                ...org,
                fixtures: org.fixtures.map(f => f.id === updatedMatch.id ? updatedMatch : f)
            }));
            setActiveMatch(updatedMatch);
            setPendingSetupFixture(null);
        } else {
            const quickMatch = { ...matchWithScorer, isOfficial: matchWithScorer.isOfficial ?? false };
            nextMatches = [quickMatch, ...nextMatches];
            setActiveMatch(quickMatch);
        }
        setStandaloneMatches(nextMatches);
        setOrgs(nextOrgs);
        setActiveTab('scorer');
    };

    const handleUpdateMatchState = async (matchId: string, newState: MatchState, finalStatus?: MatchFixture['status']) => {
        const getScore = (tid: string) => {
            const inn = newState.inningsScores.find(i => i.teamId === tid);
            if (inn) return `${inn.score}/${inn.wickets}`;
            if (newState.battingTeamId === tid) return `${newState.score}/${newState.wickets}`;
            return '0/0';
        };

        const STATUS = finalStatus || (newState.isCompleted ? 'Completed' : 'Live');
        const TEAM_A_SCORE = getScore(activeMatch?.teamAId || '');
        const TEAM_B_SCORE = getScore(activeMatch?.teamBId || '');

        const updateFixtureLocally = (f: MatchFixture): MatchFixture => {
            if (f.id === matchId) {
                return {
                    ...f,
                    savedState: newState,
                    status: STATUS,
                    teamAScore: TEAM_A_SCORE,
                    teamBScore: TEAM_B_SCORE
                };
            }
            return f;
        };

        // 1. SILENT Local Update (Instant UI, No Full Push)
        const nextMatches = standaloneMatches.map(updateFixtureLocally);
        const nextOrgs = orgs.map(org => ({
            ...org,
            fixtures: org.fixtures.map(updateFixtureLocally)
        }));

        setStandaloneMatchesSilent(nextMatches);
        setOrgsSilent(nextOrgs);

        // 2. Granular DB Update (Async, specific row only)
        // We use the same update logic as the local one
        await updateFixture(matchId, {
            savedState: newState,
            status: STATUS,
            teamAScore: TEAM_A_SCORE,
            teamBScore: TEAM_B_SCORE
        });
    };

    const handleCreateOrg = (orgData: Partial<Organization>) => {
        const newOrg: Organization = {
            id: `org-${Date.now()}`, name: orgData.name || 'Untitled', type: orgData.type || 'CLUB',
            createdBy: profile?.id, // ROBUST: Set explicit creator for permanent ownership
            description: '', address: '', country: orgData.country || '', groundLocation: '',
            establishedYear: new Date().getFullYear(), logoUrl: '', tournaments: [], groups: [],
            memberTeams: [], fixtures: [], members: profile ? [{ userId: profile.id, name: profile.name, handle: profile.handle, role: 'Administrator', addedAt: Date.now() }] : [],
            applications: [], isPublic: true, allowUserContent: true, sponsors: []
        };
        const nextOrgs = [...orgs, newOrg];
        setOrgs(nextOrgs);
        forcePush(); // Persist to database immediately
    };

    const handleAddTeam = (orgId: string, teamData: Omit<Team, 'id'>) => {
        const newTeam: Team = { ...teamData, id: `tm-${Date.now()}`, players: [] };
        const nextOrgs = orgs.map(org => org.id === orgId ? { ...org, memberTeams: [...org.memberTeams, newTeam] } : org);
        setOrgs(nextOrgs);
        forcePush(); // Persist to database
    };

    const handleRemoveTeam = async (orgId: string, teamId: string) => {
        await removeTeamFromOrg(orgId, teamId);
        const nextOrgs = orgs.map(o => o.id === orgId ? { ...o, memberTeams: o.memberTeams.filter(t => t.id !== teamId) } : o);
        setOrgs(nextOrgs);
        forcePush();
    };

    const handleRemoveTournament = async (orgId: string, tournamentId: string) => {
        await deleteTournament(tournamentId);
        const nextOrgs = orgs.map(org => {
            if (org.id === orgId) {
                return {
                    ...org,
                    tournaments: org.tournaments.filter(t => t.id !== tournamentId)
                };
            }
            return org;
        });
        setOrgs(nextOrgs);
        forcePush(); // Persist to database
    };

    const handleUpdateTournament = (orgId: string, tournamentId: string, data: Partial<Tournament>) => {
        const nextOrgs = orgs.map(org => {
            if (org.id === orgId) {
                return {
                    ...org,
                    tournaments: org.tournaments.map(t => t.id === tournamentId ? { ...t, ...data } : t)
                };
            }
            return org;
        });
        setOrgs(nextOrgs);
        forcePush(); // Persist to database
    };

    const handleUpdateFixture = async (orgId: string, fixtureId: string, data: Partial<MatchFixture>) => {
        const nextOrgs = orgs.map(org => {
            if (org.id === orgId) {
                return {
                    ...org,
                    fixtures: org.fixtures.map(f => f.id === fixtureId ? { ...f, ...data } : f)
                };
            }
            return org;
        });
        setOrgs(nextOrgs);
        await updateFixture(fixtureId, data);
        forcePush();
    };

    const handleRemoveFixture = async (orgId: string, fixtureId: string) => {
        const success = await deleteMatchFixture(fixtureId);
        if (success) {
            const nextOrgs = orgs.map(org => {
                if (org.id === orgId) {
                    return {
                        ...org,
                        fixtures: org.fixtures.filter(f => f.id !== fixtureId)
                    };
                }
                return org;
            });
            setOrgs(nextOrgs);
            forcePush();
        } else {
            alert('Failed to delete fixture.');
        }
    };

    const handleQuickCreateTeam = (name: string, playerNames: string[]) => {
        let targetOrg = orgs.find(o => o.name === 'Quick Play Teams');
        const newPlayers: Player[] = playerNames.map((pName, index) => ({
            id: generateId(`pl-${index}`),
            name: pName,
            role: 'All-rounder',
            stats: { runs: 0, wickets: 0, ballsFaced: 0, ballsBowled: 0, runsConceded: 0, matches: 0, catches: 0, runOuts: 0, stumpings: 0, fours: 0, sixes: 0, hundreds: 0, fifties: 0, ducks: 0, threeWickets: 0, fiveWickets: 0, maidens: 0 }
        }));
        if (newPlayers.length === 0) {
            for (let i = 1; i <= 12; i++) {
                newPlayers.push({ id: generateId(`pl-auto-${i}`), name: `Player ${i}`, role: i === 12 ? 'Bowler' : i < 3 ? 'Batsman' : 'All-rounder', stats: { runs: 0, wickets: 0, ballsFaced: 0, ballsBowled: 0, runsConceded: 0, matches: 0, catches: 0, runOuts: 0, stumpings: 0, fours: 0, sixes: 0, hundreds: 0, fifties: 0, ducks: 0, threeWickets: 0, fiveWickets: 0, maidens: 0 } });
            }
        }
        const newTeam: Team = { id: generateId('tm'), name: name, players: newPlayers };
        if (!targetOrg) {
            const newOrg: Organization = {
                id: generateId('org-qp'),
                name: 'Quick Play Teams',
                type: 'CLUB',
                createdBy: profile?.id,
                memberTeams: [newTeam],
                tournaments: [],
                groups: [],
                fixtures: [],
                members: profile ? [{ userId: profile.id, name: profile.name, handle: profile.handle, role: 'Administrator', addedAt: Date.now() }] : [],
                applications: [],
                country: 'Global',
                groundLocation: 'Virtual',
                establishedYear: new Date().getFullYear(),
                logoUrl: '',
                isPublic: false,
                sponsors: []
            };
            const nextOrgs = [...orgs, newOrg];
            setOrgs(nextOrgs);
        } else {
            const nextOrgs = orgs.map(o => o.id === targetOrg!.id ? { ...o, memberTeams: [...o.memberTeams, newTeam] } : o);
            setOrgs(nextOrgs);
        }
    };

    const handleAddMediaPost = (post: MediaPost) => {
        const nextPosts = [post, ...mediaPosts];
        setMediaPosts(nextPosts);
    };

    const handleDeleteMediaPost = async (postId: string) => {
        await deleteMediaPost(postId);
        const nextPosts = mediaPosts.filter(p => p.id !== postId);
        setMediaPosts(nextPosts);
    };

    const handleUpdateMediaPost = (updatedPost: MediaPost) => {
        const nextPosts = mediaPosts.map(p => p.id === updatedPost.id ? updatedPost : p);
        setMediaPosts(nextPosts);
    };

    const handleApplyForOrg = async (orgId: string) => {
        if (!profile || profile.role === 'Guest') { setEditingProfile(true); return; }

        // Use persistence similar to affiliation requests
        const success = await requestAffiliation(orgId, { applicantId: `join:${profile.id}` }); // Reuse helper

        if (success) {
            const nextOrgs = orgs.map(org => {
                if (org.id === orgId) {
                    const newApp: OrgApplication = {
                        id: generateId('app'),
                        type: 'USER_JOIN',
                        applicantId: profile.id,
                        applicantName: profile.name,
                        applicantHandle: profile.handle,
                        applicantImage: profile.avatarUrl,
                        status: 'PENDING',
                        timestamp: Date.now()
                    };
                    return { ...org, applications: [...(org.applications || []), newApp] };
                }
                return org;
            });
            setOrgs(nextOrgs);
            alert('Application Sent!');
            setIsApplyingForOrg(false);
        } else {
            alert('Failed to send application.');
        }
    };

    const handleSendInvite = async (org: Organization, player: UserProfile) => {
        if (!org || !player) return;

        // Use invite: prefix for recruitment
        const success = await requestAffiliation(org.id, { applicantId: `invite:${player.id}` });

        if (success) {
            const nextOrgs = orgs.map(o => {
                if (o.id === org.id) {
                    const newApp: OrgApplication = {
                        id: generateId('app'),
                        type: 'CLUB_INVITE',
                        applicantId: player.id,
                        applicantName: player.name,
                        applicantHandle: player.handle,
                        applicantImage: player.avatarUrl,
                        status: 'PENDING',
                        timestamp: Date.now()
                    };
                    return { ...o, applications: [...(o.applications || []), newApp] };
                }
                return o;
            });
            setOrgs(nextOrgs);
            alert(`Invite sent to ${player.name}!`);
        } else {
            alert('Failed to send invitation.');
        }
    };

    const handleRequestAffiliation = async (targetOrgId: string, applicantOrg: Organization) => {
        const nextOrgs = orgs.map(org => {
            if (org.id === targetOrgId) {
                const newApp: OrgApplication = {
                    id: generateId('app'),
                    type: 'ORG_AFFILIATE',
                    applicantId: applicantOrg.id,
                    applicantName: applicantOrg.name,
                    applicantHandle: '', // Not applicable for orgs
                    status: 'PENDING',
                    timestamp: Date.now()
                };
                // Fire and forget direct update
                requestAffiliation(targetOrgId, newApp);
                return { ...org, applications: [...(org.applications || []), newApp] };
            }
            return org;
        });
        setOrgs(nextOrgs);
        await forcePush(); // Force sync immediately
        alert(`Affiliation request sent to ${orgs.find(o => o.id === targetOrgId)?.name}!`);
    };

    const handleClaimProfile = async (playerId: string) => {
        if (!profile) return;
        const result = await claimPlayerProfile(playerId, profile.id, profile.name);
        if (result.success) {
            alert('Claim Request Sent! Admin will review it.');
        } else {
            alert(result.message || 'Failed to send claim request.');
        }
    };



    // ...

    const handleProcessApplication = async (orgId: string, appId: string, action: 'APPROVED' | 'REJECTED', role?: 'Administrator' | 'Scorer' | 'Player' | 'Club') => {
        // Find app in the specific org first
        const org = orgs.find(o => o.id === orgId);
        const app = org?.applications.find(a => a.id === appId);

        if (!org || !app) return;

        // NEW: Handle Player Claim
        if (app.type === 'PLAYER_CLAIM') {
            if (action === 'REJECTED') {
                alert("Rejection not fully implemented for claims yet. Please approve to clear.");
                return;
            }

            const success = await approvePlayerClaim(app.id, app.targetPlayerId!, app.applicantId);

            if (success) {
                const nextOrgs = orgs.map(o => {
                    if (o.id === orgId) {
                        return {
                            ...o,
                            // Remove the application since it is deleted from DB
                            applications: o.applications.filter(a => a.id !== appId),
                            // If approved, update local player state
                            memberTeams: action === 'APPROVED' ? o.memberTeams.map(t => ({
                                ...t,
                                players: t.players.map(p => p.id === app?.targetPlayerId ? { ...p, userId: app.applicantId } : p)
                            })) : o.memberTeams
                        };
                    }
                    return o;
                });
                setOrgs(nextOrgs);
                alert("Claim Approved!");
            } else {
                alert('Failed to update player claim status.');
            }
            return;
        }

        // NEW: Handle User Join
        if (app.type === 'USER_JOIN') {
            const success = await updateAffiliationStatus(orgId, `join:${app.applicantId}`, action);
            if (!success) {
                alert('Failed to update application status.');
                return;
            }

            const nextOrgs = orgs.map(o => {
                if (o.id === orgId) {
                    let newMembers = o.members;
                    // If approved, add to members
                    if (action === 'APPROVED' && !o.members.some(m => m.userId === app?.applicantId)) {
                        newMembers = [...o.members, {
                            userId: app?.applicantId || '',
                            name: app?.applicantName || 'New Member',
                            handle: app?.applicantHandle || '',
                            role: (role === 'Administrator' || role === 'Scorer') ? role : 'Player', // Default role logic
                            addedAt: Date.now()
                        }];
                    }

                    return {
                        ...o,
                        applications: o.applications.map(a => a.id === appId ? { ...a, status: action } : a),
                        members: newMembers
                    };
                }
                return o;
            });
            setOrgs(nextOrgs);

            // Update Profile if it is the current user (optimistic)
            if (action === 'APPROVED' && profile?.id === app.applicantId) {
                if (!profile.joinedClubIds?.includes(orgId)) {
                    const updatedProfile = {
                        ...profile,
                        joinedClubIds: [...(profile.joinedClubIds || []), orgId]
                    };
                    updateProfile(updatedProfile);
                }
            }
            return;
        }

        const isAffiliation = app.type === 'ORG_AFFILIATE';
        const childOrgId = app.applicantId;

        // 1. Update DB
        const success = await updateAffiliationStatus(orgId, isAffiliation ? childOrgId : appId, action);
        if (!success) {
            alert('Failed to update application status.');
            return;
        }

        const updatedOrgs = orgs.map(org => {
            if (org.id === orgId) {
                const updatedApps = org.applications.map(a => a.id === appId ? { ...a, status: action } : a);
                let newChildIds = org.childOrgIds || [];
                if (action === 'APPROVED' && isAffiliation && !newChildIds.includes(childOrgId)) {
                    newChildIds = [...newChildIds, childOrgId];
                }

                let newMembers = org.members;
                let updatedTeams = org.memberTeams;

                if (action === 'APPROVED' && !isAffiliation && role) {
                    if (role === 'Club') {
                        // Create New Team from Application
                        const newTeam: Team = {
                            id: `tm-${Date.now()}`,
                            name: app.applicantName,
                            players: [],
                            // Optional: Add logo if available
                            logoUrl: app.applicantImage
                        };
                        updatedTeams = [...updatedTeams, newTeam];

                        // Add User as Team Admin
                        if (!org.members.some(m => m.userId === app.applicantId)) {
                            newMembers = [...org.members, {
                                userId: app.applicantId,
                                name: app.applicantName,
                                handle: app.applicantHandle || '',
                                role: 'Administrator',
                                managedTeamId: newTeam.id,
                                addedAt: Date.now()
                            }];
                        }
                    } else {
                        // Existing Logic for Player/Scorer/Admin
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
                }
                return { ...org, applications: updatedApps, childOrgIds: newChildIds, members: newMembers, memberTeams: updatedTeams };
            }

            if (org.id === childOrgId && action === 'APPROVED' && isAffiliation) {
                const newParentIds = org.parentOrgIds || [];
                if (!newParentIds.includes(orgId)) {
                    // Use Set to strictly prevent duplicates
                    const uniqueParents = Array.from(new Set([...newParentIds, orgId]));
                    return { ...org, parentOrgIds: uniqueParents };
                }
            }
            return org;
        });

        setOrgs(updatedOrgs);

        if (!isAffiliation && action === 'APPROVED' && profile?.id === app.applicantId) {
            if (profile.joinedClubIds?.includes(orgId)) return;
            const updatedProfile = {
                ...profile,
                joinedClubIds: [...(profile.joinedClubIds || []), orgId],
                notifications: [...(profile.notifications || []), {
                    id: `notif-${Date.now()}`,
                    type: 'ALERT',
                    title: 'Application Accepted',
                    message: `You have been accepted into ${org.name}.`,
                    timestamp: Date.now(),
                    read: false
                }] as any
            };
            updateProfile(updatedProfile);
        }
    };

    const handleUpdateFixtureSquad = async (fixtureId: string, squadIds: string[]) => {
        const fixture = allFixtures.find(f => f.id === fixtureId);
        if (!fixture || !myTeam) return;

        let updates: Partial<MatchFixture> = {};
        if (fixture.teamAId === myTeam.id) {
            updates = { teamASquadIds: squadIds };
        } else if (fixture.teamBId === myTeam.id) {
            updates = { teamBSquadIds: squadIds };
        } else {
            return;
        }

        // Optimistic Update
        const nextOrgs = orgs.map(org => {
            if (org.fixtures.some(f => f.id === fixtureId)) {
                return {
                    ...org,
                    fixtures: org.fixtures.map(f => f.id === fixtureId ? { ...f, ...updates } : f)
                };
            }
            return org;
        });
        setOrgs(nextOrgs); // This triggers allFixtures update

        await updateFixture(fixtureId, updates);
        alert('Squad Saved Successfully!');
    };


    // --- Create New User (Scoped) ---
    const handleCreateUser = async (newUser: UserProfile, password: string): Promise<UserCreationResult> => {
        try {
            console.log("Creating user with Supabase Auth...", newUser.handle);

            // 1. Create Supabase Auth account
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: newUser.email!,
                password: password,
                options: {
                    data: {
                        name: newUser.name,
                        handle: newUser.handle
                    }
                }
            });

            if (authError) {
                console.error("Auth account creation failed:", authError);
                return { success: false, error: { message: authError.message } };
            }

            if (!authData.user) {
                return { success: false, error: { message: "Failed to create auth account" } };
            }

            // 2. Insert into user_profiles table
            const { error: profileError } = await supabase
                .from('user_profiles')
                .insert({
                    id: authData.user.id,
                    email: newUser.email,
                    handle: newUser.handle,
                    name: newUser.name,
                    role: newUser.role,
                    avatar_url: newUser.avatarUrl,
                    created_at: new Date().toISOString(),
                    player_details: newUser.playerDetails || null,
                    scorer_details: newUser.scorerDetails || null
                });

            if (profileError) {
                console.error("Profile insertion failed:", profileError);
                // Auth account was created but profile failed - this is a partial failure
                return { success: false, error: { message: `Profile creation failed: ${profileError.message}` } };
            }

            // 3. Update local state with the database-assigned ID
            const createdUser: UserProfile = {
                ...newUser,
                id: authData.user.id,
                createdAt: Date.now()
            };
            setGlobalUsers(prev => [...prev, createdUser]);

            console.log("User created successfully:", createdUser.handle, createdUser.id);
            return { success: true, userId: authData.user.id };

        } catch (error: any) {
            console.error("Unexpected error during user creation:", error);
            return { success: false, error: { message: error.message || "Unknown error occurred" } };
        }
    };


    // --- Player Transfer ---
    const handleTransferPlayer = (playerId: string, toTeamId: string) => { };

    const handleSubmitMatchReport = (report: MatchReportSubmission) => {
        console.log("📝 Captain submitting match report:", report);

        // Find the fixture and update it
        const updatedStandalone = standaloneMatches.map(m =>
            m.id === report.matchId ? { ...m, reportSubmission: report } : m
        );
        setStandaloneMatches(updatedStandalone);

        // Update org fixtures
        const updatedOrgs = orgs.map(org => ({
            ...org,
            fixtures: org.fixtures.map(f =>
                f.id === report.matchId ? { ...f, reportSubmission: report } : f
            )
        }));
        setOrgs(updatedOrgs);

        alert("Match report submitted for admin review!");
    };

    const handleSubmitUmpireReport = (report: any) => {
        console.log("🏏 Umpire submitting match report:", report);

        // Find the fixture and update it with umpire report
        const updatedStandalone = standaloneMatches.map(m =>
            m.id === report.matchId ? { ...m, umpireReport: report } : m
        );
        setStandaloneMatches(updatedStandalone);

        // Update org fixtures
        const updatedOrgs = orgs.map(org => ({
            ...org,
            fixtures: org.fixtures.map(f =>
                f.id === report.fixtureId ? { ...f, umpireReport: report } : f
            )
        }));
        setOrgs(updatedOrgs);

        alert("Umpire match report submitted successfully!");
        setActiveTab('umpire_hub');
    };

    const handleVerifyReport = (reportId: string) => {
        const fixture = allFixtures.find(f => f.reportSubmission?.id === reportId);
        if (!fixture || !fixture.reportSubmission) return;

        const updatedOrgs = updatePlayerStatsFromReport(orgs, fixture.reportSubmission);
        setOrgs(updatedOrgs);
        setViewMatchId(null);
        alert('Match Verified! Player stats have been updated.');
    };

    const handleRejectReport = (reportId: string, feedback: string) => {
        const nextOrgs = orgs.map(org => ({
            ...org,
            fixtures: org.fixtures.map(f => {
                if (f.reportSubmission?.id === reportId) {
                    return {
                        ...f,
                        reportSubmission: { ...f.reportSubmission, status: 'REJECTED' as const, adminFeedback: feedback }
                    };
                }
                return f;
            })
        }));
        setOrgs(nextOrgs);
        setViewMatchId(null);
        alert('Report Rejected.');
    };

    const handleAcceptFixture = async (fixtureId: string) => {
        // 1. Update State Locally First
        const nextOrgs = orgs.map(o => ({
            ...o,
            fixtures: o.fixtures.map(f => f.id === fixtureId ? { ...f, scorerId: profile.id, status: f.status === 'Scheduled' ? 'Live' : f.status } : f)
        }));
        setOrgs(nextOrgs);
        forcePush();

        // 2. Launch Match Interface
        const targetMatch = nextOrgs.flatMap(o => o.fixtures).find(f => f.id === fixtureId);
        if (targetMatch) {
            setActiveMatch(targetMatch);
            // readOnlyMode is now derived automatically
            setActiveTab('scorer');
        }
    };

    const handleSwitchTab = (tab: any) => {
        if (tab !== 'captain_hub') {
            setSelectedHubTeamId(null);
        }
        // Intercept Scorer tab click to auto-resume active match
        if (tab === 'scorer') {
            if (ongoingMatch && !activeMatch && profile?.id === ongoingMatch.scorerId) {
                console.log('Auto-resuming ongoing match from menu click');
                setActiveMatch(ongoingMatch);
            }
        }
        setActiveTab(tab);
    };

    const handleSwitchViewRole = (role: UserProfile['role']) => {
        setActiveViewRole(role);
        // Automatic navigation based on role
        switch (role) {
            case 'Administrator':
                setActiveTab('home');
                break;
            case 'Captain':
                setActiveTab('captain_hub');
                break;
            case 'Scorer':
                setActiveTab('career'); // Scorer Profile
                break;
            case 'Player':
                setActiveTab('career'); // Player Career
                break;
            case 'Umpire':
                setActiveTab('umpire_hub');
                break;
            case 'Coach':
                setActiveTab('home'); // Coaches use Admin Hub for now
                break;
            default:
                setActiveTab('home');
        }
    };

    const handleSwitchProfile = (type: 'ADMIN' | 'SCORER' | 'FAN' | 'COACH' | 'UMPIRE' | 'PLAYER' | 'GUEST' | 'CAPTAIN') => {
        const base = { id: `dev-${type.toLowerCase()}-${Date.now()}`, createdAt: Date.now() };
        let newProfile: UserProfile;

        switch (type) {
            case 'ADMIN':
                newProfile = {
                    ...base,
                    name: 'Central Zone Admin',
                    handle: '@cz_admin',
                    role: 'Administrator',
                    joinedClubIds: ['org-central-zone']
                };

                // Ensure Central Zone exists and user is a member
                const czExists = orgs.find(o => o.id === 'org-central-zone');
                if (czExists) {
                    // Add user to members if not present
                    if (!czExists.members.some(m => m.userId === newProfile.id)) {
                        const updatedOrgs = orgs.map(o => o.id === 'org-central-zone' ? {
                            ...o,
                            members: [...o.members, {
                                userId: newProfile.id,
                                name: newProfile.name,
                                handle: newProfile.handle,
                                role: 'Administrator' as const,
                                addedAt: Date.now()
                            }]
                        } : o);
                        setOrgs(updatedOrgs);
                    }
                } else {
                    // Create Central Zone if missing
                    setOrgs([...orgs, {
                        id: 'org-central-zone',
                        name: 'Central Zone',
                        type: 'GOVERNING_BODY',
                        country: 'Global',
                        isPublic: true,
                        allowUserContent: true,
                        tournaments: [],
                        groups: [],
                        memberTeams: [],
                        fixtures: [],
                        members: [{
                            userId: newProfile.id,
                            name: newProfile.name,
                            handle: newProfile.handle,
                            role: 'Administrator' as const,
                            addedAt: Date.now()
                        }],
                        applications: [],
                        sponsors: [],
                        establishedYear: 2026
                    }]);
                }
                break;
            case 'SCORER': newProfile = { ...base, name: 'Dev Scorer', handle: '@dev_scorer', role: 'Scorer', scorerDetails: { isHireable: true, experienceYears: 5 } }; break;
            case 'PLAYER': newProfile = { ...base, name: 'Dev Player', handle: '@dev_player', role: 'Player', playerDetails: { battingStyle: 'Right-hand', bowlingStyle: 'Leg-break', primaryRole: 'All-rounder', lookingForClub: true, isHireable: false } }; break;
            case 'CAPTAIN':
                newProfile = { ...base, id: 'dev-captain-fixed', name: 'Dev Captain', handle: '@the_captain', role: 'Player', playerDetails: { battingStyle: 'Right-hand', bowlingStyle: 'Medium-fast', primaryRole: 'Batsman', lookingForClub: false, isHireable: false } };
                // Ensure they are in a team to activate Captain's Hub
                if (allTeams.length > 0) {
                    const firstTeam = allTeams[0];
                    let updatedOrgs = [...orgs];
                    let changed = false;

                    // 1. Ensure Player is in Team
                    if (!firstTeam.players.some(p => p.id === newProfile.id)) {
                        updatedOrgs = updatedOrgs.map(org => {
                            if (org.memberTeams.some(t => t.id === firstTeam.id)) {
                                return {
                                    ...org,
                                    memberTeams: org.memberTeams.map(t => t.id === firstTeam.id ? {
                                        ...t,
                                        players: [...t.players, {
                                            id: newProfile.id, name: newProfile.name, role: 'Batsman' as const,
                                            stats: { runs: 1250, wickets: 12, ballsFaced: 1100, ballsBowled: 240, runsConceded: 180, matches: 45, catches: 15, runOuts: 2, stumpings: 0, fours: 120, sixes: 45, hundreds: 2, fifties: 8, ducks: 1, threeWickets: 1, fiveWickets: 0, maidens: 4 }
                                        }]
                                    } : t)
                                };
                            }
                            return org;
                        });
                        changed = true;
                    }

                    // 2. Ensure Completed Fixture Pending Report
                    const hasPendingReport = allFixtures.some(f =>
                        (f.teamAId === firstTeam.id || f.teamBId === firstTeam.id) &&
                        f.status === 'Completed' &&
                        !f.reportSubmission
                    );

                    if (!hasPendingReport) {
                        const mockFixtureId = `fixture-mock-pending-${Date.now()}`;
                        updatedOrgs = updatedOrgs.map(org => {
                            if (org.memberTeams.some(t => t.id === firstTeam.id)) {
                                return {
                                    ...org,
                                    fixtures: [...org.fixtures, {
                                        id: mockFixtureId,
                                        teamAId: firstTeam.id,
                                        teamBId: 'mock-opp-1',
                                        teamAName: firstTeam.name,
                                        teamBName: 'Challengers XI',
                                        date: new Date(Date.now() - 86400000).toISOString(),
                                        venue: 'Demo Ground',
                                        status: 'Completed',
                                        type: 'T20',
                                        isOfficial: true,
                                        oversPerInnings: 20
                                    }]
                                };
                            }
                            return org;
                        });
                        changed = true;
                    }

                    if (changed) {
                        setOrgs(updatedOrgs);
                    }
                }
                break;
            case 'GUEST': newProfile = MOCK_GUEST_PROFILE; break;
            default: newProfile = { ...base, name: `Dev ${type}`, handle: `@dev_${type.toLowerCase()}`, role: type as any };
        }
        updateProfile(newProfile);
        setActiveTab(type === 'CAPTAIN' ? 'captain_hub' : 'home');
    };

    const handleProfileComplete = async (p: UserProfile) => {
        updateProfile(p);
        setEditingProfile(false);
        setActiveTab('home');
    };

    if (isAppLoading) {
        const logoPath = window.wpApiSettings?.plugin_url ? `${window.wpApiSettings.plugin_url}logo.jpg` : 'logo.jpg';
        return (
            <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

                <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
                    <img
                        src={logoPath}
                        alt="Cricket Core Pro"
                        className="w-48 h-48 md:w-64 md:h-64 object-contain mb-8 drop-shadow-2xl animate-pulse"
                    />

                    <div className="relative w-64 h-2 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite]"></div>
                    </div>

                    <p className="text-white text-sm font-black uppercase tracking-[0.3em] mt-8 animate-pulse">Loading...</p>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Cricket is Life, Enjoy It</p>
                    <p className="text-slate-600 text-[9px] font-bold uppercase tracking-widest">Powered by Mitchipoohdevs</p>
                </div>
                <style>{`@keyframes loading { 0% { transform: translateX(-100%); } 50% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }`}</style>
            </div>
        );
    }

    if (!profile || editingProfile) {
        return (
            <ProfileSetup
                onComplete={handleProfileComplete}
                onCancel={editingProfile ? () => setEditingProfile(false) : undefined}
                initialMode={profileSetupMode}
            />
        );
    }

    const myClubOrg = profile.joinedClubIds && profile.joinedClubIds.length > 0 ? orgs.find(o => o.id === profile.joinedClubIds![0]) : null;

    return (
        <ErrorBoundary>
            <Layout
                activeTab={activeTab}
                onTabChange={setActiveTab}
                profile={profile}
                theme={theme}
                organizations={orgs}
                viewingOrgId={viewingOrgId}
                onThemeToggle={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
                settings={settings}
                onToggleSetting={(k) => updateSettings({ ...settings, [k]: k === 'devMode' ? !settings.devMode : !settings[k] })}
                onEditProfile={() => {
                    if (profile.role === 'Guest') {
                        setProfileSetupMode('CREATE');
                        setEditingProfile(true);
                    } else {
                        setEditingProfile(true);
                        setProfileSetupMode('CREATE'); // Actually irrelevant since skipping setup mode reset inside
                    }
                }}
                onApplyForAccreditation={() => setIsApplyingForOrg(true)}
                onSignOut={async () => {
                    if (user) {
                        await signOut();
                    }
                    updateProfile(MOCK_GUEST_PROFILE);
                }}
                onSignIn={() => {
                    setProfileSetupMode('LOGIN');
                    setEditingProfile(true);
                }}
                onSignUp={() => {
                    setProfileSetupMode('CREATE');
                    setEditingProfile(true);
                }}
                onSwitchProfile={handleSwitchProfile}
                showCaptainHub={true}
                activeViewRole={activeViewRole}
            >
                <ApplicationModal isOpen={isApplyingForOrg} onClose={() => setIsApplyingForOrg(false)} organizations={orgs.filter(o => !profile.joinedClubIds?.includes(o.id))} onApply={handleApplyForOrg} />

                <ScoringConflictModal
                    isOpen={showConflictModal}
                    onClose={() => setShowConflictModal(false)}
                    matches={conflictMatches}
                    onCloseAllAndContinue={handleCloseAllConflicts}
                    onIgnoreAndContinue={() => { setShowConflictModal(false); setActiveTab('setup'); }}
                />

                <div id="csp-view-container" className="h-full flex flex-col min-h-0">
                    <TeamProfileModal
                        team={allTeams.find(t => t.id === viewingTeamId) || null}
                        isOpen={!!viewingTeamId}
                        onClose={() => setViewingTeamId(null)}
                        allFixtures={allFixtures}
                        onViewPlayer={(pId) => setViewingPlayerId(pId)}
                        isFollowed={viewingTeamId ? following.teams.includes(viewingTeamId) : false}
                        onToggleFollow={() => viewingTeamId && toggleFollowing('TEAM', viewingTeamId)}
                        onViewMatch={(m) => { setViewMatchId(m.id); setActiveTab('media'); }}
                        onUpdateTeam={(profile.role === 'Administrator' || (viewingTeamId && orgs.some(o => o.members.some(m => m.userId === profile.id && ((m.role === 'Administrator' && !m.managedTeamId) || m.managedTeamId === viewingTeamId))))) ? (updates) => {
                            const nextOrgs = orgs.map(o => ({
                                ...o,
                                memberTeams: o.memberTeams.map(t => t.id === viewingTeamId ? { ...t, ...updates } : t)
                            }));
                            setOrgs(nextOrgs);
                        } : undefined}
                        onDeleteTeam={(profile.role === 'Administrator' || (viewingTeamId && orgs.some(o => o.members.some(m => m.userId === profile.id && (m.role === 'Administrator' && !m.managedTeamId))))) ? () => {
                            const nextOrgs = orgs.map(o => ({
                                ...o,
                                memberTeams: o.memberTeams.filter(t => t.id !== viewingTeamId)
                            }));
                            setOrgs(nextOrgs);
                            setViewingTeamId(null);
                        } : undefined}
                        onRequestCaptainHub={(profile.role === 'Administrator' || (viewingTeamId && orgs.some(o => o.members.some(m => m.userId === profile.id && (m.role === 'Administrator'))))) ? () => {
                            if (viewingTeamId) {
                                setSelectedHubTeamId(viewingTeamId);
                                handleSwitchTab('captain_hub');
                                setViewingTeamId(null);
                            }
                        } : undefined}
                    />
                    <PlayerProfileModal
                        player={allPlayers.find(p => p.id === viewingPlayerId) || null}
                        isOpen={!!viewingPlayerId}
                        onClose={() => setViewingPlayerId(null)}
                        isFollowed={viewingPlayerId ? following.players.includes(viewingPlayerId) : false}
                        onToggleFollow={() => viewingPlayerId && toggleFollowing('PLAYER', viewingPlayerId)}
                        onClaim={handleClaimProfile}
                        allFixtures={allFixtures}
                        onViewMatch={(m) => { setViewMatchId(m.id); setActiveTab('media'); }}
                        onUpdatePlayer={(profile.role === 'Administrator' || (viewingPlayerId && orgs.some(o => o.members.some(m => m.userId === profile.id && ((m.role === 'Administrator' && !m.managedTeamId) || (m.managedTeamId && allPlayers.find(p => p.id === viewingPlayerId)?.teamId === m.managedTeamId)))))) ? (updates) => {
                            const p = allPlayers.find(p => p.id === viewingPlayerId);
                            if (!p) return;
                            const nextOrgs = orgs.map(o => ({
                                ...o,
                                memberTeams: o.memberTeams.map(t => t.id === p.teamId ? { ...t, players: t.players.map(pl => pl.id === p.id ? { ...pl, ...updates } : pl) } : t)
                            }));
                            setOrgs(nextOrgs);
                        } : undefined}
                        onDeletePlayer={(profile.role === 'Administrator' || (viewingPlayerId && orgs.some(o => o.members.some(m => m.userId === profile.id && ((m.role === 'Administrator' && !m.managedTeamId) || (m.managedTeamId && allPlayers.find(p => p.id === viewingPlayerId)?.teamId === m.managedTeamId)))))) ? (id) => {
                            const p = allPlayers.find(p => p.id === id);
                            if (!p) return;
                            const nextOrgs = orgs.map(o => ({
                                ...o,
                                memberTeams: o.memberTeams.map(t => t.id === p.teamId ? { ...t, players: t.players.filter(pl => pl.id !== id) } : t)
                            }));
                            setOrgs(nextOrgs);
                            setViewingPlayerId(null);
                        } : undefined}
                    />

                    {activeTab === 'home' && (
                        <AdminCenter
                            organizations={orgs} standaloneMatches={standaloneMatches} userRole={profile.role}
                            onStartMatch={(m) => {
                                if (m.status === 'Scheduled') {
                                    handleRequestSetup(m);
                                } else {
                                    setActiveMatch(m);
                                    setActiveTab('scorer');
                                }
                            }} onViewMatch={(m) => { setViewMatchId(m.id); setActiveTab('media'); }} onRequestSetup={() => handleRequestSetup(null)}
                            onUpdateOrgs={setOrgs} onCreateOrg={handleCreateOrg} onAddTeam={handleAddTeam}
                            onProcessApplication={handleProcessApplication}
                            onRemoveTeam={handleRemoveTeam}
                            onRemoveTournament={handleRemoveTournament}
                            onUpdateTournament={handleUpdateTournament}
                            onUpdateFixture={handleUpdateFixture}
                            onRemoveFixture={handleRemoveFixture}
                            allOrganizations={orgs}
                            onBulkAddPlayers={(tid, pl) => { const next = orgs.map(o => ({ ...o, memberTeams: o.memberTeams.map(t => t.id === tid ? { ...t, players: [...t.players, ...pl] } : t) })); setOrgs(next); forcePush(); }} onAddGroup={(oid, gn) => { const next = orgs.map(o => o.id === oid ? { ...o, groups: [...o.groups, { id: `grp-${Date.now()}`, name: gn, teams: [] }] } : o); setOrgs(next); forcePush(); }}
                            onUpdateGroupTeams={(oid, gid, tids) => { const next = orgs.map(o => o.id === oid ? { ...o, groups: o.groups.map(g => g.id === gid ? { ...g, teams: o.memberTeams.filter(t => tids.includes(t.id)) } : g) } : o); setOrgs(next); }}
                            onAddTournament={(oid, trn) => { const next = orgs.map(o => o.id === oid ? { ...o, tournaments: [...o.tournaments, trn] } : o); setOrgs(next); }} mediaPosts={mediaPosts} onAddMediaPost={handleAddMediaPost}
                            onViewTeam={(tid) => setViewingTeamId(tid)} onOpenMediaStudio={() => setActiveTab('media')} following={following} onToggleFollow={toggleFollowing} hireableScorers={hireableScorers} currentUserId={profile.id}
                            onApplyForOrg={handleApplyForOrg} currentUserProfile={profile}
                            showCaptainHub={true} onOpenCaptainHub={() => setActiveTab('captain_hub')}
                            onRequestMatchReports={() => setActiveTab('stats')}
                            onRequestTransferMarket={() => setActiveTab('transfer_market')}
                            onUpdateProfile={updateProfile}
                            issues={issues}
                            onUpdateIssues={setIssues}
                            onRequestAffiliation={handleRequestAffiliation}
                            onViewOrg={(orgId) => { setViewingOrgId(orgId); setActiveTab('media'); }}
                            onCreateUser={handleCreateUser}
                            mockGlobalUsers={globalUsers} // FIX: Pass global users for search
                            activeViewRole={activeViewRole}
                            onSwitchViewRole={handleSwitchViewRole}
                        />

                    )}

                    {activeTab === 'my_matches' && (
                        <div className="max-w-4xl mx-auto p-4 content-container">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">My Matches</h2>
                                <button onClick={() => handleRequestSetup(null)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-md">Start New</button>
                            </div>

                            {/* Filter standalone matches or matches where user is player/captain */}
                            {(() => {
                                // Debug: Log all available matches
                                console.log('MY_MATCHES_DEBUG: Total standalone matches:', standaloneMatches.length);
                                console.log('MY_MATCHES_DEBUG: Total org fixtures:', orgs.flatMap(o => o.fixtures).length);
                                console.log('MY_MATCHES_DEBUG: User profile ID:', profile.id);

                                const myMatches = [...standaloneMatches, ...orgs.flatMap(o => o.fixtures)].filter(f => {
                                    // Check if user is in Playing XI (need player IDs on fixture, or check teams)
                                    // For simplicity, checking if user's team is involved
                                    const myTeamIds = allTeams.filter(t => t.players.some(p => p.id === profile.id)).map(t => t.id);

                                    // Include match if:
                                    // 1. User is a player on either team
                                    // 2. User is the scorer
                                    // 3. User is an umpire
                                    // 4. It's a standalone match created by this user (scorerId matches)
                                    const isPlayerMatch = myTeamIds.includes(f.teamAId) || myTeamIds.includes(f.teamBId);
                                    const isScorer = f.scorerId === profile.id;
                                    const isUmpire = f.umpires?.includes(profile.id);
                                    const isStandaloneCreator = !f.tournamentId && f.scorerId === profile.id;

                                    const shouldInclude = isPlayerMatch || isScorer || isUmpire || isStandaloneCreator;

                                    if (shouldInclude) {
                                        console.log('MY_MATCHES_DEBUG: Including match:', {
                                            id: f.id,
                                            teams: `${f.teamAName} vs ${f.teamBName}`,
                                            reason: isPlayerMatch ? 'player' : isScorer ? 'scorer' : isUmpire ? 'umpire' : 'standalone creator'
                                        });
                                    }

                                    return shouldInclude;
                                }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                                console.log('MY_MATCHES_DEBUG: Filtered matches count:', myMatches.length);

                                if (myMatches.length === 0) {
                                    return (
                                        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No matches found</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="grid gap-4">
                                        {myMatches.map(match => (
                                            <div key={match.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:shadow-md transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-xs ${match.status === 'Live' ? 'bg-red-500 animate-pulse' : match.status === 'Completed' ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                                                        {match.status === 'Live' ? 'LIVE' : match.status === 'Completed' ? 'FT' : 'SCH'}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-slate-900 dark:text-white text-sm">{match.teamAName} vs {match.teamBName}</h3>
                                                        <p className="text-xs text-slate-500 font-bold">{new Date(match.date).toLocaleDateString()} • {match.venue}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {match.status === 'Live' && match.scorerId === profile.id ? (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setActiveMatch(match); setActiveTab('scorer'); }}
                                                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg"
                                                        >
                                                            Resume Scoring
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => { setViewMatchId(match.id); setActiveTab('media'); }}
                                                            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                                        >
                                                            View Details
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {activeTab === 'my_tournaments' && (
                        <div className="max-w-4xl mx-auto p-4 content-container">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest italic">My Tournaments</h2>
                                <button onClick={() => setActiveTab('create_tournament')} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg">New Tournament</button>
                            </div>

                            {(() => {
                                // Find all tournaments created by user across all organizations
                                const myTournaments = orgs.flatMap(org =>
                                    (org.tournaments || []).filter(t => t.createdBy === profile.id).map(t => ({ ...t, orgName: org.name }))
                                ).sort((a, b) => (b.startDate ? new Date(b.startDate).getTime() : 0) - (a.startDate ? new Date(a.startDate).getTime() : 0));

                                if (myTournaments.length === 0) {
                                    return (
                                        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                                            <div className="text-4xl mb-4">🏆</div>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">No Tournaments Found</h3>
                                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Tournaments you create will appear here.</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="grid gap-4">
                                        {myTournaments.map(t => (
                                            <div key={t.id} className="group bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all cursor-pointer" onClick={() => { setViewingOrgId(orgs.find(o => o.tournaments.some(trn => trn.id === t.id))?.id || null); setActiveTab('my_tournaments'); /* This needs proper navigation to ORG > TRN view */ }}>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
                                                            {t.orgName} - {t.name}
                                                        </h3>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{t.format}</span>
                                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.status || 'Draft'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{t.startDate ? new Date(t.startDate).toLocaleDateString() : 'N/A'}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Start Date</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <ProfileSetup existingProfile={profile} onComplete={(p) => { updateProfile(p); setActiveTab('home'); }} onCancel={() => setActiveTab('home')} initialMode="CREATE" />
                    )}

                    {activeTab === 'my_teams' && (
                        <div className="p-6">
                            <h2 className="text-2xl font-black text-white mb-6">My Teams & Registry</h2>
                            <TeamRegistry allTeams={allTeams} allOrganizations={orgs} onViewTeam={setViewingTeamId} onBack={() => setActiveTab('home')} />
                        </div>
                    )}

                    {activeTab === 'my_clubs' && (
                        <div className="max-w-7xl mx-auto p-4">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest italic mb-6 px-4">My Managed Clubs</h2>
                            <div className="grid grid-cols-1 gap-8">
                                {orgs.filter(o => o.createdBy === profile.id).map(org => (
                                    <div key={org.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                                        <OrganizationView
                                            organization={org}
                                            userRole="Administrator"
                                            onBack={() => { }}
                                            onViewTournament={(tId) => setViewingTournamentId(tId)}
                                            onViewPlayer={setViewingPlayerId as any}
                                            onRequestAddTeam={() => setViewingOrgId(org.id)}
                                            onRequestAddTournament={() => setViewingOrgId(org.id)}
                                            players={org.memberTeams.flatMap(t => t.players.map(p => ({ ...p, teamName: t.name, teamId: t.id, orgId: org.id, orgName: org.name })))}
                                            onViewTeam={setViewingTeamId}
                                            isFollowed={following.orgs.includes(org.id)}
                                            onToggleFollow={() => toggleFollowing('ORG', org.id)}
                                            globalUsers={[]}
                                            onAddMember={() => { }}
                                            onUpdateOrg={(id, d) => { setOrgs(orgs.map(o => o.id === id ? { ...o, ...d } : o)); forcePush(); }}
                                            onRemoveTeam={handleRemoveTeam}
                                            onRemoveTournament={handleRemoveTournament}
                                            onUpdateTournament={handleUpdateTournament}
                                            onRemoveFixture={handleRemoveFixture}
                                            onProcessApplication={handleProcessApplication}
                                            allOrganizations={orgs}
                                            currentUserProfile={profile}
                                            onUpdateFixture={handleUpdateFixture}
                                            onApplyForOrg={handleApplyForOrg}
                                            onRequestAffiliation={handleRequestAffiliation}
                                            onSelectHubTeam={setSelectedHubTeamId}
                                            onCreateUser={async () => ({ success: false })}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'career' && (
                        <div className="max-w-7xl mx-auto p-4 md:p-8">
                            {activeViewRole === 'Scorer' ? (
                                <ScorerProfile
                                    profile={profile}
                                    fixtures={allFixtures}
                                    onUpdateProfile={updateProfile}
                                    onAcceptFixture={handleAcceptFixture}
                                    onBack={() => handleSwitchTab('media')}
                                    onUpdateMatchState={handleUpdateMatchState}
                                />
                            ) : (
                                <PlayerCareer
                                    profile={profile}
                                    onUpdateProfile={updateProfile}
                                    showCaptainHub={profile.role === 'Administrator' || activeViewRole === 'Captain'}
                                    onOpenCaptainHub={() => handleSwitchTab('captain_hub')}
                                    onBack={() => handleSwitchTab('media')}
                                />
                            )}
                        </div>
                    )}

                    {activeTab === 'umpire_hub' && (
                        <UmpireProfile
                            profile={profile}
                            fixtures={allFixtures}
                            organizations={orgs}
                            allTeams={allTeams}
                            onBack={() => handleSwitchTab('media')}
                            onCreateFixture={() => setActiveTab('setup')}
                            onSubmitReport={(report) => {
                                handleSubmitUmpireReport(report);
                                alert('Umpire Report Submitted!');
                            }}
                        />
                    )}

                    {activeTab === 'create_tournament' && (
                        <div className="max-w-4xl mx-auto p-6 md:p-12">
                            {trnCreationMode === 'SELECT' ? (
                                <>
                                    <div className="text-center mb-12">
                                        <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-3">Launch Tournament</h2>
                                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Choose your organization or start standalone</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                                        {/* Option 1: Standalone */}
                                        <div className="group bg-white dark:bg-slate-900 p-10 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:border-indigo-500/30 transition-all cursor-pointer overflow-hidden relative" onClick={() => setTrnCreationMode('STANDALONE')}>
                                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-3xl mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">⚡</div>
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Standalone</h3>
                                            <p className="text-slate-500 text-sm font-bold leading-relaxed">
                                                Perfect for exhibition matches or informal multi-day series without complex governing bodies.
                                            </p>
                                        </div>

                                        {/* Option 2: Organization-bound */}
                                        <div className="group bg-slate-900 dark:bg-indigo-950 p-10 rounded-[3rem] shadow-2xl hover:shadow-indigo-500/20 hover:scale-[1.02] transition-all cursor-pointer overflow-hidden relative" onClick={() => { setActiveTab('my_clubs'); }}>
                                            <div className="absolute top-0 right-0 p-6 flex gap-1 opacity-20">
                                                {[1, 2, 3].map(i => <div key={i} className="w-4 h-4 rounded-full bg-white"></div>)}
                                            </div>
                                            <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-3xl mb-8 group-hover:bg-white group-hover:text-slate-900 transition-all">🏢</div>
                                            <h3 className="text-2xl font-black text-white mb-3">Via Organization</h3>
                                            <p className="text-slate-400 text-sm font-bold leading-relaxed">
                                                Launch official leagues, manage multiple groups, and track full affiliation history under a club or board.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 flex items-center justify-center gap-6">
                                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Need a new organization?</div>
                                        <button onClick={() => setActiveTab('register_club')} className="px-8 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-md transition-all shadow-sm">Register Club</button>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <button onClick={() => setTrnCreationMode('SELECT')} className="mb-6 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-indigo-500 transition-colors flex items-center gap-2">← Back to Options</button>
                                    <h2 className="text-2xl font-black text-indigo-400 mb-6 uppercase tracking-widest italic">Create Standalone Tournament</h2>
                                    <AdminCenter
                                        organizations={[]}
                                        standaloneMatches={standaloneMatches}
                                        userRole="Administrator"
                                        onStartMatch={() => { }}
                                        onViewMatch={(m) => { setViewMatchId(m.id); setActiveTab('media'); }}
                                        onRequestSetup={() => setActiveTab('setup')}
                                        onUpdateOrgs={() => { }}
                                        onCreateOrg={() => { }}
                                        onAddTeam={() => { }}
                                        onAddTournament={(oid, t) => {
                                            // For standalone, we might need a special container or just add to matching org if exists
                                            // But standard user request says "regardless of organization"
                                            // We'll create a hidden 'Standalone' org or handle separately.
                                            // For now, let's just use the first user-created org or create one if none.
                                            const myOrg = orgs.find(o => o.createdBy === profile.id);
                                            if (myOrg) {
                                                setOrgs(orgs.map(o => o.id === myOrg.id ? { ...o, tournaments: [...o.tournaments, t] } : o));
                                            } else {
                                                // Create a default org for them
                                                handleCreateOrg({ name: 'Personal Tournaments' });
                                                // We'd need to wait for state update or use setOrgs directly with the new item
                                            }
                                            forcePush();
                                            alert('Standalone Tournament Created!');
                                            setActiveTab('my_tournaments');
                                            setTrnCreationMode('SELECT');
                                        }}
                                        mediaPosts={[]}
                                        onAddMediaPost={() => { }}
                                        onViewTeam={setViewingTeamId}
                                        onOpenMediaStudio={() => { }}
                                        following={following}
                                        onToggleFollow={toggleFollowing}
                                        currentUserId={profile.id}
                                        onBulkAddPlayers={() => { }}
                                        onAddGroup={() => { }}
                                        onUpdateGroupTeams={() => { }}
                                        onUpdateFixture={handleUpdateFixture}
                                        onRemoveFixture={handleRemoveFixture}
                                        onUpdateTournament={handleUpdateTournament}
                                        onRemoveTournament={handleRemoveTournament}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'register_club' && (
                        <div className="max-w-7xl mx-auto p-4">
                            <h2 className="text-2xl font-black text-indigo-400 mb-6 uppercase tracking-widest">Register New Club</h2>
                            <AdminCenter
                                organizations={orgs}
                                standaloneMatches={[]}
                                userRole="Administrator"
                                onStartMatch={() => { }}
                                onViewMatch={() => { }}
                                onRequestSetup={() => { }}
                                onUpdateOrgs={setOrgs}
                                onCreateOrg={(o) => { handleCreateOrg(o); alert('Club Registered!'); setActiveTab('my_clubs'); }}
                                onAddTeam={handleAddTeam}
                                onProcessApplication={handleProcessApplication}
                                onRemoveTeam={() => { }}
                                onRemoveTournament={handleRemoveTournament}
                                onUpdateTournament={handleUpdateTournament}
                                onUpdateFixture={handleUpdateFixture}
                                onRemoveFixture={handleRemoveFixture}
                                allOrganizations={orgs}
                                onBulkAddPlayers={() => { }}
                                onAddGroup={() => { }}
                                onUpdateGroupTeams={() => { }}
                                onAddTournament={() => { }}
                                mediaPosts={[]}
                                onAddMediaPost={() => { }}
                                onViewTeam={() => { }}
                                onOpenMediaStudio={() => { }}
                                following={{ teams: [], players: [], orgs: [] }}
                                onToggleFollow={() => { }}
                                currentUserId={profile.id}
                                onApplyForOrg={handleApplyForOrg}
                                currentUserProfile={profile}
                                onCreateUser={async () => ({ success: false })}
                            />
                        </div>
                    )}

                    {activeTab === 'following' && (
                        <MediaCenter onBack={() => setActiveTab('home')} fixtures={allFixtures} teams={allTeams} players={allPlayers} mediaPosts={mediaPosts} onAddMediaPost={handleAddMediaPost} onUpdatePost={handleUpdateMediaPost} onDeletePost={handleDeleteMediaPost} following={following} onToggleFollow={toggleFollowing} onViewTeam={setViewingTeamId} onViewPlayer={(p) => setViewingPlayerId(p.id)} userRole={profile.role} currentProfile={profile} organizations={orgs} viewingOrgId={null} initialTab="FOLLOWING" />
                    )}

                    {activeTab === 'my_club' && myClubOrg && (
                        <OrganizationView
                            organization={myClubOrg}
                            userRole="Player"
                            onBack={() => setActiveTab('home')}
                            onViewTournament={(tId) => { setViewingTournamentId(tId); setActiveTab('tournament_details'); }}
                            onViewPlayer={(p) => setViewingPlayerId(p.id)}
                            onRequestAddTeam={() => { }}
                            onRequestAddTournament={() => {
                                // Default simple tournament creation
                                const newT: Tournament = {
                                    id: `trn-${Date.now()}`,
                                    name: 'New League',
                                    format: 'T20',
                                    status: 'Upcoming',
                                    orgId: myClubOrg.id,
                                    teamIds: [],
                                    groups: [],
                                    pointsConfig: DEFAULT_POINTS_CONFIG,
                                    overs: 20
                                };
                                const updatedOrgs = orgs.map(o => o.id === myClubOrg.id ? { ...o, tournaments: [...o.tournaments, newT] } : o);
                                setOrgs(updatedOrgs);
                            }}
                            players={allPlayers.filter(p => p.orgId === myClubOrg.id)}
                            onViewTeam={setViewingTeamId}
                            isFollowed={following.orgs.includes(myClubOrg.id)}
                            onToggleFollow={() => toggleFollowing('ORG', myClubOrg.id)}
                            globalUsers={globalUsers}
                            onAddMember={() => { }}
                            currentUserProfile={profile}
                            onRequestCaptainHub={() => handleSwitchTab('captain_hub')}
                            onSelectHubTeam={(id) => { setSelectedHubTeamId(id); handleSwitchTab('captain_hub'); }}
                            onUpdateFixture={handleUpdateFixture}
                            onApplyForOrg={handleApplyForOrg}
                            allOrganizations={orgs}
                            onRemoveTournament={handleRemoveTournament}
                            onUpdateTournament={handleUpdateTournament}
                            onUpdateOrg={(id, data) => {
                                const nextOrgs = orgs.map(o => o.id === id ? { ...o, ...data } : o);
                                setOrgs(nextOrgs);
                                forcePush();
                            }}
                            onRemoveTeam={async (oid, tid) => {
                                await removeTeamFromOrg(oid, tid);
                                const nextOrgs = orgs.map(o => o.id === oid ? { ...o, memberTeams: o.memberTeams.filter(t => t.id !== tid) } : o);
                                setOrgs(nextOrgs);
                                forcePush();
                            }}
                        />
                    )}

                    {activeTab === 'tournament_details' && viewingTournamentId && (
                        <TournamentView
                            tournament={orgs.flatMap(o => o.tournaments).find(t => t.id === viewingTournamentId)!}
                            organization={orgs.find(o => o.tournaments.some(t => t.id === viewingTournamentId))!}
                            allTeams={allTeams}
                            fixtures={allFixtures}
                            onBack={() => handleSwitchTab('my_club')}
                            isOrgAdmin={profile.role === 'Administrator' || (orgs.find(o => o.tournaments.some(t => t.id === viewingTournamentId))?.members.some(m => m.userId === profile.id && m.role === 'Administrator' && !m.managedTeamId) || false)}
                            onSelectHubTeam={(id) => { setSelectedHubTeamId(id); handleSwitchTab('captain_hub'); setViewingTournamentId(null); }}
                            onUpdateTournament={(updates) => {
                                const nextOrgs = orgs.map(o => ({
                                    ...o,
                                    tournaments: o.tournaments.map(t => t.id === viewingTournamentId ? { ...t, ...updates } : t)
                                }));
                                setOrgs(nextOrgs);
                            }}
                            onDeleteTournament={(id) => {
                                const nextOrgs = orgs.map(o => ({
                                    ...o,
                                    tournaments: o.tournaments.filter(t => t.id !== id)
                                }));
                                setOrgs(nextOrgs);
                                setViewingTournamentId(null);
                                setActiveTab('home');
                            }}
                            onAddTeam={(teamId) => {
                                const nextOrgs = orgs.map(o => ({
                                    ...o,
                                    tournaments: o.tournaments.map(t => t.id === viewingTournamentId ? {
                                        ...t,
                                        teamIds: [...(t.teamIds || []), teamId]
                                    } : t)
                                }));
                                setOrgs(nextOrgs);
                            }}
                            onRemoveTeam={(teamId) => {
                                const nextOrgs = orgs.map(o => ({
                                    ...o,
                                    tournaments: o.tournaments.map(t => t.id === viewingTournamentId ? {
                                        ...t,
                                        teamIds: t.teamIds?.filter(id => id !== teamId)
                                    } : t)
                                }));
                                setOrgs(nextOrgs);
                            }}
                        />
                    )}

                    {activeTab === 'stats' && (
                        <div className="max-w-7xl mx-auto p-4">
                            <StatsAnalytics
                                teams={allTeams}
                                onBack={() => setActiveTab('home')}
                            />
                        </div>
                    )}

                    {activeTab === 'setup' && (<MatchSetup teams={allTeams} existingFixture={pendingSetupFixture} onMatchReady={handleSetupComplete} onCancel={() => { setPendingSetupFixture(null); setActiveTab('home'); }} onCreateTeam={handleQuickCreateTeam} />)}
                    {activeTab === 'scorer' && (activeMatch ? (
                        <Scorer
                            match={activeMatch} teams={allTeams} userRole={profile.role}
                            organizations={orgs} onUpdateOrgs={setOrgs}
                            onUpdateMatchState={handleUpdateMatchState}
                            onComplete={() => { setActiveMatch(null); setActiveTab('home'); }}
                            onRequestNewMatch={() => setActiveTab('setup')}
                            onAddMediaPost={handleAddMediaPost}
                            onExit={() => setActiveTab('home')}
                            currentUserId={profile.id}
                            readOnly={isReadOnly}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center pb-20">
                            <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center text-4xl mb-8">🏏</div>
                            <h2 className="text-3xl font-black text-slate-900 mb-2">Cloud Sync Scoring</h2>
                            <p className="text-slate-500 font-bold mb-8 max-w-sm">Manage live matches with real-time analytics and global sync.</p>

                            <div className="flex flex-col gap-4">
                                {ongoingMatch && (
                                    <button
                                        onClick={() => setActiveMatch(ongoingMatch)}
                                        className="bg-emerald-600 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-500 transition-all flex items-center gap-3 justify-center"
                                    >
                                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                        Resume Ongoing Match
                                    </button>
                                )}
                                <button
                                    onClick={() => setActiveTab('setup')}
                                    className="bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-500 transition-all"
                                >
                                    Start New Cloud Match
                                </button>
                            </div>
                        </div>
                    ))}

                    {activeTab === 'captain_hub' && (
                        selectedHubTeamId ? (
                            <CaptainsProfile
                                team={allTeams.find(t => t.id === selectedHubTeamId)!}
                                fixtures={allFixtures.filter(f => f != null)}
                                allPlayers={allPlayers}
                                onBack={() => { setSelectedHubTeamId(null); /* Return to selector if multiple teams */ }}
                                onSubmitReport={handleSubmitMatchReport}
                                onLodgeProtest={(issue) => setIssues([...issues, issue])}
                                currentUser={profile}
                                issues={issues}
                                onUpdateFixtureSquad={handleUpdateFixtureSquad}
                            />
                        ) : myCaptainTeams.length > 1 ? (
                            <TeamSelector
                                teams={myCaptainTeams}
                                onSelect={(id) => setSelectedHubTeamId(id)}
                                onBack={() => setActiveTab('home')}
                            />
                        ) : myCaptainTeams.length === 1 ? (
                            <CaptainsProfile
                                team={myCaptainTeams[0]}
                                fixtures={allFixtures.filter(f => f != null)}
                                allPlayers={allPlayers}
                                onBack={() => setActiveTab('media')}
                                onSubmitReport={handleSubmitMatchReport}
                                onLodgeProtest={(issue) => setIssues([...issues, issue])}
                                currentUser={profile}
                                issues={issues}
                                onUpdateFixtureSquad={handleUpdateFixtureSquad}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-12">
                                <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 text-5xl mb-8">
                                    🏏
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 mb-4">No Team Assigned</h2>
                                <p className="text-slate-500 font-bold max-w-md mb-8">
                                    You need to be a member of a team to access the Captain Hub.
                                    Join a team or create one to get started.
                                </p>
                                <button
                                    onClick={() => setActiveTab('team_registry')}
                                    className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-500 transition-all"
                                >
                                    Browse Teams
                                </button>
                            </div>
                        )
                    )}

                    {activeTab === 'media' && viewMatchId && viewMatch?.reportSubmission?.status === 'PENDING' && profile.role === 'Administrator' ? (
                        <ReportVerification
                            submission={viewMatch.reportSubmission}
                            fixture={viewMatch}
                            onApprove={handleVerifyReport}
                            onReject={handleRejectReport}
                            onBack={() => setViewMatchId(null)}
                        />
                    ) : activeTab === 'media' && (
                        <MediaCenter
                            onBack={() => { setActiveTab('home'); setViewingOrgId(null); }}
                            fixtures={allFixtures}
                            teams={allTeams}
                            players={allPlayers}
                            mediaPosts={mediaPosts}
                            onAddMediaPost={handleAddMediaPost}
                            onUpdatePost={handleUpdateMediaPost}
                            onDeletePost={handleDeleteMediaPost}
                            initialMatchId={viewMatchId}
                            following={following}
                            onToggleFollow={toggleFollowing}
                            onViewTeam={setViewingTeamId}
                            onViewPlayer={(p) => setViewingPlayerId(p.id)}
                            userRole={profile.role}
                            currentProfile={profile}
                            organizations={orgs}
                            viewingOrgId={viewingOrgId}
                        />
                    )}

                    {activeTab === 'registry' && (
                        <div>
                            <div className="flex justify-center mb-6">
                                <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-lg inline-flex">
                                    <button
                                        onClick={() => setActiveTab('registry')}
                                        className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-white text-indigo-600 shadow-md"
                                    >
                                        Players
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('team_registry')}
                                        className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-400 hover:text-slate-600"
                                    >
                                        Teams
                                    </button>
                                </div>
                            </div>
                            <PlayerRegistry
                                allPlayers={allPlayers}
                                allTeams={allTeams}
                                onViewPlayer={(id) => setViewingPlayerId(id)}
                                onBack={() => setActiveTab('home')}
                            />
                        </div>
                    )}

                    {activeTab === 'team_registry' && (
                        <div>
                            <div className="flex justify-center mb-6">
                                <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-lg inline-flex">
                                    <button
                                        onClick={() => setActiveTab('registry')}
                                        className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-400 hover:text-slate-600"
                                    >
                                        Players
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('team_registry')}
                                        className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-white text-indigo-600 shadow-md"
                                    >
                                        Teams
                                    </button>
                                </div>
                            </div>
                            <TeamRegistry
                                allTeams={allTeams}
                                allOrganizations={orgs}
                                onViewTeam={(id) => setViewingTeamId(id)}
                                onBack={() => setActiveTab('home')}
                            />
                        </div>
                    )}

                    {activeTab === 'transfer_market' && (
                        <TransferMarket
                            onBack={() => setActiveTab('home')}
                            onViewPlayer={(id) => setViewingPlayerId(id)}
                            currentOrg={profile.role === 'Administrator' ? orgs.find(o => o.createdBy === profile.id) || orgs[0] : null}
                            onSendInvite={handleSendInvite}
                        />
                    )}

                </div>
            </Layout>

            {/* Resume Game Modal */}
            {showResumeModal && ongoingMatch && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <div className="text-8xl">🏏</div>
                        </div>
                        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl flex items-center justify-center text-4xl mb-6 mx-auto shadow-inner">⚡</div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight italic">Resume Live Scoring?</h2>
                        <p className="text-slate-500 font-bold mb-8 text-sm">
                            You have an active match in progress: <br />
                            <span className="text-emerald-600 dark:text-emerald-400">{ongoingMatch.teamAName} vs {ongoingMatch.teamBName}</span>
                        </p>
                        <div className="grid gap-3">
                            <button
                                onClick={() => {
                                    setActiveMatch(ongoingMatch);
                                    setActiveTab('scorer');
                                    setShowResumeModal(false);
                                }}
                                className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:shadow-emerald-500/20 hover:scale-[1.02] transition-all"
                            >
                                Resume Game
                            </button>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('cc_active_match_id');
                                    setShowResumeModal(false);
                                }}
                                className="w-full text-slate-400 font-black uppercase text-[10px] tracking-widest py-3 hover:text-slate-600 transition-colors"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Scorer Banner */}
            {ongoingMatch && activeTab !== 'scorer' && (
                <div className="fixed bottom-24 left-4 right-4 z-[60] animate-in slide-in-from-bottom-8 duration-500">
                    <div
                        onClick={() => {
                            setActiveMatch(ongoingMatch);
                            setActiveTab('scorer');
                        }}
                        className="bg-slate-900 dark:bg-indigo-950 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between cursor-pointer border border-white/10 hover:scale-[1.02] transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-xl animate-pulse">🏏</div>
                            <div>
                                <h4 className="font-black text-[10px] uppercase tracking-widest text-emerald-400 mb-0.5">Live Scoring Active</h4>
                                <p className="text-xs font-bold text-white/80">{ongoingMatch.teamAName} vs {ongoingMatch.teamBName}</p>
                            </div>
                        </div>
                        <div className="bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-emerald-600 transition-all">
                            Back to Game
                        </div>
                    </div>
                </div>
            )}


            {/* Shared Link Summary Modal */}
            {summaryMatch && (
                <MatchSummary
                    match={summaryMatch}
                    onClose={() => setSummaryMatch(null)}
                    onPin={() => {
                        // Pin to active match if live
                        if (summaryMatch.status === 'Live') {
                            setViewMatchId(summaryMatch.id);
                            setActiveTab('media');
                        }
                        setSummaryMatch(null);
                    }}
                    allTeams={allTeams}
                />
            )}

            {/* Auth Modal */}
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                initialMode={authModalMode}
                onSuccess={() => {
                    setShowLoginModal(false);
                    // Profile will be synced via useEffect
                }}
            />
        </ErrorBoundary>
    );
};

export default App;
