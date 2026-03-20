
import React from 'react';
import { InningsStats } from '../../types.ts';

export const BattingScorecard: React.FC<{ data: InningsStats }> = ({ data }) => {
  const { rows, extras, totalScore, overs, runRate, fow, didNotBat } = data;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col w-full">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">
              <th className="px-3 py-2">Batter</th>
              <th className="px-2 py-2 text-center">R</th>
              <th className="px-2 py-2 text-center">B</th>
              <th className="px-2 py-2 text-center">4s</th>
              <th className="px-2 py-2 text-center">6s</th>
              <th className="px-2 py-2 text-right pr-3">SR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {rows.map(r => (
              <tr key={r.playerId} className={`group hover:bg-white/5 transition-colors ${r.atCrease ? 'bg-indigo-500/5' : ''}`}>
                <td className="px-3 py-1.5">
                  <div className="flex flex-col">
                    <span className={`text-[11px] font-black ${r.atCrease ? 'text-indigo-400' : 'text-slate-200'}`}>
                      {r.name}{r.atCrease ? '*' : ''}
                    </span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter mt-0.5 italic">
                      {r.isOut ? r.dismissal : r.atCrease ? 'not out' : 'did not bat'}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-1.5 text-center font-black text-white text-[11px]">{r.runs}</td>
                <td className="px-2 py-1.5 text-center text-slate-400 font-bold text-[11px]">{r.balls}</td>
                <td className="px-2 py-1.5 text-center text-slate-500 font-medium text-[10px]">{r.fours}</td>
                <td className="px-2 py-1.5 text-center text-slate-500 font-medium text-[10px]">{r.sixes}</td>
                <td className="px-2 py-1.5 text-right pr-3 text-indigo-500 font-black tabular-nums text-[10px]">{r.strikeRate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Extras & Total Row */}
      <div className="border-t border-slate-800 bg-slate-800/20 px-3 py-2 space-y-1">
         <div className="flex justify-between items-center text-[10px]">
            <span className="font-bold text-slate-400 uppercase tracking-widest">Extras</span>
            <span className="font-black text-white">
                {extras.total} <span className="text-slate-500 font-medium ml-1">(b {extras.byes}, lb {extras.legByes}, w {extras.wides}, nb {extras.noBalls}, p {extras.penalty})</span>
            </span>
         </div>
         <div className="flex justify-between items-center border-t border-slate-800/50 pt-1">
            <span className="font-black text-sm text-white uppercase tracking-widest">Total</span>
            <div className="text-right">
                <span className="font-black text-lg text-white leading-none">{totalScore}</span>
                <span className="text-[10px] font-bold text-slate-400 ml-2">({overs} Ov, RR: {runRate})</span>
            </div>
         </div>
      </div>

      {/* Did Not Bat */}
      {didNotBat.length > 0 && (
          <div className="px-3 py-2 border-t border-slate-800 bg-slate-900">
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Did Not Bat</div>
              <div className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  {didNotBat.map(p => p.name).join(', ')}
              </div>
          </div>
      )}

      {/* Fall of Wickets */}
      {fow.length > 0 && (
          <div className="px-3 py-2 border-t border-slate-800 bg-slate-900/50">
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Fall of Wickets</div>
              <div className="flex flex-wrap gap-1.5">
                  {fow.map((f, i) => (
                      <span key={i} className="text-[9px] text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                          <span className="font-black text-white">{f.score}-{f.wicketNumber}</span> ({f.batterName}, {f.over})
                      </span>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

