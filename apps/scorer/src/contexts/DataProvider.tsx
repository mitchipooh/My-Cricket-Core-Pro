import React, { createContext, useContext, useEffect, useState } from 'react';
import { Organization, MatchFixture, MediaPost, UserProfile, Team, GameIssue, MatchReportSubmission, UmpireMatchReport } from '@shared/types';
import { useSync } from '@shared/hooks/useSync';

interface DataContextType {
    orgs: Organization[];
    standaloneMatches: MatchFixture[];
    profile: UserProfile | null;
    allTeams: Team[];

    // Actions
    setOrgs: (orgs: Organization[]) => void;
    setStandaloneMatches: (matches: MatchFixture[]) => void;

    // Sync trigger
    pullNow: () => Promise<void>;
    forcePush: () => Promise<boolean>;
    isSyncing: boolean;

    setOrgsSilent: (orgs: Organization[]) => void;
    setStandaloneMatchesSilent: (matches: MatchFixture[]) => void;
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

    return (
        <DataContext.Provider value={{
            orgs, standaloneMatches, profile, allTeams,
            setOrgs, setStandaloneMatches,
            pullNow, forcePush: pushNow, isSyncing,
            setOrgsSilent: setOrgsState,
            setStandaloneMatchesSilent: setMatchesState
        }}>
            {children}
        </DataContext.Provider>
    );
};
