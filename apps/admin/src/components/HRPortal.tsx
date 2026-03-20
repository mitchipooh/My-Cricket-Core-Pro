
import React from 'react';
import { UserProfile } from '../../types.ts';

interface HRPortalProps {
  scorers: UserProfile[];
}

export const HRPortal: React.FC<HRPortalProps> = ({ scorers }) => {
  return (
    <div className="space-y-8 animate-in fade-in">
        <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-3xl font-black mb-2">HR & Talent Acquisition</h2>
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Find qualified scorers for your league</p>
            </div>
            <div className="absolute top-0 right-0 p-8 text-8xl opacity-10">👔</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scorers.map(scorer => (
                <div key={scorer.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col hover:border-indigo-300 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                                {scorer.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-black text-lg text-slate-900 leading-tight">{scorer.name}</h3>
                                <p className="text-xs font-bold text-slate-400">{scorer.handle}</p>
                            </div>
                        </div>
                        <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                            Available
                        </div>
                    </div>

                    <div className="flex-1 space-y-4 mb-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rate</div>
                                <div className="text-xl font-black text-slate-900">${scorer.scorerDetails?.hourlyRate || 'Neg'}/hr</div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Exp</div>
                                <div className="text-xl font-black text-slate-900">{scorer.scorerDetails?.experienceYears || 0} Yrs</div>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed italic">
                            "{scorer.scorerDetails?.bio || 'No bio provided.'}"
                        </p>
                    </div>

                    <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-600 transition-all shadow-lg">
                        Contact / Hire
                    </button>
                </div>
            ))}
            
            {scorers.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                    No scorers currently available for hire.
                </div>
            )}
        </div>
    </div>
  );
};

