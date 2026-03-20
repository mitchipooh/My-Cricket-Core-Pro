
import React, { useState } from 'react';

interface AddPlayerModalProps {
  isOpen: boolean;
  teamName: string;
  onClose: () => void;
  onSave: (name: string, role: string) => void;
}

export const AddPlayerModal: React.FC<AddPlayerModalProps> = ({ isOpen, teamName, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Batsman');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name, role);
      setName('');
      setRole('Batsman');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 overflow-hidden">
        <div className="bg-slate-900 p-6 text-white text-center">
            <h3 className="text-xl font-black mb-1">Add Player</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">To {teamName}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Player Name</label>
                <input 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Virat Kohli"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 outline-none focus:border-indigo-500"
                    autoFocus
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Primary Role</label>
                <select 
                    value={role} 
                    onChange={e => setRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 outline-none focus:border-indigo-500"
                >
                    <option value="Batsman">Batsman</option>
                    <option value="Bowler">Bowler</option>
                    <option value="All-rounder">All-rounder</option>
                    <option value="Wicket-keeper">Wicket-keeper</option>
                </select>
            </div>

            <div className="flex gap-3 mt-6">
                <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-400 font-black uppercase text-xs hover:text-slate-600">Cancel</button>
                <button type="submit" disabled={!name.trim()} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-500 shadow-lg disabled:opacity-50">
                    Add to Squad
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

