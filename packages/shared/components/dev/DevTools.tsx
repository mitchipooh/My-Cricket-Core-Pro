import React from 'react';
import { DEV_PROFILES } from './DevDataProfiles.ts';
import { useData } from '@shared/contexts/DataProvider.tsx';

export const DevTools: React.FC = () => {
    const { setOrgs, setStandaloneMatches } = useData();

    const handleApplyProfile = (profileId: string) => {
        const profile = DEV_PROFILES.find(p => p.id === profileId);
        if (!profile) return;

        if (!confirm(`Are you sure you want to load "${profile.name}"? This will overwrite existing data.`)) return;

        const data = profile.generate();
        setOrgs(data.orgs);
        setStandaloneMatches(data.matches);
        alert(`Loaded profile: ${profile.name}`);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3">Dev Data Profiles</h3>
            <div className="grid grid-cols-1 gap-2">
                {DEV_PROFILES.map(profile => (
                    <button
                        key={profile.id}
                        onClick={() => handleApplyProfile(profile.id)}
                        className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all text-left group"
                    >
                        <span className="text-2xl group-hover:scale-110 transition-transform">{profile.icon}</span>
                        <div>
                            <div className="text-sm font-bold text-white">{profile.name}</div>
                            <div className="text-[10px] text-slate-500">{profile.description}</div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
