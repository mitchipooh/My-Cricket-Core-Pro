import React, { useState } from 'react';
import { Player, Team, MatchFixture } from '../../types';

interface SquadSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    fixture: MatchFixture;
    team: Team; // The captain's team
    onSave: (fixtureId: string, squadIds: string[]) => void;
}

export const SquadSelectorModal: React.FC<SquadSelectorModalProps> = ({ isOpen, onClose, fixture, team, onSave }) => {
    // Safely derive initial selection. We need to identify if we are Team A or Team B
    const isTeamA = fixture.teamAId === team.id;
    const initialSquad = isTeamA ? (fixture.teamASquadIds || []) : (fixture.teamBSquadIds || []);

    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(initialSquad);

    if (!isOpen) return null;

    const togglePlayer = (playerId: string) => {
        if (selectedPlayerIds.includes(playerId)) {
            setSelectedPlayerIds(prev => prev.filter(id => id !== playerId));
        } else {
            if (selectedPlayerIds.length >= 11) {
                alert("You can only select 11 players!");
                return;
            }
            setSelectedPlayerIds(prev => [...prev, playerId]);
        }
    };

    const handleSave = () => {
        onSave(fixture.id, selectedPlayerIds);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">Select Playing XI</h2>
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">{fixture.venue} • {new Date(fixture.date).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-indigo-100 text-indigo-700 font-black px-4 py-2 rounded-xl text-sm">
                        {selectedPlayerIds.length} / 11
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {team.players.map(player => {
                            const isSelected = selectedPlayerIds.includes(player.id);
                            return (
                                <div
                                    key={player.id}
                                    onClick={() => togglePlayer(player.id)}
                                    className={`p-3 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${isSelected ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
                                >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                                        {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                                    </div>
                                    <div>
                                        <p className={`font-bold text-sm leading-tight ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{player.name}</p>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">{player.role}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex gap-4 justify-end bg-white">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={selectedPlayerIds.length === 0}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
                    >
                        Save Squad
                    </button>
                </div>
            </div>
        </div>
    );
};
