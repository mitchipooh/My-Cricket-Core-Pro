import React from 'react';
import { MatchFixture } from '../../types';

interface ScoringConflictModalProps {
    isOpen: boolean;
    onClose: () => void;
    matches: MatchFixture[];
    onCloseAllAndContinue: () => void;
    onIgnoreAndContinue: () => void;
}

export const ScoringConflictModal: React.FC<ScoringConflictModalProps> = ({
    isOpen,
    onClose,
    matches,
    onCloseAllAndContinue,
    onIgnoreAndContinue,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8">
                    <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center text-4xl mb-6 mx-auto">
                        ⚠️
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2 uppercase tracking-tight">
                        Unfinished Matches Detected
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-center mb-8 px-4">
                        You have active scoring sessions in progress. We recommend closing them to keep your dashboard clean and avoid sync conflicts.
                    </p>

                    <div className="space-y-3 mb-8 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                        {matches.map(match => (
                            <div key={match.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                <div>
                                    <h4 className="font-black text-slate-900 dark:text-white text-sm">
                                        {match.teamAName} vs {match.teamBName}
                                    </h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        {new Date(match.date).toLocaleDateString()} • {match.venue}
                                    </p>
                                </div>
                                <div className="px-3 py-1 bg-red-500 text-white text-[9px] font-black rounded-full animate-pulse">
                                    LIVE
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <button
                            onClick={onCloseAllAndContinue}
                            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all"
                        >
                            Close All & Start New
                        </button>
                        <button
                            onClick={onIgnoreAndContinue}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all"
                        >
                            Ignore & Continue
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-white dark:bg-slate-800 text-slate-400 font-black rounded-2xl text-xs uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
