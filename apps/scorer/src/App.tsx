import React, { useState } from 'react';
import { Scorer } from '@shared/components/scoring/Scorer';
import { MatchSetup } from '@shared/components/setup/MatchSetup';
import { DataProvider, useData } from '@shared/contexts/DataProvider';
import { MatchFixture, MatchState } from '@shared/types';
import './index.css';

import { ProTools } from '@shared/components/ProTools';
import { AuthGuard } from '@shared/components/auth/AuthGuard';
import { useAuth } from '@shared/hooks/useAuth';

const ScorerAppContent: React.FC = () => {
    const { 
        profile, 
        allTeams, 
        orgs, 
        standaloneMatches, 
        setOrgs, 
        setStandaloneMatches,
        updateProfile
    } = useData();

    const { user, signOut } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);
    
    const [activeMatch, setActiveMatch] = useState<MatchFixture | null>(null);
    const [showSetup, setShowSetup] = useState(false);
    const [view, setView] = useState<'matches' | 'pro'>('matches');

    const handleMatchReady = (match: MatchFixture) => {
        setStandaloneMatches([...standaloneMatches, match]);
        setActiveMatch(match);
        setShowSetup(false);
    };

    const handleUpdateMatchState = (matchId: string, newState: MatchState) => {
        setStandaloneMatches(standaloneMatches.map(m => 
            m.id === matchId ? { ...m, status: newState.isCompleted ? 'Completed' : 'Live' } : m
        ));
    };

    if (activeMatch) {
        return (
            <Scorer 
                match={activeMatch}
                teams={allTeams}
                userRole={profile?.role || 'Guest'}
                organizations={orgs}
                onUpdateOrgs={setOrgs}
                onUpdateMatchState={handleUpdateMatchState}
                onComplete={() => {
                    setActiveMatch(null);
                    setShowSetup(false);
                }}
                onRequestNewMatch={() => {
                    setActiveMatch(null);
                    setShowSetup(true);
                }}
                onAddMediaPost={() => {}}
                onExit={() => {
                    setActiveMatch(null);
                    setShowSetup(false);
                }}
                currentUserId={profile?.id || ''}
            />
        );
    }

    if (showSetup) {
        return (
            <MatchSetup 
                teams={allTeams}
                onMatchReady={handleMatchReady}
                onCancel={() => setShowSetup(false)}
            />
        );
    }

    const allFixtures = [...standaloneMatches, ...orgs.flatMap(o => o.fixtures)];
    const allPlayers = allTeams.flatMap(t => t.players || []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
                <div className="max-w-xl mx-auto flex items-center px-4">
                    <div className="flex-1 flex">
                        <button 
                            onClick={() => setView('matches')}
                            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all ${view === 'matches' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}
                        >
                            Live Scorer
                        </button>
                        <button 
                            onClick={() => setView('pro')}
                            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all ${view === 'pro' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}
                        >
                            Pro Tools
                        </button>
                    </div>

                    {/* User Menu */}
                    <div className="relative ml-4">
                        <button 
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-black hover:bg-slate-200 transition-all border border-slate-200 overflow-hidden"
                        >
                            {profile?.avatarUrl ? (
                                <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                profile?.name?.charAt(0) || '?'
                            )}
                        </button>

                        {showUserMenu && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 animate-in fade-in zoom-in-95 duration-200 z-50">
                                <div className="px-4 py-3 border-b border-slate-50 mb-1">
                                    <div className="text-[10px] font-black text-slate-900 truncate">{profile?.name}</div>
                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{profile?.role}</div>
                                </div>
                                <button 
                                    onClick={() => {
                                        signOut();
                                        setShowUserMenu(false);
                                    }}
                                    className="w-full text-left px-4 py-2 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors"
                                >
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-4 max-w-xl mx-auto pb-24">
                    {view === 'matches' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm mb-8 text-center">
                                <h1 className="text-3xl font-black text-slate-900 mb-2">CricketCore</h1>
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-8">Professional Scoring Suite</p>
                                
                                <button
                                    onClick={() => setShowSetup(true)}
                                    className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-500 hover:-translate-y-1 transition-all active:scale-95"
                                >
                                    Setup New Match
                                </button>
                            </div>

                            <div className="flex items-center gap-3 mb-6 px-2">
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Recent & Available Fixtures</h2>
                                <div className="h-px bg-slate-200 flex-1"></div>
                            </div>
                            
                            <div className="space-y-4">
                                {allFixtures.length === 0 ? (
                                    <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                                        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No active fixtures found</p>
                                    </div>
                                ) : (
                                    allFixtures.map(m => (
                                        <div
                                            key={m.id}
                                            className="p-6 bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                                            onClick={() => setActiveMatch(m)}
                                        >
                                            <div className="flex justify-between items-center mb-6">
                                                <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${m.status === 'Live' ? 'bg-red-50 text-red-600 ring-1 ring-red-100' : 'bg-slate-100 text-slate-500'}`}>
                                                    {m.status}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400">{m.date}</div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between gap-6">
                                                <div className="flex-1 text-center">
                                                    <div className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{m.teamAName}</div>
                                                </div>
                                                <div className="text-[10px] font-black text-slate-300">VS</div>
                                                <div className="flex-1 text-center">
                                                    <div className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{m.teamBName}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <ProTools 
                                players={allPlayers} 
                                organizations={orgs}
                                onSaveAssessment={(pid, cat, sub, score, time, notes) => {
                                    console.log('Saving Pro Assessment:', { pid, cat, sub, score, time, notes });
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => (
    <DataProvider>
        <AuthGuard>
            <ScorerAppContent />
        </AuthGuard>
    </DataProvider>
);

export default App;
