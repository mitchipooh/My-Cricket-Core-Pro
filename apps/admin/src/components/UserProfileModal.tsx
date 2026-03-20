
import React, { useMemo } from 'react';
import { OrgMember, Organization } from '../../types.ts';

interface UserProfileModalProps {
    member: OrgMember | null;
    isOpen: boolean;
    onClose: () => void;
    allOrganizations?: Organization[];
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ member, isOpen, onClose, allOrganizations = [] }) => {

    const officiatingStats = useMemo(() => {
        if (!member || (member.role !== 'Umpire' && member.role !== 'Match Official')) return null;

        const stats = { totalGames: 0, orgs: [] as { name: string, count: number }[] };

        allOrganizations.forEach(org => {
            const count = org.fixtures.filter(f => f.umpires?.includes(member.userId)).length;
            if (count > 0) {
                stats.totalGames += count;
                stats.orgs.push({ name: org.name, count });
            }
        });
        return stats;
    }, [member, allOrganizations]);

    const createdOrgs = useMemo(() => {
        if (!member || !allOrganizations) return [];
        return allOrganizations.filter(o => o.createdBy === member.userId);
    }, [member, allOrganizations]);

    if (!isOpen || !member) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[400] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-slate-200">
                <div className="h-32 bg-slate-900 relative overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br opacity-80 ${member.role === 'Administrator' ? 'from-purple-600 to-indigo-900' : member.role === 'Umpire' ? 'from-yellow-600 to-amber-900' : 'from-teal-500 to-emerald-800'}`}></div>
                    <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-black/20 text-white rounded-full flex items-center justify-center hover:bg-black/40 transition-all backdrop-blur-md z-10">✕</button>
                    <div className="absolute -bottom-10 -right-10 text-9xl opacity-10 text-white rotate-12">👤</div>
                </div>
                <div className="px-8 pb-8 -mt-12 relative max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="w-24 h-24 bg-white p-1.5 rounded-3xl shadow-xl mb-4">
                        <div className={`w-full h-full rounded-2xl flex items-center justify-center text-4xl font-black text-white shadow-inner ${member.role === 'Administrator' ? 'bg-purple-600' : member.role === 'Umpire' ? 'bg-amber-500' : 'bg-teal-500'}`}>
                            {member.name.charAt(0)}
                        </div>
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 leading-tight">{member.name}</h2>
                    <p className="text-sm font-bold text-slate-400 mb-8">{member.handle}</p>

                    <div className="space-y-3">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${member.role === 'Administrator' ? 'bg-purple-100 text-purple-600' : 'bg-teal-100 text-teal-600'}`}>
                                {member.role}
                            </span>
                        </div>

                        {createdOrgs.length > 0 && (
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Created Clubs</span>
                                    <span className="text-xl font-black text-indigo-600">{createdOrgs.length}</span>
                                </div>
                                <div className="pt-3 border-t border-slate-200/50 space-y-2">
                                    {createdOrgs.map((org, i) => (
                                        <div key={i} className="flex items-center justify-between text-[10px]">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 bg-white rounded border border-slate-200 flex items-center justify-center font-black text-[8px] text-slate-400">
                                                    {org.logoUrl ? <img src={org.logoUrl} className="w-full h-full object-cover rounded" /> : org.name.charAt(0)}
                                                </div>
                                                <span className="font-bold text-slate-700">{org.name}</span>
                                            </div>
                                            <span className="font-bold text-slate-400 uppercase tracking-widest">{org.type === 'CLUB' ? 'Club' : 'League'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {officiatingStats && (
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Games Officiated</span>
                                    <span className="text-xl font-black text-amber-600">{officiatingStats.totalGames}</span>
                                </div>
                                {officiatingStats.orgs.length > 0 && (
                                    <div className="pt-3 border-t border-slate-200/50 space-y-1">
                                        {officiatingStats.orgs.map((org, i) => (
                                            <div key={i} className="flex justify-between text-[10px]">
                                                <span className="font-bold text-slate-600">{org.name}</span>
                                                <span className="font-black text-slate-900">{org.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Member Since</span>
                            <span className="text-xs font-bold text-slate-900">
                                {new Date(member.addedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</span>
                            <span className="text-[10px] font-mono text-slate-500 truncate max-w-[100px]">
                                {member.userId}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

