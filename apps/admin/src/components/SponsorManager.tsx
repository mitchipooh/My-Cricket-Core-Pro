
/**
 * Cricket-Core 2026 Management System
 * Created by mitchipoohdevs
 */

import React, { useState } from 'react';
import { Organization, Sponsor, SponsorSettings } from '../../types.ts';

interface SponsorManagerProps {
    organization: Organization;
    onUpdateOrg: (id: string, data: Partial<Organization>) => void;
}

export const SponsorManager: React.FC<SponsorManagerProps> = ({ organization, onUpdateOrg }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newSponsor, setNewSponsor] = useState<Partial<Sponsor>>({
        name: '',
        logoUrl: '',
        website: '',
        isActive: true,
        placements: []
    });
    const [editingSponsorId, setEditingSponsorId] = useState<string | null>(null);

    const [uploading, setUploading] = useState(false);

    const settings = organization.sponsorSettings || {
        mediaTopHeight: 320, // Default h-80
        mediaBottomHeight: 320,
        scoreboardTopHeight: 400, // Default h-100
        scoreboardBottomHeight: 480 // Default h-120
    };

    const updateSizing = (key: keyof SponsorSettings, value: number) => {
        onUpdateOrg(organization.id, {
            sponsorSettings: { ...settings, [key]: value }
        });
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploading(true);
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    // Resize logic: Max 3000px width/height for sponsor logos (10x increase)
                    const MAX_SIZE = 3000;
                    let width = img.width;
                    let height = img.height;
                    if (width > height) {
                        if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
                    } else {
                        if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    ctx?.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/png');
                    setNewSponsor(prev => ({ ...prev, logoUrl: dataUrl }));
                    setUploading(false);
                };
                img.src = readerEvent.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const togglePlacement = (p: Sponsor['placements'][number]) => {
        setNewSponsor(prev => {
            const current = prev.placements || [];
            if (current.includes(p)) return { ...prev, placements: current.filter(x => x !== p) };
            return { ...prev, placements: [...current, p] };
        });
    };

    const saveSponsor = () => {
        if (!newSponsor.name || !newSponsor.logoUrl) return;

        if (editingSponsorId) {
            // Update existing
            const updatedSponsors = (organization.sponsors || []).map(s =>
                s.id === editingSponsorId ? {
                    ...s,
                    name: newSponsor.name!,
                    logoUrl: newSponsor.logoUrl!,
                    website: newSponsor.website,
                    placements: newSponsor.placements || []
                } : s
            );
            onUpdateOrg(organization.id, { sponsors: updatedSponsors });
        } else {
            // Create new
            const s: Sponsor = {
                id: `sp-${Date.now()}`,
                name: newSponsor.name!,
                logoUrl: newSponsor.logoUrl!,
                website: newSponsor.website,
                isActive: newSponsor.isActive ?? true,
                placements: newSponsor.placements || []
            };
            const updatedSponsors = [...(organization.sponsors || []), s];
            onUpdateOrg(organization.id, { sponsors: updatedSponsors });
        }

        setIsAdding(false);
        setEditingSponsorId(null);
        setNewSponsor({ name: '', logoUrl: '', website: '', isActive: true, placements: [] });
    };

    const startEdit = (sponsor: Sponsor) => {
        setNewSponsor({
            name: sponsor.name,
            logoUrl: sponsor.logoUrl,
            website: sponsor.website,
            isActive: sponsor.isActive,
            placements: sponsor.placements
        });
        setEditingSponsorId(sponsor.id);
        setIsAdding(true);
    };

    const cancelForm = () => {
        setIsAdding(false);
        setEditingSponsorId(null);
        setNewSponsor({ name: '', logoUrl: '', website: '', isActive: true, placements: [] });
    };

    const deleteSponsor = (id: string) => {
        const updatedSponsors = (organization.sponsors || []).filter(s => s.id !== id);
        onUpdateOrg(organization.id, { sponsors: updatedSponsors });
    };

    const toggleSponsorStatus = (id: string) => {
        const updatedSponsors = (organization.sponsors || []).map(s =>
            s.id === id ? { ...s, isActive: !s.isActive } : s
        );
        onUpdateOrg(organization.id, { sponsors: updatedSponsors });
    };

    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-3xl font-black mb-2">Sponsors Console</h2>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Manage Partners & Ad Placements</p>
                </div>
                <div className="absolute top-0 right-0 p-8 text-8xl opacity-10">🤝</div>
            </div>

            {/* SIZING SETTINGS */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-6 text-4xl opacity-5">⚙️</div>
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    Display Sizing
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-full">Adjust Dimensions (px)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Media Center Top', key: 'mediaTopHeight' },
                        { label: 'Media Center Bottom', key: 'mediaBottomHeight' },
                        { label: 'Scoreboard Top', key: 'scoreboardTopHeight' },
                        { label: 'Scoreboard Bottom', key: 'scoreboardBottomHeight' }
                    ].map(cfg => (
                        <div key={cfg.key} className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{cfg.label}</label>
                            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-1 rounded-xl">
                                <input
                                    type="number"
                                    value={settings[cfg.key as keyof SponsorSettings] || 0}
                                    onChange={(e) => updateSizing(cfg.key as keyof SponsorSettings, parseInt(e.target.value) || 0)}
                                    className="w-full bg-transparent p-3 font-black text-slate-900 outline-none"
                                />
                                <span className="pr-4 text-[10px] font-black text-slate-400">PX</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] font-bold text-indigo-700 leading-relaxed uppercase tracking-tight">
                        💡 These heights define the vertical container for sponsor logos. Logos will scale proportionally to fit within this height while maintaining their aspect ratio.
                    </p>
                </div>
            </div>

            {isAdding ? (
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
                    <h3 className="text-xl font-black text-slate-900 mb-6">{editingSponsorId ? 'Edit Sponsor' : 'Add New Sponsor'}</h3>
                    <div className="space-y-6">
                        <div className="flex items-center gap-6">
                            <div className="w-80 h-80 rounded-[2.5rem] bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative group">
                                {uploading ? (
                                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                ) : newSponsor.logoUrl ? (
                                    <img src={newSponsor.logoUrl} className="w-full h-full object-contain p-2" />
                                ) : (
                                    <span className="text-4xl text-slate-300 font-black">+</span>
                                )}
                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                            <div className="flex-1 space-y-4">
                                <input
                                    value={newSponsor.name}
                                    onChange={e => setNewSponsor({ ...newSponsor, name: e.target.value })}
                                    placeholder="Sponsor Name"
                                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outline-none"
                                />
                                <input
                                    value={newSponsor.website}
                                    onChange={e => setNewSponsor({ ...newSponsor, website: e.target.value })}
                                    placeholder="Website URL (Optional)"
                                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-medium text-sm outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 block">Ad Placements</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'MEDIA_TOP', label: 'Media Feed (Top)' },
                                    { id: 'MEDIA_BOTTOM', label: 'Media Feed (Bottom)' },
                                    { id: 'SCOREBOARD_TOP', label: 'Scoreboard (Top)' },
                                    { id: 'SCOREBOARD_BOTTOM', label: 'Scoreboard (Bottom)' }
                                ].map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => togglePlacement(p.id as any)}
                                        className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${newSponsor.placements?.includes(p.id as any)
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button onClick={cancelForm} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs">Cancel</button>
                            <button onClick={saveSponsor} disabled={!newSponsor.name || !newSponsor.logoUrl} className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-xs shadow-xl disabled:opacity-50">
                                {editingSponsorId ? 'Save Changes' : 'Save Sponsor'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <button onClick={() => setIsAdding(true)} className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center p-8 hover:bg-white hover:border-indigo-400 hover:text-indigo-600 transition-all text-slate-400 gap-4 min-h-[250px]">
                        <span className="text-5xl font-thin">+</span>
                        <span className="text-xs font-black uppercase tracking-widest">Add Sponsor</span>
                    </button>

                    {organization.sponsors?.map(sponsor => (
                        <div key={sponsor.id} className={`bg-white p-6 rounded-[2.5rem] border shadow-xl flex flex-col transition-all ${sponsor.isActive ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-64 h-64 bg-white border border-slate-100 rounded-[2rem] p-4 flex items-center justify-center">
                                    <img src={sponsor.logoUrl} className="max-w-full max-h-full" />
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${sponsor.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {sponsor.isActive ? 'Active' : 'Paused'}
                                </div>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 mb-1">{sponsor.name}</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">
                                {sponsor.placements.length} Placements
                            </p>

                            <div className="mt-auto flex gap-2 pt-4 border-t border-slate-50">
                                <button onClick={() => toggleSponsorStatus(sponsor.id)} className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-[9px] font-black uppercase hover:bg-slate-100">
                                    {sponsor.isActive ? 'Pause' : 'Activate'}
                                </button>
                                <button onClick={() => startEdit(sponsor)} className="w-8 h-8 flex items-center justify-center bg-indigo-50 text-indigo-400 rounded-lg hover:bg-indigo-100">✏️</button>
                                <button onClick={() => deleteSponsor(sponsor.id)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-400 rounded-lg hover:bg-red-100">🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

