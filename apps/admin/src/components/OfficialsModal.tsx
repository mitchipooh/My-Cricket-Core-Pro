
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types.ts';

interface OfficialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUmpires: string[];
  availableOfficials: UserProfile[];
  onSave: (umpires: string[]) => void;
}

export const OfficialsModal: React.FC<OfficialsModalProps> = ({ 
  isOpen, onClose, currentUmpires, availableOfficials, onSave 
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [guestName, setGuestName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(currentUmpires || []);
    }
  }, [isOpen, currentUmpires]);

  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(uid => uid !== id));
    } else {
      if (selectedIds.length >= 2) {
          // Allow more than 2, but visually maybe warn? Standard is 2 on field + 1 TV.
          // We'll just append.
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleAddGuest = () => {
      if (guestName.trim()) {
          // Create a mock ID for guest string, or handled by parent? 
          // Ideally parent handles ID resolution. For now we assume IDs in list.
          // If availableOfficials doesn't have it, we can't easily add ad-hoc ID without UserProfile.
          // Simplified: We only allow selecting from available. 
          // To support ad-hoc, we'd need a "Guest Umpire" creation flow which is complex for this modal.
          // We will stick to selecting existing profiles.
          alert("To add a new official, please register them in the Organization > Members tab first.");
          setGuestName('');
      }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="bg-slate-900 p-8 border-b border-slate-800">
           <h3 className="text-2xl font-black text-white mb-1">Match Officials</h3>
           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Assign Umpires & Referees</p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-4">
           {availableOfficials.length === 0 && (
               <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">
                   No officials found in this organization.
               </div>
           )}
           
           <div className="grid grid-cols-1 gap-2">
               {availableOfficials.map(official => {
                   const isSelected = selectedIds.includes(official.id);
                   return (
                       <button 
                           key={official.id}
                           onClick={() => handleToggle(official.id)}
                           className={`p-4 rounded-xl border flex items-center justify-between transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                       >
                           <div className="flex items-center gap-3">
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${isSelected ? 'bg-white text-indigo-600' : 'bg-white border border-slate-200'}`}>
                                   {official.name.charAt(0)}
                               </div>
                               <div className="text-left">
                                   <div className="font-bold text-sm">{official.name}</div>
                                   <div className={`text-[10px] uppercase font-bold ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>ID: {official.handle}</div>
                               </div>
                           </div>
                           {isSelected && <span className="text-xl">✓</span>}
                       </button>
                   );
               })}
           </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
           <button onClick={onClose} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs hover:text-slate-600 transition-all">Cancel</button>
           <button 
             onClick={() => { onSave(selectedIds); onClose(); }}
             className="flex-1 py-4 bg-emerald-500 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-400 transition-all"
           >
             Confirm Officials ({selectedIds.length})
           </button>
        </div>
      </div>
    </div>
  );
};

