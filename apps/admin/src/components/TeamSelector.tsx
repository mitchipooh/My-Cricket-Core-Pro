import React from 'react';
import { Team } from '../../types';

interface TeamSelectorProps {
    teams: Team[];
    onSelect: (teamId: string) => void;
    onBack?: () => void;
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({ teams, onSelect, onBack }) => {
    return (
        <div className="max-w-4xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-[2rem] mb-6 text-4xl shadow-inner">
                    👨‍✈️
                </div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-3">
                    Captain's Hub
                </h2>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">
                    Select a team to manage
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teams.map(team => (
                    <button
                        key={team.id}
                        onClick={() => onSelect(team.id)}
                        className="group relative bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:border-indigo-500 hover:-translate-y-1 transition-all text-left overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-10 font-black text-9xl text-indigo-900 group-hover:scale-110 transition-transform duration-500">
                            {team.name.charAt(0)}
                        </div>

                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl font-black mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                                {team.logoUrl ? (
                                    <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover rounded-2xl" />
                                ) : (
                                    team.name.charAt(0)
                                )}
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">
                                {team.name}
                            </h3>

                            <div className="flex items-center gap-4 mt-4">
                                <div className="px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    {team.players.length} Players
                                </div>
                                <div className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                                    Manage
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {onBack && (
                <div className="mt-12 text-center">
                    <button
                        onClick={onBack}
                        className="text-slate-400 hover:text-slate-600 font-bold uppercase text-[10px] tracking-widest transition-colors"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            )}
        </div>
    );
};
