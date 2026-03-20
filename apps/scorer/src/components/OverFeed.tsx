
import React, { useState } from 'react';
import { MatchState, BallEvent, Team } from '../../types.ts';
import { BallEditorModal } from '../modals/BallEditorModal.tsx';

interface OverFeedProps {
  matchState: MatchState;
  battingTeam?: Team;
  bowlingTeam?: Team;
  onEditBall: (timestamp: number, updates: Partial<BallEvent>) => void;
}

export const OverFeed: React.FC<OverFeedProps> = ({ matchState, battingTeam, bowlingTeam, onEditBall }) => {
  const [editingBall, setEditingBall] = useState<BallEvent | null>(null);
  const [activeEditOver, setActiveEditOver] = useState<number | null>(null);

  // Group balls by over
  const currentInningsBalls = matchState.history
    .filter(b => b.innings === matchState.innings && !b.commentary?.startsWith('EVENT'))
    .reverse();

  const oversMap = new Map<number, BallEvent[]>();
  currentInningsBalls.forEach(b => {
    if (!oversMap.has(b.over)) oversMap.set(b.over, []);
    oversMap.get(b.over)!.push(b);
  });

  const overIndices = Array.from(oversMap.keys()).sort((a, b) => b - a);

  const getBallSymbol = (ball: BallEvent) => {
    if (ball.isWicket) return 'W';
    if (ball.extraType === 'Wide') return `${1 + (ball.extraRuns || 0)}w`;
    if (ball.extraType === 'NoBall') return `${1 + (ball.runs || 0)}n`;
    if (ball.extraType === 'Bye') return `${ball.extraRuns}b`;
    if (ball.extraType === 'LegBye') return `${ball.extraRuns}l`;
    if (ball.runs === 0) return '•';
    return ball.runs.toString();
  };

  const getBallColor = (ball: BallEvent) => {
    if (ball.isWicket) return 'bg-red-600 text-white';
    if (ball.extraType !== 'None' && ball.extraType) return 'bg-amber-600 text-white';
    if (ball.runs >= 4) return 'bg-indigo-600 text-white';
    if (ball.runs === 0) return 'bg-slate-800 text-slate-500';
    return 'bg-slate-700 text-white';
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Match Timeline</h2>
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          {overIndices.length} Overs Recorded
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {overIndices.map(overIdx => {
          const balls = oversMap.get(overIdx)!;
          const bowlerId = balls[0].bowlerId;
          const bowler = bowlingTeam?.players.find(p => p.id === bowlerId);
          const isBeingEdited = activeEditOver === overIdx;

          return (
            <div
              key={overIdx}
              className={`flex items-center px-4 py-2 border-b border-white/5 transition-colors ${isBeingEdited ? 'bg-indigo-500/10' : 'hover:bg-white/5'}`}
            >
              {/* Left: Over & Bowler */}
              <div className="w-32 shrink-0 flex flex-col justify-center">
                <div className="text-[10px] font-black text-indigo-500 uppercase leading-none mb-1">Over {overIdx + 1}</div>
                <div className="text-xs font-bold text-white truncate pr-2">{bowler?.name || 'Unknown'}</div>
              </div>

              {/* Center: Balls */}
              <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {balls.map((ball, bIdx) => (
                  <button
                    key={ball.timestamp}
                    disabled={!isBeingEdited}
                    onClick={() => setEditingBall(ball)}
                    className={`
                      w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-all shrink-0
                      ${getBallColor(ball)}
                      ${isBeingEdited ? 'ring-2 ring-indigo-400 animate-pulse scale-105 shadow-lg' : ''}
                    `}
                  >
                    {getBallSymbol(ball)}
                  </button>
                ))}
              </div>

              {/* Right: Edit Toggle */}
              <div className="w-16 shrink-0 flex justify-end">
                <button
                  onClick={() => setActiveEditOver(isBeingEdited ? null : overIdx)}
                  className={`
                    px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                    ${isBeingEdited
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'bg-slate-800 text-slate-400 hover:bg-indigo-600 hover:text-white'
                    }
                  `}
                >
                  {isBeingEdited ? 'DONE' : 'EDIT'}
                </button>
              </div>
            </div>
          );
        })}

        {overIndices.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center p-20 opacity-20 text-center">
            <span className="text-5xl mb-4">🏏</span>
            <p className="text-sm font-black uppercase tracking-widest">No overs bowled yet</p>
          </div>
        )}
      </div>

      {editingBall && (
        <BallEditorModal
          ball={editingBall}
          battingTeam={battingTeam}
          bowlingTeam={bowlingTeam}
          onClose={() => setEditingBall(null)}
          onSave={(updates) => {
            onEditBall(editingBall.timestamp, updates);
            setEditingBall(null);
          }}
        />
      )}
    </div>
  );
};

