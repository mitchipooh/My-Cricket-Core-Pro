import React, { useState, useEffect } from 'react';
import { BallEvent } from '../../types';

interface BallCorrectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    ball: BallEvent | null;
    onSave: (updates: Partial<BallEvent>) => void;
}

export const BallCorrectionModal: React.FC<BallCorrectionModalProps> = ({ isOpen, onClose, ball, onSave }) => {
    const [runs, setRuns] = useState(0);
    const [extraType, setExtraType] = useState<string>('None');
    const [extraRuns, setExtraRuns] = useState(0);
    const [isWicket, setIsWicket] = useState(false);
    const [wicketType, setWicketType] = useState('');

    useEffect(() => {
        if (ball) {
            setRuns(ball.runs || 0);
            setExtraType(ball.extraType || 'None');
            setExtraRuns(ball.extraRuns || 0);
            setIsWicket(ball.isWicket || false);
            setWicketType(ball.wicketType || '');
        }
    }, [ball]);

    if (!isOpen || !ball) return null;

    const handleSave = () => {
        onSave({
            runs,
            extraType: extraType as any,
            extraRuns,
            isWicket,
            wicketType: isWicket ? wicketType : undefined
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="bg-slate-100 p-6 border-b border-slate-200">
                    <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Edit Ball</h3>
                    <p className="text-sm font-mono text-slate-500 font-bold">
                        {new Date(ball.timestamp).toLocaleTimeString()} • {ball.bowlerId ? 'Valid Ball' : 'Extra'}
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Runs Off Bat */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 px-1">Runs (Off Bat)</label>
                        <div className="flex gap-2">
                            {[0, 1, 2, 3, 4, 6].map(r => (
                                <button
                                    key={r}
                                    onClick={() => setRuns(r)}
                                    className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${runs === r ? 'bg-indigo-600 text-white shadow-md scale-110' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Extras */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 px-1">Extras</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['None', 'Wide', 'NoBall', 'Bye', 'LegBye'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setExtraType(type)}
                                    className={`py-2 rounded-lg text-xs font-bold transition-all ${extraType === type ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                        {extraType !== 'None' && (
                            <div className="flex items-center gap-4 mt-2 bg-slate-50 p-3 rounded-xl">
                                <span className="text-xs font-bold text-slate-600">Extra Runs:</span>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4].map(r => (
                                        <button
                                            key={r}
                                            onClick={() => setExtraRuns(r)}
                                            className={`w-8 h-8 rounded-lg font-bold text-xs ${extraRuns === r ? 'bg-orange-500 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Wicket Toggle */}
                    <div className="flex items-center justify-between bg-red-50 p-4 rounded-xl border border-red-100">
                        <span className="font-black text-red-700 uppercase text-xs tracking-widest">Is Wicket?</span>
                        <div
                            onClick={() => setIsWicket(!isWicket)}
                            className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${isWicket ? 'bg-red-500' : 'bg-gray-300'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm ${isWicket ? 'left-7' : 'left-1'}`}></div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-4 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
