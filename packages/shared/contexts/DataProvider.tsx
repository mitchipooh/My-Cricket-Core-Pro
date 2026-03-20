import React, { createContext, useContext, useEffect, useState } from 'react';
import { Organization, MatchFixture, MediaPost, UserProfile, Team, GameIssue, MatchReportSubmission, UmpireMatchReport } from '../types';
import { useSync } from '../hooks/useSync';
import { DEMO_ORGS, DEMO_MATCHES, DEMO_POSTS, DEMO_TEAMS } from '../utils/demoData';

interface DataContextType {
    orgs: Organization[];
    standaloneMatches: MatchFixture[];
    mediaPosts: MediaPost[];
    allTeams: Team[];
    profile: UserProfile | null;
    settings: { notifications: boolean; sound: boolean; devMode?: boolean; fullScreen?: boolean; demoMode?: boolean };
    following: { teams: string[], players: string[], orgs: string[] };
    issues: GameIssue[];
    matchReports: MatchReportSubmission[];
    umpireReports: UmpireMatchReport[];

    // Actions
    updateProfile: (p: Partial<UserProfile>) => void;
    updateSettings: (s: { notifications: boolean; sound: boolean; devMode?: boolean; fullScreen?: boolean; demoMode?: boolean }) => void;
    updateFollowing: (f: { teams: string[], players: string[], orgs: string[] }) => void;

    // Data Mutations (Automatically triggers sync)
    setOrgs: (orgs: Organization[]) => void;
    setStandaloneMatches: (matches: MatchFixture[]) => void;
    setMediaPosts: (posts: MediaPost[]) => void;
    setAllTeams: (teams: Team[]) => void;
    setIssues: (issues: GameIssue[]) => void;
    setMatchReports: (reports: MatchReportSubmission[]) => void;
    setUmpireReports: (reports: UmpireMatchReport[]) => void;

    // Sync trigger
    pullNow: () => Promise<void>;
    forcePush: () => Promise<boolean>;
    isSyncing: boolean;

    // Silent Mutators (Update Local State ONLY - No Sync trigger)
    setOrgsSilent: (orgs: Organization[] | ((prev: Organization[]) => Organization[])) => void;
    setStandaloneMatchesSilent: (matches: MatchFixture[] | ((prev: MatchFixture[]) => MatchFixture[])) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within a DataProvider');
    return context;
};

const MOCK_GUEST_PROFILE: UserProfile = { id: 'guest', name: 'Visitor', handle: 'guest', role: 'Guest', createdAt: Date.now() };

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // --- STATE ---
    const [profile, setProfile] = useState<UserProfile | null>(() => {
        try { const saved = localStorage.getItem('cc_profile'); return saved ? JSON.parse(saved) : MOCK_GUEST_PROFILE; } catch { return MOCK_GUEST_PROFILE; }
    });

    const [orgs, setOrgsState] = useState<Organization[]>(() => {
        try { const saved = localStorage.getItem('cc_orgs'); return saved ? JSON.parse(saved) : []; } catch { return []; }
    });
    const [standaloneMatches, setMatchesState] = useState<MatchFixture[]>(() => {
        try { const saved = localStorage.getItem('cc_matches'); return saved ? JSON.parse(saved) : []; } catch { return []; }
    });
    const [mediaPosts, setPostsState] = useState<MediaPost[]>(() => {
        try { const saved = localStorage.getItem('cc_posts'); return saved ? JSON.parse(saved) : []; } catch { return []; }
    });
    const [allTeams, setAllTeamsState] = useState<Team[]>(() => {
        try { const saved = localStorage.getItem('cc_all_teams'); return saved ? JSON.parse(saved) : []; } catch { return []; }
    });

    const [settings, setSettings] = useState(() => {
        try { const saved = localStorage.getItem('cc_settings'); return saved ? JSON.parse(saved) : { notifications: false, sound: true, devMode: false, fullScreen: false, demoMode: false }; } catch { return { notifications: false, sound: true, devMode: false, fullScreen: false, demoMode: false }; }
    });

    const [following, setFollowing] = useState(() => {
        try { const saved = localStorage.getItem('cc_following'); return saved ? JSON.parse(saved) : { teams: [], players: [], orgs: [] }; } catch { return { teams: [], players: [], orgs: [] }; }
    });

    const [issues, setIssuesState] = useState<GameIssue[]>(() => {
        try { const saved = localStorage.getItem('cc_issues'); return saved ? JSON.parse(saved) : []; } catch { return []; }
    });
    const [matchReports, setMatchReportsState] = useState<MatchReportSubmission[]>(() => {
        try { const saved = localStorage.getItem('cc_match_reports'); return saved ? JSON.parse(saved) : []; } catch { return []; }
    });
    const [umpireReports, setUmpireReportsState] = useState<UmpireMatchReport[]>(() => {
        try { const saved = localStorage.getItem('cc_umpire_reports'); return saved ? JSON.parse(saved) : []; } catch { return []; }
    });

    // --- PERSISTENCE EFFECT ---
    useEffect(() => {
        if (profile && profile.role !== 'Guest') localStorage.setItem('cc_profile', JSON.stringify(profile));
        else localStorage.removeItem('cc_profile');
    }, [profile]);

    useEffect(() => { localStorage.setItem('cc_settings', JSON.stringify(settings)); }, [settings]);
    useEffect(() => { localStorage.setItem('cc_following', JSON.stringify(following)); }, [following]);
    useEffect(() => { localStorage.setItem('cc_orgs', JSON.stringify(orgs)); }, [orgs]);
    useEffect(() => { localStorage.setItem('cc_matches', JSON.stringify(standaloneMatches)); }, [standaloneMatches]);
    useEffect(() => { localStorage.setItem('cc_posts', JSON.stringify(mediaPosts)); }, [mediaPosts]);
    useEffect(() => { localStorage.setItem('cc_all_teams', JSON.stringify(allTeams)); }, [allTeams]);
    useEffect(() => { localStorage.setItem('cc_issues', JSON.stringify(issues)); }, [issues]);
    useEffect(() => { localStorage.setItem('cc_match_reports', JSON.stringify(matchReports)); }, [matchReports]);
    useEffect(() => { localStorage.setItem('cc_umpire_reports', JSON.stringify(umpireReports)); }, [umpireReports]);

    // --- SYNC HOOK ---
    const { isSyncing, pullNow, pushNow, markDirty } = useSync({
        profile,
        orgs,
        standaloneMatches,
        mediaPosts,
        allTeams,
        settings,
        following,
        issues,
        matchReports,
        umpireReports,
        setOrgsState,
        setMatchesState,
        setPostsState,
        setAllTeamsState,
        setSettings,
        setFollowing,
        setIssuesState,
        setMatchReportsState,
        setUmpireReportsState
    });

    // --- SETTERS (Wrap to mark dirty) ---
    const setOrgs = (newOrgs: Organization[]) => {
        setOrgsState(newOrgs);
        markDirty();
    };

    const setStandaloneMatches = (newMatches: MatchFixture[]) => {
        setMatchesState(newMatches);
        markDirty();
    };

    const setMediaPosts = (newPosts: MediaPost[]) => {
        setPostsState(newPosts);
        markDirty();
    };

    const setAllTeams = (newTeams: Team[]) => {
        setAllTeamsState(newTeams);
        // We don't necessarily mark dirty for allTeams as it's primarily a pulled resource
        // but if we allow creating teams globally later, we might.
    };

    const setIssues = (newIssues: GameIssue[]) => {
        setIssuesState(newIssues);
        markDirty();
    };

    const setMatchReports = (newReports: MatchReportSubmission[]) => {
        setMatchReportsState(newReports);
        markDirty();
    };

    const setUmpireReports = (newReports: UmpireMatchReport[]) => {
        setUmpireReportsState(newReports);
        markDirty();
    };

    const updateProfile = (p: Partial<UserProfile>) => {
        if (!profile) return;
        setProfile({ ...profile, ...p });
        markDirty();
    };

    const updateSettings = (s: any) => {
        setSettings(s);
        markDirty();
    };

    const updateFollowing = (f: any) => {
        setFollowing(f);
        markDirty();
    };

    // --- DEMO MODE MERGING ---
    const displayOrgs = settings.demoMode ? [...orgs, ...DEMO_ORGS] : orgs;
    const displayMatches = settings.demoMode ? [...standaloneMatches, ...DEMO_MATCHES] : standaloneMatches;
    const displayPosts = settings.demoMode ? [...mediaPosts, ...DEMO_POSTS] : mediaPosts;
    const displayTeams = settings.demoMode ? [...allTeams, ...DEMO_TEAMS] : allTeams;

    return (
        <DataContext.Provider value={{
            orgs: displayOrgs,
            standaloneMatches: displayMatches,
            mediaPosts: displayPosts,
            allTeams: displayTeams,
            profile, settings, following,
            issues, matchReports, umpireReports,
            setOrgs, setStandaloneMatches, setMediaPosts, setAllTeams,
            setIssues, setMatchReports, setUmpireReports,
            updateProfile, updateSettings, updateFollowing,
            pullNow, forcePush: pushNow, isSyncing,
            setOrgsSilent: setOrgsState,
            setStandaloneMatchesSilent: setMatchesState
        }}>
            {children}
        </DataContext.Provider>
    );
};
