
import React, { useState, useMemo } from 'react';
import { Team, Organization } from '../../types';

interface GlobalTeamSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    allTeams: Team[];
    onSelectTeam: (team: Team) => void;
    currentOrgName: string;
}

export const GlobalTeamSearchModal: React.FC<GlobalTeamSearchModalProps> = ({ isOpen, onClose, allTeams, onSelectTeam, currentOrgName }) => {
    const [search, setSearch] = useState('');

    const filteredTeams = useMemo(() => {
        if (!search) return [];
        return allTeams.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
    }, [allTeams, search]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                <div className="p-8 border-b border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-black text-slate-900">Link Existing Team</h2>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 font-bold">×</button>
                    </div>
                    <p className="text-xs text-slate-500 font-bold mb-4">Search the global database to add a squad to <span className="text-indigo-600">{currentOrgName}</span>.</p>

                    <input
                        autoFocus
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search team name (e.g. Balmain)..."
                        className="w-full bg-slate-50 border-none outline-none p-4 rounded-xl font-bold text-lg text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {search.length === 0 ? (
                        <div className="text-center py-12 text-slate-300 font-black uppercase text-xs tracking-widest">
                            Type to search...
                        </div>
                    ) : filteredTeams.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 font-bold text-sm">
                            No teams found matching "{search}"
                        </div>
                    ) : (
                        filteredTeams.map(team => (
                            <div
                                key={team.id}
                                onClick={() => { if (confirm(`Add ${team.name} to ${currentOrgName}?`)) onSelectTeam(team); }}
                                className="group flex items-center justify-between p-4 rounded-xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100 cursor-pointer transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-300 flex items-center justify-center font-black text-lg group-hover:bg-white group-hover:text-indigo-600 border border-slate-200 group-hover:border-indigo-200">
                                        {team.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 group-hover:text-indigo-700">{team.name}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{team.location || 'Unknown Location'}</p>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md">
                                    Add +
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
