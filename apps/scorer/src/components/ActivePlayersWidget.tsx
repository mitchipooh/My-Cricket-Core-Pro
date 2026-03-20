import React from 'react';
import { MatchState, Team } from '../../types';

interface ActivePlayersWidgetProps {
    state: MatchState;
    teams: Team[];
}

export const ActivePlayersWidget: React.FC<ActivePlayersWidgetProps> = ({ state, teams }) => {
    // In a real implementation, we would look up player names from ID using the teams prop
    // For now, using placeholders or basic ID display to ensure structure works

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
            {/* Batsmen */}
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                <div className="flex justify-between text-[9px] text-slate-500 uppercase tracking-widest mb-2 px-1">
                    <span>Batting</span>
                    <span>R (B)</span>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center bg-slate-700/50 p-2 rounded-lg border-l-2 border-emerald-500">
                        <div className="flex items-center gap-2">
                            <span className="text-emerald-500 text-xs">🏏</span>
                            <span className="text-sm font-bold text-white truncate max-w-[120px]">
                                {state.strikerId || 'Striker'}
                            </span>
                        </div>
                        <span className="text-sm font-bold text-white">0 (0)</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-700/30 p-2 rounded-lg opacity-80">
                        <span className="text-sm font-bold text-white pl-6 truncate max-w-[120px]">
                            {state.nonStrikerId || 'Non-Striker'}
                        </span>
                        <span className="text-sm font-bold text-white">0 (0)</span>
                    </div>
                </div>
            </div>

            {/* Bowler */}
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                <div className="flex justify-between text-[9px] text-slate-500 uppercase tracking-widest mb-2 px-1">
                    <span>Bowling</span>
                    <span>Figures</span>
                </div>
                <div className="flex justify-between items-center bg-slate-700/50 p-2 rounded-lg border-l-2 border-indigo-500 h-[calc(100%-24px)]">
                    <div className="flex items-center gap-2">
                        <span className="text-indigo-500 text-xs">⚾</span>
                        <span className="text-sm font-bold text-white truncate max-w-[120px]">
                            {state.bowlerId || 'Bowler'}
                        </span>
                    </div>
                    <span className="text-sm font-bold text-white">0-0 (0.0)</span>
                </div>
            </div>
        </div>
    );
};
