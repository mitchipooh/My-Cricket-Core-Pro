import React, { useState } from 'react';
import { Organization, OrgMember } from '../../../types';

interface AccessControlPanelProps {
    organization: Organization;
    onUpdateOrg?: (id: string, data: Partial<Organization>) => void;
    isParentAdmin?: boolean;
    isMainAdmin?: boolean;
    isOrgAdmin?: boolean;
}

export const AccessControlPanel: React.FC<AccessControlPanelProps> = ({ organization, onUpdateOrg, isParentAdmin, isMainAdmin, isOrgAdmin }) => {
    const [subTab, setSubTab] = useState<'ALL' | 'ADMINS' | 'CAPTAINS' | 'SCORERS' | 'UMPIRES' | 'COACHES'>('ALL');
    const [search, setSearch] = useState('');
    const [editingMember, setEditingMember] = useState<OrgMember | null>(null);

    // Helpers
    const filterRole = (role: OrgMember['role'] | 'ALL_ROLES') => {
        return organization.members.filter(m => (role === 'ALL_ROLES' || m.role === role) &&
            (m.name.toLowerCase().includes(search.toLowerCase()) || m.handle.toLowerCase().includes(search.toLowerCase()))
        );
    };

    const toggleLockdown = () => {
        if (onUpdateOrg) {
            onUpdateOrg(organization.id, { allowMemberEditing: !organization.allowMemberEditing });
        }
    };

    const getMembers = () => {
        switch (subTab) {
            case 'ADMINS': return filterRole('Administrator');
            case 'CAPTAINS': return organization.members.filter(m => m.role === 'Captain' || (m.role === 'Player' && m.permissions?.canSubmitReport)).filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
            case 'SCORERS': return filterRole('Scorer');
            case 'UMPIRES': return filterRole('Umpire');
            case 'COACHES': return filterRole('Coach');
            default: return organization.members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
        }
    };

    const handleAutoGenerate = (role: 'Captain' | 'Scorer' | 'Coach') => {
        if (!onUpdateOrg) return;

        const roleName = role;
        const existingRoleMembers = organization.members.filter(m => m.role === role);
        // Find teams that don't have a member with this role linked via managedTeamId
        const teamsWithoutRole = organization.memberTeams.filter(team =>
            !existingRoleMembers.some(c => c.managedTeamId === team.id)
        );

        if (teamsWithoutRole.length === 0) {
            alert(`All teams already have a designated ${roleName}.`);
            return;
        }

        if (!confirm(`Generate ${teamsWithoutRole.length} ${roleName} accounts (one for each missing team)?`)) {
            return;
        }

        const newMembers: OrgMember[] = teamsWithoutRole.map(team => ({
            userId: `${role.toLowerCase().substring(0, 3)}-${team.id}-${Date.now()}`,
            name: `${team.name} ${role}`,
            handle: `@${team.name.replace(/\s+/g, '').toLowerCase()}_${role.toLowerCase().substring(0, 3)}`,
            role: role,
            addedAt: Date.now(),
            managedTeamId: team.id,
            permissions: role === 'Captain' ? { canSubmitReport: true, canViewReports: true } :
                role === 'Scorer' ? { canScoreMatch: true, canEditScorecard: true } :
                    role === 'Coach' ? { canEditSquad: true, canViewReports: true } : {}
        }));

        onUpdateOrg(organization.id, {
            members: [...organization.members, ...newMembers]
        });
        alert(`Generated ${newMembers.length} ${roleName} accounts.`);
    };

    const togglePermission = (perm: string) => {
        if (!editingMember || !onUpdateOrg) return;

        const currentPerms = editingMember.permissions || {};
        const newPerms = { ...currentPerms, [perm]: !currentPerms[perm] };

        const updatedMembers = organization.members.map(m => m.userId === editingMember.userId ? { ...m, permissions: newPerms } : m);
        onUpdateOrg(organization.id, { members: updatedMembers });
        setEditingMember({ ...editingMember, permissions: newPerms });
    };

    const filteredMembers = getMembers();

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header & Search */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-900">Access Control Center</h3>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Manage Privileges & Permissions</p>
                    </div>
                    <div className="w-full md:w-auto flex gap-2">
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Find user..."
                            className="bg-slate-50 px-5 py-3 rounded-xl border-none outline-none font-bold text-sm w-full md:w-64 focus:ring-2 focus:ring-indigo-100 transition-all"
                        />
                        {/* New Bulk Import Feature */}
                        <div className="flex gap-2">
                            <button className="bg-slate-900 text-white px-4 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-700 whitespace-nowrap shadow-lg">
                                + Bulk Add
                            </button>
                            {onUpdateOrg && subTab === 'CAPTAINS' && (
                                <button
                                    onClick={() => handleAutoGenerate('Captain')}
                                    className="bg-indigo-600 text-white px-4 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-500 whitespace-nowrap shadow-lg flex items-center gap-2"
                                    title="Generate a unique login for every team that lacks a captain"
                                >
                                    ⚡ Auto Captains
                                </button>
                            )}
                            {onUpdateOrg && subTab === 'SCORERS' && (
                                <button
                                    onClick={() => handleAutoGenerate('Scorer')}
                                    className="bg-teal-600 text-white px-4 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-teal-500 whitespace-nowrap shadow-lg flex items-center gap-2"
                                    title="Generate a unique scorer login for every team"
                                >
                                    ⚡ Auto Scorers
                                </button>
                            )}
                            {onUpdateOrg && subTab === 'COACHES' && (
                                <button
                                    onClick={() => handleAutoGenerate('Coach')}
                                    className="bg-amber-600 text-white px-4 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-amber-500 whitespace-nowrap shadow-lg flex items-center gap-2"
                                    title="Generate a unique coach login for every team"
                                >
                                    ⚡ Auto Coaches
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sub Tabs */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {['ALL', 'ADMINS', 'CAPTAINS', 'SCORERS', 'UMPIRES', 'COACHES'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => { setSubTab(tab as any); setEditingMember(null); }}
                            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${subTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List View */}
                <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredMembers.map(member => (
                        <div
                            key={member.userId}
                            onClick={() => setEditingMember(member)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${editingMember?.userId === member.userId ? 'bg-indigo-50 border-indigo-200 shadow-md' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-xs ${member.role === 'Administrator' ? 'bg-purple-500' :
                                    member.role === 'Scorer' ? 'bg-teal-500' :
                                        'bg-slate-400'
                                    }`}>
                                    {member.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">{member.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{member.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredMembers.length === 0 && (
                        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-xs uppercase">No users found.</div>
                    )}
                </div>

                {/* Editor View */}
                <div className="lg:col-span-2">
                    {editingMember ? (
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl sticky top-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-black">
                                    {editingMember.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900">{editingMember.name}</h2>
                                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">{editingMember.role} • {editingMember.handle}</p>
                                    {/* Mock Password Display */}
                                    <div className="flex gap-2 mt-1">
                                        {editingMember.role === 'Administrator' && <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Default PW: admin</span>}
                                        {editingMember.role === 'Coach' && <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Default PW: coach</span>}
                                        {editingMember.role === 'Scorer' && <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Default PW: scorer</span>}
                                        {editingMember.role === 'Umpire' && <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Default PW: umpire</span>}
                                        {(editingMember.role === 'Captain' || (editingMember.role === 'Player' && editingMember.permissions?.canSubmitReport)) && (
                                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Default PW: Captain</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 mb-6">Permissions</h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {['canEditOrg', 'canManageMembers', 'canEditSquad', 'canSubmitReport', 'canViewReports', 'view_protests', 'canScoreMatch', 'canEditScorecard', 'canOfficiate'].map(perm => (
                                    <div key={perm} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div>
                                            <p className="font-bold text-slate-700 text-sm">{perm.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</p>
                                            <p className="text-[10px] text-slate-400">Allow user to {perm.replace('can', '').toLowerCase()}...</p>
                                        </div>
                                        <button
                                            onClick={() => togglePermission(perm)}
                                            className={`w-12 h-6 rounded-full p-1 transition-all ${editingMember.permissions?.[perm] ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all ${editingMember.permissions?.[perm] ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* TEAM ASSIGNMENT (For Captains Hub Migration) */}
                            {onUpdateOrg && (isMainAdmin || isOrgAdmin) && (
                                <div className="mt-8 pt-8 border-t border-slate-100">
                                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Managed Team Assignment</h4>
                                    <p className="text-xs text-slate-500 mb-4 font-medium">Link this user to a specific team to enable their Captains Hub / Team Admin view.</p>

                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <div className="flex gap-2 mb-2">
                                            <select
                                                className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500"
                                                value={editingMember.managedTeamId || ''}
                                                onChange={(e) => {
                                                    const newTeamId = e.target.value;
                                                    // Update the member's managedTeamId locally to reflect change immediately in UI if possible, 
                                                    // but mainly call onUpdateOrg to persist.
                                                    const updatedMembers = organization.members.map(m =>
                                                        m.userId === editingMember.userId ? { ...m, managedTeamId: newTeamId || undefined } : m
                                                    );
                                                    onUpdateOrg(organization.id, { members: updatedMembers } as any);
                                                    // Update local editing state to show selection
                                                    setEditingMember({ ...editingMember, managedTeamId: newTeamId || undefined });
                                                }}
                                            >
                                                <option value="">-- No Team Assigned --</option>
                                                {organization.memberTeams.map(team => (
                                                    <option key={team.id} value={team.id}>{team.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {editingMember.managedTeamId && (
                                            <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold">
                                                <span>✓ Linked to {organization.memberTeams.find(t => t.id === editingMember.managedTeamId)?.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {isParentAdmin && (
                                <div className="mt-8 pt-8 border-t border-slate-100">
                                    <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-black text-red-900 uppercase tracking-widest mb-1">Organization Lockdown</h4>
                                                <p className="text-xs text-red-700 font-medium">Prevent further member edits by Club Admins.</p>
                                            </div>
                                            <button
                                                onClick={toggleLockdown}
                                                className={`px-6 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all ${!organization.allowMemberEditing ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-red-500 border border-red-200'}`}
                                            >
                                                {!organization.allowMemberEditing ? 'Locked 🔒' : 'Lock Now 🔓'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="h-full bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex items-center justify-center p-12 text-center text-slate-400">
                            <div>
                                <p className="text-4xl mb-4">👆</p>
                                <p className="font-bold uppercase text-xs tracking-widest">Select a member to edit permissions</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
