import React, { useState, useMemo } from 'react';
import { Team, Organization } from '../../types';

interface TeamRegistryProps {
    allTeams: Team[];
    allOrganizations: Organization[];
    onViewTeam: (teamId: string) => void;
    onBack: () => void;
}

export const TeamRegistry: React.FC<TeamRegistryProps> = ({ allTeams, allOrganizations, onViewTeam, onBack }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrgId, setSelectedOrgId] = useState<string>('ALL');

    const filteredTeams = useMemo(() => {
        return allTeams.filter(team => {
            const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase());

            // Find team's organization - check memberTeams array
            const teamOrg = allOrganizations.find(org =>
                org.memberTeams?.some(mt => mt.id === team.id)
            );
            const matchesOrg = selectedOrgId === 'ALL' || (teamOrg && teamOrg.id === selectedOrgId);

            return matchesSearch && matchesOrg;
        });
    }, [allTeams, allOrganizations, searchTerm, selectedOrgId]);

    // Calculate stats from player data
    const stats = {
        total: filteredTeams.length,
        totalPlayers: filteredTeams.reduce((acc, t) => acc + t.players.length, 0),
        totalRuns: filteredTeams.reduce((acc, t) => acc + t.players.reduce((sum, p) => sum + p.stats.runs, 0), 0),
        totalWickets: filteredTeams.reduce((acc, t) => acc + t.players.reduce((sum, p) => sum + p.stats.wickets, 0), 0),
        totalMatches: filteredTeams.reduce((acc, t) => acc + t.players.reduce((sum, p) => sum + p.stats.matches, 0), 0),
    };

    return (
        <div className="max-w-[100vw] overflow-x-hidden mx-auto p-4 md:p-12 min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12 gap-6">
                <div>
                    <button
                        onClick={onBack}
                        className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-4 hover:text-indigo-500 transition-colors"
                    >
                        ← Back
                    </button>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter mb-2">Team Registry</h1>
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Central Zone Team Database</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-lg border border-slate-100 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <span className="absolute left-4 top-3.5 text-slate-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Search by team name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-700 w-full md:w-64 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                    </div>
                    <select
                        value={selectedOrgId}
                        onChange={(e) => setSelectedOrgId(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer hover:bg-slate-100 flex-1 md:flex-none"
                    >
                        <option value="ALL">All Organizations</option>
                        {allOrganizations.map(org => (
                            <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-10">
                <div className="bg-indigo-600 rounded-2xl p-3 md:p-4 text-white shadow-lg shadow-indigo-200">
                    <p className="text-2xl md:text-3xl font-black">{stats.total}</p>
                    <p className="text-[8px] md:text-[9px] uppercase tracking-widest opacity-80 font-bold">Teams Found</p>
                </div>
                <div className="bg-white rounded-2xl p-3 md:p-4 border border-slate-100 shadow-sm">
                    <p className="text-xl md:text-2xl font-black text-slate-800">{stats.totalPlayers}</p>
                    <p className="text-[8px] md:text-[9px] uppercase tracking-widest text-slate-400 font-bold">Total Players</p>
                </div>
                <div className="bg-white rounded-2xl p-3 md:p-4 border border-slate-100 shadow-sm">
                    <p className="text-xl md:text-2xl font-black text-slate-800">{stats.totalMatches}</p>
                    <p className="text-[8px] md:text-[9px] uppercase tracking-widest text-slate-400 font-bold">Total Matches</p>
                </div>
                <div className="bg-white rounded-2xl p-3 md:p-4 border border-slate-100 shadow-sm">
                    <p className="text-xl md:text-2xl font-black text-slate-800 lg:text-2xl overflow-hidden text-ellipsis">{stats.totalRuns.toLocaleString()}</p>
                    <p className="text-[8px] md:text-[9px] uppercase tracking-widest text-slate-400 font-bold whitespace-nowrap">Total Runs</p>
                </div>
                <div className="bg-white rounded-2xl p-3 md:p-4 border border-slate-100 shadow-sm">
                    <p className="text-xl md:text-2xl font-black text-slate-800">{stats.totalWickets.toLocaleString()}</p>
                    <p className="text-[8px] md:text-[9px] uppercase tracking-widest text-slate-400 font-bold whitespace-nowrap">Total Wickets</p>
                </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTeams.map(team => {
                    const org = allOrganizations.find(o =>
                        o.memberTeams?.some(mt => mt.id === team.id)
                    );
                    const teamRuns = team.players.reduce((sum, p) => sum + p.stats.runs, 0);
                    const teamWickets = team.players.reduce((sum, p) => sum + p.stats.wickets, 0);
                    const teamMatches = team.players.reduce((sum, p) => sum + p.stats.matches, 0);
                    const avgRuns = teamMatches > 0 ? (teamRuns / teamMatches).toFixed(0) : 0;

                    return (
                        <div
                            key={team.id}
                            onClick={() => onViewTeam(team.id)}
                            className="bg-white rounded-[2rem] p-6 border border-slate-100 hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-transparent rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>

                            <div className="flex items-center gap-4 mb-6 relative">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 border-2 border-indigo-50 shadow-lg overflow-hidden flex items-center justify-center text-white text-2xl font-black">
                                    {team.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1" title={team.name}>{team.name}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{team.players.length} Players</p>
                                    {org && (
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 rounded-md text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                                            {org.name}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 relative">
                                <div className="bg-slate-50 p-3 rounded-xl text-center">
                                    <p className="text-xl font-black text-slate-800">{teamMatches}</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Matches</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl text-center">
                                    <p className="text-xl font-black text-slate-800">{teamRuns.toLocaleString()}</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Runs</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl text-center">
                                    <p className="text-xl font-black text-slate-800">{teamWickets}</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Wickets</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl text-center">
                                    <p className="text-xl font-black text-slate-800">{avgRuns}</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Avg Runs</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredTeams.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-6xl mb-4">🔍</p>
                    <h3 className="text-xl font-black text-slate-900 mb-2">No Teams Found</h3>
                    <p className="text-slate-500 text-sm">Try adjusting your search terms or filters.</p>
                </div>
            )}
        </div>
    );
};
