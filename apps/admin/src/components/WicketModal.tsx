
import React from 'react';
import { WicketType, Player } from '../../types.ts';

interface WicketModalProps {
  open: boolean;
  batters: Player[];
  fielders: Player[];
  wicketType: WicketType | null;
  outPlayerId: string | null;
  fielderId: string | null;

  onSelectType: (t: WicketType) => void;
  onSelectOutPlayer: (id: string) => void;
  onSelectFielder: (id: string) => void;

  onConfirm: () => void;
  onCancel: () => void;
}

export const WicketModal: React.FC<WicketModalProps> = ({
  open,
  batters,
  fielders,
  wicketType,
  outPlayerId,
  fielderId,
  onSelectType,
  onSelectOutPlayer,
  onSelectFielder,
  onConfirm,
  onCancel
}) => {
  if (!open) return null;

  const WICKET_TYPES: WicketType[] = [
    'Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 
    'Hit Wicket', 'Timed Out', 'Retired Out', 'Retired Hurt'
  ];

  const needsFielder = wicketType === 'Caught' || wicketType === 'Stumped' || wicketType === 'Run Out';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-8 w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-8">
           <div>
              <h2 className="text-2xl font-black text-white">Dismissal Record</h2>
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1">Official Match Event</p>
           </div>
           <button onClick={onCancel} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        <div className="space-y-8">
          {/* DISMISSAL TYPE */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 mb-3 block">Method of Dismissal</label>
            <div className="grid grid-cols-3 gap-3">
              {WICKET_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => onSelectType(t)}
                  className={`py-3 rounded-2xl text-[11px] font-black transition-all border ${
                    wicketType === t
                      ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* OUT PLAYER */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 mb-3 block">Dismissed Batter</label>
              <div className="space-y-2">
                {batters.map(p => (
                  <button
                    key={p.id}
                    onClick={() => onSelectOutPlayer(p.id)}
                    className={`w-full p-4 rounded-2xl text-left transition-all border flex justify-between items-center ${
                      outPlayerId === p.id
                        ? 'bg-slate-800 border-indigo-500 text-white ring-1 ring-indigo-500/50'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 opacity-60'
                    }`}
                  >
                    <span className="font-bold text-xs">{p.name}</span>
                    {outPlayerId === p.id && <span className="text-indigo-500">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* FIELDER */}
            <div className={needsFielder ? 'opacity-100' : 'opacity-30 pointer-events-none'}>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 mb-3 block">Fielder Involved</label>
              <select
                value={fielderId || ''}
                onChange={e => onSelectFielder(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-red-500 appearance-none shadow-inner"
              >
                <option value="">Select Fielder...</option>
                {fielders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-4 pt-10">
          <button
            onClick={onCancel}
            className="flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-500 hover:bg-slate-800 transition-all"
          >
            Discard
          </button>

          <button
            onClick={onConfirm}
            disabled={!wicketType || !outPlayerId}
            className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-600/20 hover:bg-red-500 transition-all active:scale-95 disabled:opacity-30"
          >
            Record Wicket
          </button>
        </div>
      </div>
    </div>
  );
};

