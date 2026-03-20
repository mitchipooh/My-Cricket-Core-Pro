import React from 'react';
import { MatchState } from '../../types';

interface TimelineWidgetProps {
    state: MatchState;
}

export const TimelineWidget: React.FC<TimelineWidgetProps> = ({ state }) => {
    // Derive current over balls
    const currentOverIndex = Math.floor(state.totalBalls / 6);
    // Find balls that belong to this over OR the previous over if we just finished one
    const displayOverIndex = state.totalBalls > 0 && state.totalBalls % 6 === 0 ? currentOverIndex - 1 : currentOverIndex;

    // Sort logic: we need to find the balls from history that match this over index.
    const currentBalls = state.history
        .filter(b => b.over === displayOverIndex)
        .sort((a, b) => a.ballNumber - b.ballNumber);

    return (
        <div className="w-full">
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {currentBalls.length > 0 ? (
                    currentBalls.map((ball, i) => (
                        <div key={i} className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white border border-slate-600 shadow-sm">
                            {ball.isWicket ? 'W' : (ball.extraRuns ? (ball.extraType === 'Wide' ? 'wd' : 'nb') : ball.runs)}
                        </div>
                    ))
                ) : (
                    <div className="w-full text-center py-2 text-[10px] text-slate-500 italic border border-dashed border-slate-700 rounded-lg">
                        Ready to start over {displayOverIndex + 1}
                    </div>
                )}
            </div>
        </div>
    );
};
