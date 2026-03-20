
import React from 'react';
import { InningsStats } from '../../types.ts';
import { BowlingCardRow, BattingCardRow } from '../../scorer/scorecard/types.ts';
import { BallEvent } from '../../types.ts';

interface LinearScorebookProps {
   data: InningsStats & { bowlingRows?: BowlingCardRow[] };
}

export const LinearScorebook: React.FC<LinearScorebookProps> = ({ data }) => {
   const { rows, extras, totalScore, overs, runRate, fow, didNotBat, bowlingRows = [] } = data;

   const getBowlerName = (row: BattingCardRow) => {
      return row.bowlerName || '';
   };

   // --- Symbol Generators ---
   const renderBallSymbol = (b: BallEvent) => {
      let symbol = (
         <span className="font-bold text-slate-400">.</span>
      );

      if (b.isWicket) {
         symbol = <span className="font-black text-red-600">W</span>;
      } else if (b.extraType === 'Wide') {
         symbol = (
            <div className="relative w-full h-full flex items-center justify-center">
               <span className="text-indigo-600 text-[10px] font-black">+</span>
               {b.extraRuns > 0 && <span className="absolute -top-1 -right-1 text-[7px] text-indigo-600">{b.extraRuns}</span>}
            </div>
         );
      } else if (b.extraType === 'NoBall') {
         symbol = (
            <div className="relative w-full h-full flex items-center justify-center">
               <div className="w-3 h-3 rounded-full border border-purple-600 flex items-center justify-center">
                  <span className="text-[6px] text-purple-600 font-bold">{b.batRuns > 0 ? b.batRuns : '•'}</span>
               </div>
            </div>
         );
      } else if (b.extraType === 'Bye' || b.extraType === 'LegBye') {
         symbol = <span className="text-[8px] font-black text-slate-500">▼<span className="text-[6px] align-top">{b.extraRuns}</span></span>;
      } else if (b.runs > 0) {
         symbol = <span className="font-bold text-slate-900">{b.runs}</span>;
      }

      return symbol;
   };

   return (
      <div className="bg-white rounded-none md:rounded-[4px] border border-slate-300 shadow-xl overflow-hidden font-mono text-xs text-slate-800 max-w-6xl mx-auto">

         {/* --- HEADER --- */}
         <div className="bg-[#fdfbf7] p-4 border-b-2 border-slate-800 flex justify-between items-end">
            <div>
               <h1 className="text-xl font-serif font-black text-slate-900 uppercase tracking-widest">Official Scorecard</h1>
               <p className="text-[10px] uppercase tracking-wider text-slate-500">Innings Details & Analysis</p>
            </div>
            <div className="text-right">
               <div className="text-3xl font-black text-slate-900 leading-none">{totalScore}</div>
               <div className="text-xs font-bold text-slate-600 mt-1">{overs} Overs • RR {runRate}</div>
            </div>
         </div>

         {/* --- BATTING SECTION (The Ledger) --- */}
         <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">

               <thead>
                  <tr className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-400">
                     <th className="px-3 py-2 w-10 border-r border-slate-300 text-center">#</th>
                     <th className="px-4 py-2 border-r border-slate-300 w-48">Batsman</th>
                     <th className="px-4 py-2 border-r border-slate-300 w-32">How Out</th>
                     <th className="px-4 py-2 border-r border-slate-300 w-32">Bowler</th>
                     <th className="px-3 py-2 border-r border-slate-300 min-w-[350px]">Runs Scored</th>
                     <th className="px-4 py-2 border-r border-slate-300 text-center w-16">Runs</th>
                     <th className="px-2 py-2 border-r border-slate-300 text-center text-[9px] w-12">4s</th>
                     <th className="px-2 py-2 border-r border-slate-300 text-center text-[9px] w-12">6s</th>
                     <th className="px-2 py-2 text-center text-[9px] w-12">Balls</th>
                  </tr>
               </thead>
               <tbody>
                  {/* 1. Batted Players */}
                  {rows.map((row, idx) => (
                     <tr key={row.playerId} className="border-b border-slate-200 hover:bg-yellow-50/30 transition-colors h-12">
                        <td className="border-r border-slate-300 text-center text-slate-400 font-bold">{idx + 1}</td>
                        <td className="px-4 border-r border-slate-300 font-bold text-slate-900 flex items-center h-12">
                           <div className="truncate">{row.name} {row.atCrease && <span className="ml-1 text-indigo-600 text-lg leading-none">*</span>}</div>
                        </td>
                        <td className="px-4 border-r border-slate-300 text-slate-600 italic text-[10px]">
                           {row.isOut ? row.dismissal : row.atCrease ? 'not out' : ''}
                        </td>
                        <td className="px-4 border-r border-slate-300 text-slate-600 text-[10px] uppercase">
                           {getBowlerName(row)}
                        </td>

                        {/* LINEAR SCORING SECTION */}
                        <td className="px-2 border-r border-slate-300 bg-white align-middle">
                           <div className="flex flex-wrap items-center gap-1 leading-none py-1">
                              {row.scoringSequence.length === 0 && <span className="text-slate-300 text-[10px] italic">Did not face</span>}
                              {row.scoringSequence.map((score, sIdx) => (
                                 <div
                                    key={sIdx}
                                    className={`
                               flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-sm border select-none
                               ${score === '•' ? 'border-slate-100 text-slate-400' :
                                          score === 'W' ? 'border-red-200 bg-red-50 text-red-600' :
                                             score === '4' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' :
                                                score === '6' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                                                   'border-slate-200 text-slate-800'}
                            `}
                                 >
                                    {score}
                                 </div>
                              ))}
                           </div>
                        </td>

                        <td className="px-4 border-r border-slate-300 text-center font-black text-lg bg-slate-50/50">{row.runs}</td>
                        <td className="border-r border-slate-300 text-center text-slate-500">{row.fours}</td>
                        <td className="border-r border-slate-300 text-center text-slate-500">{row.sixes}</td>
                        <td className="text-center text-slate-500">{row.balls}</td>
                     </tr>
                  ))}

                  {/* 2. Extras Row */}
                  <tr className="border-b border-slate-800 bg-slate-50 h-10 font-bold">
                     <td className="border-r border-slate-300"></td>
                     <td className="px-4 border-r border-slate-300 uppercase tracking-widest text-slate-500">Extras</td>
                     <td className="px-4 border-r border-slate-300 col-span-2 text-[10px] text-slate-500" colSpan={2}>
                        (b {extras.byes}, lb {extras.legByes}, w {extras.wides}, nb {extras.noBalls}, p {extras.penalty})
                     </td>
                     <td className="px-4 border-r border-slate-300 text-slate-400 text-[10px] uppercase tracking-widest italic flex items-center">
                        Total Extras
                     </td>
                     <td className="px-4 border-r border-slate-300 text-center font-black text-lg">{extras.total}</td>
                     <td colSpan={3}></td>
                  </tr>

                  {/* 3. Did Not Bat */}
                  {didNotBat.map((p, idx) => (
                     <tr key={p.id} className="border-b border-slate-200 h-10 opacity-60">
                        <td className="border-r border-slate-300 text-center text-slate-300 font-bold">{rows.length + idx + 1}</td>
                        <td className="px-4 border-r border-slate-300 text-slate-500 italic">{p.name}</td>
                        <td className="px-4 border-r border-slate-300 text-[10px] text-slate-400">Did not bat</td>
                        <td className="px-4 border-r border-slate-300"></td>
                        <td className="px-4 border-r border-slate-300 bg-slate-50/30"></td>
                        <td className="border-r border-slate-300 bg-slate-100/50"></td>
                        <td className="border-r border-slate-300 bg-slate-100/50"></td>
                        <td className="border-r border-slate-300 bg-slate-100/50"></td>
                        <td className="bg-slate-100/50"></td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>

         {/* --- FALL OF WICKETS --- */}
         {fow.length > 0 && (
            <div className="border-b-2 border-slate-800 p-4 bg-[#fdfbf7]">
               <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500">Fall of Wickets</h4>
               <div className="flex flex-wrap gap-4">
                  {fow.map((f, i) => (
                     <div key={i} className="flex flex-col items-center border border-slate-300 bg-white px-3 py-1 rounded-sm shadow-sm">
                        <span className="font-black text-sm">{f.score}</span>
                        <div className="w-full h-px bg-slate-200 my-0.5"></div>
                        <span className="text-[9px] font-bold text-slate-500">for {f.wicketNumber}</span>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* --- BOWLER BOXES (Analysis Grid) --- */}
         <div className="bg-white">
            <div className="bg-slate-800 text-white p-2 text-xs font-bold uppercase tracking-widest border-b border-slate-900">
               Bowling Analysis
            </div>

            <div className="w-full overflow-x-auto">
               <div className="w-full overflow-x-auto">

                  {/* Grid Header */}
                  <div className="flex border-b border-slate-300 bg-slate-100">
                     <div className="w-40 shrink-0 p-2 font-bold border-r border-slate-300 text-[10px] uppercase">Bowler</div>
                     <div className="flex-1 flex">
                        {Array.from({ length: 12 }).map((_, i) => (
                           <div key={i} className="w-16 shrink-0 border-r border-slate-200 text-center p-1 text-[9px] text-slate-400">Ov {i + 1}</div>
                        ))}
                        <div className="flex-1 text-[9px] text-slate-400 p-1 italic">...</div>
                     </div>
                     <div className="w-24 shrink-0 flex text-[9px] text-center font-bold bg-slate-50 border-l border-slate-300">
                        <div className="flex-1 py-2 border-r border-slate-200">O</div>
                        <div className="flex-1 py-2 border-r border-slate-200">M</div>
                        <div className="flex-1 py-2 border-r border-slate-200">R</div>
                        <div className="flex-1 py-2">W</div>
                     </div>
                  </div>

                  {/* Grid Rows */}
                  {bowlingRows.map(bowler => (
                     <div key={bowler.playerId} className="flex border-b border-slate-300 h-14">
                        {/* Name */}
                        <div className="w-40 shrink-0 p-3 font-bold border-r border-slate-300 flex items-center text-sm truncate bg-white">
                           {bowler.name}
                        </div>

                        {/* The Over Boxes */}
                        <div className="flex-1 flex bg-white overflow-hidden">
                           {bowler.oversHistory.map((overBalls, idx) => (
                              <div key={idx} className="w-16 shrink-0 border-r border-slate-200 border-dashed flex flex-wrap content-start p-0.5 gap-px relative">
                                 {/* Grid inside the box for 6 balls */}
                                 {overBalls.map((ball, bIdx) => (
                                    <div
                                       key={bIdx}
                                       className="w-4 h-4 flex items-center justify-center text-[9px] bg-slate-50 border border-slate-100 rounded-[2px]"
                                       title={ball.commentary}
                                    >
                                       {renderBallSymbol(ball)}
                                    </div>
                                 ))}
                                 <div className="absolute bottom-0.5 right-0.5 text-[7px] text-slate-300 font-mono">{idx + 1}</div>
                              </div>
                           ))}
                           {/* Empty boxes filler for aesthetics */}
                           {Array.from({ length: Math.max(0, 12 - bowler.oversHistory.length) }).map((_, i) => (
                              <div key={`empty-${i}`} className="w-16 shrink-0 border-r border-slate-100 border-dashed bg-slate-50/30"></div>
                           ))}
                        </div>

                        {/* Summary */}
                        <div className="w-24 shrink-0 flex text-sm text-center font-bold bg-slate-50 border-l border-slate-300 items-center">
                           <div className="flex-1 text-slate-600">{bowler.overs}</div>
                           <div className="flex-1 text-slate-400 font-normal">{bowler.maidens}</div>
                           <div className="flex-1 text-slate-900">{bowler.runs}</div>
                           <div className="flex-1 text-red-600 font-black">{bowler.wickets}</div>
                        </div>
                     </div>
                  ))}

                  {bowlingRows.length === 0 && (
                     <div className="p-8 text-center text-slate-400 text-xs uppercase italic">
                        No bowling data recorded yet.
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
};

