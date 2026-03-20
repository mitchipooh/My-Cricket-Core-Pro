import React, { createContext, useContext, useEffect, useState } from 'react';
import { Organization, MatchFixture, MediaPost, UserProfile, Team, GameIssue, MatchReportSubmission, UmpireMatchReport } from '@shared/types';
import { useSync } from '@shared/hooks/useSync';

interface DataContextType {
    orgs: Organization[];
    standaloneMatches: MatchFixture[];
    allTeams: Team[];
    issues: GameIssue[];
    matchReports: MatchReportSubmission[];
    umpireReports: UmpireMatchReport[];
    profile: UserProfile | null;

    // Actions
    setOrgs: (orgs: Organization[]) => void;
    setStandaloneMatches: (matches: MatchFixture[]) => void;
    setIssues: (issues: GameIssue[]) => void;
    setMatchReports: (reports: MatchReportSubmission[]) => void;

    // Sync trigger
    pullNow: () => Promise<void>;
    forcePush: () => Promise<boolean>;
    isSyncing: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within a DataProvider');
    return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [profile] = useState<UserProfile | null>(() => {
        const saved = localStorage.getItem('cc_profile');
        return saved ? JSON.parse(saved) : null;
    });

    const [orgs, setOrgsState] = useState<Organization[]>([]);
    const [standaloneMatches, setMatchesState] = useState<MatchFixture[]>([]);
    const [mediaPosts, setPostsState] = useState<MediaPost[]>([]);
    const [allTeams, setAllTeamsState] = useState<Team[]>([]);
    const [issues, setIssuesState] = useState<GameIssue[]>([]);
    const [matchReports, setMatchReportsState] = useState<MatchReportSubmission[]>([]);
    const [umpireReports, setUmpireReportsState] = useState<UmpireMatchReport[]>([]);

    const { isSyncing, pullNow, pushNow, markDirty } = useSync({
        profile, orgs, standaloneMatches, mediaPosts, allTeams,
        settings: {}, following: {}, issues, matchReports, umpireReports,
        setOrgsState, setMatchesState, setPostsState, setAllTeamsState,
        setSettings: () => { }, setFollowing: () => { },
        setIssuesState, setMatchReportsState, setUmpireReportsState
    });

    const setOrgs = (newOrgs: Organization[]) => {
        setOrgsState(newOrgs);
        markDirty();
    };

    const setStandaloneMatches = (newMatches: MatchFixture[]) => {
        setMatchesState(newMatches);
        markDirty();
    };

    const setIssues = (newIssues: GameIssue[]) => {
        setIssuesState(newIssues);
        markDirty();
    };

    const setMatchReports = (newReports: MatchReportSubmission[]) => {
        setMatchReportsState(newReports);
        markDirty();
    };

    return (
        <DataContext.Provider value={{
            orgs, standaloneMatches, allTeams, issues, matchReports, umpireReports, profile,
            setOrgs, setStandaloneMatches, setIssues, setMatchReports,
            pullNow, forcePush: pushNow, isSyncing
        }}>
            {children}
        </DataContext.Provider>
    );
};
