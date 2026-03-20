
import React from 'react';
import { Organization } from '../../types.ts';

interface DeleteOrgModalProps {
  organization: Organization;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteOrgModal: React.FC<DeleteOrgModalProps> = ({ organization, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">⚠️</div>
          <h3 className="text-2xl font-black text-slate-900 text-center mb-4">Delete Organization?</h3>
          <p className="text-slate-400 text-sm text-center mb-10 font-medium">This will permanently remove <span className="text-slate-900 font-black">{organization.name}</span> and all its associated teams, matches, and data. This action cannot be undone.</p>
          <div className="flex flex-col gap-3">
            <button onClick={onConfirm} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Yes, Delete Everything</button>
            <button onClick={onCancel} className="w-full py-4 text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-slate-50 rounded-2xl">Cancel Action</button>
          </div>
      </div>
    </div>
  );
};

