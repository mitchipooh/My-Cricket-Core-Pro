
import React, { useState, useEffect } from 'react';
import { UserProfile, Organization } from '../../types';
import { searchPlayersForMarket } from '../../services/centralZoneService';

interface TransferMarketProps {
    onBack: () => void;
    onViewPlayer: (id: string) => void;
    currentOrg: Organization | null;
    onSendInvite: (org: Organization, player: UserProfile) => void;
}

export const TransferMarket: React.FC<TransferMarketProps> = ({
    onBack, onViewPlayer, currentOrg, onSendInvite
}) => {
    const [players, setPlayers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadMarket();
    }, [roleFilter]);

    const loadMarket = async () => {
        setLoading(true);
        const results = await searchPlayersForMarket(roleFilter === 'ALL' ? undefined : roleFilter);
        setPlayers(results);
        setLoading(false);
    };

    const filteredPlayers = players.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.handle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all hover:shadow-lg"
                    >
                        ←
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Transfer Market</h1>
                        <p className="text-indigo-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Recruit Global Talent</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-xl border border-slate-100">
                    <div className="relative">
                        <span className="absolute left-4 top-3.5 text-slate-400 text-sm">🔍</span>
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search names or @handles..."
                            className="bg-slate-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-700 w-full md:w-64 focus:ring-2 ring-indigo-500/20"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black text-slate-700 uppercase tracking-wider cursor-pointer"
                    >
                        <option value="ALL">All Roles</option>
                        <option value="Batsman">Batsmen</option>
                        <option value="Bowler">Bowlers</option>
                        <option value="All-rounder">All-Rounders</option>
                        <option value="Wicket-keeper">Keepers</option>
                    </select>
                </div>
            </div>

            {/* Market Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-50 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-slate-100 h-64 rounded-[2.5rem]" />
                    ))}
                </div>
            ) : filteredPlayers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredPlayers.map(player => (
                        <div
                            key={player.id}
                            className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-20 h-20 rounded-3xl bg-slate-50 border-2 border-slate-100 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                                    <img
                                        src={player.avatarUrl || `https://ui-avatars.com/api/?name=${player.name}&background=6366f1&color=fff`}
                                        className="w-full h-full object-cover"
                                        alt={player.name}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-slate-900 leading-tight truncate">{player.name}</h3>
                                    <p className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest">{player.handle}</p>
                                    <div className="mt-1 flex gap-1">
                                        <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border border-emerald-100">
                                            LFC ✓
                                        </span>
                                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter">
                                            {player.playerDetails?.primaryRole || 'Player'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Bio/Stats Preview */}
                            <div className="bg-slate-50 rounded-2xl p-4 flex-1 mb-6">
                                <p className="text-xs text-slate-500 font-medium line-clamp-3 leading-relaxed">
                                    {player.playerDetails?.bio || "This player has haven't provided a bio yet, but is actively looking for a new club to join for the 2026 season."}
                                </p>
                                <div className="mt-4 pt-4 border-t border-slate-200/50 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Style</p>
                                        <p className="text-xs font-bold text-slate-700">{player.playerDetails?.battingStyle || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bowling</p>
                                        <p className="text-xs font-bold text-slate-700 truncate">{player.playerDetails?.bowlingStyle || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onViewPlayer(player.id)}
                                    className="flex-1 border-2 border-slate-100 text-slate-600 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                                >
                                    Full Bio
                                </button>
                                {currentOrg && (
                                    <button
                                        onClick={() => onSendInvite(currentOrg, player)}
                                        className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-500 transition-all"
                                    >
                                        Invite
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <p className="text-6xl mb-6 grayscale">🏃‍♂️</p>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Market is Quiet</h3>
                    <p className="text-slate-500 font-medium">No players are currently looking for a club with these filters.</p>
                </div>
            )}
        </div>
    );
};
