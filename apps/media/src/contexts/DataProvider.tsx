import React, { createContext, useContext, useEffect, useState } from 'react';
import { Organization, MatchFixture, MediaPost, UserProfile, Team, GameIssue, MatchReportSubmission, UmpireMatchReport } from '@shared/types';
import { useSync } from '@shared/hooks/useSync';

interface DataContextType {
    orgs: Organization[];
    standaloneMatches: MatchFixture[];
    mediaPosts: MediaPost[];
    allTeams: Team[];
    profile: UserProfile | null;

    // Actions are limited in Media Center (Public)

    // Sync trigger
    pullNow: () => Promise<void>;
    isSyncing: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within a DataProvider');
    return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [profile] = useState<UserProfile | null>(null);

    const [orgs, setOrgsState] = useState<Organization[]>([]);
    const [standaloneMatches, setMatchesState] = useState<MatchFixture[]>([]);
    const [mediaPosts, setPostsState] = useState<MediaPost[]>([]);
    const [allTeams, setAllTeamsState] = useState<Team[]>([]);
    const [issues, setIssuesState] = useState<GameIssue[]>([]);
    const [matchReports, setMatchReportsState] = useState<MatchReportSubmission[]>([]);
    const [umpireReports, setUmpireReportsState] = useState<UmpireMatchReport[]>([]);

    const { isSyncing, pullNow } = useSync({
        profile, orgs, standaloneMatches, mediaPosts, allTeams,
        settings: {}, following: {}, issues, matchReports, umpireReports,
        setOrgsState, setMatchesState, setPostsState, setAllTeamsState,
        setSettings: () => { }, setFollowing: () => { },
        setIssuesState, setMatchReportsState, setUmpireReportsState
    });

    return (
        <DataContext.Provider value={{
            orgs, standaloneMatches, mediaPosts, allTeams, profile,
            pullNow, isSyncing
        }}>
            {children}
        </DataContext.Provider>
    );
};
