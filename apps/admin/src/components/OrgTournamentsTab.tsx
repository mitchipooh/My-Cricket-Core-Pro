import React from 'react';
import { Organization, Tournament } from '../../../types';

interface OrgTournamentsTabProps {
    organization: Organization;
    isClub: boolean;
    isOrgAdmin: boolean;
    isActive: boolean;
    onRequestAddTournament: () => void;
    onViewTournament: (tournamentId: string) => void;
    onUpdateTournament?: (orgId: string, tournamentId: string, data: Partial<Tournament>) => void;
    onRemoveTournament?: (orgId: string, tournamentId: string) => void;
    setEditingTournament: (tournament: Tournament) => void;
}

export const OrgTournamentsTab: React.FC<OrgTournamentsTabProps> = ({
    organization, isClub, isOrgAdmin, isActive,
    onRequestAddTournament, onViewTournament, onUpdateTournament, onRemoveTournament, setEditingTournament
}) => {
    if (!isActive) return null;

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">{isClub ? 'Active Leagues' : 'Tournaments'}</h3>
                {isOrgAdmin && (
                    <button
                        onClick={onRequestAddTournament}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-500 shadow-lg transition-all"
                    >
                        + Create {isClub ? 'League' : 'Tournament'}
                    </button>
                )}
            </div>

            {organization.tournaments.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-[2rem] gap-4 flex flex-col items-center justify-center">
                    <span className="text-4xl opacity-50">🏆</span>
                    <div className="text-slate-400 font-bold uppercase text-xs">
                        No {isClub ? 'leagues' : 'tournaments'} found.
                    </div>
                    {isOrgAdmin && (
                        <button onClick={onRequestAddTournament} className="text-indigo-600 font-black text-xs underline">
                            Create First {isClub ? 'League' : 'Tournament'}
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {organization.tournaments.map(t => (
                        <div
                            key={t.id}
                            onClick={() => onViewTournament(t.id)}
                            className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm cursor-pointer hover:border-indigo-300 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl text-slate-900 group-hover:opacity-20 transition-opacity">
                                {t.format}
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-xl font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{t.name}</h3>
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex gap-2">
                                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${t.status === 'Ongoing' ? 'bg-emerald-100 text-emerald-700' :
                                            t.status === 'Completed' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {t.status}
                                        </span>
                                    </div>
                                    {(t.startDate || t.endDate) && (
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            <span>📅</span>
                                            <span>
                                                {t.startDate ? new Date(t.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '...'}
                                                {t.endDate ? ` — ${new Date(t.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isOrgAdmin && onUpdateTournament && (
                                <div className="absolute top-4 right-4 flex gap-2 z-20">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingTournament(t);
                                        }}
                                        className="w-8 h-8 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                        title="Edit Tournament"
                                    >
                                        ✏️
                                    </button>
                                    {onRemoveTournament && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`Delete "${t.name}"? This action cannot be undone.`)) {
                                                    onRemoveTournament(organization.id, t.id);
                                                }
                                            }}
                                            className="w-8 h-8 rounded-full bg-red-100/80 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                            title="Delete Tournament"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
