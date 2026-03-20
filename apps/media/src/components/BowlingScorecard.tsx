
import React from 'react';
import { BowlingCardRow } from '../../scorer/scorecard/types.ts';

export const BowlingScorecard: React.FC<{ rows: BowlingCardRow[] }> = ({ rows }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl w-full">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">
              <th className="px-3 py-2">Bowler</th>
              <th className="px-2 py-2 text-center">O</th>
              <th className="px-2 py-2 text-center">M</th>
              <th className="px-2 py-2 text-center">R</th>
              <th className="px-2 py-2 text-center">W</th>
              <th className="px-2 py-2 text-right pr-3">Econ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {rows.map(r => (
              <tr key={r.playerId} className="group hover:bg-white/5 transition-colors">
                <td className="px-3 py-1.5">
                  <span className="text-[11px] font-black text-slate-200 group-hover:text-emerald-400 transition-colors">
                    {r.name}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-center text-slate-300 font-bold text-[11px]">{r.overs}</td>
                <td className="px-2 py-1.5 text-center text-slate-500 font-medium text-[11px]">{r.maidens}</td>
                <td className="px-2 py-1.5 text-center text-white font-black text-[11px]">{r.runs}</td>
                <td className="px-2 py-1.5 text-center text-emerald-500 font-black text-[11px]">{r.wickets}</td>
                <td className="px-2 py-1.5 text-right pr-3 text-amber-500 font-black tabular-nums text-[10px]">{r.economy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

