
import React, { useState, useMemo } from 'react';
import { UserProfile, Team } from '../../types.ts';

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    globalUsers: UserProfile[];
    orgTeams: Team[];
    onAdd: (user: UserProfile, role: string, targetTeamId?: string) => void;
    existingMemberIds: string[];
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
    isOpen, onClose, globalUsers, orgTeams, onAdd, existingMemberIds
}) => {
    const [step, setStep] = useState<'SEARCH' | 'CONFIGURE'>('SEARCH');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState<'NAME' | 'ID'>('NAME'); // NEW
    const [roleFilter, setRoleFilter] = useState<string>('ALL'); // NEW
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>('Scorer');
    const [targetTeamId, setTargetTeamId] = useState<string>('');

    const filteredUsers = useMemo(() => {
        if (!searchQuery && roleFilter === 'ALL') return [];

        return globalUsers.filter(u => {
            if (existingMemberIds.includes(u.id)) return false;

            // Role Filter
            if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;

            // Search Query
            if (!searchQuery) return true; // If only filtering by role

            if (searchType === 'ID') {
                return u.id.toLowerCase().includes(searchQuery.toLowerCase());
            }

            return u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.handle.toLowerCase().includes(searchQuery.toLowerCase());
        }).slice(0, 10);
    }, [globalUsers, searchQuery, existingMemberIds, searchType, roleFilter]);

    if (!isOpen) return null;

    const handleUserSelect = (user: UserProfile) => {
        setSelectedUser(user);
        setStep('CONFIGURE');
        // Default logic: if they look like a player, default to Player role
        if (user.role === 'Player') {
            setSelectedRole('Player');
            if (orgTeams.length > 0) setTargetTeamId(orgTeams[0].id);
        } else if (user.role === 'Umpire') {
            setSelectedRole('Umpire');
        } else if (user.role === 'Scorer') {
            setSelectedRole('Scorer');
        }
    };

    const handleConfirm = () => {
        if (selectedUser) {
            onAdd(selectedUser, selectedRole, targetTeamId);
            onClose();
            // Reset
            setStep('SEARCH');
            setSearchQuery('');
            setSelectedUser(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[80vh]">

                {/* HEADER */}
                <div className="bg-slate-900 p-8 border-b border-slate-800 shrink-0">
                    <h3 className="text-2xl font-black text-white mb-1">Add Member</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                        {step === 'SEARCH' ? 'Search Global Directory' : 'Configure Role & Access'}
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50">
                    {step === 'SEARCH' ? (
                        <div className="space-y-4">
                            {/* Search Controls */}
                            <div className="flex gap-2">
                                <select
                                    value={searchType}
                                    onChange={e => setSearchType(e.target.value as any)}
                                    className="bg-slate-100 border-none rounded-xl px-3 py-4 text-xs font-black uppercase tracking-widest outline-none cursor-pointer hover:bg-slate-200 transition-colors"
                                >
                                    <option value="NAME">Name / Handle</option>
                                    <option value="ID">User ID</option>
                                </select>
                                <select
                                    value={roleFilter}
                                    onChange={e => setRoleFilter(e.target.value)}
                                    className="bg-slate-100 border-none rounded-xl px-3 py-4 text-xs font-black uppercase tracking-widest outline-none cursor-pointer hover:bg-slate-200 transition-colors"
                                >
                                    <option value="ALL">Any Role</option>
                                    <option value="Administrator">Admins</option>
                                    <option value="Captain">Captains</option>
                                    <option value="Scorer">Scorers</option>
                                    <option value="Umpire">Umpires</option>
                                    <option value="Coach">Coaches</option>
                                    <option value="Player">Players</option>
                                </select>
                            </div>

                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder={searchType === 'ID' ? "Enter exact User ID..." : "Search by name or handle..."}
                                className="w-full bg-white border border-slate-200 rounded-xl px-5 py-4 font-bold outline-none focus:border-indigo-500 shadow-sm"
                                autoFocus
                            />
                            <div className="space-y-2">
                                {filteredUsers.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleUserSelect(user)}
                                        className="w-full p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all flex items-center gap-4 text-left group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-900 text-sm">{user.name}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase">{user.handle} • {user.role}</div>
                                        </div>
                                    </button>
                                ))}
                                {searchQuery && filteredUsers.length === 0 && (
                                    <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">No users found</div>
                                )}
                                {!searchQuery && roleFilter === 'ALL' && (
                                    <div className="text-center py-12 opacity-30">
                                        <span className="text-4xl mb-2 block">🔍</span>
                                        <p className="text-xs font-black uppercase">Type to search or select a filter</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xl">
                                    {selectedUser?.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-900">{selectedUser?.name}</h4>
                                    <p className="text-xs text-slate-500 font-bold">{selectedUser?.handle}</p>
                                </div>
                                <button onClick={() => setStep('SEARCH')} className="ml-auto text-xs font-bold text-slate-400 underline hover:text-indigo-600">Change</button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Assign Role</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Administrator', 'Scorer', 'Umpire', 'Coach', 'Player'].map(role => (
                                        <button
                                            key={role}
                                            onClick={() => setSelectedRole(role)}
                                            className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${selectedRole === role
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                                }`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {selectedRole === 'Player' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-1">Assign to Squad (Optional)</label>
                                    <select
                                        value={targetTeamId}
                                        onChange={e => setTargetTeamId(e.target.value)}
                                        className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3 font-bold text-sm text-slate-900 outline-none focus:border-emerald-500"
                                    >
                                        <option value="">-- Add to Org Roster Only --</option>
                                        {orgTeams.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[9px] text-slate-400 px-1">Adding to a squad automatically creates a Player Profile in that team.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-200 bg-white flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs hover:text-slate-600 transition-all">Cancel</button>
                    {step === 'CONFIGURE' && (
                        <button
                            onClick={handleConfirm}
                            className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-500 transition-all"
                        >
                            Confirm Assignment
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

