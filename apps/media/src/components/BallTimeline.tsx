
import React from 'react';
import { TimelineBall } from '../../scoring/hooks/useBallTimeline.ts';

interface BallTimelineProps {
  items: TimelineBall[];
  canUndo: boolean;
  onUndo: () => void;
}

export const BallTimeline: React.FC<BallTimelineProps> = ({
  items,
  canUndo,
  onUndo
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-4 shadow-2xl flex flex-col h-full overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-[2rem]" />

      <div className="relative z-10 flex items-center justify-between mb-4 pb-2 border-b border-slate-800 shrink-0">
        <div>
          <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Timeline</h3>
          <p className="text-[8px] font-bold text-indigo-500 mt-0.5">{items.length} balls</p>
        </div>

        <button
          disabled={!canUndo}
          onClick={onUndo}
          className={`px-3 py-1.5 rounded-lg font-black uppercase text-[9px] tracking-widest transition-all ${canUndo
              ? 'bg-amber-900/30 text-amber-500 border border-amber-500/30 hover:bg-amber-900/50'
              : 'bg-slate-800 text-slate-600 border border-slate-700 opacity-50 cursor-not-allowed'
            }`}
        >
          Undo
        </button>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto space-y-2 no-scrollbar pr-1">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 opacity-20">
            <span className="text-2xl mb-1">⏱️</span>
            <p className="text-[9px] font-black uppercase tracking-widest">Start</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-3 p-2 bg-slate-800/40 rounded-xl border border-slate-800/60 hover:bg-slate-800 hover:border-slate-600 transition-all animate-in slide-in-from-right-4"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 shadow-lg ${item.color} text-white transition-transform group-hover:scale-110`}>
                {item.label}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between items-center">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Over {item.displayOver}</p>
                  {item.ball.isWicket && (
                    <span className="text-[7px] bg-red-600/20 text-red-500 px-1 py-0.5 rounded font-black uppercase ring-1 ring-red-500/30">
                      Wicket
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-bold text-slate-300 truncate group-hover:text-white transition-colors">
                  {item.ball.commentary}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="relative z-10 mt-3 pt-3 border-t border-slate-800 shrink-0">
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-2">
            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-2 text-center">Last 6</p>
            <div className="flex justify-center gap-1.5">
              {items.slice(0, 6).reverse().map(item => (
                <div
                  key={item.id + '-summary'}
                  className={`w-6 h-6 rounded-md ${item.color} flex items-center justify-center text-[9px] font-black text-white shadow-md transition-all hover:scale-110`}
                >
                  {item.label === '•' ? '' : item.label.charAt(0)}
                </div>
              ))}
              {items.length < 6 && Array.from({ length: 6 - items.length }).map((_, i) => (
                <div key={`empty-${i}`} className="w-6 h-6 rounded-md bg-slate-800/20 border border-slate-800" />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

