
import React, { useState } from 'react';
import { Tournament } from '../../types.ts';

interface EditTournamentModalProps {
    tournament: Tournament;
    onSave: (updates: Partial<Tournament>) => void;
    onClose: () => void;
    onDelete: () => void;
}

export const EditTournamentModal: React.FC<EditTournamentModalProps> = ({
    tournament, onSave, onClose, onDelete
}) => {
    const [formData, setFormData] = useState({
        name: tournament.name,
        format: tournament.format,
        overs: tournament.overs,
        status: tournament.status,
        startDate: tournament.startDate || '',
        endDate: tournament.endDate || '',
        gameStartTime: tournament.gameStartTime || '',
        description: tournament.description || ''
    });

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-xl shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Edit Tournament</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xl">✕</button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Tournament Name</label>
                        <input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-slate-50 border-none p-4 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-indigo-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Format</label>
                            <select
                                value={formData.format}
                                onChange={e => setFormData({ ...formData, format: e.target.value as any })}
                                className="w-full bg-slate-50 border-none p-4 rounded-xl font-bold text-sm outline-none"
                            >
                                <option value="T20">T20</option>
                                <option value="ODI">ODI</option>
                                <option value="TEST">TEST</option>
                                <option value="The 100">The 100</option>
                                <option value="T10">T10</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Overs</label>
                            <input
                                type="number"
                                value={formData.overs}
                                onChange={e => setFormData({ ...formData, overs: parseInt(e.target.value) })}
                                className="w-full bg-slate-50 border-none p-4 rounded-xl font-bold text-sm outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Default Start Time</label>
                            <input
                                type="time"
                                value={formData.gameStartTime}
                                onChange={e => setFormData({ ...formData, gameStartTime: e.target.value })}
                                className="w-full bg-slate-50 border-none p-4 rounded-xl font-bold text-sm outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Status</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                className="w-full bg-slate-50 border-none p-4 rounded-xl font-bold text-sm outline-none"
                            >
                                <option value="Upcoming">Upcoming</option>
                                <option value="Ongoing">Ongoing</option>
                                <option value="Completed">Completed</option>
                                <option value="Draft">Draft</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Start Date</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full bg-slate-50 border-none p-4 rounded-xl font-bold text-sm outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">End Date</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full bg-slate-50 border-none p-4 rounded-xl font-bold text-sm outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Description / About</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Details about this tournament..."
                            className="w-full bg-slate-50 border-none p-4 rounded-xl font-bold text-sm outline-none min-h-[100px] resize-none"
                        />
                    </div>

                    <div className="pt-6 flex flex-col gap-3">
                        <button
                            onClick={handleSave}
                            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-500 transition-all"
                        >
                            Save Updates
                        </button>
                        <button
                            onClick={() => {
                                if (confirm('Are you sure you want to delete this tournament? This cannot be undone.')) {
                                    onDelete();
                                    onClose();
                                }
                            }}
                            className="w-full py-4 text-red-500 font-black uppercase text-[10px] tracking-widest hover:bg-red-50 hover:rounded-2xl transition-all"
                        >
                            Delete Tournament
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
