
import React from 'react';
import { PointsRow } from '../../competition/types.ts';

export const PointsTable: React.FC<{ rows: PointsRow[], onViewTeam?: (id: string) => void }> = ({ rows, onViewTeam }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl">
      <div className="w-full">
        <table className="w-full text-left border-collapse table-fixed md:table-auto">
          <thead>
            <tr className="bg-slate-800/50 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">
              <th className="pl-4 pr-2 py-2 w-5/12 md:w-auto md:px-6 md:py-3">Team</th>
              <th className="px-1 py-2 text-center md:px-4 md:py-3">P</th>
              <th className="px-1 py-2 text-center md:px-4 md:py-3">W</th>
              <th className="px-1 py-2 text-center md:px-4 md:py-3">L</th>
              <th className="px-1 py-2 text-center hidden sm:table-cell md:px-4 md:py-3">T</th>
              <th className="px-1 py-2 text-center hidden sm:table-cell md:px-4 md:py-3">D</th>
              <th className="px-1 py-2 text-center text-amber-500 font-bold md:px-4 md:py-3">BP</th>
              <th className="px-1 py-2 text-center md:px-4 md:py-3">NRR</th>
              <th className="pr-4 pl-2 py-2 text-right text-indigo-400 md:px-6 md:py-3">PTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {rows.map((r, idx) => (
              <tr key={r.teamId} className="group hover:bg-white/5 transition-colors">
                <td className="pl-4 pr-2 py-2 md:px-6 md:py-3 overflow-hidden">
                  <div className="flex items-center gap-2 md:gap-3">
                    <span className="text-[10px] font-black text-slate-600 w-3 md:w-4 shrink-0">{idx + 1}</span>
                    {onViewTeam ? (
                      <button onClick={() => onViewTeam(r.teamId)} className="text-[11px] md:text-sm font-black text-slate-200 group-hover:text-white transition-colors hover:underline truncate block w-full text-left leading-tight">
                        {r.teamName}
                      </button>
                    ) : (
                      <span className="text-[11px] md:text-sm font-black text-slate-200 group-hover:text-white transition-colors truncate block leading-tight">
                        {r.teamName}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-1 py-2 text-center text-slate-400 font-bold text-[10px] md:text-sm md:px-4 md:py-3">{r.played}</td>
                <td className="px-1 py-2 text-center text-emerald-500 font-black text-[10px] md:text-sm md:px-4 md:py-3">{r.won}</td>
                <td className="px-1 py-2 text-center text-red-500/70 font-bold text-[10px] md:text-sm md:px-4 md:py-3">{r.lost}</td>
                <td className="px-1 py-2 text-center text-slate-500 font-medium text-[10px] md:text-sm hidden sm:table-cell md:px-4 md:py-3">{r.tied}</td>
                <td className="px-1 py-2 text-center text-slate-500 font-medium text-[10px] md:text-sm hidden sm:table-cell md:px-4 md:py-3">{r.drawn}</td>
                <td className="px-1 py-2 text-center text-amber-500/80 font-black text-[10px] md:text-sm md:px-4 md:py-3">{r.bonusPoints}</td>
                <td className={`px-1 py-2 text-center font-bold text-[9px] md:text-xs md:px-4 md:py-3 ${r.nrr >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {r.nrr > 0 ? '+' : ''}{r.nrr}
                </td>
                <td className="pr-4 pl-2 py-2 text-right font-black text-xs md:text-base text-white tabular-nums md:px-6 md:py-3">
                  {r.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <div className="p-10 text-center flex flex-col items-center gap-2 opacity-20">
          <span className="text-2xl">📊</span>
          <p className="text-[9px] font-black uppercase tracking-widest">No competition data</p>
        </div>
      )}
    </div>
  );
};

