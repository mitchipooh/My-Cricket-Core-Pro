
import React from 'react';
import { PointsRow } from '@shared/types';

export const PointsTable: React.FC<{ rows: PointsRow[], onViewTeam?: (id: string) => void }> = ({ rows, onViewTeam }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">
              <th className="px-8 py-5">Team</th>
              <th className="px-4 py-5 text-center">P</th>
              <th className="px-4 py-5 text-center">W</th>
              <th className="px-4 py-5 text-center">L</th>
              <th className="px-4 py-5 text-center">T</th>
              <th className="px-4 py-5 text-center">NRR</th>
              <th className="px-8 py-5 text-right text-indigo-400">PTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {rows.map((r, idx) => (
              <tr key={r.teamId} className="group hover:bg-white/5 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-slate-600 w-4">{idx + 1}</span>
                    {onViewTeam ? (
                        <button onClick={() => onViewTeam(r.teamId)} className="text-sm font-black text-slate-200 group-hover:text-white transition-colors hover:underline">
                            {r.teamName}
                        </button>
                    ) : (
                        <span className="text-sm font-black text-slate-200 group-hover:text-white transition-colors">
                            {r.teamName}
                        </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-5 text-center text-slate-400 font-bold">{r.played}</td>
                <td className="px-4 py-5 text-center text-emerald-500 font-black">{r.won}</td>
                <td className="px-4 py-5 text-center text-red-500/70 font-bold">{r.lost}</td>
                <td className="px-4 py-5 text-center text-slate-500 font-medium">{r.tied}</td>
                <td className={`px-4 py-5 text-center font-bold text-xs ${r.nrr >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {r.nrr > 0 ? '+' : ''}{r.nrr}
                </td>
                <td className="px-8 py-5 text-right font-black text-lg text-white tabular-nums">
                  {r.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <div className="p-20 text-center flex flex-col items-center gap-4 opacity-20">
          <span className="text-4xl">📊</span>
          <p className="text-[10px] font-black uppercase tracking-widest">No competition data recorded</p>
        </div>
      )}
    </div>
  );
};
