
import React, { useState, useMemo } from 'react';
import { Organization, OrgMember, OrgApplication } from '../../types.ts';
import { UserProfileModal } from './UserProfileModal.tsx';

interface EditOrgModalProps {
    organization: Organization;
    onSave: (id: string, data: Partial<Organization>) => void;
    onClose: () => void;
    currentUserProfile?: any; // Add this
}

type ModalTab = 'DETAILS' | 'ACCESS';

export const EditOrgModal: React.FC<EditOrgModalProps> = ({ organization, onSave, onClose, currentUserProfile }) => {
    const [activeTab, setActiveTab] = useState<ModalTab>('DETAILS');
    const [viewingMember, setViewingMember] = useState<OrgMember | null>(null);
    const [uploading, setUploading] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        name: organization.name,
        description: organization.description || '',
        country: organization.country || '',
        location: organization.groundLocation || '',
        logoUrl: organization.logoUrl || '',
        isPublic: organization.isPublic !== undefined ? organization.isPublic : true,
        allowUserContent: organization.allowUserContent !== undefined ? organization.allowUserContent : true,
        allowMemberEditing: organization.allowMemberEditing !== undefined ? organization.allowMemberEditing : true,
        pushToGlobalFeed: organization.pushToGlobalFeed !== undefined ? organization.pushToGlobalFeed : true,
        managerName: organization.managerName || '',
        ownerName: organization.ownerName || '',
        establishedYear: organization.establishedYear || '',
        sponsors: organization.sponsors ? organization.sponsors.map(s => s.logoUrl || '') : [] as string[]
    });

    const handleSaveDetails = () => {
        onSave(organization.id, {
            name: formData.name,
            description: formData.description,
            country: formData.country,
            groundLocation: formData.location,
            logoUrl: formData.logoUrl,
            isPublic: formData.isPublic,
            allowUserContent: formData.allowUserContent,
            allowMemberEditing: formData.allowMemberEditing,
            pushToGlobalFeed: formData.pushToGlobalFeed,
            managerName: formData.managerName,
            ownerName: formData.ownerName,
            establishedYear: formData.establishedYear ? Number(formData.establishedYear) : undefined,
            sponsors: formData.sponsors.filter(s => s.trim() !== '').map((url, index) => ({
                id: `sponsor-${Date.now()}-${index}`,
                name: `Sponsor ${index + 1}`,
                logoUrl: url,
                isActive: true,
                placements: ['SCOREBOARD_BOTTOM']
            }))
        });
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

                    // Resize logic: Max 800px width/height to save DB space
                    const MAX_SIZE = 800;
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

                    // Compress to JPEG 0.7 quality
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    setFormData(prev => ({ ...prev, logoUrl: dataUrl }));
                    setUploading(false);
                };
                img.src = readerEvent.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRevoke = (member: OrgMember) => {
        // 1. Remove from members
        const updatedMembers = organization.members.filter(m => m.userId !== member.userId);

        // 2. Update or Create Application with REJECTED status
        let updatedApplications = [...(organization.applications || [])];
        const existingAppIndex = updatedApplications.findIndex(a => a.applicantId === member.userId);

        if (existingAppIndex >= 0) {
            updatedApplications[existingAppIndex] = { ...updatedApplications[existingAppIndex], status: 'REJECTED' };
        } else {
            // Create synthetic application record so they appear in rejected list
            const newApp: OrgApplication = {
                id: `app-revoke-${Date.now()}`,
                type: 'USER_JOIN',
                applicantId: member.userId,
                applicantName: member.name,
                applicantHandle: member.handle,
                status: 'REJECTED',
                timestamp: Date.now()
            };
            updatedApplications.push(newApp);
        }

        onSave(organization.id, {
            members: updatedMembers,
            applications: updatedApplications
        });
    };

    const handleRestore = (app: OrgApplication) => {
        // 1. Update Application status
        const updatedApplications = (organization.applications || []).map(a =>
            a.id === app.id ? { ...a, status: 'APPROVED' as const } : a
        );

        // 2. Add to Members (Default to Scorer)
        // Check if already member to prevent duplicates (edge case)
        let updatedMembers = [...organization.members];
        if (!updatedMembers.some(m => m.userId === app.applicantId)) {
            updatedMembers.push({
                userId: app.applicantId,
                name: app.applicantName,
                handle: app.applicantHandle || '',
                role: 'Scorer',
                addedAt: Date.now()
            });
        }

        onSave(organization.id, {
            members: updatedMembers,
            applications: updatedApplications
        });
    };

    const admins = useMemo(() => organization.members.filter(m => m.role === 'Administrator'), [organization.members]);
    const scorers = useMemo(() => organization.members.filter(m => m.role === 'Scorer'), [organization.members]);
    const rejectedApps = useMemo(() => (organization.applications || []).filter(a => a.status === 'REJECTED'), [organization.applications]);

    const renderMemberRow = (member: OrgMember) => (
        <div key={member.userId} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm group hover:border-indigo-300 transition-all">
            <div
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={() => setViewingMember(member)}
            >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white shadow-sm ${member.role === 'Administrator' ? 'bg-purple-600' : 'bg-teal-500'}`}>
                    {member.name.charAt(0)}
                </div>
                <div>
                    <div className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">{member.name}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">{member.handle}</div>
                </div>
            </div>

            <button
                onClick={() => handleRevoke(member)}
                className="px-4 py-2 border border-red-100 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
            >
                Revoke
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
            <UserProfileModal member={viewingMember} isOpen={!!viewingMember} onClose={() => setViewingMember(null)} />

            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[85vh]">
                <div className="bg-slate-900 p-8 border-b border-slate-800 shrink-0">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-2xl font-black text-white mb-2">Organization Settings</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Manage Entity & Access</p>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-700 transition-all">✕</button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('DETAILS')}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'DETAILS' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                        >
                            Details
                        </button>
                        <button
                            onClick={() => setActiveTab('ACCESS')}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ACCESS' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                        >
                            Access Control
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 p-8">
                    {activeTab === 'DETAILS' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-6 mb-6">
                                <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative group">
                                    {uploading ? (
                                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                    ) : formData.logoUrl ? (
                                        <img src={formData.logoUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl text-slate-300 font-black">{formData.name.charAt(0)}</span>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <span className="text-white text-[9px] font-bold uppercase">{uploading ? 'Processing' : 'Change'}</span>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Organization Logo</h4>
                                    <p className="text-xs text-slate-500 mt-1">Tap image to upload. Auto-resized.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Organization Name</label>
                                <input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-5 py-4 font-bold outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Region / Country</label>
                                    <input
                                        value={formData.country}
                                        onChange={e => setFormData({ ...formData, country: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-4 font-bold outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Main Venue</label>
                                    <input
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-4 font-bold outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-5 py-4 font-bold outline-none focus:border-indigo-500 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Manager Name</label>
                                    <input
                                        value={formData.managerName}
                                        onChange={e => setFormData({ ...formData, managerName: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-4 font-bold outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Owner Name</label>
                                    <input
                                        value={formData.ownerName}
                                        onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-4 font-bold outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Established Year</label>
                                    <input
                                        type="number"
                                        value={formData.establishedYear}
                                        onChange={e => setFormData({ ...formData, establishedYear: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-4 font-bold outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* SPONSORS SECTION */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Sponsors (Max 5)</label>
                                <div className="space-y-2">
                                    {formData.sponsors.map((url, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input
                                                value={url}
                                                onChange={e => {
                                                    const newSponsors = [...formData.sponsors];
                                                    newSponsors[i] = e.target.value;
                                                    setFormData({ ...formData, sponsors: newSponsors });
                                                }}
                                                placeholder="Enter Sponsor Logo URL"
                                                className="flex-1 bg-white border border-slate-200 rounded-xl px-5 py-3 font-bold text-sm outline-none focus:border-indigo-500"
                                            />
                                            {url && <img src={url} className="w-10 h-10 object-contain rounded bg-slate-100 border border-slate-200" />}
                                            <button
                                                onClick={() => {
                                                    const newSponsors = formData.sponsors.filter((_, idx) => idx !== i);
                                                    setFormData({ ...formData, sponsors: newSponsors });
                                                }}
                                                className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center font-bold"
                                            >✕</button>
                                        </div>
                                    ))}
                                    {formData.sponsors.length < 5 && (
                                        <button
                                            onClick={() => setFormData({ ...formData, sponsors: [...formData.sponsors, ''] })}
                                            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                                        >
                                            + Add Sponsor Logo
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Visibility Toggle */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">Public Visibility</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Show in Global Feed</div>
                                    </div>
                                    <div
                                        onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
                                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${formData.isPublic ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${formData.isPublic ? 'left-7' : 'left-1'}`}></div>
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">Allow User Posts</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enable Public Feed</div>
                                    </div>
                                    <div
                                        onClick={() => setFormData({ ...formData, allowUserContent: !formData.allowUserContent })}
                                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${formData.allowUserContent ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${formData.allowUserContent ? 'left-7' : 'left-1'}`}></div>
                                    </div>
                                </div>

                                    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-slate-900 text-sm">Push Matches to Global Feed</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Show Matches to All Users</div>
                                        </div>
                                        <div
                                            onClick={() => setFormData({ ...formData, pushToGlobalFeed: !formData.pushToGlobalFeed })}
                                            className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors shrink-0 ${formData.pushToGlobalFeed ? 'bg-blue-600' : 'bg-slate-300'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${formData.pushToGlobalFeed ? 'left-7' : 'left-1'}`}></div>
                                        </div>
                                    </div>
                                    {currentUserProfile?.handle === '@cz_admin' && (
                                        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between col-span-1 md:col-span-2">
                                            <div>
                                                <div className="font-bold text-slate-900 text-sm">Council-wide Editing</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-indigo-600">Master Switch: Allow Member/Team Admins to Edit</div>
                                            </div>
                                            <div
                                                onClick={() => setFormData({ ...formData, allowMemberEditing: !formData.allowMemberEditing })}
                                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${formData.allowMemberEditing ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${formData.allowMemberEditing ? 'left-7' : 'left-1'}`}></div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button onClick={handleSaveDetails} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-slate-800 transition-all mt-4">Save Changes</button>
                            </div>
                    )}

                            {/* Access Tab Content Remains Identical to previous implementation */}
                            {activeTab === 'ACCESS' && (
                                <div className="space-y-8">
                                    <div>
                                        <h4 className="text-xs font-black text-purple-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-purple-600 rounded-full"></span> Administrators
                                        </h4>
                                        <div className="space-y-3">
                                            {admins.length > 0 ? admins.map(renderMemberRow) : <div className="text-slate-400 text-xs italic pl-4">No administrators defined.</div>}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-teal-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-teal-600 rounded-full"></span> Scorers
                                        </h4>
                                        <div className="space-y-3">
                                            {scorers.length > 0 ? scorers.map(renderMemberRow) : <div className="text-slate-400 text-xs italic pl-4">No scorers assigned.</div>}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-red-500 rounded-full"></span> Restricted / Rejected
                                        </h4>
                                        {rejectedApps.length === 0 ? (
                                            <div className="p-6 bg-slate-100 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400 text-xs font-bold uppercase">
                                                No rejected applicants
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {rejectedApps.map(app => (
                                                    <div key={app.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm opacity-75 hover:opacity-100 transition-opacity">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400">
                                                                {app.applicantName.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-sm text-slate-900">{app.applicantName}</div>
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase">{new Date(app.timestamp).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRestore(app)}
                                                            className="px-4 py-2 border border-emerald-100 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all"
                                                        >
                                                            Restore
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
            </div>
            </div>
            );
};

