import React from 'react';

interface ControlPadWidgetProps {
    onScoringInput: (val: string | number) => void;
    onExtra: () => void;
    onUndo: () => void;
    onWicket: () => void;
}

export const ControlPadWidget: React.FC<ControlPadWidgetProps> = ({ onScoringInput, onExtra, onUndo, onWicket }) => {
    return (
        <div className="h-full flex flex-col gap-2">
            {/* Main Keypad - using flex-1 to fill available vertical space */}
            <div className="flex-1 grid grid-cols-4 gap-2">
                {[0, 1, 2].map(runs => (
                    <button key={runs} onClick={() => onScoringInput(runs)} className="bg-slate-800 hover:bg-slate-700 rounded-xl text-3xl font-black text-white shadow-lg border-b-4 border-slate-900 active:border-b-0 active:translate-y-1">
                        {runs}
                    </button>
                ))}
                <button onClick={onWicket} className="bg-red-500 hover:bg-red-400 rounded-xl text-2xl font-black text-white uppercase tracking-widest shadow-lg shadow-red-900/50 border-b-4 border-red-800 active:border-b-0 active:translate-y-1">
                    OUT
                </button>

                {[3, 4, 6].map(runs => (
                    <button key={runs} onClick={() => onScoringInput(runs)} className="bg-slate-800 hover:bg-slate-700 rounded-xl text-3xl font-black text-white shadow-lg border-b-4 border-slate-900 active:border-b-0 active:translate-y-1">
                        {runs}
                    </button>
                ))}
                <button onClick={onUndo} className="bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold shadow-lg border-b-4 border-slate-800 active:border-b-0 active:translate-y-1 flex items-center justify-center">
                    <span className="text-2xl">↺</span>
                </button>
            </div>

            {/* Extras Bar - Fixed Height */}
            <div className="h-14 grid grid-cols-2 gap-2 shrink-0">
                <button onClick={onExtra} className="bg-slate-800 text-slate-400 rounded-xl text-xs font-bold uppercase border border-slate-700 hover:bg-slate-700 transition-colors">
                    Extras
                </button>
                <button className="bg-slate-800 text-slate-400 rounded-xl text-xs font-bold uppercase border border-slate-700 hover:bg-slate-700 transition-colors">
                    Events
                </button>
            </div>
        </div>
    );
};
