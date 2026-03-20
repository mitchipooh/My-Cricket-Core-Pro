
import React, { useState } from 'react';
import { UserProfile, Organization } from '../../types';
import { generateId } from '../../utils/idGenerator';

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (user: UserProfile, password: string) => Promise<void>; // UPDATED to async
    organizationName: string;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onCreate, organizationName }) => {
    const [formData, setFormData] = useState({
        name: '',
        handle: '@',
        password: '',
        role: 'Player' as UserProfile['role'],
        email: '' // Now REQUIRED
    });

    if (!isOpen) return null;

    const handleSubmit = async () => {
        // Validate required fields including email
        if (!formData.name || !formData.handle || !formData.password || !formData.email) {
            alert("Please fill in all required fields (Name, Handle, Email, Password).");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            alert("Please enter a valid email address.");
            return;
        }

        const newUser: UserProfile = {
            id: generateId('user'), // Temporary ID, will be replaced by Supabase Auth ID
            name: formData.name,
            handle: formData.handle.startsWith('@') ? formData.handle : `@${formData.handle}`,
            role: formData.role,
            email: formData.email, // Now required
            createdAt: Date.now()
        };

        await onCreate(newUser, formData.password);
        onClose();
        setFormData({ name: '', handle: '@', password: '', role: 'Player', email: '' });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900">Create New User</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">For {organizationName}</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center font-bold transition-all">✕</button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Full Name *</label>
                        <input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-indigo-400 transition-colors"
                            placeholder="e.g. John Smith"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">System Handle *</label>
                        <input
                            value={formData.handle}
                            onChange={e => setFormData({ ...formData, handle: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-indigo-400 transition-colors"
                            placeholder="@johnsmith"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Email *</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-indigo-400 transition-colors"
                            placeholder="johnsmith@example.com"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Password *</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-indigo-400 transition-colors"
                            placeholder="Set a password"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Role</label>
                            <select
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-indigo-400 transition-colors"
                            >
                                <option value="Administrator">Administrator</option>
                                <option value="Scorer">Scorer</option>
                                <option value="Captain">Captain</option>
                                <option value="Coach">Coach</option>
                                <option value="Player">Player</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button onClick={onClose} className="flex-1 py-3 text-slate-400 font-black uppercase text-xs hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                    <button onClick={handleSubmit} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs shadow-lg hover:bg-indigo-500 hover:shadow-xl hover:scale-[1.02] transition-all">Create Account</button>
                </div>
            </div>
        </div>
    );
};
