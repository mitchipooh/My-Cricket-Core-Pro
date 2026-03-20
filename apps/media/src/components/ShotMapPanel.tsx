import React, { useState } from 'react';
import { Coordinates } from '../../types.ts';
import { FieldView } from './FieldView.tsx';
import { PitchView } from './PitchView.tsx';
import { getBallColor } from '../../utils/cricket-engine.ts';

interface ShotMapPanelProps {
    onSave: (pitch: Coordinates | undefined, shot: Coordinates | undefined, height: 'Ground' | 'Aerial' | undefined) => void;
    onClose: () => void;
    existingPitch?: Coordinates;
    existingShot?: Coordinates;
    existingHeight?: 'Ground' | 'Aerial';
    ballColor?: string;
    isWaiting?: boolean;
}

export const ShotMapPanel: React.FC<ShotMapPanelProps> = ({
    onSave, onClose, existingPitch, existingShot, existingHeight, ballColor, isWaiting = false
}) => {
    const [pitch, setPitch] = useState<Coordinates | undefined>(existingPitch);
    const [shot, setShot] = useState<Coordinates | undefined>(existingShot);
    const [height, setHeight] = useState<'Ground' | 'Aerial' | undefined>(existingHeight);
    const [tab, setTab] = useState<'PITCH' | 'SHOT' | 'HEIGHT'>('PITCH');

    const handleSave = () => {
        onSave(pitch, shot, height);
        // Reset local state for next entry
        setPitch(undefined);
        setShot(undefined);
        setHeight(undefined);
        setTab('PITCH');
    };

    return (
        <div className="h-full flex flex-col bg-slate-900 text-white overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-tight">Guided Analytics</h3>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Step {tab === 'PITCH' ? '1' : tab === 'SHOT' ? '2' : '3'}</p>
                    </div>
                    <button onClick={onClose} className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs">✕</button>
                </div>

                <div className="flex bg-slate-800 rounded-lg p-0.5">
                    <button
                        onClick={() => setTab('PITCH')}
                        className={`flex-1 py-1.5 rounded-md text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1 ${tab === 'PITCH' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    >
                        Pitch
                    </button>
                    <button
                        onClick={() => setTab('SHOT')}
                        className={`flex-1 py-1.5 rounded-md text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1 ${tab === 'SHOT' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    >
                        Shot
                    </button>
                    <button
                        onClick={() => setTab('HEIGHT')}
                        className={`flex-1 py-1.5 rounded-md text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1 ${tab === 'HEIGHT' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    >
                        Type
                    </button>
                </div>
            </div>

            <div className="flex-1 p-4 flex flex-col items-center justify-center relative overflow-y-auto no-scrollbar">
                {tab === 'PITCH' && (
                    <div className="w-full space-y-4">
                        <p className="text-center text-[9px] text-slate-500 font-bold uppercase tracking-widest bg-slate-800/50 py-1.5 rounded-full border border-white/5 px-3">
                            1. Tap ball impact point
                        </p>
                        <PitchView
                            onRecord={(c) => { setPitch(c); setTimeout(() => setTab('SHOT'), 400); }}
                            deliveries={pitch ? [{ coords: pitch, color: ballColor || '#14b8a6' }] : []}
                        />
                    </div>
                )}
                {tab === 'SHOT' && (
                    <div className="w-full space-y-4">
                        <p className="text-center text-[9px] text-slate-500 font-bold uppercase tracking-widest bg-slate-800/50 py-1.5 rounded-full border border-white/5 px-3">
                            2. Tap ball travel
                        </p>
                        <FieldView
                            onRecord={(c) => { setShot(c); setTimeout(() => setTab('HEIGHT'), 400); }}
                            shots={shot ? [{ coords: shot, color: ballColor || '#f59e0b' }] : []}
                        />
                    </div>
                )}
                {tab === 'HEIGHT' && (
                    <div className="w-full space-y-4 flex flex-col items-center">
                        <p className="text-center text-[9px] text-slate-500 font-bold uppercase tracking-widest bg-slate-800/50 py-1.5 rounded-full border border-white/5 px-3 w-full">
                            3. Select shot type
                        </p>

                        <div className="flex flex-col gap-3 w-full px-2">
                            <button
                                onClick={() => { setHeight('Ground'); setTimeout(handleSave, 300); }}
                                className={`py-6 rounded-xl border transition-all flex flex-col items-center gap-2 ${height === 'Ground' ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                            >
                                <span className="text-2xl">🌱</span>
                                <span className="font-black uppercase tracking-widest text-[10px]">Ground</span>
                            </button>

                            <button
                                onClick={() => { setHeight('Aerial'); setTimeout(handleSave, 300); }}
                                className={`py-6 rounded-xl border transition-all flex flex-col items-center gap-2 ${height === 'Aerial' ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                            >
                                <span className="text-2xl">☁️</span>
                                <span className="font-black uppercase tracking-widest text-[10px]">Aerial</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Waiting Overlay */}
                {isWaiting && (
                    <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
                        <div className="space-y-4">
                            <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-indigo-500 animate-spin mx-auto opacity-40" />
                            <div className="space-y-1">
                                <h4 className="text-sm font-black uppercase tracking-tight text-white/50">Waiting on ball</h4>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">Record a delivery to begin</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950">
                <button
                    onClick={handleSave}
                    disabled={!pitch && !shot && !height}
                    className="w-full py-3 bg-gradient-to-r from-teal-600 to-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-30"
                >
                    Complete Entry
                </button>
            </div>
        </div>
    );
};
