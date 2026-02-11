import React, { useState } from 'react';
import { UserProfile, MatchFixture } from '../../types';

interface ScorerProfileProps {
    profile: UserProfile;
    onUpdateProfile: (updates: Partial<UserProfile>) => void;
    fixtures: MatchFixture[];
    onAcceptFixture: (fixtureId: string) => void;
    onBack?: () => void;
}

export const ScorerProfile: React.FC<ScorerProfileProps> = ({ profile, onUpdateProfile, fixtures, onAcceptFixture, onBack }) => {
    const details = profile.scorerDetails || { isHireable: false, hourlyRate: 0, experienceYears: 0, bio: '' };
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState(details);
    const [activeTab, setActiveTab] = useState<'MY_GAMES' | 'AVAILABLE'>('MY_GAMES');

    // Filter fixtures
    const scoutedGames = fixtures.filter(f => f && f.scorerId === profile.id);
    const availableFixtures = fixtures.filter(f =>
        f && !f.scorerId && f.status !== 'Completed' && (new Date(f.date).getTime() > Date.now() - 86400000)
    );

    const handleSave = () => {
        onUpdateProfile({ scorerDetails: editForm });
        setIsEditing(false);
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    };

    const incompleteGames = scoutedGames.filter(f => f.status === 'Live');

    return (
        <div className="animate-in slide-in-from-bottom-8 min-h-screen bg-slate-50 pb-20">
            {/* INCOMPLETE GAMES WARNING */}
            {incompleteGames.length > 0 && (
                <div className="bg-red-500 text-white px-4 py-3 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-3">
                        <span className="text-lg animate-pulse">⚠</span>
                        <p className="text-[10px] font-black uppercase tracking-widest">
                            Incomplete Games Detected ({incompleteGames.length})
                        </p>
                    </div>
                    <button
                        onClick={() => setActiveTab('MY_GAMES')}
                        className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                        View Assignments
                    </button>
                </div>
            )}
            {/* Collapsed Header / Top Bar */}
            <div className="bg-slate-900 text-white p-4 sticky top-0 z-30 shadow-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center font-black text-sm">
                            {profile.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">{profile.name}</h1>
                            {onBack && (
                                <button onClick={onBack} className="text-[10px] text-indigo-300 uppercase tracking-widest hover:text-white">
                                    ← Dashboard
                                </button>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="text-[10px] bg-white/10 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider hover:bg-white/20"
                    >
                        {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                </div>
            </div>

            {/* Editing Form (Overlay) */}
            {isEditing && (
                <div className="bg-white p-6 m-4 rounded-[2rem] shadow-xl border border-slate-200 animate-in zoom-in-95">
                    <h3 className="text-xl font-black text-slate-900 mb-6">Edit Profile</h3>
                    {/* ... (Keep editing fields concise) ... */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hourly Rate ($)</label>
                            <input type="number" value={editForm.hourlyRate} onChange={(e) => setEditForm({ ...editForm, hourlyRate: Number(e.target.value) })} className="w-full bg-slate-50 border rounded-xl px-4 py-2 mt-1" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Experience (Years)</label>
                            <input type="number" value={editForm.experienceYears} onChange={(e) => setEditForm({ ...editForm, experienceYears: Number(e.target.value) })} className="w-full bg-slate-50 border rounded-xl px-4 py-2 mt-1" />
                        </div>
                        <button onClick={handleSave} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest mt-4">Save</button>
                    </div>
                </div>
            )}

            {/* Menu / Tabs - Collapsed to Top */}
            <div className="px-4 py-4">
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                    <button
                        onClick={() => setActiveTab('MY_GAMES')}
                        className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'MY_GAMES' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                    >
                        Assignments
                    </button>
                    <button
                        onClick={() => setActiveTab('AVAILABLE')}
                        className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'AVAILABLE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                    >
                        Find Work ({availableFixtures.length})
                    </button>
                </div>
            </div>

            {/* Fixture List - Modern Table Look */}
            <div className="px-4 space-y-3">
                {activeTab === 'MY_GAMES' && (
                    scoutedGames.length > 0 ? (
                        scoutedGames.map(game => (
                            <div key={game.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-3">
                                {/* Left: Date/Time */}
                                <div className="flex flex-col items-center justify-center w-14 shrink-0 border-r border-slate-100 pr-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">{formatDate(game.date).split(' ')[0]}</span>
                                    <span className="text-lg font-black text-indigo-600 leading-none">{formatDate(game.date).split(' ')[1]}</span>
                                    <span className="text-[9px] font-bold text-slate-400 mt-1">{formatTime(game.date)}</span>
                                </div>

                                {/* Center: Match Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col gap-0.5">
                                        <div className="font-bold text-slate-900 text-sm truncate">{game.teamAName}</div>
                                        <div className="text-[9px] font-black text-slate-300 uppercase">VS</div>
                                        <div className="font-bold text-slate-900 text-sm truncate">{game.teamBName}</div>
                                    </div>
                                    <div className="flex items-center gap-1 mt-1.5 text-[10px] font-medium text-slate-500">
                                        <span>📍</span> <span className="truncate">{game.venue}</span>
                                    </div>
                                </div>

                                {/* Right: Status Badge */}
                                <div className="shrink-0">
                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${game.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                        {game.status === 'Completed' ? 'Done' : 'Active'}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center p-8 text-slate-400 text-xs font-bold uppercase tracking-widest">No assigned games</div>
                    )
                )}

                {activeTab === 'AVAILABLE' && (
                    availableFixtures.length > 0 ? (
                        availableFixtures.map(game => (
                            <div key={game.id} className="bg-white rounded-xl p-0 shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row">
                                <div className="p-4 flex items-center gap-4">
                                    {/* Left: Date/Time Block */}
                                    <div className="flex flex-col items-center justify-center w-14 shrink-0 border-r border-slate-100 pr-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">{formatDate(game.date).split(' ')[0]}</span>
                                        <span className="text-xl font-black text-indigo-600 leading-none">{formatDate(game.date).split(' ')[1]}</span>
                                        <span className="text-[9px] font-bold text-slate-400 mt-1">{formatTime(game.date)}</span>
                                    </div>

                                    {/* Center: Teams & Venue */}
                                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                                        <div className="font-bold text-slate-900 text-base leading-tight break-words">{game.teamAName}</div>
                                        <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">VS</div>
                                        <div className="font-bold text-slate-900 text-base leading-tight break-words">{game.teamBName}</div>

                                        <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 font-medium">
                                            <span>📍</span> {game.venue}
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom: Action Button (Full Width on Mobile) */}
                                <button
                                    onClick={() => onAcceptFixture(game.id)}
                                    className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black uppercase text-[10px] tracking-widest py-3 border-t border-indigo-100 flex items-center justify-center gap-2"
                                >
                                    <span>Accept Match</span>
                                    <span>→</span>
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center p-8 text-slate-400 text-xs font-bold uppercase tracking-widest">No available games found</div>
                    )
                )}
            </div>
        </div>
    );
};
