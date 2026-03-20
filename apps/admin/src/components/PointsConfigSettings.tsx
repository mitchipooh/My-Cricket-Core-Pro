
import React, { useState } from 'react';
import { PointsConfig, BonusThreshold } from '../../types';
import { DEFAULT_POINTS_CONFIG, PRESET_T20, PRESET_TEST } from '../../competition/pointsEngine';

interface PointsConfigSettingsProps {
    config: PointsConfig;
    onSave: (newConfig: PointsConfig) => void;
}

export const PointsConfigSettings: React.FC<PointsConfigSettingsProps> = ({ config, onSave }) => {
    // Merge with defaults to handle legacy tournaments missing new fields
    const mergedConfig = { ...DEFAULT_POINTS_CONFIG, ...config };
    const [localConfig, setLocalConfig] = useState<PointsConfig>(mergedConfig);

    const applyPreset = (preset: PointsConfig) => {
        if (confirm('Apply this preset? This will overwrite your current point settings.')) {
            setLocalConfig({ ...preset });
        }
    };

    const handleChange = (field: keyof PointsConfig, value: any) => {
        setLocalConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleTierChange = (type: 'batting' | 'bowling', index: number, field: keyof BonusThreshold, value: number) => {
        const fieldName = type === 'batting' ? 'batting_bonus_tiers' : 'bowling_bonus_tiers';
        const newTiers = [...(localConfig[fieldName] as BonusThreshold[])];
        newTiers[index] = { ...newTiers[index], [field]: value };
        handleChange(fieldName, newTiers);
    };

    const addTier = (type: 'batting' | 'bowling') => {
        const fieldName = type === 'batting' ? 'batting_bonus_tiers' : 'bowling_bonus_tiers';
        const newTiers = [...(localConfig[fieldName] as BonusThreshold[]), { threshold: 0, points: 0 }];
        handleChange(fieldName, newTiers);
    };

    const removeTier = (type: 'batting' | 'bowling', index: number) => {
        const fieldName = type === 'batting' ? 'batting_bonus_tiers' : 'bowling_bonus_tiers';
        const newTiers = (localConfig[fieldName] as BonusThreshold[]).filter((_, i) => i !== index);
        handleChange(fieldName, newTiers);
    };

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h3 className="text-2xl font-black text-slate-900">Points Configuration</h3>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Regulatory Logic Settings</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex-1 md:flex-none">
                        <select
                            onChange={(e) => {
                                if (e.target.value === 'T20') applyPreset(PRESET_T20);
                                if (e.target.value === 'TEST') applyPreset(PRESET_TEST);
                                e.target.value = ''; // Reset select
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest outline-none focus:ring-2 ring-indigo-500"
                        >
                            <option value="">Apply Preset...</option>
                            <option value="T20">Standard T20/Limited Overs</option>
                            <option value="TEST">Standard Test/Multi-Day</option>
                        </select>
                    </div>

                    <button
                        onClick={() => onSave(localConfig)}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-500 transition-all"
                    >
                        Save Configuration
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Standard Points */}
                <section className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Standard Match Points</h4>
                    <div className="space-y-3">
                        <ConfigInput label="Win (Reg/Outright)" value={localConfig.win_outright} onChange={v => { handleChange('win_outright', v); handleChange('win', v); }} />
                        <ConfigInput label="Tie (Reg/Match)" value={localConfig.tie_match} onChange={v => { handleChange('tie_match', v); handleChange('tie', v); }} />
                        <ConfigInput label="No Result / Abandoned" value={localConfig.noResult} onChange={v => handleChange('noResult', v)} />
                    </div>
                </section>

                {/* Inning Points */}
                <section className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Test/Multi-Day Points</h4>
                    <div className="space-y-3">
                        <ConfigInput label="1st Innings Lead" value={localConfig.first_inning_lead} onChange={v => handleChange('first_inning_lead', v)} />
                        <ConfigInput label="1st Innings Tie" value={localConfig.first_inning_tie} onChange={v => handleChange('first_inning_tie', v)} />
                        <ConfigInput label="1st Innings Loss" value={localConfig.first_inning_loss} onChange={v => handleChange('first_inning_loss', v)} />
                    </div>
                </section>

                {/* Validation & Caps */}
                <section className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Bonus Caps & Limits</h4>
                    <div className="space-y-3">
                        <ConfigInput label="Max Pts Per Match" value={localConfig.max_total_per_match} onChange={v => handleChange('max_total_per_match', v)} />
                        <ConfigInput label="Max Batting Bonus" value={localConfig.bonus_batting_max} onChange={v => handleChange('bonus_batting_max', v)} />
                        <ConfigInput label="Max Bowling Bonus" value={localConfig.bonus_bowling_max} onChange={v => handleChange('bonus_bowling_max', v)} />
                    </div>
                </section>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                {/* Batting Bonus Tiers */}
                <TierEditor
                    title="Batting Bonus Tiers"
                    unit="Runs"
                    tiers={localConfig.batting_bonus_tiers}
                    onAdd={() => addTier('batting')}
                    onRemove={i => removeTier('batting', i)}
                    onChange={(i, f, v) => handleTierChange('batting', i, f, v)}
                />

                {/* Bowling Bonus Tiers */}
                <TierEditor
                    title="Bowling Bonus Tiers"
                    unit="Wickets"
                    tiers={localConfig.bowling_bonus_tiers}
                    onAdd={() => addTier('bowling')}
                    onRemove={i => removeTier('bowling', i)}
                    onChange={(i, f, v) => handleTierChange('bowling', i, f, v)}
                />
            </div>
        </div>
    );
};

const ConfigInput = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <span className="text-sm font-bold text-slate-600">{label}</span>
        <input
            type="number"
            value={value}
            onChange={e => onChange(parseInt(e.target.value) || 0)}
            className="w-16 bg-white border border-slate-200 rounded-lg p-2 text-center font-black text-indigo-600 outline-none focus:ring-2 ring-indigo-500"
        />
    </div>
);

const TierEditor = ({ title, unit, tiers, onAdd, onRemove, onChange }: any) => (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{title}</h4>
            <button onClick={onAdd} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">+ Add Tier</button>
        </div>
        <div className="space-y-2">
            {tiers.map((tier: any, i: number) => (
                <div key={i} className="flex items-center gap-3 animate-in slide-in-from-left-2">
                    <div className="flex-1 flex items-center gap-2 bg-slate-50 p-2 px-4 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400">MIN {unit}:</span>
                        <input
                            type="number"
                            value={tier.threshold}
                            onChange={e => onChange(i, 'threshold', parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent font-bold text-sm outline-none"
                        />
                    </div>
                    <div className="w-24 flex items-center gap-2 bg-indigo-50/50 p-2 px-4 rounded-xl border border-indigo-100/50">
                        <span className="text-[10px] font-black text-indigo-400">PTS:</span>
                        <input
                            type="number"
                            value={tier.points}
                            onChange={e => onChange(i, 'points', parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent font-black text-sm text-indigo-600 outline-none"
                        />
                    </div>
                    <button onClick={() => onRemove(i)} className="text-slate-300 hover:text-red-500 transition-colors">✕</button>
                </div>
            ))}
        </div>
    </div>
);
