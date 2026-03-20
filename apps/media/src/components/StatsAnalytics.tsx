
import React, { useState } from 'react';
import { Team } from '../../types';
import { calculateDLSTarget } from '../../utils/cricket-engine.ts';
import { PitchView } from './PitchView.tsx';
import { FieldView } from './FieldView.tsx';

interface StatsProps {
  teams: Team[];
  onBack?: () => void;
  hideHeader?: boolean;
}

export const StatsAnalytics: React.FC<StatsProps> = ({ teams, onBack, hideHeader }) => {
  const [dlsData, setDlsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dlsForm, setDlsForm] = useState({
    score: 150,
    wickets: 4,
    overs: 12.4,
    target: 200,
    weather: "Overcast with light drizzle"
  });

  const runDLS = async () => {
    setIsLoading(true);
    setTimeout(() => {
      const oversLost = 20 - dlsForm.overs;
      const revised = calculateDLSTarget(
        dlsForm.target - 1,
        oversLost,
        dlsForm.wickets,
        20
      );

      setDlsData({
        revisedTarget: revised,
        tacticalAdvice: "Based on current mathematical trends, maintain the run rate and protect wickets to stay ahead of the par score.",
        winningProbability: Math.min(100, Math.max(0, 50 + (dlsForm.score / dlsForm.target * 50) - (dlsForm.wickets * 10)))
      });
      setIsLoading(false);
    }, 600);
  };

  // Mock data for visualizations since we don't query a specific match here
  const mockPitchData = [
    { coords: { x: 45, y: 30 }, color: 'red' },
    { coords: { x: 55, y: 150 }, color: 'green' },
    { coords: { x: 50, y: 170 }, color: 'blue' },
    { coords: { x: 20, y: 40 }, color: 'yellow' },
  ];

  const mockShotData = [
    { coords: { x: 10, y: 10 }, color: 'red' },
    { coords: { x: 90, y: 90 }, color: 'green' },
    { coords: { x: 50, y: 10 }, color: 'white' },
    { coords: { x: 20, y: 50 }, color: 'yellow' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-right-8 duration-500">
      {!hideHeader && (
        <header className="flex items-center gap-6">
          {onBack && (
            <button onClick={onBack} className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-all shadow-lg border border-slate-700">←</button>
          )}
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Advanced Analytics</h1>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Moneyball Insights & DLS Logic</p>
          </div>
        </header>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pitch & Field Analysis */}
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Spatial Analysis</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700/50 flex flex-col items-center">
              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Pitch Map</h4>
              <PitchView deliveries={mockPitchData} readonly />
            </div>
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700/50 flex flex-col items-center">
              <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-4">Wagon Wheel</h4>
              <FieldView shots={mockShotData} readonly />
            </div>
          </div>

          <div className="mt-4 flex gap-4 text-[10px] uppercase font-bold text-slate-500 justify-center">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Wicket</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Dot</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> 4s/6s</span>
          </div>
        </div>

        {/* DLS Module */}
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🌧️</span>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">DLS Target Calculator</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Current Score</label>
              <input
                type="number"
                value={dlsForm.score}
                onChange={e => setDlsForm({ ...dlsForm, score: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Wickets Down</label>
              <input
                type="number"
                value={dlsForm.wickets}
                onChange={e => setDlsForm({ ...dlsForm, wickets: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Overs Completed</label>
              <input
                type="number"
                value={dlsForm.overs}
                onChange={e => setDlsForm({ ...dlsForm, overs: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Initial Target</label>
              <input
                type="number"
                value={dlsForm.target}
                onChange={e => setDlsForm({ ...dlsForm, target: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white"
              />
            </div>
          </div>

          <button
            onClick={runDLS}
            disabled={isLoading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20"
          >
            {isLoading ? 'Processing Standard Logic...' : 'Calculate Revised Target'}
          </button>

          {dlsData && (
            <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 animate-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-indigo-400">REVISED TARGET</span>
                <span className="text-4xl font-black text-white">{dlsData.revisedTarget}</span>
              </div>
              <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Mathematical Analysis</p>
              <p className="text-sm text-slate-300 italic mb-4">"{dlsData.tacticalAdvice}"</p>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-green-500 h-full transition-all duration-1000"
                  style={{ width: `${dlsData.winningProbability}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase text-right">Win Probability: {Math.round(dlsData.winningProbability)}%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

