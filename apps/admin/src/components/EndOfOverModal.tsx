
import React from 'react';
import { Player } from '../../types.ts';

interface EndOfOverModalProps {
  isOpen: boolean;
  overNumber: number;
  bowlingTeamName: string;
  currentBowlerId: string;
  bowlers: Player[];
  onSelectBowler: (id: string) => void;
  getAvailability: (id: string) => { allowed: boolean; reason: string };
}

export const EndOfOverModal: React.FC<EndOfOverModalProps> = ({
  isOpen,
  overNumber,
  bowlingTeamName,
  currentBowlerId,
  bowlers,
  onSelectBowler,
  getAvailability
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[50] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
        <div className="bg-slate-900 p-8 text-center">
           <h2 className="text-2xl font-black text-white uppercase italic tracking-wider">Over {overNumber} Complete</h2>
           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Select Next Bowler for {bowlingTeamName}</p>
        </div>
        
        <div className="p-4 bg-slate-50 max-h-[60vh] overflow-y-auto custom-scrollbar">
           <div className="grid grid-cols-1 gap-2">
              {bowlers.map(p => {
                 const avail = getAvailability(p.id);
                 const isCurrent = p.id === currentBowlerId;
                 return (
                    <button 
                       key={p.id}
                       disabled={!avail.allowed}
                       onClick={() => onSelectBowler(p.id)}
                       className={`w-full p-4 rounded-xl flex items-center justify-between border-2 transition-all ${
                          isCurrent 
                            ? 'border-slate-200 bg-slate-100 opacity-50 cursor-not-allowed'
                            : !avail.allowed 
                               ? 'border-slate-100 bg-white opacity-40 grayscale' 
                               : 'border-white bg-white shadow-sm hover:border-indigo-500 hover:shadow-md'
                       }`}
                    >
                       <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${isCurrent ? 'bg-slate-300 text-slate-500' : 'bg-indigo-100 text-indigo-600'}`}>
                             {p.name.charAt(0)}
                          </div>
                          <div className="text-left">
                             <div className="font-bold text-sm text-slate-900">{p.name}</div>
                             <div className="text-[10px] font-bold text-slate-400 uppercase">{p.role}</div>
                          </div>
                       </div>
                       {!avail.allowed && (
                          <span className="text-[9px] font-black text-red-400 uppercase tracking-wider">{avail.reason}</span>
                       )}
                    </button>
                 );
              })}
           </div>
        </div>
      </div>
    </div>
  );
};

