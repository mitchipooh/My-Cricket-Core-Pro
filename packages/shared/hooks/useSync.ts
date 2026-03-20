import { useState, useRef, useCallback, useEffect } from 'react';
import { Organization, Team, MatchFixture, MediaPost, UserProfile, GameIssue, MatchReportSubmission, UmpireMatchReport } from '../types';
import { fetchGlobalSync, pushGlobalSync } from '../services/api';

interface UseSyncProps {
    profile: UserProfile | null;
    orgs: Organization[];
    standaloneMatches: MatchFixture[];
    mediaPosts: MediaPost[];
    allTeams: Team[];
    settings: any;
    following: any;
    issues: any[];
    matchReports: any[];
    umpireReports: any[];

    setOrgsState: (val: Organization[]) => void;
    setMatchesState: (val: MatchFixture[]) => void;
    setPostsState: (val: MediaPost[]) => void;
    setAllTeamsState: (val: Team[]) => void;
    setSettings: (val: any) => void;
    setFollowing: (val: any) => void;
    setIssuesState: (val: any[]) => void;
    setMatchReportsState: (val: any[]) => void;
    setUmpireReportsState: (val: any[]) => void;
}

export const useSync = ({
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
}: UseSyncProps) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const isSyncingRef = useRef(false);
    const dirtyRef = useRef(false);

    // Track last pull timestamp
    const lastPullRef = useRef<number>(0);
    const STALE_THRESHOLD_MS = 1 * 60 * 1000; // 1 minute for the new system

    const performPull = useCallback(async (force: boolean = false) => {
        if (isSyncingRef.current) return;
        if (dirtyRef.current && !force) return;

        const now = Date.now();
        if (!force && now - lastPullRef.current < STALE_THRESHOLD_MS) return;

        isSyncingRef.current = true;
        setIsSyncing(true);

        try {
            const cloudData = await fetchGlobalSync();
            if (cloudData) {
                setOrgsState(cloudData.orgs || []);
                setMatchesState(cloudData.standaloneMatches || []);
                setPostsState(cloudData.mediaPosts || []);
                setAllTeamsState(cloudData.allTeams || []);
                setIssuesState(cloudData.issues || []);
                setMatchReportsState(cloudData.matchReports || []);
                setUmpireReportsState(cloudData.umpireReports || []);
            }
            lastPullRef.current = Date.now();
        } catch (e) {
            console.error("Sync pull failed:", e);
        } finally {
            isSyncingRef.current = false;
            setIsSyncing(false);
            dirtyRef.current = false;
        }
    }, [orgs, standaloneMatches, mediaPosts, allTeams, issues, matchReports, umpireReports]);

    const performPush = useCallback(async () => {
        if (isSyncingRef.current) return false;
        isSyncingRef.current = true;
        setIsSyncing(true);

        try {
            const result = await pushGlobalSync({ orgs, standaloneMatches, mediaPosts, issues, matchReports, umpireReports });
            if (result.success) {
                dirtyRef.current = false;
                return true;
            }
            return false;
        } catch (e) {
            console.error("Sync push failed:", e);
            return false;
        } finally {
            isSyncingRef.current = false;
            setIsSyncing(false);
        }
    }, [orgs, standaloneMatches, mediaPosts, issues, matchReports, umpireReports]);

    useEffect(() => {
        performPull();
        const interval = setInterval(performPull, 30000);
        return () => clearInterval(interval);
    }, [performPull]);

    useEffect(() => {
        if (!dirtyRef.current) return;
        const timer = setTimeout(performPush, 1000);
        return () => clearTimeout(timer);
    }, [orgs, standaloneMatches, mediaPosts, issues, matchReports, umpireReports, performPush]);

    const markDirty = () => {
        dirtyRef.current = true;
    };

    return {
        isSyncing,
        pullNow: performPull,
        pushNow: performPush,
        markDirty
    };
};
