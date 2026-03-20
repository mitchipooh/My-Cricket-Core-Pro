import React from 'react';
import { ScoringPadProps } from './types';

export const ConfirmationPad: React.FC<ScoringPadProps> = ({
    padView,
    striker,
    onDeclare,
    onEndGame,
    onEndInnings,
    onNav,
    onBack
}) => {
    if (padView === 'declare_confirm') {
        return (
            <div className="h-full flex flex-col animate-in zoom-in-95 p-4 bg-red-950/20 rounded-2xl border border-red-500/20">
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-4xl mb-4 shadow-lg shadow-red-600/40">✋</div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Declare Innings?</h3>
                    <p className="text-red-300 text-xs font-bold leading-relaxed px-4">
                        This will immediately end the current innings and close batting for {striker?.id ? 'the batting team' : 'this team'}.
                    </p>
                </div>

                <div className="flex flex-col gap-3 shrink-0">
                    {/* Primary Action depends on context, but user wants End Innings as option */}
                    <button
                        onClick={() => { if (onEndInnings) { onEndInnings(); onBack(); } }}
                        className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-900/40 transition-all active:scale-95"
                    >
                        End Innings (Conclude)
                    </button>

                    <button
                        onClick={() => { if (onDeclare) { onDeclare(); onBack(); } }}
                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black uppercase text-xs tracking-widest border border-slate-600 transition-all"
                    >
                        Declare Closed
                    </button>

                    <button
                        onClick={() => onNav('events')}
                        className="w-full py-3 bg-transparent text-slate-400 rounded-xl font-black uppercase text-xs tracking-widest hover:text-white transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    if (padView === 'end_match_confirm') {
        return (
            <div className="h-full flex flex-col animate-in zoom-in-95 p-4 bg-purple-950/20 rounded-2xl border border-purple-500/20">
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-4xl mb-4 shadow-lg shadow-purple-600/40">🏁</div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Conclude Match?</h3>
                    <p className="text-purple-300 text-xs font-bold leading-relaxed px-4">
                        If time has expired or captains agree, this will end the game as a <span className="text-white">DRAW</span> if no result was reached.
                    </p>
                </div>

                <div className="flex flex-col gap-3 shrink-0">
                    <button
                        onClick={() => { if (onEndGame) { onEndGame(); onBack(); } }}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-purple-900/40 transition-all active:scale-95"
                    >
                        End as Draw / Result
                    </button>
                    <button
                        onClick={() => onNav('events')}
                        className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black uppercase text-xs tracking-widest transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

