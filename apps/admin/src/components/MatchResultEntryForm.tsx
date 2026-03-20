
import React, { useState, useMemo } from 'react';
import { MatchFixture, PointsConfig } from '../../types';
import { calculatePointsForSide, MatchScoringPayload } from '../../utils/pointsCalculator';

import { DEFAULT_POINTS_CONFIG } from '../../competition/pointsEngine';

interface MatchResultEntryFormProps {
    fixture: MatchFixture;
    config: PointsConfig;
    onSave: (fixtureId: string, resultData: any) => void;
    onCancel: () => void;
}

export const MatchResultEntryForm: React.FC<MatchResultEntryFormProps> = ({ fixture, config, onSave, onCancel }) => {
    // Merge with defaults to handle legacy tournaments missing new fields
    const mergedConfig = useMemo(() => ({ ...DEFAULT_POINTS_CONFIG, ...config }), [config]);

    const [formData, setFormData] = useState<MatchScoringPayload & { winnerSide: 'A' | 'B' | 'TIE' | 'NONE' }>({
        resultType: 'OUTRIGHT_WIN',
        winnerSide: 'A',
        firstInningsWinnerId: fixture.teamAId, // Initial assumption
        firstInningsResult: 'LEAD',
        isIncomplete: false,
        teamARuns: 0,
        teamBRuns: 0,
        teamAWickets: 0,
        teamBWickets: 0,
    });

    const sideAPoints = useMemo(() => calculatePointsForSide('A', formData, mergedConfig), [formData, mergedConfig]);
    const sideBPoints = useMemo(() => calculatePointsForSide('B', formData, mergedConfig), [formData, mergedConfig]);

    const isValid = sideAPoints.isValid && sideBPoints.isValid;

    return (
        <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 p-8 text-white">
                <h3 className="text-2xl font-black italic uppercase tracking-tight">Record Match Result</h3>
                <p className="text-indigo-400 font-bold text-xs uppercase tracking-widest mt-1">{fixture.teamAName} vs {fixture.teamBName}</p>
            </div>

            <div className="p-8 space-y-8">
                {/* Results Logic */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Match Outcome</label>
                        <div className="flex flex-col gap-2">
                            <select
                                value={formData.isIncomplete ? 'INCOMPLETE' : 'OUTRIGHT'}
                                onChange={e => setFormData(p => ({ ...p, isIncomplete: e.target.value === 'INCOMPLETE' }))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold outline-none focus:ring-2 ring-indigo-500"
                            >
                                <option value="OUTRIGHT">Outright Result</option>
                                <option value="INCOMPLETE">Incomplete Match (Innings Based)</option>
                            </select>

                            {!formData.isIncomplete && (
                                <select
                                    value={formData.winnerSide}
                                    onChange={e => setFormData(p => ({ ...p, winnerSide: e.target.value as any }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold outline-none"
                                >
                                    <option value="A">{fixture.teamAName} Won Outright</option>
                                    <option value="B">{fixture.teamBName} Won Outright</option>
                                    <option value="TIE">Match Tied</option>
                                </select>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">1st Innings Performance</label>
                        <div className="flex flex-col gap-2">
                            <select
                                value={formData.firstInningsResult || ''}
                                onChange={e => setFormData(p => ({ ...p, firstInningsResult: e.target.value as any }))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold outline-none"
                            >
                                <option value="LEAD">{fixture.teamAName} 1st Innings Lead</option>
                                <option value="TIE">1st Innings Tied</option>
                                <option value="LOSS">{fixture.teamAName} 1st Innings Loss</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-900 uppercase text-center">{fixture.teamAName}</h4>
                        <div className="flex gap-4">
                            <StatInput label="Runs" value={formData.teamARuns} onChange={v => setFormData(p => ({ ...p, teamARuns: v }))} />
                            <StatInput label="Wkts Taken" value={formData.teamAWickets} onChange={v => setFormData(p => ({ ...p, teamAWickets: v }))} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-900 uppercase text-center">{fixture.teamBName}</h4>
                        <div className="flex gap-4">
                            <StatInput label="Runs" value={formData.teamBRuns} onChange={v => setFormData(p => ({ ...p, teamBRuns: v }))} />
                            <StatInput label="Wkts Taken" value={formData.teamBWickets} onChange={v => setFormData(p => ({ ...p, teamBWickets: v }))} />
                        </div>
                    </div>
                </div>

                {/* Points Preview */}
                <div className="grid grid-cols-2 gap-4">
                    <PointsCard side="A" name={fixture.teamAName} calculation={sideAPoints} />
                    <PointsCard side="B" name={fixture.teamBName} calculation={sideBPoints} />
                </div>

                {(!isValid) && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-3 animate-bounce">
                        <span className="text-xl">⚠️</span>
                        <span>{sideAPoints.error || sideBPoints.error}</span>
                    </div>
                )}

                <div className="flex gap-4 pt-4">
                    <button onClick={onCancel} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs tracking-widest">Cancel</button>
                    <button
                        disabled={!isValid}
                        onClick={() => onSave(fixture.id, formData)}
                        className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl disabled:opacity-50 transition-all"
                    >
                        Confirm & Save Result
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatInput = ({ label, value, onChange }: any) => (
    <div className="flex-1 flex flex-col items-center gap-1">
        <span className="text-[9px] font-black text-slate-400 uppercase">{label}</span>
        <input
            type="number"
            value={value}
            onChange={e => onChange(parseInt(e.target.value) || 0)}
            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-center font-black outline-none focus:ring-2 ring-indigo-500"
        />
    </div>
);

const PointsCard = ({ name, calculation }: any) => (
    <div className={`p-5 rounded-3xl border transition-all ${calculation.isValid ? 'bg-indigo-50/50 border-indigo-100' : 'bg-red-50 border-red-100'}`}>
        <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black text-slate-400 uppercase truncate max-w-[100px]">{name}</span>
            <span className={`text-2xl font-black ${calculation.isValid ? 'text-indigo-600' : 'text-red-600'}`}>{calculation.total}</span>
        </div>
        <div className="space-y-1">
            <PointRow label="Match" value={calculation.matchPoints} />
            <PointRow label="Innings" value={calculation.inningPoints} />
            <PointRow label="Batting" value={calculation.battingBonus} />
            <PointRow label="Bowling" value={calculation.bowlingBonus} />
        </div>
    </div>
);

const PointRow = ({ label, value }: any) => (
    <div className="flex justify-between text-[10px] items-center">
        <span className="text-slate-500 font-bold uppercase tracking-tight">{label}</span>
        <span className="font-black text-slate-900">+{value}</span>
    </div>
);
