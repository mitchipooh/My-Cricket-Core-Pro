
import React from 'react';
import { MatchFixture } from '@shared/types';

interface BracketViewProps {
  fixtures: MatchFixture[];
  onViewMatch: (match: MatchFixture) => void;
}

export const BracketView: React.FC<BracketViewProps> = ({ fixtures, onViewMatch }) => {
  const semiFinals = fixtures.filter(f => f.stage === 'Semi-Final');
  const final = fixtures.find(f => f.stage === 'Final');

  const MatchCard = ({ match, title }: { match?: MatchFixture; title: string }) => {
    if (!match) return (
        <div className="w-64 h-32 bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center">
            <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">{title} TBD</span>
        </div>
    );

    const isWinnerA = match.winnerId && match.winnerId === match.teamAId;
    const isWinnerB = match.winnerId && match.winnerId === match.teamBId;

    return (
      <div 
        onClick={() => onViewMatch(match)}
        className={`w-64 bg-slate-800 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${match.status === 'Live' ? 'border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'border-slate-700 hover:border-indigo-500'}`}
      >
        <div className="bg-slate-900 p-2 flex justify-between items-center border-b border-slate-700">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
            {match.status === 'Completed' && <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">DONE</span>}
            {match.status === 'Live' && <span className="text-[9px] font-black bg-red-600 text-white px-2 py-0.5 rounded animate-pulse">LIVE</span>}
        </div>
        <div className="p-4 space-y-2">
            <div className={`flex justify-between items-center ${isWinnerA ? 'text-emerald-400' : isWinnerB ? 'text-slate-500' : 'text-white'}`}>
                <span className="font-bold text-sm truncate max-w-[120px]">{match.teamAName}</span>
                <span className="font-black font-mono">{match.teamAScore || '-'}</span>
            </div>
            <div className={`flex justify-between items-center ${isWinnerB ? 'text-emerald-400' : isWinnerA ? 'text-slate-500' : 'text-white'}`}>
                <span className="font-bold text-sm truncate max-w-[120px]">{match.teamBName}</span>
                <span className="font-black font-mono">{match.teamBScore || '-'}</span>
            </div>
        </div>
        {match.result && <div className="px-4 pb-2 text-[9px] text-slate-400 italic truncate">{match.result}</div>}
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-12 p-8 overflow-x-auto min-h-[400px]">
       
       {/* SEMI FINALS */}
       <div className="flex flex-col gap-12 relative">
          <MatchCard match={semiFinals[0]} title="Semi Final 1" />
          <MatchCard match={semiFinals[1]} title="Semi Final 2" />
          
          {/* Connector Lines (Visual Only - CSS) */}
          <div className="absolute top-16 -right-6 w-6 h-[calc(100%-8rem)] border-r-2 border-t-2 border-b-2 border-slate-600 rounded-r-xl pointer-events-none md:block hidden"></div>
          <div className="absolute top-1/2 -right-12 w-6 h-0.5 bg-slate-600 pointer-events-none md:block hidden"></div>
       </div>

       {/* FINAL */}
       <div className="flex flex-col items-center gap-6">
          <div className="text-4xl">🏆</div>
          <MatchCard match={final} title="Grand Final" />
          {final?.winnerId && (
             <div className="bg-gradient-to-r from-amber-400 to-yellow-600 text-white px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-xl animate-in zoom-in">
                Champion: {final.winnerId === final.teamAId ? final.teamAName : final.teamBName}
             </div>
          )}
       </div>

    </div>
  );
};

