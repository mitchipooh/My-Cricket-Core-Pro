
import React, { useState, useMemo } from 'react';
import { MatchState, Team } from '../../types.ts';
import { buildBattingCard } from '../../scorer/scorecard/buildBattingCard.ts';
import { buildBowlingCard } from '../../scorer/scorecard/buildBowlingCard.ts';
import { BattingScorecard } from './BattingScorecard.tsx';
import { BowlingScorecard } from './BowlingScorecard.tsx';
import { LinearScorebook } from '../scoring/LinearScorebook.tsx';

interface FullMatchScorecardProps {
  matchState: MatchState;
  teamA: Team;
  teamB: Team;
  onBack?: () => void;
}

export const FullMatchScorecard: React.FC<FullMatchScorecardProps> = ({
  matchState,
  teamA,
  teamB,
  onBack
}) => {
  // Determine which innings have data
  const inningsList = useMemo(() => {
    const list: number[] = [];
    // Check completed innings
    matchState.inningsScores.forEach(s => {
      if (!list.includes(s.innings)) list.push(s.innings);
    });
    // Check current innings
    if (!list.includes(matchState.innings)) {
      // Only if there's some history or it's innings 1
      if (matchState.innings === 1 || matchState.history.some(b => b.innings === matchState.innings)) {
        list.push(matchState.innings);
      }
    }
    return list.sort((a, b) => a - b);
  }, [matchState]);

  const [activeTab, setActiveTab] = useState<number>(inningsList[inningsList.length - 1] || 1);
  const [viewMode, setViewMode] = useState<'SUMMARY' | 'BOOK'>('SUMMARY');
  const [scale, setScale] = useState(1);

  // Helper to build data for a specific innings
  const getInningsData = (inn: number) => {
    // Is it completed?
    const completedData = matchState.inningsScores.find(s => s.innings === inn);

    // Determine Batting Team
    let battingTeamId = completedData?.teamId;

    // If not in completed, check if it's current
    if (!battingTeamId && matchState.innings === inn) {
      battingTeamId = matchState.battingTeamId;
    }

    // If still unknown (shouldn't happen for valid innings), deduce from logic (simplified)
    if (!battingTeamId) {
      // Robust Fallback: Check who batted in this innings from history
      const firstBallOfInnings = matchState.history.find(b => b.innings === inn);
      const sId = firstBallOfInnings?.strikerId;
      if (sId) {
        if (teamA.players.some(p => p.id === sId)) battingTeamId = teamA.id;
        else if (teamB.players.some(p => p.id === sId)) battingTeamId = teamB.id;
      }

      if (!battingTeamId) return null;
    }

    const battingTeam = battingTeamId === teamA.id ? teamA : teamB;
    const bowlingTeam = battingTeamId === teamA.id ? teamB : teamA;

    // Current Strikers (only if this is the active current innings)
    const isCurrent = matchState.innings === inn && !matchState.isCompleted;
    const sId = isCurrent ? matchState.strikerId : '';
    const nsId = isCurrent ? matchState.nonStrikerId : '';

    const battingCard = buildBattingCard(
      matchState.history,
      battingTeam.players,
      inn,
      sId,
      nsId
    );

    const bowlingCard = buildBowlingCard(
      matchState.history,
      bowlingTeam.players,
      inn
    );

    return { battingTeam, bowlingTeam, battingCard, bowlingCard };
  };

  const activeData = getInningsData(activeTab);

  const handleZoom = (direction: 'in' | 'out') => {
    setScale(prev => {
      const next = direction === 'in' ? prev + 0.1 : prev - 0.1;
      return Math.max(0.5, Math.min(next, 1.5));
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white animate-in zoom-in-95 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all text-sm">
              ←
            </button>
          )}
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Logo" className="w-8 h-8 object-contain" />
            <div>
              <h2 className="text-sm font-black uppercase tracking-tight">Scorecard</h2>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{teamA.name} vs {teamB.name}</p>
            </div>
          </div>
          {/* Status Banner */}
          {matchState.isCompleted ? (
            <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-500/20 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Completed</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-indigo-950/30 border border-indigo-500/20 px-3 py-1 rounded-full animate-pulse">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Live Cloud Match</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Zoom Controls */}
        <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
          <button onClick={() => handleZoom('out')} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded text-xs">-</button>
          <span className="w-8 flex items-center justify-center text-[9px] font-mono text-slate-500">{Math.round(scale * 100)}%</span>
          <button onClick={() => handleZoom('in')} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded text-xs">+</button>
        </div>

        {/* View Mode Switcher */}
        <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
          <button
            onClick={() => setViewMode('SUMMARY')}
            className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'SUMMARY' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Summary
          </button>
          <button
            onClick={() => setViewMode('BOOK')}
            className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'BOOK' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Book
          </button>
        </div>
      </div>

      {/* Innings Tabs */}
      <div className="flex bg-slate-900 border-b border-slate-800 overflow-x-auto no-scrollbar shrink-0">
        {inningsList.map(inn => {
          const data = getInningsData(inn);
          if (!data) return null;
          return (
            <button
              key={inn}
              onClick={() => setActiveTab(inn)}
              className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${activeTab === inn
                ? 'border-indigo-500 text-white bg-slate-800'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
            >
              Inn {inn} ({data.battingTeam.name.substring(0, 3).toUpperCase()})
            </button>
          );
        })}
      </div>

      {/* Content with Zoom */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-slate-950">
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', transition: 'transform 0.2s ease' }}>
          {activeData ? (
            viewMode === 'SUMMARY' ? (
              <div className="space-y-4 max-w-4xl mx-auto">
                <div className="animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Batting</h3>
                    <div className="text-[10px] font-bold text-slate-400">{activeData.battingTeam.name}</div>
                  </div>
                  <BattingScorecard data={activeData.battingCard} />
                </div>

                <div className="animate-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest">Bowling</h3>
                    <div className="text-[10px] font-bold text-slate-400">{activeData.bowlingTeam.name}</div>
                  </div>
                  <BowlingScorecard rows={activeData.bowlingCard} />
                </div>
              </div>
            ) : (
              <div className="animate-in slide-in-from-right-4 duration-300 max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Scorebook View</h3>
                  <div className="text-[10px] font-bold text-slate-400">{activeData.battingTeam.name}</div>
                </div>
                <LinearScorebook
                  data={{
                    ...activeData.battingCard,
                    bowlingRows: activeData.bowlingCard
                  }}
                />
              </div>
            )
          ) : (
            <div className="text-center py-20 text-slate-500 font-bold uppercase text-xs tracking-widest">
              No data for this innings
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
