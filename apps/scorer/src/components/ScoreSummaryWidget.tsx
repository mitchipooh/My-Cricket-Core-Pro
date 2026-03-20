import React from 'react';
import { MatchFixture, Team, MatchState } from '../../types';

interface ScoreSummaryWidgetProps {
    match: MatchFixture;
    state: MatchState;
    battingTeam?: Team;
}

export const ScoreSummaryWidget: React.FC<ScoreSummaryWidgetProps> = ({ match, state, battingTeam }) => {
    const overs = Math.floor(state.totalBalls / 6);
    const balls = state.totalBalls % 6;
    const crr = state.score / (state.totalBalls / 6 || 1);
    const isChasing = state.innings === 2;
    const target = isChasing ? (match.savedState?.inningsScores[0]?.score || 0) + 1 : 0;
    const runsNeeded = isChasing ? Math.max(0, target - state.score) : 0;
    const ballsRemaining = isChasing ? Math.max(0, (match.customOvers || 20) * 6 - state.totalBalls) : 0;
    const rrr = isChasing && ballsRemaining > 0 ? (runsNeeded / (ballsRemaining / 6)).toFixed(2) : '-';

    // Extras Calculation (Mock for now as simple breakdown isn't in top level state yet, but structure allows it)
    // In a real app, calculate from history or use state.extras if available.
    const extrasCount = state.history.filter(b => b.extraRuns && b.extraRuns > 0).reduce((acc, b) => acc + (b.extraRuns || 0), 0);

    return (
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 p-4 rounded-2xl shadow-xl border border-indigo-500/20 w-full flex flex-col gap-2">
            {/* Top Row: Score and Overs */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-white leading-none">{state.score}/{state.wickets}</h1>
                    <p className="text-xs font-bold text-indigo-300 mt-1">{battingTeam?.name || 'Batting Team'}</p>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-bold text-white leading-none">{overs}.{balls}</p>
                    <p className="text-[9px] text-indigo-300 uppercase tracking-widest mt-1">Overs</p>
                </div>
            </div>

            {/* Middle Row: Chasing Stats or Run Rate */}
            <div className="flex justify-between items-center bg-indigo-950/30 p-2 rounded-lg border border-indigo-500/10">
                <div className="flex flex-col">
                    <span className="text-[9px] text-indigo-400 uppercase tracking-widest">CRR</span>
                    <span className="text-sm font-black text-white">{crr.toFixed(2)}</span>
                </div>
                {isChasing && (
                    <>
                        <div className="h-6 w-px bg-indigo-500/30" />
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] text-indigo-400 uppercase tracking-widest">Target</span>
                            <span className="text-sm font-black text-white">{target}</span>
                        </div>
                        <div className="h-6 w-px bg-indigo-500/30" />
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] text-yellow-400 uppercase tracking-widest">Need</span>
                            <span className="text-sm font-black text-white">
                                <span className="text-yellow-400">{runsNeeded}</span>
                                <span className="text-[9px] font-normal text-indigo-300 ml-1">off {ballsRemaining}</span>
                            </span>
                        </div>
                    </>
                )}
            </div>

            {/* Bottom Row: Extras & RRR */}
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-indigo-300 pt-1">
                <span>Extras: {extrasCount}</span>
                {isChasing && <span>Req. Rate: {rrr}</span>}
            </div>
        </div>
    );
};
