import React from 'react';
import { ScoringPadProps } from './types';

export const MainPad: React.FC<ScoringPadProps> = ({
    readOnly,
    compact,
    onRun,
    striker,
    onStartWicket,
    onAnalyticsClick,
    onNav
}) => {
    const btnClass = (base: string) =>
        `${base} ${readOnly ? 'opacity-50 cursor-not-allowed pointer-events-none grayscale' : ''} ${compact ? 'text-sm py-0.5' : ''}`;

    return (
        <div className="h-full w-full flex flex-col relative">
            {readOnly && (
                <div className="absolute top-1 right-1 z-20 pointer-events-none">
                    <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest animate-pulse shadow-md">
                        Live
                    </span>
                </div>
            )}

            <div className="flex flex-col gap-1.5 h-full w-full p-2 bg-slate-50">
                {/* Row 1: Singles/Dots - Desktop Optimized (shorter) */}
                <div className="grid grid-cols-4 gap-1.5 h-14">
                    <button onClick={() => onRun(0)} disabled={readOnly} className={btnClass("bg-white hover:bg-slate-50 text-slate-900 text-xl font-black rounded-lg shadow-sm border border-slate-200 flex items-center justify-center")}>0</button>
                    <button onClick={() => onRun(1)} disabled={readOnly} className={btnClass("bg-white hover:bg-slate-50 text-slate-900 text-xl font-black rounded-lg shadow-sm border border-slate-200 flex items-center justify-center")}>1</button>
                    <button onClick={() => onRun(2)} disabled={readOnly} className={btnClass("bg-white hover:bg-slate-50 text-slate-900 text-xl font-black rounded-lg shadow-sm border border-slate-200 flex items-center justify-center")}>2</button>
                    <button onClick={() => onRun(3)} disabled={readOnly} className={btnClass("bg-white hover:bg-slate-50 text-slate-900 text-xl font-black rounded-lg shadow-sm border border-slate-200 flex items-center justify-center")}>3</button>
                </div>

                {/* Row 2: Boundaries - Desktop Optimized (shorter) */}
                <div className="grid grid-cols-2 gap-1.5 h-20">
                    <button onClick={() => onRun(4)} disabled={readOnly} className={btnClass("bg-indigo-600 hover:bg-indigo-700 text-white text-4xl font-black rounded-xl shadow-md flex items-center justify-center")}>4</button>
                    <button onClick={() => onRun(6)} disabled={readOnly} className={btnClass("bg-emerald-600 hover:bg-emerald-700 text-white text-4xl font-black rounded-xl shadow-md flex items-center justify-center")}>6</button>
                </div>

                {/* Row 3: Actions - Desktop Optimized (shorter) */}
                <div className="grid grid-cols-3 gap-1.5 h-14">
                    <button onClick={() => onNav('extras')} disabled={readOnly} className={btnClass("bg-amber-600 hover:bg-amber-700 text-white text-sm font-black rounded-lg shadow-sm flex items-center justify-center uppercase")}>EX</button>
                    <button onClick={() => onStartWicket(striker?.id)} disabled={readOnly} className={btnClass("bg-red-600 hover:bg-red-700 text-white text-sm font-black rounded-lg shadow-sm flex items-center justify-center uppercase")}>OUT</button>

                    <div className="grid grid-rows-2 gap-1">
                        <button
                            onClick={() => { if (onAnalyticsClick) onAnalyticsClick(); }}
                            className={btnClass("bg-slate-100 hover:bg-slate-200 text-slate-900 text-[10px] font-black rounded-md border border-slate-200 flex items-center justify-center gap-1")}
                        >
                            <span>📍</span> MAP
                        </button>
                        <button
                            onClick={() => onNav('events')}
                            className={btnClass("bg-slate-100 hover:bg-slate-200 text-slate-900 text-[10px] font-black rounded-md border border-slate-200 flex items-center justify-center")}
                        >
                            MORE
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
