
import React, { useState } from 'react';
import { Organization } from '../../types.ts';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizations: Organization[];
  onApply: (orgId: string) => void;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({ isOpen, onClose, organizations, onApply }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredOrgs = organizations.filter(org => 
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    org.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApply = () => {
    if (selectedOrgId) {
        onApply(selectedOrgId);
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="bg-slate-50 p-8 border-b border-slate-100">
           <h3 className="text-2xl font-black text-slate-900 mb-2">Apply for Access</h3>
           <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Join an Organization as Staff</p>
        </div>

        <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
           <div>
              <input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Organization Name or ID..."
                className="w-full bg-white border border-slate-200 rounded-xl px-5 py-4 font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
              />
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {filteredOrgs.length === 0 ? (
                 <div className="text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-widest">No organizations found</div>
              ) : (
                 filteredOrgs.map(org => (
                    <button 
                       key={org.id} 
                       onClick={() => setSelectedOrgId(org.id)}
                       className={`w-full p-4 rounded-xl border text-left flex items-center gap-4 transition-all ${selectedOrgId === org.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                    >
                       <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black shrink-0 ${selectedOrgId === org.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                          {org.name.charAt(0)}
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className={`font-black text-sm truncate ${selectedOrgId === org.id ? 'text-white' : 'text-slate-900'}`}>{org.name}</div>
                          <div className={`text-[10px] font-bold uppercase tracking-widest ${selectedOrgId === org.id ? 'text-indigo-200' : 'text-slate-400'}`}>{org.memberTeams.length} Teams • {org.country || 'Global'}</div>
                       </div>
                       {selectedOrgId === org.id && <div className="text-white text-xl">✓</div>}
                    </button>
                 ))
              )}
           </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
           <button onClick={onClose} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs hover:text-slate-600 transition-all">Cancel</button>
           <button 
             onClick={handleApply}
             disabled={!selectedOrgId}
             className="flex-1 py-4 bg-emerald-500 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-400 disabled:opacity-50 disabled:shadow-none transition-all"
           >
             Send Application
           </button>
        </div>
      </div>
    </div>
  );
};

