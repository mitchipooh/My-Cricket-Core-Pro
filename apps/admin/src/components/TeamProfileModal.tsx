
import React, { useMemo, useState } from 'react';
import { Team, MatchFixture, Player } from '../../types.ts';
import { EditTeamModal } from './EditTeamModal.tsx';

interface TeamProfileModalProps {
    team: Team | null;
    isOpen: boolean;
    onClose: () => void;
    allFixtures: MatchFixture[];
    onViewPlayer: (playerId: string) => void;
    isFollowed: boolean;
    onToggleFollow: () => void;
    onViewMatch: (match: MatchFixture) => void;
    onUpdateTeam?: (updates: Partial<Team>) => void;
    onDeleteTeam?: () => void;
    onRequestCaptainHub?: () => void; // NEW
}

type Tab = 'OVERVIEW' | 'ANALYTICS' | 'FIXTURES' | 'SQUAD';

export const TeamProfileModal: React.FC<TeamProfileModalProps> = ({
    team, isOpen, onClose, allFixtures, onViewPlayer, isFollowed, onToggleFollow, onViewMatch, onUpdateTeam, onDeleteTeam,
    onRequestCaptainHub // NEW
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');
    const [isEditing, setIsEditing] = useState(false);

    // --- ANALYTICS ENGINE ---
    const stats = useMemo(() => {
        if (!team) return null;

        const teamFixtures = allFixtures.filter(f => f.teamAId === team.id || f.teamBId === team.id);
        const completed = teamFixtures.filter(f => f.status === 'Completed');
        const upcoming = teamFixtures.filter(f => f.status === 'Scheduled');

        let wins = 0, losses = 0, ties = 0, noResult = 0;
        let battingFirstWins = 0, battingSecondWins = 0, homeWins = 0, awayWins = 0;

        const sortedCompleted = [...completed].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const formGuide = sortedCompleted.slice(0, 5).map(m => {
            if (m.winnerId === team.id) return 'W';
            if (m.winnerId === 'TIE') return 'T';
            if (!m.winnerId) return 'N';
            return 'L';
        }).reverse();

        completed.forEach(m => {
            if (m.winnerId === team.id) {
                wins++;
                const isTeamA = m.teamAId === team.id;
                const resultText = m.result || '';
                if (resultText.includes('runs')) battingFirstWins++;
                else if (resultText.includes('wickets')) battingSecondWins++;
                if (isTeamA) homeWins++; else awayWins++;
            } else if (m.winnerId === 'TIE') ties++;
            else if (!m.winnerId) noResult++;
            else losses++;
        });

        const totalPlayed = wins + losses + ties + noResult;
        const winRate = totalPlayed > 0 ? Math.round((wins / totalPlayed) * 100) : 0;

        return { totalPlayed, wins, losses, ties, noResult, winRate, formGuide, completed, upcoming, battingFirstWins, battingSecondWins, homeWins, awayWins };
    }, [team, allFixtures]);

    if (!isOpen || !team || !stats) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-5xl h-[85vh] rounded-[3rem] border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">

                {/* HEADER */}
                <div className="bg-slate-950 p-8 border-b border-slate-800 flex justify-between items-start relative shrink-0">
                    <div className="flex items-center gap-6 z-10">
                        <button
                            onClick={onClose}
                            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md"
                            title="Close Team View"
                        >
                            ←
                        </button>
                        <div className="w-24 h-24 bg-white rounded-3xl p-1 shadow-2xl relative group">
                            <img src={team.logoUrl} className="w-full h-full object-cover rounded-2xl" />
                            {onUpdateTeam && (
                                <div onClick={() => setIsEditing(true)} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer">
                                    <span className="text-white text-[10px] font-black uppercase">Edit</span>
                                </div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                                {team.name}
                                {onUpdateTeam && (
                                    <button onClick={() => setIsEditing(true)} className="text-white/20 hover:text-white transition-colors text-xl">✏️</button>
                                )}
                            </h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                                    {team.management || 'Club Team'}
                                </span>
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                                    📍 {team.location || 'Unknown Location'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 z-10">
                        {onRequestCaptainHub && (
                            <button
                                onClick={onRequestCaptainHub}
                                className="px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg border border-indigo-400"
                            >
                                Team Hub ⚡
                            </button>
                        )}
                        {onUpdateTeam && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10"
                            >
                                ✏️ Edit Team
                            </button>
                        )}
                        <button
                            onClick={onToggleFollow}
                            className={`px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${isFollowed ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                        >
                            {isFollowed ? 'Following ✓' : 'Follow Team'}
                        </button>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-all">✕</button>
                    </div>

                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />
                </div>

                {/* TABS */}
                <div className="flex bg-slate-950 border-b border-slate-800 px-8 gap-8 shrink-0 overflow-x-auto no-scrollbar">
                    {(['OVERVIEW', 'ANALYTICS', 'FIXTURES', 'SQUAD'] as Tab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-4 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === tab ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-slate-900">
                    {activeTab === 'OVERVIEW' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Matches', val: stats.totalPlayed, color: 'text-white' },
                                        { label: 'Wins', val: stats.wins, color: 'text-emerald-400' },
                                        { label: 'Losses', val: stats.losses, color: 'text-red-400' },
                                        { label: 'Win Rate', val: `${stats.winRate}%`, color: 'text-indigo-400' },
                                    ].map((s, i) => (
                                        <div key={i} className="bg-slate-800 p-6 rounded-[2rem] border border-slate-700 text-center">
                                            <div className={`text-3xl font-black ${s.color}`}>{s.val}</div>
                                            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{s.label}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700">
                                    <h3 className="text-xl font-black text-white mb-6">Recent Form</h3>
                                    <div className="flex gap-4">
                                        {stats.formGuide.length === 0 && <span className="text-slate-500 text-xs italic">No matches played yet.</span>}
                                        {stats.formGuide.map((result, i) => (
                                            <div key={i} className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-lg ${result === 'W' ? 'bg-emerald-500' : result === 'L' ? 'bg-red-500' : 'bg-slate-500'}`}>{result}</div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white text-slate-900 p-8 rounded-[2.5rem] shadow-xl">
                                <h3 className="text-xl font-black mb-4 flex items-center justify-between">
                                    Team Bio
                                    {onUpdateTeam && (
                                        <button onClick={() => setIsEditing(true)} className="text-slate-300 hover:text-indigo-600 transition-colors">✏️</button>
                                    )}
                                </h3>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">{team.name} plays out of {team.location || 'their local ground'}. Currently managed by {team.management || 'the club'}. This squad features {team.players.length} registered players.</p>
                                <div className="mt-8 pt-8 border-t border-slate-100">
                                    <div className="flex justify-between items-center mb-2"><span className="text-xs font-bold text-slate-400 uppercase">Squad Size</span><span className="text-lg font-black">{team.players.length}</span></div>
                                    <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400 uppercase">Established</span><span className="text-lg font-black">2026</span></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ANALYTICS' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700">
                                    <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">🏏 Chasing vs Defending</h3>
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between text-xs font-bold text-slate-400 mb-2"><span>Defending Target</span><span className="text-white">{stats.battingFirstWins} Wins</span></div>
                                            <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden"><div className="bg-indigo-500 h-full" style={{ width: `${(stats.battingFirstWins / Math.max(1, stats.wins)) * 100}%` }}></div></div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs font-bold text-slate-400 mb-2"><span>Chasing Target</span><span className="text-white">{stats.battingSecondWins} Wins</span></div>
                                            <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden"><div className="bg-emerald-500 h-full" style={{ width: `${(stats.battingSecondWins / Math.max(1, stats.wins)) * 100}%` }}></div></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700">
                                    <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">🏟️ Venue Performance</h3>
                                    <div className="flex items-center justify-center gap-8 h-40">
                                        <div className="text-center"><div className="w-20 h-20 rounded-full border-4 border-indigo-500 flex items-center justify-center text-2xl font-black text-white bg-indigo-500/10">{stats.homeWins}</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Home Wins</div></div>
                                        <div className="text-slate-600 text-2xl font-black">VS</div>
                                        <div className="text-center"><div className="w-20 h-20 rounded-full border-4 border-pink-500 flex items-center justify-center text-2xl font-black text-white bg-pink-500/10">{stats.awayWins}</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Away Wins</div></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'FIXTURES' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4">
                            {stats.upcoming.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Upcoming Matches</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {stats.upcoming.map(f => (
                                            <div key={f.id} className="bg-slate-800 p-6 rounded-3xl border border-slate-700 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-slate-900 px-4 py-2 rounded-xl text-center"><div className="text-xs font-black text-slate-400 uppercase">{new Date(f.date).toLocaleDateString('en-US', { month: 'short' })}</div><div className="text-xl font-black text-white">{new Date(f.date).getDate()}</div></div>
                                                    <div>
                                                        <div className="text-sm font-bold text-white">{f.teamAName} vs {f.teamBName}</div>
                                                        <div className="text-xs text-slate-500">{f.venue} • <span className="text-indigo-400 font-bold">{f.format}</span></div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => onViewMatch(f)}
                                                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                                                    >
                                                        Scorecard
                                                    </button>
                                                    <div className="px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">Scheduled</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div>
                                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Match History</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {stats.completed.map(f => (
                                        <div key={f.id} className="bg-slate-800 p-6 rounded-3xl border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <div className="text-sm font-bold text-white mb-1">{f.teamAName} vs {f.teamBName}</div>
                                                <div className="text-xs text-slate-500">{new Date(f.date).toLocaleDateString()} • {f.venue} • <span className="text-indigo-400 font-bold">{f.format}</span></div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right"><div className="text-xs font-bold text-slate-400 uppercase">Result</div><div className={`text-sm font-black ${f.winnerId === team.id ? 'text-emerald-400' : 'text-red-400'}`}>{f.winnerId === team.id ? 'WON' : f.winnerId === 'TIE' ? 'TIED' : 'LOST'}</div></div>
                                                <button onClick={() => onViewMatch(f)} className="bg-slate-900 px-4 py-3 rounded-xl border border-slate-800 text-xs font-black text-slate-300 hover:text-white transition-all uppercase">Scorecard</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'SQUAD' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-right-4">
                            {team.players.map(p => (
                                <div key={p.id} onClick={() => onViewPlayer(p.id)} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex items-center gap-4 hover:border-indigo-500 transition-colors group cursor-pointer">
                                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-800"><img src={p.photoUrl || `https://ui-avatars.com/api/?name=${p.name}&background=random`} className="w-full h-full object-cover" /></div>
                                    <div>
                                        <div className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors">{p.name}</div>
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{p.role}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isEditing && onUpdateTeam && (
                <EditTeamModal
                    team={team}
                    onClose={() => setIsEditing(false)}
                    onSave={onUpdateTeam}
                    onDelete={onDeleteTeam || (() => { })}
                />
            )}
        </div>
    );
};
