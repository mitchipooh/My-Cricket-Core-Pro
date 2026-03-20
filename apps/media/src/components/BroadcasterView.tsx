
import React from 'react';
import { MatchState, Team } from '../../types.ts';
import { getBattingStats, getBowlingStats } from '../../scoring/MatchSelectors.ts';
import { useBallTimeline } from '../../scoring/hooks/useBallTimeline.ts';

interface BroadcasterViewProps {
    matchState: MatchState;
    battingTeam?: Team;
    bowlingTeam?: Team;
    onClose: () => void;
}

export const BroadcasterView: React.FC<BroadcasterViewProps> = ({ matchState, battingTeam, bowlingTeam, onClose }) => {
    const striker = battingTeam?.players.find(p => p.id === matchState.strikerId);
    const nonStriker = battingTeam?.players.find(p => p.id === matchState.nonStrikerId);
    const bowler = bowlingTeam?.players.find(p => p.id === matchState.bowlerId);

    const strikerStats = matchState.strikerId ? getBattingStats(matchState.strikerId, matchState.history, matchState.innings) : null;
    const nonStrikerStats = matchState.nonStrikerId ? getBattingStats(matchState.nonStrikerId, matchState.history, matchState.innings) : null;
    const bowlerStats = matchState.bowlerId ? getBowlingStats(matchState.bowlerId, matchState.history, matchState.innings) : null;

    const timeline = useBallTimeline(matchState).slice(0, 6).reverse();

    // Run Rate
    const runRate = matchState.totalBalls > 0
        ? ((matchState.score / matchState.totalBalls) * 6).toFixed(1)
        : '0.0';

    const projectScore = matchState.totalBalls > 0
        ? Math.round((matchState.score / matchState.totalBalls) * (matchState.innings === 1 ? 120 : 120)) // Assuming T20 base for projection
        : 0;

    return (
        <div className="fixed inset-0 z-[500] bg-[#00FF00] overflow-hidden cursor-none hover:cursor-default group">
            {/* Hidden Exit Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md hover:bg-red-600"
            >
                Exit Broadcaster Mode
            </button>

            {/* LOWER THIRD OVERLAY */}
            <div className="absolute bottom-10 left-10 right-10 flex flex-col gap-4">

                {/* Main Score Bar */}
                <div className="flex items-end">
                    <div className="bg-[#0f172a] text-white rounded-t-3xl rounded-bl-3xl p-4 md:p-6 shadow-2xl border-l-4 md:border-l-8 border-indigo-600 w-full max-w-sm relative z-20">
                        <div className="flex items-center gap-4 mb-2">
                            {battingTeam?.logoUrl && <img src={battingTeam.logoUrl} className="w-12 h-12 bg-white rounded-full p-1" />}
                            <div>
                                <h1 className="text-3xl font-black uppercase leading-none tracking-tight">{battingTeam?.name || 'Batting Team'}</h1>
                                <p className="text-indigo-400 font-bold text-sm uppercase tracking-widest">{matchState.innings === 1 ? '1st Innings' : 'Target Chase'}</p>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-4">
                            <span className="text-6xl font-black tabular-nums tracking-tighter">{matchState.score}/{matchState.wickets}</span>
                            <span className="text-2xl text-slate-400 font-bold">{Math.floor(matchState.totalBalls / 6)}.{matchState.totalBalls % 6} Ov</span>
                        </div>
                        <div className="mt-2 flex gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <span>CRR: {runRate}</span>
                            {projectScore > 0 && <span>Proj: {projectScore}</span>}
                        </div>
                    </div>

                    {/* Batters Card */}
                    <div className="bg-slate-900/95 backdrop-blur text-white p-4 mb-0 ml-[-20px] pl-10 rounded-tr-3xl relative z-10 border-b-4 border-slate-800 flex-1 min-w-0 max-w-2xl flex justify-between items-center shadow-xl">
                        <div className="flex-1 flex items-center justify-around">
                            {/* Striker */}
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <div className="font-black text-xl leading-none flex items-center gap-2 justify-end">
                                        {striker?.name} <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                                    </div>
                                    <div className="text-indigo-300 font-mono font-bold text-lg">
                                        {strikerStats?.runs}<span className="text-xs text-slate-500 ml-1">({strikerStats?.balls})</span>
                                    </div>
                                </div>
                            </div>

                            <div className="h-10 w-px bg-slate-700 mx-4"></div>

                            {/* Non-Striker */}
                            <div className="flex items-center gap-3 opacity-70">
                                <div className="text-left">
                                    <div className="font-bold text-lg leading-none text-slate-300">
                                        {nonStriker?.name}
                                    </div>
                                    <div className="text-slate-400 font-mono font-bold text-base">
                                        {nonStrikerStats?.runs}<span className="text-xs text-slate-600 ml-1">({nonStrikerStats?.balls})</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bowler & Timeline Bar */}
                <div className="flex gap-4">
                    <div className="bg-white text-slate-900 rounded-3xl p-3 md:p-4 shadow-xl flex items-center gap-3 md:gap-6 w-full max-w-md">
                        <div className="bg-slate-900 text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest">Bowler</div>
                        <div>
                            <div className="font-black text-xl uppercase leading-none">{bowler?.name}</div>
                            <div className="font-mono text-sm font-bold text-slate-600 mt-1">
                                {bowlerStats?.wickets}-{bowlerStats?.runs} <span className="text-[10px] text-slate-400">({bowlerStats?.overs})</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/80 backdrop-blur rounded-3xl p-4 flex items-center gap-2 flex-1 shadow-xl">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">This Over</div>
                        {timeline.map((ball) => (
                            <div key={ball.id} className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${ball.color} text-white shadow-md border-2 border-white/10`}>
                                {ball.label}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

