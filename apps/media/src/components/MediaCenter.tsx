
/**
 * Cricket-Core 2026 Management System
 * Created by mitchipoohdevs
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MatchFixture, Team, MediaPost, PlayerWithContext, UserProfile, Organization, Standing } from '../../types.ts';
import { MediaStudio } from './MediaStudio.tsx';
import { MediaFeed } from './MediaFeed.tsx';
import { NewsFeed } from './NewsFeed.tsx';
import { PointsTable } from '../display/PointsTable.tsx';
import { buildPointsTable } from '../../competition/buildPointsTable.ts';
import { CompletedMatch, MatchResult } from '../../competition/types.ts';

interface MediaCenterProps {
    onBack: () => void;
    fixtures: MatchFixture[];
    teams: Team[];
    players: PlayerWithContext[];
    mediaPosts: MediaPost[];
    onAddMediaPost: (post: MediaPost) => void;
    onDeletePost?: (postId: string) => void;
    initialMatchId?: string | null;
    following: { teams: string[], players: string[], orgs: string[] };
    onToggleFollow: (type: 'TEAM' | 'PLAYER' | 'ORG', id: string) => void;
    onViewTeam: (teamId: string) => void;
    onViewPlayer: (player: PlayerWithContext) => void;
    userRole?: UserProfile['role'];
    currentProfile?: UserProfile | null;
    organizations?: Organization[];
    onArchiveMatch?: (matchId: string) => void;
    onDeleteMatch?: (matchId: string) => void;
    onUpdatePost: (post: MediaPost) => void;
    viewingOrgId?: string | null;
    initialTab?: MediaTab;
}

type MediaTab = 'NEWS' | 'FEED' | 'FIXTURES' | 'STANDINGS' | 'TEAMS' | 'PLAYERS' | 'STUDIO' | 'FOLLOWING';
type FixtureFilter = 'LIVE' | 'SCHEDULED' | 'COMPLETED' | 'UNOFFICIAL' | 'ARCHIVE';

export const MediaCenter: React.FC<MediaCenterProps> = ({
    onBack, fixtures, teams, players, mediaPosts, onAddMediaPost, onDeletePost, onUpdatePost, initialMatchId,
    following, onToggleFollow, onViewTeam, onViewPlayer, userRole, currentProfile, organizations = [],
    onArchiveMatch, onDeleteMatch, viewingOrgId, initialTab = 'NEWS'
}) => {
    const [activeTab, setActiveTab] = useState<MediaTab>(initialTab);
    const [activeFixtureFilter, setActiveFixtureFilter] = useState<FixtureFilter>('SCHEDULED');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMatch, setSelectedMatch] = useState<MatchFixture | null>(null);

    useEffect(() => {
        if (initialMatchId) {
            const match = fixtures.find(f => f.id === initialMatchId);
            if (match) {
                setSelectedMatch(match);
                setActiveTab('FEED');
            }
        }
    }, [initialMatchId, fixtures]);

    const displayedFixtures = useMemo(() => {
        let filtered = fixtures;

        // Filter by Org if set
        if (viewingOrgId) {
            const org = organizations.find(o => o.id === viewingOrgId);
            if (org) {
                // Only show fixtures belonging to this org
                // Note: Fixtures don't have orgId directly usually, but orgs have fixtures.
                // Better to use org.fixtures list if available, or cross-reference.
                const orgFixtureIds = org.fixtures.map(f => f.id);
                filtered = filtered.filter(f => orgFixtureIds.includes(f.id));
            }
        } else {
            // NEW: Global feed visibility filtering based on pushToGlobalFeed setting
            filtered = filtered.filter(fixture => {
                const hostOrg = organizations.find(org => org.fixtures.some(f => f.id === fixture.id));

                // Standalone matches (no host org) are always visible
                if (!hostOrg) return true;

                // If org pushes to global feed (or setting is undefined/true), show to everyone
                if (hostOrg.pushToGlobalFeed !== false) return true;

                // Otherwise, only show to org members
                const currentUserId = currentProfile?.id;
                if (!currentUserId) return false;
                return hostOrg.members.some(m => m.userId === currentUserId);
            });
        }

        // Apply status/type filters
        filtered = filtered.filter(f => {
            if (activeFixtureFilter === 'ARCHIVE') return f.isArchived;
            if (f.isArchived) return false;

            if (activeFixtureFilter === 'UNOFFICIAL') return f.isOfficial === false;

            // For other tabs (LIVE, SCHEDULED, COMPLETED), only show official matches
            if (f.isOfficial === false) return false;

            if (activeFixtureFilter === 'LIVE') return f.status === 'Live';
            if (activeFixtureFilter === 'SCHEDULED') return f.status === 'Scheduled';
            if (activeFixtureFilter === 'COMPLETED') return f.status === 'Completed';
            return false;
        });

        // Apply search query filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(f => {
                const teamAMatch = f.teamAName?.toLowerCase().includes(query);
                const teamBMatch = f.teamBName?.toLowerCase().includes(query);
                const venueMatch = f.venue?.toLowerCase().includes(query);
                const dateMatch = new Date(f.date).toLocaleDateString().toLowerCase().includes(query);
                return teamAMatch || teamBMatch || venueMatch || dateMatch;
            });
        }

        return filtered;

    }, [fixtures, activeFixtureFilter, viewingOrgId, organizations, currentProfile, searchQuery]);

    // Also filter MediaPosts if looking at specific Org
    const displayedPosts = useMemo(() => {
        if (!viewingOrgId) return mediaPosts;
        const org = organizations.find(o => o.id === viewingOrgId);
        if (!org) return mediaPosts;
        // Find matches for this org
        const orgFixtureIds = org.fixtures.map(f => f.id);

        return mediaPosts.filter(p => {
            // If post is linked to a match, check if that match belongs to Org
            if (p.matchId) return orgFixtureIds.includes(p.matchId);
            // If post has no match, maybe filter by user membership? (Too strict for now, just show match content)
            return true;
        });
    }, [mediaPosts, viewingOrgId, organizations]);

    const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredPlayers = players.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const handleSelectMatch = (match: MatchFixture | null) => {
        setSelectedMatch(match);
        if (match) setActiveTab('FEED');
    };

    const isGuest = !currentProfile || currentProfile.role === 'Guest';
    const isAdmin = userRole === 'Administrator' || userRole === 'Scorer';

    const centralZone = organizations.find(o => o.id === 'org-central-zone') || organizations[0];
    const canPostToFeed = isAdmin || (!isGuest && (centralZone?.allowUserContent !== false));

    const globalStandings = useMemo(() => {
        if (activeTab !== 'STANDINGS') return [];
        const allTables: { title: string; rows: any[] }[] = [];
        organizations.forEach(org => {
            org.tournaments.forEach(trn => {
                const trnFixtures = org.fixtures.filter(f => f.tournamentId === trn.id && f.status === 'Completed' && f.savedState && f.isOfficial !== false);
                if (trnFixtures.length === 0 && trn.groups.every(g => g.teams.length === 0)) return;
                const completedMatches: CompletedMatch[] = trnFixtures.map(f => {
                    const state = f.savedState!;
                    const teamAScoreData = state.inningsScores.find(i => i.teamId === f.teamAId) || (state.innings === 1 && state.battingTeamId === f.teamAId ? { score: state.score, wickets: state.wickets, overs: '0.0' } : { score: 0, wickets: 0, overs: '0.0' });
                    const teamBScoreData = state.inningsScores.find(i => i.teamId === f.teamBId) || (state.innings === 2 && state.battingTeamId === f.teamBId ? { score: state.score, wickets: state.wickets, overs: '0.0' } : { score: 0, wickets: 0, overs: '0.0' });
                    const scoreA = typeof teamAScoreData.score === 'number' ? teamAScoreData.score : parseInt(teamAScoreData.score as any);
                    const scoreB = typeof teamBScoreData.score === 'number' ? teamBScoreData.score : parseInt(teamBScoreData.score as any);
                    let result: MatchResult = 'NO_RESULT';
                    if (scoreA > scoreB) result = 'HOME_WIN';
                    else if (scoreB > scoreA) result = 'AWAY_WIN';
                    else if (scoreA === scoreB && scoreA > 0) result = 'TIE';
                    return {
                        matchId: f.id,
                        teamAId: f.teamAId,
                        teamBId: f.teamBId,
                        teamAName: f.teamAName,
                        teamBName: f.teamBName,
                        teamAScore: scoreA,
                        teamAWkts: teamAScoreData.wickets,
                        teamAOvers: parseFloat(teamAScoreData.overs),
                        teamBScore: scoreB,
                        teamBWkts: teamBScoreData.wickets,
                        teamBOvers: parseFloat(teamBScoreData.overs),
                        result
                    };
                });
                trn.groups.forEach(grp => {
                    const grpMatches = completedMatches.filter(m => {
                        const teamIds = grp.teams.map(t => t.id);
                        return teamIds.includes(m.teamAId) && teamIds.includes(m.teamBId);
                    });
                    const rows = buildPointsTable(grpMatches, grp.teams);
                    if (rows.length > 0 || grp.teams.length > 0) {
                        allTables.push({
                            title: `${org.name} - ${trn.name} (${grp.name})`,
                            rows
                        });
                    }
                });
            });
        });
        return allTables;
    }, [organizations, activeTab]);

    // Aggregate sponsors for display
    const sponsors = useMemo(() => {
        return organizations.flatMap(o => o.sponsors || []).filter(s => s.isActive);
    }, [organizations]);

    const topSponsors = sponsors.filter(s => s.placements.includes('MEDIA_TOP'));
    const bottomSponsors = sponsors.filter(s => s.placements.includes('MEDIA_BOTTOM'));

    // Resolve sizing settings
    const activeOrg = viewingOrgId ? organizations.find(o => o.id === viewingOrgId) : (organizations.find(o => o.id === 'org-central-zone') || organizations[0]);
    const sponsorSettings = activeOrg?.sponsorSettings || {
        mediaTopHeight: 320,
        mediaBottomHeight: 320,
        scoreboardTopHeight: 400,
        scoreboardBottomHeight: 480
    };

    return (
        <div className="h-full flex flex-col animate-in slide-in-from-bottom-8 duration-500 overflow-hidden w-full max-w-[100vw] overflow-x-hidden">


            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 px-2 md:px-0 shrink-0 pt-4">
                <div className="flex items-center gap-6">
                    <button onClick={onBack} className="w-12 h-12 rounded-full bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50 hover:text-black transition-all shadow-sm">←</button>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                            {viewingOrgId ? (
                                <span className="flex items-center gap-3">
                                    <span className="text-indigo-600">{organizations.find(o => o.id === viewingOrgId)?.name}</span>
                                    <span className="text-slate-300">/</span>
                                    <span>Media</span>
                                </span>
                            ) : 'Media Center'}
                        </h1>
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Live Games & Fan Content</p>
                    </div>
                </div>

                <div className="flex bg-white rounded-2xl p-1.5 border border-slate-200 shadow-sm self-start md:self-auto overflow-x-auto max-w-full no-scrollbar shrink-0">
                    {(['NEWS', 'FEED', 'FIXTURES', 'STANDINGS', 'TEAMS', 'PLAYERS', 'STUDIO'] as MediaTab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-24 px-1 scroll-container w-full">
                {activeTab === 'NEWS' && (
                    <NewsFeed posts={displayedPosts} onAddPost={onAddMediaPost} onDeletePost={onDeletePost} onUpdatePost={onUpdatePost} isAdmin={isAdmin} currentUser={currentProfile} />
                )}

                {activeTab === 'FEED' && (
                    <MediaFeed fixtures={displayedFixtures} teams={teams} mediaPosts={displayedPosts} onAddMediaPost={onAddMediaPost} onDeletePost={onDeletePost} selectedMatch={selectedMatch} onSelectMatch={handleSelectMatch} canPost={canPostToFeed} isAdmin={isAdmin} organizations={organizations} onUpdatePost={onUpdatePost} currentUser={currentProfile} />
                )}

                {activeTab === 'STUDIO' && <MediaStudio onBack={() => setActiveTab('FEED')} fixtures={fixtures} isEmbedded={true} />}

                {activeTab === 'STANDINGS' && (
                    <div className="space-y-8 animate-in fade-in pb-10">
                        {globalStandings.length === 0 ? <div className="text-center py-20 text-slate-400 text-xs font-bold uppercase tracking-widest border-2 border-dashed border-slate-200 rounded-[2rem]">No active league tables found.</div> : globalStandings.map((table, idx) => (
                            <div key={idx} className="space-y-4">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-indigo-500 pl-3">{table.title}</h3>
                                <PointsTable rows={table.rows} onViewTeam={onViewTeam} />
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'FIXTURES' && (
                    <div className="space-y-6 animate-in fade-in pb-10">
                        {/* Search Input */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search matches by team, venue, or date..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-6 py-4 pl-12 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm font-bold placeholder:text-slate-400"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">🔍</span>
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-sm"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        <div className="flex gap-2 border-b border-slate-200 pb-4 overflow-x-auto no-scrollbar">
                            {(['LIVE', 'SCHEDULED', 'COMPLETED', 'UNOFFICIAL', 'ARCHIVE'] as const).map(filter => (
                                <button key={filter} onClick={() => setActiveFixtureFilter(filter)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeFixtureFilter === filter ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-400'}`}>{filter}</button>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {displayedFixtures.map(f => (
                                <div key={f.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 group">
                                    <div className="flex flex-col gap-1 w-full md:w-auto text-center md:text-left">
                                        <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">{new Date(f.date).toLocaleDateString()}</span>
                                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{f.venue}</span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200 px-1.5 rounded">{f.format}</span>
                                            {f.isOfficial === false && <span className="text-[10px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded uppercase tracking-widest">Unofficial</span>}
                                            {f.isArchived && <span className="text-[10px] font-black bg-slate-200 text-slate-500 px-2 py-0.5 rounded uppercase tracking-widest">Archived</span>}
                                        </div>
                                        <div className="flex items-center justify-center md:justify-start gap-4 text-lg"><span className="font-black text-slate-900">{f.teamAName}</span><span className="text-xs font-bold text-slate-300">VS</span><span className="font-black text-slate-900">{f.teamBName}</span></div>
                                        {f.status === 'Live' && <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1 animate-pulse">Live Score: {f.teamAScore || '0/0'} - {f.teamBScore || '0/0'}</div>}
                                        {f.result && <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">{f.result}</div>}
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        {isAdmin && (
                                            <div className="flex gap-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!f.isArchived && onArchiveMatch && <button onClick={() => onArchiveMatch(f.id)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center" title="Archive">📦</button>}
                                                {onDeleteMatch && <button onClick={() => onDeleteMatch(f.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center" title="Delete">🗑️</button>}
                                            </div>
                                        )}
                                        <button onClick={() => handleSelectMatch(f)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-500 transition-all w-full md:w-auto">Scorecard</button>
                                    </div>
                                </div>
                            ))}
                            {displayedFixtures.length === 0 && <div className="py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 font-bold uppercase text-xs">No {activeFixtureFilter.toLowerCase()} fixtures found</div>}
                        </div>
                    </div>
                )}

                {(activeTab === 'TEAMS' || activeTab === 'PLAYERS') && (
                    <div className="space-y-6 animate-in fade-in pb-10">
                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={`Search ${activeTab.toLowerCase()}...`} className="w-full bg-white border border-slate-200 rounded-[2rem] px-6 py-4 font-bold outline-none shadow-sm focus:ring-2 focus:ring-indigo-500" />
                        {activeTab === 'TEAMS' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredTeams.map(t => {
                                    const isFollowed = following.teams.includes(t.id);
                                    return (
                                        <div key={t.id} className="bg-white rounded-[2.5rem] p-6 border border-slate-200 shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:shadow-xl transition-all">
                                            <div className="flex items-center gap-4 cursor-pointer" onClick={() => onViewTeam(t.id)}>
                                                <img src={t.logoUrl} className="w-16 h-16 rounded-2xl bg-slate-50 object-cover" />
                                                <div><h3 className="font-black text-lg text-slate-900 leading-tight">{t.name}</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.location}</p></div>
                                            </div>
                                            <button onClick={() => onToggleFollow('TEAM', t.id)} className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isFollowed ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{isFollowed ? 'Following Team' : 'Follow Team'}</button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {activeTab === 'PLAYERS' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {filteredPlayers.slice(0, 48).map(p => {
                                    const isFollowed = following.players.includes(p.id);
                                    return (
                                        <div key={p.id} className="bg-white rounded-[2rem] p-4 border border-slate-200 shadow-sm flex items-center gap-4 hover:border-indigo-300 transition-all group">
                                            <div className="w-12 h-12 rounded-xl bg-slate-50 overflow-hidden cursor-pointer" onClick={() => onViewPlayer(p)}><img src={p.photoUrl} className="w-full h-full object-cover" /></div>
                                            <div className="flex-1 min-w-0"><h4 className="font-black text-xs text-slate-900 truncate cursor-pointer hover:underline" onClick={() => onViewPlayer(p)}>{p.name}</h4><p className="text-[9px] text-slate-400 font-bold uppercase">{p.teamName}</p></div>
                                            <button onClick={() => onToggleFollow('PLAYER', p.id)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isFollowed ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300 hover:bg-indigo-100 hover:text-indigo-500'}`}>{isFollowed ? '✓' : '+'}</button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
};
