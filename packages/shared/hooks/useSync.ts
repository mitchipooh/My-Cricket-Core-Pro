import { useState, useRef, useCallback, useEffect } from 'react';
import { Organization, Team, MatchFixture, MediaPost, UserProfile, GameIssue, MatchReportSubmission, UmpireMatchReport } from '../types';
import { fetchGlobalSync, pushGlobalSync, pushUserData, fetchUserData } from '../services/centralZoneService';
import { supabase } from '../lib/supabase';

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
    const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

    // 1. PULL: Fetch on mount and occasionally
    const performPull = useCallback(async (force: boolean = false) => {
        if (isSyncingRef.current) return;

        // Skip pull if local changes are pending
        if (dirtyRef.current) {
            console.log('⏳ Skipping Pull: Local changes pending push.');
            return;
        }

        // Skip pull if data is fresh (unless forced)
        const now = Date.now();
        const timeSinceLastPull = now - lastPullRef.current;
        if (!force && timeSinceLastPull < STALE_THRESHOLD_MS && lastPullRef.current > 0) {
            console.log(`⏭️ Skipping Pull: Data is fresh (${Math.round(timeSinceLastPull / 1000)}s old)`);
            return;
        }

        isSyncingRef.current = true;
        setIsSyncing(true);

        const userId = profile?.googleId || (profile?.role !== 'Guest' ? profile?.id : undefined);

        try {
            const cloudData = await fetchGlobalSync(userId);
            console.log('📥 Cloud data received:', cloudData ? {
                orgs: cloudData.orgs?.length,
                teams: cloudData.allTeams?.length,
                matches: cloudData.standaloneMatches?.length,
                issues: cloudData.issues?.length,
                matchReports: cloudData.matchReports?.length,
                umpireReports: cloudData.umpireReports?.length
            } : 'null');

            if (cloudData) {
                // PRIORITY: Local wins - only update if cloud has different data
                const orgsChanged = JSON.stringify(cloudData.orgs) !== JSON.stringify(orgs);
                const matchesChanged = JSON.stringify(cloudData.standaloneMatches) !== JSON.stringify(standaloneMatches);
                const postsChanged = JSON.stringify(cloudData.mediaPosts) !== JSON.stringify(mediaPosts);
                const allTeamsChanged = JSON.stringify(cloudData.allTeams) !== JSON.stringify(allTeams);
                const issuesChanged = JSON.stringify(cloudData.issues) !== JSON.stringify(issues);
                const matchReportsChanged = JSON.stringify(cloudData.matchReports) !== JSON.stringify(matchReports);
                const umpireReportsChanged = JSON.stringify(cloudData.umpireReports) !== JSON.stringify(umpireReports);

                console.log('🔄 Applying changes:', { orgsChanged, matchesChanged, postsChanged, allTeamsChanged, issuesChanged, matchReportsChanged, umpireReportsChanged });

                // Only apply cloud changes if they differ from local
                if (orgsChanged) setOrgsState(cloudData.orgs || []);
                if (matchesChanged) setMatchesState(cloudData.standaloneMatches || []);
                if (postsChanged) setPostsState(cloudData.mediaPosts || []);
                if (allTeamsChanged) setAllTeamsState(cloudData.allTeams || []);
                if (issuesChanged) setIssuesState(cloudData.issues || []);
                if (matchReportsChanged) setMatchReportsState(cloudData.matchReports || []);
                if (umpireReportsChanged) setUmpireReportsState(cloudData.umpireReports || []);
            } else {
                console.log('⚠️ No cloud data to sync');
            }

            if (profile && profile.role !== 'Guest') {
                const userData = await fetchUserData(profile.id);
                if (userData) {
                    if (userData.settings) setSettings(userData.settings);
                    if (userData.following) setFollowing(userData.following);
                }
            }

            lastPullRef.current = Date.now();
        } catch (e) {
            console.error("Sync fetch failed:", e);
        } finally {
            isSyncingRef.current = false;
            setIsSyncing(false);
            dirtyRef.current = false; // Reset dirty after a successful sync/merge cycle
        }
    }, [profile?.id, profile?.role, orgs, standaloneMatches, mediaPosts, allTeams, issues, matchReports, umpireReports]); // Dependencies for Pull

    // 2. PUSH: Function to call when we make changes
    const performPush = useCallback(async () => {
        if (isSyncingRef.current) return false;
        isSyncingRef.current = true;
        setIsSyncing(true);

        const userId = profile?.googleId || (profile?.role !== 'Guest' ? profile?.id : undefined);

        try {
            const success = await pushGlobalSync({ orgs, standaloneMatches, mediaPosts, issues, matchReports, umpireReports }, userId);

            if (success) {
                if (profile && profile.role !== 'Guest') {
                    await pushUserData(profile.id, { profile, settings, following });
                }
                dirtyRef.current = false;
                console.log('📤 Global push successful');
                return true;
            } else {
                console.error('❌ Global push failed - keeping changes dirty');
                return false;
            }
        } catch (e) {
            console.error("Sync push exception:", e);
            return false;
        } finally {
            isSyncingRef.current = false;
            setIsSyncing(false);
        }
    }, [orgs, standaloneMatches, mediaPosts, issues, matchReports, umpireReports, profile, settings, following]);

    // Initial Pull & Heartbeat
    useEffect(() => {
        performPull();
        const interval = setInterval(performPull, 30000); // 30s heartbeat fallback

        // --- NEW: REAL-TIME SYNC ---
        const subscription = supabase
            .channel('fixtures-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'fixtures' },
                (payload) => {
                    console.log('⚡ Realtime Update Received:', payload.eventType);
                    // Trigger an immediate pull to get the full merged state
                    performPull();
                }
            )
            .subscribe((status) => {
                console.log('📡 Realtime Subscription Status:', status);
            });

        return () => {
            clearInterval(interval);
            supabase.removeChannel(subscription);
        };
    }, [performPull]);

    // Network Status Recovery
    useEffect(() => {
        const handleOnline = () => {
            console.log('🌐 Connection restored. Attempting sync...');
            if (dirtyRef.current) {
                performPush();
            } else {
                performPull();
            }
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [performPull, performPush]);

    // Debounced Push for Data Changes
    useEffect(() => {
        if (!dirtyRef.current) return;
        const timer = setTimeout(() => {
            performPush();
        }, 1000); // 1s debounce
        return () => clearTimeout(timer);
    }, [orgs, standaloneMatches, mediaPosts, issues, matchReports, umpireReports, profile, settings, following, performPush]);

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
