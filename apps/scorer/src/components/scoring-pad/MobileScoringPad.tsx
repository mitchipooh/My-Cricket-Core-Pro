import React from 'react';
import { ScoringPadProps } from './types';

export const MobileScoringPad: React.FC<ScoringPadProps> = ({
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

            <div className="flex flex-col gap-2 h-full w-full p-2 bg-slate-50">
                {/* Row 1: Singles/Dots - Flex Row (4 items, 25% each) */}
                <div className="flex gap-2 h-14 w-full">
                    <button
                        onClick={() => onRun(0)}
                        disabled={readOnly}
                        className={btnClass("flex-1 bg-white hover:bg-slate-50 text-slate-900 text-2xl font-black rounded-xl shadow-sm border border-slate-200 flex items-center justify-center")}
                    >
                        0
                    </button>
                    <button
                        onClick={() => onRun(1)}
                        disabled={readOnly}
                        className={btnClass("flex-1 bg-white hover:bg-slate-50 text-slate-900 text-2xl font-black rounded-xl shadow-sm border border-slate-200 flex items-center justify-center")}
                    >
                        1
                    </button>
                    <button
                        onClick={() => onRun(2)}
                        disabled={readOnly}
                        className={btnClass("flex-1 bg-white hover:bg-slate-50 text-slate-900 text-2xl font-black rounded-xl shadow-sm border border-slate-200 flex items-center justify-center")}
                    >
                        2
                    </button>
                    <button
                        onClick={() => onRun(3)}
                        disabled={readOnly}
                        className={btnClass("flex-1 bg-white hover:bg-slate-50 text-slate-900 text-2xl font-black rounded-xl shadow-md border-2 border-slate-900 flex items-center justify-center")}
                    >
                        3
                    </button>
                </div>

                {/* Row 2: Boundaries - Flex Row (2 items, 50% each) */}
                <div className="flex gap-2 h-20 w-full">
                    <button
                        onClick={() => onRun(4)}
                        disabled={readOnly}
                        className={btnClass("flex-1 bg-[#5b21b6] hover:bg-[#4c1d95] text-white text-5xl font-black rounded-2xl shadow-lg flex items-center justify-center")}
                    >
                        4
                    </button>
                    <button
                        onClick={() => onRun(6)}
                        disabled={readOnly}
                        className={btnClass("flex-1 bg-[#047857] hover:bg-[#065f46] text-white text-5xl font-black rounded-2xl shadow-lg flex items-center justify-center")}
                    >
                        6
                    </button>
                </div>

                {/* Row 3: Actions - Flex Row (4 items, 25% each) */}
                <div className="flex gap-2 h-16 w-full">
                    <button
                        onClick={() => onNav('extras')}
                        disabled={readOnly}
                        className={btnClass("flex-1 bg-[#c2410c] hover:bg-[#9a3412] text-white text-md font-black rounded-xl shadow-md flex items-center justify-center uppercase")}
                    >
                        EX
                    </button>
                    <button
                        onClick={() => onStartWicket(striker?.id)}
                        disabled={readOnly}
                        className={btnClass("flex-1 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-md font-black rounded-xl shadow-md flex items-center justify-center uppercase")}
                    >
                        OUT
                    </button>
                    <button
                        onClick={() => { if (onAnalyticsClick) onAnalyticsClick(); }}
                        disabled={readOnly}
                        className={btnClass("flex-1 bg-white hover:bg-slate-50 text-slate-900 text-[10px] font-black rounded-xl shadow-sm border border-slate-300 flex flex-col items-center justify-center gap-0.5")}
                    >
                        <span className="text-sm">📍</span>
                        <span className="uppercase">MAP</span>
                    </button>
                    <button
                        onClick={() => onNav('events')}
                        disabled={readOnly}
                        className={btnClass("flex-1 bg-white hover:bg-slate-50 text-slate-900 text-[10px] font-black rounded-xl shadow-sm border border-slate-300 flex items-center justify-center uppercase")}
                    >
                        MORE
                    </button>
                </div>
            </div>
        </div>
    );
};
