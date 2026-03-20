
import React, { useState } from 'react';
import { BallEvent, Team, WicketType } from '../../types.ts';

interface BallEditorModalProps {
  ball: BallEvent;
  battingTeam?: Team;
  bowlingTeam?: Team;
  onClose: () => void;
  onSave: (updates: Partial<BallEvent>) => void;
}

export const BallEditorModal: React.FC<BallEditorModalProps> = ({ ball, battingTeam, bowlingTeam, onClose, onSave }) => {
  const [runs, setRuns] = useState(ball.runs);
  const [extraType, setExtraType] = useState(ball.extraType);
  const [extraRuns, setExtraRuns] = useState(ball.extraRuns || 0);
  const [isWicket, setIsWicket] = useState(ball.isWicket);
  const [wicketType, setWicketType] = useState<string | undefined>(ball.wicketType);
  const [strikerId, setStrikerId] = useState(ball.strikerId);
  const [bowlerId, setBowlerId] = useState(ball.bowlerId);

  const WICKET_TYPES: WicketType[] = [
    'Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket'
  ];

  const handleSave = () => {
    onSave({
      runs,
      batRuns: extraType === 'Wide' ? 0 : runs,
      extraType,
      extraRuns,
      isWicket,
      wicketType: isWicket ? wicketType : undefined,
      strikerId,
      bowlerId
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[300] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
         <div className="bg-slate-950 p-6 border-b border-slate-800 flex justify-between items-center">
            <div>
               <h3 className="text-xl font-black text-white">Edit Ball {ball.over}.{ball.ballNumber}</h3>
               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Retroactive Scorer Override</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors">✕</button>
         </div>

         <div className="p-8 space-y-6 overflow-y-auto no-scrollbar">
            {/* Identity */}
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Striker</label>
                  <select value={strikerId} onChange={e => setStrikerId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs font-bold text-white outline-none">
                     {battingTeam?.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bowler</label>
                  <select value={bowlerId} onChange={e => setBowlerId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs font-bold text-white outline-none">
                     {bowlingTeam?.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
               </div>
            </div>

            {/* Outcome */}
            <div className="grid grid-cols-3 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Runs</label>
                  <input type="number" value={runs} onChange={e => setRuns(parseInt(e.target.value) || 0)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs font-bold text-white outline-none" />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Extra Type</label>
                  <select value={extraType} onChange={e => setExtraType(e.target.value as any)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs font-bold text-white outline-none">
                     <option value="None">None</option>
                     <option value="Wide">Wide</option>
                     <option value="NoBall">No Ball</option>
                     <option value="Bye">Bye</option>
                     <option value="LegBye">Leg Bye</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Extra Runs</label>
                  <input type="number" value={extraRuns} onChange={e => setExtraRuns(parseInt(e.target.value) || 0)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs font-bold text-white outline-none" />
               </div>
            </div>

            {/* Wicket */}
            <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/20">
               <div className="flex justify-between items-center mb-4">
                  <label className="text-[10px] font-black text-red-400 uppercase tracking-widest">Wicket Incident</label>
                  <button onClick={() => setIsWicket(!isWicket)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${isWicket ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                     {isWicket ? 'Active' : 'No Wicket'}
                  </button>
               </div>
               {isWicket && (
                  <div className="grid grid-cols-2 gap-2">
                     {WICKET_TYPES.map(t => (
                        <button key={t} onClick={() => setWicketType(t)} className={`p-2 rounded-xl border text-[10px] font-bold transition-all ${wicketType === t ? 'border-red-500 bg-red-500/20 text-white' : 'border-slate-700 bg-slate-800 text-slate-500'}`}>
                           {t}
                        </button>
                     ))}
                  </div>
               )}
            </div>
         </div>

         <div className="p-6 bg-slate-950 border-t border-slate-800 flex gap-4 shrink-0">
            <button onClick={onClose} className="flex-1 py-4 text-slate-500 font-black uppercase text-xs hover:text-white transition-all">Cancel</button>
            <button onClick={handleSave} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-900/20 hover:bg-indigo-500 transition-all">Update History</button>
         </div>
      </div>
    </div>
  );
};

