
import React, { useState } from 'react';
import { UserProfile, Organization } from '../../types.ts';

interface CreateOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: Partial<Organization>) => void;
  userRole: UserProfile['role'];
}

export const CreateOrgModal: React.FC<CreateOrgModalProps> = ({ isOpen, onClose, onCreate, userRole }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'CLUB' | 'GOVERNING_BODY' | 'UMPIRE_ASSOCIATION' | 'COACHES_ASSOCIATION'>('CLUB');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (name) {
      onCreate({
        name,
        type,
        groundLocation: location,
        country
      });
      onClose();
    }
  };

  const isGlobalAdmin = userRole === 'Administrator';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 overflow-hidden flex flex-col">
        <div className="bg-slate-900 p-8 text-white">
          <h3 className="text-xl font-black mb-1">Establish New Entity</h3>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Create a Club or Organization</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Entity Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Royal Strikers CC"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 outline-none focus:border-indigo-500"
              >
                <option value="CLUB">Cricket Club</option>
                <option value="UMPIRE_ASSOCIATION">Umpire Association</option>
                <option value="COACHES_ASSOCIATION">Coaches Association</option>
                {isGlobalAdmin && <option value="GOVERNING_BODY">Governing Body</option>}
              </select>
              {!isGlobalAdmin && <p className="text-[9px] text-slate-400 px-1">Governing Bodies restricted to Admins.</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Country</label>
              <input
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder="e.g. Australia"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Home Ground / City</label>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Melbourne"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button onClick={onClose} className="flex-1 py-3 text-slate-400 font-black uppercase text-xs hover:text-slate-600 transition-all">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={!name}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-500 disabled:opacity-50 transition-all"
            >
              Create {type === 'CLUB' ? 'Club' : 'Org'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

