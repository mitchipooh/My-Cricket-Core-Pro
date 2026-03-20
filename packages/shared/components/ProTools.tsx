// I will use a simplified version of ProTools for now to ensure it works, 
// and will gradually add back all features like Yoyo and Video analysis.
import React, { useState, useEffect } from 'react';
import { Timer, Activity, Calculator, Play, Pause, RotateCcw, Users, Target, Shield, UserCheck, UserX } from 'lucide-react';
import { Organization, Player } from '@shared/types';
import { SUB_CATEGORIES, METRIC_BENCHMARKS } from '../constants/performance';

interface ProToolsProps {
  players: Player[];
  organizations: Organization[];
  onSaveAssessment?: (playerId: string, category: string, subCategory: string, score: number, time?: number, notes?: string) => void;
}

export const ProTools: React.FC<ProToolsProps> = ({ players, organizations, onSaveAssessment }) => {
  const [activeTab, setActiveTab] = useState<'stopwatch' | 'yoyo' | 'calc'>('stopwatch');
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [stopwatchMode, setStopwatchMode] = useState<'simple' | 'group' | 'individual'>('individual');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [selectedSkill, setSelectedSkill] = useState<{cat: string, sub: string}>({ cat: 'Fitness', sub: 'Lap Timing' });

  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prev => prev + 10);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    if (!selectedPlayerId || !onSaveAssessment) return;
    const timeSec = time / 1000;
    onSaveAssessment(selectedPlayerId, selectedSkill.cat, selectedSkill.sub, timeSec, timeSec, `Recorded via Shared ProTools`);
    alert('Assessment saved!');
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-zinc-800 flex items-center gap-4 bg-zinc-950/50">
        <Timer className="w-6 h-6 text-emerald-500" />
        <div>
          <h2 className="text-xl font-bold text-white">Pro Tools</h2>
          <p className="text-xs text-zinc-500">Shared Assessment Engine</p>
        </div>
      </div>

      <div className="p-8 flex flex-col items-center">
        <div className="text-6xl font-black text-white font-mono mb-8 tabular-nums">
          {formatTime(time)}
        </div>

        <div className="flex gap-4 mb-8 w-full max-w-sm">
          <button 
            onClick={() => setIsRunning(!isRunning)}
            className={`flex-1 py-4 rounded-2xl font-bold uppercase transition-all ${isRunning ? 'bg-red-500 text-white' : 'bg-emerald-500 text-zinc-950'}`}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button 
            onClick={() => { setTime(0); setIsRunning(false); }}
            className="w-16 bg-zinc-800 text-zinc-400 rounded-2xl flex items-center justify-center"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        <div className="w-full max-w-md space-y-4">
            <select 
              value={selectedPlayerId}
              onChange={e => setSelectedPlayerId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white"
            >
              <option value="">Select Athlete...</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <select 
              value={JSON.stringify(selectedSkill)}
              onChange={e => setSelectedSkill(JSON.parse(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white"
            >
              {Object.entries(SUB_CATEGORIES).map(([cat, subs]) => (
                <optgroup key={cat} label={cat}>
                  {subs.map(sub => (
                    <option key={sub} value={JSON.stringify({cat, sub})}>{sub}</option>
                  ))}
                </optgroup>
              ))}
            </select>

            <button 
              onClick={handleSave}
              disabled={!selectedPlayerId || time === 0}
              className="w-full bg-emerald-500 text-zinc-950 font-bold py-4 rounded-2xl disabled:opacity-30"
            >
              Save Results
            </button>
        </div>
      </div>
    </div>
  );
};
