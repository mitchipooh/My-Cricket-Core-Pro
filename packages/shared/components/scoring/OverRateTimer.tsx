
import React, { useState } from 'react';

type Props = {
  elapsedSeconds: number;
  actualOvers: number;
  expectedOvers: number;
  behindRate: boolean;
  totalInningsMinutes?: number;
};

export function OverRateTimer({
  elapsedSeconds,
  actualOvers,
  expectedOvers,
  behindRate,
  totalInningsMinutes = 85 // Standard T20
}: Props) {
  const [showRemaining, setShowRemaining] = useState(false);

  const formatTime = (totalSecs: number) => {
    const s = Math.abs(totalSecs);
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;
    return hours > 0 
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const totalInningsSeconds = totalInningsMinutes * 60;
  const timeRemaining = totalInningsSeconds - elapsedSeconds;
  
  // Calculate Avg time per over
  const avgSecondsPerOver = actualOvers > 0 ? elapsedSeconds / actualOvers : 0;

  return (
    <button
      onClick={() => setShowRemaining(!showRemaining)}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all duration-300
        ${behindRate 
           ? 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.6)] animate-pulse' 
           : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
        }
      `}
    >
      <div className="flex items-center gap-1.5">
        <span className={behindRate ? 'text-white' : 'opacity-70'}>
            {behindRate ? '⚠️' : '⏱'}
        </span>
        <span className={behindRate ? 'text-white' : 'text-indigo-400'}>
          {showRemaining ? `Rem: ${formatTime(timeRemaining)}` : formatTime(elapsedSeconds)}
        </span>
      </div>

      <div className={`w-px h-3 ${behindRate ? 'bg-white/30' : 'bg-white/10'}`} />

      <div className="flex items-center gap-1.5 whitespace-nowrap">
         <span className="text-white">{actualOvers.toFixed(1)} Ov</span>
         {!behindRate && actualOvers > 0 && (
            <span className="text-[9px] text-emerald-400 ml-1">Avg {formatTime(Math.round(avgSecondsPerOver))}</span>
         )}
      </div>
      
      {behindRate && (
        <span className="text-[9px] bg-white text-red-600 px-1.5 py-0.5 rounded uppercase tracking-widest font-black ml-1">
          SLOW
        </span>
      )}
    </button>
  );
}

