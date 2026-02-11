
import React, { useState } from 'react';
import { Player } from '../../types.ts';

interface NewBatterModalProps {
  isOpen: boolean;
  teamName: string;
  availableBatters: Player[];
  targetRole: 'Striker' | 'NonStriker';
  onSelect: (playerId: string) => void;
}

export const NewBatterModal: React.FC<NewBatterModalProps> = ({
  isOpen,
  teamName,
  availableBatters,
  targetRole,
  onSelect
}) => {
  const [selectedId, setSelectedId] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[150] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 overflow-hidden">
        <div className="bg-slate-950 p-6 border-b border-slate-800 text-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl mx-auto flex items-center justify-center text-2xl shadow-lg mb-3">🏏</div>
          <h3 className="text-xl font-black text-white uppercase">New Batter Required</h3>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Select New Batter for {teamName}</p>
        </div>

        <div className="p-6 space-y-4">
          {availableBatters.length === 0 ? (
            <div className="text-center p-4 bg-red-500/10 rounded-xl text-red-400 font-bold text-xs uppercase">
              No more batters available.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {availableBatters.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full p-4 rounded-xl text-left border transition-all flex justify-between items-center ${selectedId === p.id
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                >
                  <span className="font-bold text-sm">{p.name}</span>
                  <span className="text-[9px] font-mono opacity-60 uppercase">{p.role}</span>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => selectedId && onSelect(selectedId)}
            disabled={!selectedId}
            className="w-full py-4 bg-white text-slate-900 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition-all mt-4"
          >
            Confirm Batter
          </button>
        </div>
      </div>
    </div>
  );
};

