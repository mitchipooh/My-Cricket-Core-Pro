import React from 'react';
import { ScoringPadProps } from './types';

export const EventsPad: React.FC<ScoringPadProps> = ({
    readOnly,
    compact,
    onBack,
    onMediaCapture,
    onBroadcasterMode,
    onNav,
    onDeclare,
    onSubRequest,
    matchFormat,
    onToggleAnalytics,
    autoAnalytics,
    onOfficialsClick
}) => {
    const isTest = matchFormat === 'Test';
    const btnClass = (base: string) =>
        `${base} ${readOnly ? 'opacity-50 cursor-not-allowed pointer-events-none grayscale' : ''} ${compact ? 'text-xs py-1' : ''}`;

    return (
        <div className="h-full flex flex-col animate-in zoom-in-95 p-1 gap-2">
            <h3 className="text-center font-black uppercase text-[9px] text-slate-500 tracking-widest shrink-0">Match Actions</h3>
            <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 overflow-y-auto pb-4">
                <button disabled={readOnly} onClick={() => { if (onMediaCapture) onMediaCapture(); }} className={btnClass("bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all p-2")}>
                    <div className="w-10 h-10 rounded-full bg-slate-700 group-hover:bg-indigo-600 flex items-center justify-center text-xl transition-colors">📸</div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white text-center">Media Capture</span>
                </button>
                <button onClick={() => { if (onBroadcasterMode) onBroadcasterMode(); }} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all p-2">
                    <div className="w-10 h-10 rounded-full bg-slate-700 group-hover:bg-green-600 flex items-center justify-center text-xl transition-colors">📺</div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white text-center">Broadcaster Mode</span>
                </button>
                <button disabled={readOnly} onClick={() => onNav('declare_confirm')} className={btnClass("bg-slate-800 hover:bg-red-900/30 border border-slate-700 hover:border-red-500 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all p-2")}>
                    <div className="w-10 h-10 rounded-full bg-slate-700 group-hover:bg-red-600 flex items-center justify-center text-xl transition-colors">✋</div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white text-center">Declare Innings</span>
                </button>
                <button disabled={readOnly} onClick={() => { if (onSubRequest) onSubRequest(); }} className={btnClass("bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all p-2")}>
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xl group-hover:bg-amber-600 transition-colors">🔁</div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white text-center">Substitute</span>
                </button>
                {onToggleAnalytics && (
                    <button
                        disabled={readOnly}
                        onClick={onToggleAnalytics}
                        className={btnClass(`border rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all p-2 ${autoAnalytics ? 'bg-indigo-900/30 border-indigo-500/50 hover:bg-indigo-900/50' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`)}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-colors ${autoAnalytics ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-500'}`}>📍</div>
                        <div className="flex flex-col items-center leading-none">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${autoAnalytics ? 'text-indigo-300' : 'text-slate-400'}`}>Auto Maps</span>
                            <span className="text-[8px] font-bold uppercase mt-1">{autoAnalytics ? 'ON' : 'OFF'}</span>
                        </div>
                    </button>
                )}
                {onOfficialsClick && (
                    <button
                        disabled={readOnly}
                        onClick={onOfficialsClick}
                        className={btnClass(`bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all p-2`)}
                    >
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xl group-hover:bg-purple-600 transition-colors">👔</div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white text-center">Officials</span>
                    </button>
                )}
                {isTest && (
                    <button disabled={readOnly} onClick={() => onNav('end_match_confirm')} className={btnClass("bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all p-2")}>
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xl group-hover:bg-purple-600 transition-colors">🏁</div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white text-center">End Match</span>
                    </button>
                )}
            </div>
            <button onClick={onBack} className="h-12 w-full bg-slate-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-700 shrink-0">Back to Scoring</button>
        </div>
    );
};

