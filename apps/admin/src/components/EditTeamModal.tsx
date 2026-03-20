
import React, { useState } from 'react';
import { Team } from '../../types.ts';

interface EditTeamModalProps {
    team: Team;
    onSave: (updates: Partial<Team>) => void;
    onClose: () => void;
    onDelete: () => void;
}

export const EditTeamModal: React.FC<EditTeamModalProps> = ({
    team, onSave, onClose, onDelete
}) => {
    const [formData, setFormData] = useState({
        name: team.name,
        location: team.location || '',
        logoUrl: team.logoUrl || ''
    });
    const [uploading, setUploading] = useState(false);

    const handleSave = () => {
        onSave(formData);
        onClose();
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
                    const MAX_SIZE = 400;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    ctx?.drawImage(img, 0, 0, width, height);

                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    setFormData(prev => ({ ...prev, logoUrl: dataUrl }));
                    setUploading(false);
                };
                img.src = readerEvent.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Edit Team</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xl">✕</button>
                </div>

                <div className="space-y-6">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-24 h-24 bg-slate-100 rounded-3xl overflow-hidden mb-4 border-2 border-slate-100 relative group">
                            {formData.logoUrl ? (
                                <img src={formData.logoUrl} className="w-full h-full object-cover" alt="Team Logo" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300 text-3xl font-black">
                                    {formData.name.charAt(0)}
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-[10px] font-black uppercase">{uploading ? '...' : 'Upload'}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Team Name</label>
                        <input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-slate-50 border-none p-4 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-indigo-500"
                            placeholder="Team Name"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Location / Home Ground</label>
                        <input
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                            className="w-full bg-slate-50 border-none p-4 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-indigo-500"
                            placeholder="City or Stadium Name"
                        />
                    </div>

                    <div className="pt-6 flex flex-col gap-3">
                        <button
                            onClick={handleSave}
                            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
                        >
                            <span>Save Changes</span>
                        </button>
                        <button
                            onClick={() => {
                                if (confirm(`Delete ${team.name}? This will remove it from the organization and all tournaments.`)) {
                                    onDelete();
                                    onClose();
                                }
                            }}
                            className="w-full py-4 text-red-500 font-black uppercase text-[10px] tracking-widest hover:bg-red-50 hover:rounded-2xl transition-all"
                        >
                            Remove Team
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
