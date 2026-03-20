
import React, { useState } from 'react';
import { MatchState, Team } from '../../types.ts';
import { getCoachInsights } from '../../services/geminiService.ts';

interface CoachCopilotProps {
  matchState: MatchState;
  battingTeam?: Team;
  bowlingTeam?: Team;
}

export const CoachCopilot: React.FC<CoachCopilotProps> = ({ matchState, battingTeam, bowlingTeam }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<{ analysis: string; tactics: string[]; winProbability: number } | null>(null);

  const fetchInsights = async () => {
    if (!battingTeam || !bowlingTeam) return;
    setLoading(true);
    const data = await getCoachInsights(matchState, battingTeam.name, bowlingTeam.name);
    setInsights(data);
    setLoading(false);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => { setIsOpen(true); if(!insights) fetchInsights(); }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-2xl z-[100] hover:scale-110 transition-transform group border-2 border-white/20"
      >
        🤖
        <span className="absolute right-0 top-0 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 md:w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-[2rem] shadow-2xl z-[100] overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 flex flex-col max-h-[80vh]">
      
      {/* Header */}
      <div className="p-5 border-b border-white/10 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 flex justify-between items-center">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-xl shadow-lg">🤖</div>
           <div>
              <h3 className="font-black text-white text-sm">AI Strat-Coach</h3>
              <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest">Real-time Tactics</p>
           </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">✕</button>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
         {loading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
               <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Analyzing Match Data...</p>
            </div>
         ) : insights ? (
            <div className="space-y-6">
               
               {/* Win Prob */}
               <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/5">
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-2">
                     <span>Batting Win Prob</span>
                     <span>{insights.winProbability}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                     <div className="h-full bg-gradient-to-r from-red-500 to-green-500 transition-all duration-1000" style={{ width: `${insights.winProbability}%` }}></div>
                  </div>
               </div>

               {/* Analysis */}
               <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Situation Report</h4>
                  <p className="text-sm text-slate-300 leading-relaxed font-medium bg-white/5 p-3 rounded-xl border border-white/5">
                     "{insights.analysis}"
                  </p>
               </div>

               {/* Tactics */}
               <div>
                  <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Recommended Actions</h4>
                  <div className="space-y-2">
                     {insights.tactics.map((tactic, i) => (
                        <div key={i} className="flex gap-3 items-start">
                           <span className="text-emerald-500 font-black text-lg leading-none mt-0.5">›</span>
                           <p className="text-xs font-bold text-white leading-tight">{tactic}</p>
                        </div>
                     ))}
                  </div>
               </div>

            </div>
         ) : (
            <div className="text-center py-8 text-slate-500 text-xs font-bold uppercase">No insights available.</div>
         )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 bg-slate-900">
         <button 
            onClick={fetchInsights}
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
         >
            {loading ? 'Thinking...' : 'Refresh Strategy'}
         </button>
      </div>
    </div>
  );
};

