import React, { useState, useMemo } from 'react';
import { Player, Team, MatchFixture } from '../../types';

interface PlayerRegistryProps {
    allPlayers: Player[];
    allTeams: Team[];
    onViewPlayer: (playerId: string) => void;
    onBack: () => void;
}

export const PlayerRegistry: React.FC<PlayerRegistryProps> = ({ allPlayers, allTeams, onViewPlayer, onBack }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTeamId, setSelectedTeamId] = useState<string>('ALL');

    const filteredPlayers = useMemo(() => {
        return allPlayers.filter(player => {
            const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());

            // Find player's team
            const playerTeam = allTeams.find(t => t.players.some(p => p.id === player.id));
            const matchesTeamName = playerTeam && playerTeam.name.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesTeam = selectedTeamId === 'ALL' || (playerTeam && playerTeam.id === selectedTeamId);

            return (matchesSearch || matchesTeamName) && matchesTeam;
        });
    }, [allPlayers, allTeams, searchTerm, selectedTeamId]);

    // Group players by role for stats
    const stats = {
        total: filteredPlayers.length,
        batsmen: filteredPlayers.filter(p => p.role === 'Batsman').length,
        bowlers: filteredPlayers.filter(p => p.role === 'Bowler').length,
        allRounders: filteredPlayers.filter(p => p.role === 'All-rounder').length,
        keepers: filteredPlayers.filter(p => p.role === 'Wicket-keeper').length,
        runs: filteredPlayers.reduce((acc, p) => acc + p.stats.runs, 0),
        wickets: filteredPlayers.reduce((acc, p) => acc + p.stats.wickets, 0),
    };

    return (
        <div className="max-w-[100vw] overflow-x-hidden mx-auto p-4 md:p-12 min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12 gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter mb-2">Player Registry</h1>
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Central Zone Player Database</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-lg border border-slate-100 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <span className="absolute left-4 top-3.5 text-slate-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-700 w-full md:w-64 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                    </div>
                    <select
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer hover:bg-slate-100 flex-1 md:flex-none"
                    >
                        <option value="ALL">All Teams</option>
                        {allTeams.map(team => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4 mb-10">
                <div className="bg-indigo-600 rounded-2xl p-3 md:p-4 text-white shadow-lg shadow-indigo-200">
                    <p className="text-2xl md:text-3xl font-black">{stats.total}</p>
                    <p className="text-[8px] md:text-[9px] uppercase tracking-widest opacity-80 font-bold">Players Found</p>
                </div>
                <div className="bg-white rounded-2xl p-3 md:p-4 border border-slate-100 shadow-sm">
                    <p className="text-xl md:text-2xl font-black text-slate-800">{stats.batsmen}</p>
                    <p className="text-[8px] md:text-[9px] uppercase tracking-widest text-slate-400 font-bold">Batsmen</p>
                </div>
                <div className="bg-white rounded-2xl p-3 md:p-4 border border-slate-100 shadow-sm">
                    <p className="text-xl md:text-2xl font-black text-slate-800">{stats.bowlers}</p>
                    <p className="text-[8px] md:text-[9px] uppercase tracking-widest text-slate-400 font-bold">Bowlers</p>
                </div>
                <div className="bg-white rounded-2xl p-3 md:p-4 border border-slate-100 shadow-sm">
                    <p className="text-xl md:text-2xl font-black text-slate-800">{stats.allRounders}</p>
                    <p className="text-[8px] md:text-[9px] uppercase tracking-widest text-slate-400 font-bold">All-Rounders</p>
                </div>
                <div className="bg-white rounded-2xl p-3 md:p-4 border border-slate-100 shadow-sm">
                    <p className="text-xl md:text-2xl font-black text-slate-800 lg:text-2xl overflow-hidden text-ellipsis">{stats.runs.toLocaleString()}</p>
                    <p className="text-[8px] md:text-[9px] uppercase tracking-widest text-slate-400 font-bold whitespace-nowrap">Total Runs</p>
                </div>
                <div className="bg-white rounded-2xl p-3 md:p-4 border border-slate-100 shadow-sm">
                    <p className="text-xl md:text-2xl font-black text-slate-800">{stats.wickets.toLocaleString()}</p>
                    <p className="text-[8px] md:text-[9px] uppercase tracking-widest text-slate-400 font-bold whitespace-nowrap">Total Wickets</p>
                </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPlayers.map(player => {
                    const team = allTeams.find(t => t.players.some(p => p.id === player.id));
                    return (
                        <div
                            key={player.id}
                            onClick={() => onViewPlayer(player.id)}
                            className="bg-white rounded-[2rem] p-6 border border-slate-100 hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-transparent rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>

                            <div className="flex items-center gap-4 mb-6 relative">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-slate-50 shadow-inner overflow-hidden flex items-center justify-center text-2xl">
                                    {player.photoUrl ? <img src={player.photoUrl} className="w-full h-full object-cover" /> : '👤'}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1" title={player.name}>{player.name}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{player.role}</p>
                                    {team && (
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 rounded-md text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                                            {team.name}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 relative">
                                <div className="bg-slate-50 p-3 rounded-xl text-center">
                                    <p className="text-xl font-black text-slate-800">{player.stats.runs}</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Runs</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl text-center">
                                    <p className="text-xl font-black text-slate-800">{player.stats.wickets}</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Wickets</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl text-center">
                                    <p className="text-xl font-black text-slate-800">{player.stats.matches || 0}</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Matches</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl text-center">
                                    <p className="text-xl font-black text-slate-800">{(player.stats.runs / (player.stats.matches || 1)).toFixed(1)}</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Avg</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredPlayers.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-6xl mb-4">🔍</p>
                    <h3 className="text-xl font-black text-slate-900 mb-2">No Players Found</h3>
                    <p className="text-slate-500 text-sm">Try adjusting your search terms or filters.</p>
                </div>
            )}
        </div>
    );
};
