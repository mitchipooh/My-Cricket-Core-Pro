
import React, { useState } from 'react';
import { Player } from '../../types.ts';

interface PlayerEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamName: string;
    currentPlayerId: string;
    currentPlayerName: string;
    role: 'Striker' | 'NonStriker' | 'Bowler';
    availablePlayers: Player[];
    onReplace: (oldId: string, newId: string, role: 'striker' | 'nonStriker' | 'bowler') => void;
    onRetire?: (playerId: string, type: 'Retired Hurt' | 'Retired Out') => void;
    onInjury?: (newPlayerId: string) => void;
}

export const PlayerEditModal: React.FC<PlayerEditModalProps> = ({
    isOpen, onClose, teamName, currentPlayerId, currentPlayerName, role, availablePlayers, onReplace, onRetire, onInjury
}) => {
    const [action, setAction] = useState<'REPLACE' | 'RETIRE' | 'INJURY'>('REPLACE');
    const [selectedPlayerId, setSelectedPlayerId] = useState('');
    const [retirementType, setRetirementType] = useState<'Retired Hurt' | 'Retired Out'>('Retired Hurt');

    if (!isOpen) return null;

    const handleSave = () => {
        if (action === 'REPLACE') {
            if (selectedPlayerId && selectedPlayerId !== currentPlayerId) {
                // Map the capitalized Role to the lowercase internal role expected by the engine
                const internalRole = role === 'Striker' ? 'striker' : role === 'NonStriker' ? 'nonStriker' : 'bowler';
                onReplace(currentPlayerId, selectedPlayerId, internalRole);
                onClose();
            }
        } else if (action === 'RETIRE' && onRetire) {
            onRetire(currentPlayerId, retirementType);
            onClose();
        } else if (action === 'INJURY' && onInjury && selectedPlayerId) {
            onInjury(selectedPlayerId);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="bg-slate-100 p-6 border-b border-slate-200">
                    <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Edit {role}</h3>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{currentPlayerName}</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Action Selector */}
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setAction('REPLACE')}
                            className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${action === 'REPLACE' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
                        >
                            Correction
                        </button>

                        {role !== 'Bowler' ? (
                            <button
                                onClick={() => setAction('RETIRE')}
                                className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${action === 'RETIRE' ? 'bg-white shadow-sm text-red-600' : 'text-slate-400'}`}
                            >
                                Retire
                            </button>
                        ) : (
                            <button
                                onClick={() => setAction('INJURY')}
                                className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${action === 'INJURY' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}
                            >
                                Injury
                            </button>
                        )}
                    </div>

                    {action === 'REPLACE' && (
                        <div className="space-y-4">
                            <p className="text-xs text-slate-500">
                                Select the correct player who should be <strong>{role}</strong>. This will retroactively fix the current ball state but won't change history.
                            </p>
                            <UserSelect
                                available={availablePlayers}
                                current={currentPlayerId}
                                selected={selectedPlayerId}
                                onChange={setSelectedPlayerId}
                            />
                        </div>
                    )}

                    {action === 'INJURY' && (
                        <div className="space-y-4">
                            <p className="text-xs text-slate-500">
                                <strong>Injury Replacement:</strong> The new bowler will complete the current over.
                            </p>
                            <UserSelect
                                available={availablePlayers}
                                current={currentPlayerId}
                                selected={selectedPlayerId}
                                onChange={setSelectedPlayerId}
                            />
                        </div>
                    )}

                    {action === 'RETIRE' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-red-500 px-1">Retirement Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setRetirementType('Retired Hurt')}
                                        className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${retirementType === 'Retired Hurt' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                                    >
                                        🤕 Retired Hurt
                                        <span className="block text-[9px] font-normal mt-1 text-slate-500">Can return later (Not Out)</span>
                                    </button>
                                    <button
                                        onClick={() => setRetirementType('Retired Out')}
                                        className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${retirementType === 'Retired Out' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                                    >
                                        🛑 Retired Out
                                        <span className="block text-[9px] font-normal mt-1 text-slate-500">Cannot return (Wicket)</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={(action === 'REPLACE' || action === 'INJURY') && !selectedPlayerId}
                        className="flex-1 py-4 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper component to dry up the select logic
const UserSelect = ({ available, current, selected, onChange }: { available: Player[], current: string, selected: string, onChange: (id: string) => void }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 px-1">Swap With</label>
        <select
            value={selected}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
        >
            <option value="">Select teammate...</option>
            {available.filter(p => p.id !== current).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
            ))}
        </select>
    </div>
);
