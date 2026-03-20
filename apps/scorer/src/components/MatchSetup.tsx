
import React, { useState, useMemo, useEffect } from 'react';
import { Team, MatchFixture, TournamentFormat, Player, UserProfile } from '../../types.ts';

interface MatchSetupProps {
  teams: Team[];
  existingFixture?: MatchFixture | null;
  onMatchReady: (match: MatchFixture) => void;
  onCancel: () => void;
  onTeamUpdate?: (teamId: string, newPlayer: Player) => void;
  onCreateTeam?: (name: string, playerNames: string[]) => void;
  availableOfficials?: UserProfile[]; // NEW PROP
}

type WizardStep = 'team_select' | 'squads' | 'toss' | 'officials' | 'openers';

export const MatchSetup: React.FC<MatchSetupProps> = ({ teams, existingFixture, onMatchReady, onCancel, onTeamUpdate, onCreateTeam, availableOfficials = [] }) => {
  const [step, setStep] = useState<WizardStep>('team_select');
  const [selectionStage, setSelectionStage] = useState<'HOME' | 'AWAY'>('HOME');
  
  const [config, setConfig] = useState<{
    teamAId: string;
    teamBId: string;
    venue: string;
    format: TournamentFormat;
    overs: number;
    followOnMargin: number;
    matchDays: number;
    teamASquad: string[];
    teamBSquad: string[];
    tossWinnerId: string;
    tossDecision: 'Bat' | 'Bowl';
    strikerId: string;
    nonStrikerId: string;
    bowlerId: string;
    allowFlexibleSquad: boolean;
    isOfficial: boolean;
    umpires: string[]; // NEW FIELD
  }>({
    teamAId: '',
    teamBId: '',
    venue: 'Main Oval',
    format: 'T20',
    overs: 20,
    followOnMargin: 200,
    matchDays: 5,
    teamASquad: [],
    teamBSquad: [],
    tossWinnerId: '',
    tossDecision: 'Bat',
    strikerId: '',
    nonStrikerId: '',
    bowlerId: '',
    allowFlexibleSquad: false,
    isOfficial: true,
    umpires: []
  });

  // Pre-fill if claiming an existing fixture
  useEffect(() => {
    if (existingFixture) {
      const tA = teams.find(t => t.id === existingFixture.teamAId);
      const tB = teams.find(t => t.id === existingFixture.teamBId);
      const isTest = existingFixture.format === 'Test';
      const inferredDays = isTest ? Math.ceil((existingFixture.customOvers || 450) / 90) : 5;
      
      setConfig({
        teamAId: existingFixture.teamAId,
        teamBId: existingFixture.teamBId,
        venue: existingFixture.venue,
        format: existingFixture.format || 'T20',
        overs: existingFixture.customOvers || 20,
        followOnMargin: existingFixture.followOnMargin || 200,
        matchDays: inferredDays,
        teamASquad: existingFixture.teamASquadIds || (tA ? tA.players.slice(0, 11).map(p => p.id) : []),
        teamBSquad: existingFixture.teamBSquadIds || (tB ? tB.players.slice(0, 11).map(p => p.id) : []),
        tossWinnerId: existingFixture.tossWinnerId || '',
        tossDecision: existingFixture.tossDecision || 'Bat',
        strikerId: '',
        nonStrikerId: '',
        bowlerId: '',
        allowFlexibleSquad: existingFixture.allowFlexibleSquad || false,
        isOfficial: existingFixture.isOfficial !== false,
        umpires: existingFixture.umpires || []
      });
      // Skip team selection step
      setStep('squads');
    }
  }, [existingFixture, teams]);

  const selectedTeamA = teams.find(t => t.id === config.teamAId);
  const selectedTeamB = teams.find(t => t.id === config.teamBId);

  // New Team Modal
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newTeamNameInput, setNewTeamNameInput] = useState('');
  const [newTeamPlayersInput, setNewTeamPlayersInput] = useState('');

  const handleTeamSelect = (teamId: string) => {
    if (selectionStage === 'HOME') {
      setConfig(prev => ({ ...prev, teamAId: teamId }));
      setSelectionStage('AWAY');
    } else {
      if (teamId === config.teamAId) return; // Prevent same team
      const tA = teams.find(t => t.id === config.teamAId);
      const tB = teams.find(t => t.id === teamId);
      setConfig(prev => ({
        ...prev,
        teamBId: teamId,
        teamASquad: tA ? tA.players.slice(0, 11).map(p => p.id) : [],
        teamBSquad: tB ? tB.players.slice(0, 11).map(p => p.id) : [],
        tossWinnerId: '',
        strikerId: '',
        nonStrikerId: '',
        bowlerId: ''
      }));
      setStep('squads');
    }
  };

  const togglePlayer = (side: 'A' | 'B', playerId: string) => {
    const key = side === 'A' ? 'teamASquad' : 'teamBSquad';
    setConfig(prev => {
      const current = prev[key];
      return {
        ...prev,
        [key]: current.includes(playerId) ? current.filter(id => id !== playerId) : [...current, playerId]
      };
    });
  };

  const updateTossConfig = (updates: Partial<typeof config>) => {
    setConfig(prev => ({
        ...prev,
        ...updates,
        strikerId: '',
        nonStrikerId: '',
        bowlerId: ''
    }));
  };

  const getBattingTeam = () => {
    if (!config.tossWinnerId) return null;
    const winner = config.tossWinnerId === config.teamAId ? selectedTeamA : selectedTeamB;
    const loser = config.tossWinnerId === config.teamAId ? selectedTeamB : selectedTeamA;
    return config.tossDecision === 'Bat' ? winner : loser;
  };

  const getBowlingTeam = () => {
    if (!config.tossWinnerId) return null;
    const winner = config.tossWinnerId === config.teamAId ? selectedTeamA : selectedTeamB;
    const loser = config.tossWinnerId === config.teamAId ? selectedTeamB : selectedTeamA;
    return config.tossDecision === 'Bat' ? loser : winner;
  };

  const toggleUmpire = (umpireId: string) => {
      setConfig(prev => {
          const exists = prev.umpires.includes(umpireId);
          return {
              ...prev,
              umpires: exists ? prev.umpires.filter(u => u !== umpireId) : [...prev.umpires, umpireId]
          };
      });
  };

  const handleFinish = () => {
    if (!selectedTeamA || !selectedTeamB) return;

    const fixture: MatchFixture = {
      id: existingFixture ? existingFixture.id : `match-${Date.now()}`,
      teamAId: selectedTeamA.id,
      teamBId: selectedTeamB.id,
      teamAName: selectedTeamA.name,
      teamBName: selectedTeamB.name,
      date: existingFixture ? existingFixture.date : new Date().toISOString().split('T')[0],
      venue: config.venue,
      status: 'Live',
      format: config.format,
      customOvers: config.overs,
      followOnMargin: config.followOnMargin,
      teamASquadIds: config.teamASquad,
      teamBSquadIds: config.teamBSquad,
      tossWinnerId: config.tossWinnerId,
      tossDecision: config.tossDecision,
      allowFlexibleSquad: config.allowFlexibleSquad,
      isOfficial: config.isOfficial,
      isArchived: false,
      umpires: config.umpires,
      initialPlayers: {
        strikerId: config.strikerId,
        nonStrikerId: config.nonStrikerId,
        bowlerId: config.bowlerId
      }
    };
    onMatchReady(fixture);
  };

  const saveNewTeam = () => {
    if (!newTeamNameInput.trim() || !onCreateTeam) return;
    const players = newTeamPlayersInput.split('\n').filter(p => p.trim() !== '');
    onCreateTeam(newTeamNameInput, players);
    setNewTeamNameInput('');
    setNewTeamPlayersInput('');
    setIsCreatingTeam(false);
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-slate-50 w-full">
      {/* Create Team Modal */}
      {isCreatingTeam && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[80vh]">
             <h3 className="text-xl font-black text-slate-900 mb-4 shrink-0">Add New Team</h3>
             <input value={newTeamNameInput} onChange={e => setNewTeamNameInput(e.target.value)} placeholder="Team Name" autoFocus className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 mb-4 shrink-0" />
             
             <div className="flex-1 min-h-0 flex flex-col mb-6">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Quick Add Players (Optional)</label>
                <textarea 
                    value={newTeamPlayersInput} 
                    onChange={e => setNewTeamPlayersInput(e.target.value)} 
                    placeholder="Enter player names (one per line)..."
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-medium text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 resize-none flex-1"
                />
             </div>

             <div className="flex gap-3 shrink-0">
               <button onClick={() => setIsCreatingTeam(false)} className="flex-1 py-3 text-slate-400 font-black uppercase text-xs hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
               <button onClick={saveNewTeam} className="flex-1 py-3 bg-indigo-600 text-white font-black uppercase text-xs rounded-xl shadow-lg hover:bg-indigo-500 transition-all">Create</button>
             </div>
          </div>
        </div>
      )}

      {/* Steps Header */}
      <div className="p-4 md:p-6 border-b border-slate-200 bg-white z-10 shrink-0 shadow-sm">
        <div className="flex justify-between items-center mb-4 max-w-6xl mx-auto w-full">
           <div>
             <h1 className="text-2xl font-black text-slate-900 tracking-tight">{existingFixture ? 'Claim & Configure Match' : 'Match Setup'}</h1>
             <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-0.5">
               {step === 'team_select' && 'Match Configuration & Teams'}
               {step === 'squads' && 'Confirm Playing 11'}
               {step === 'toss' && 'The Toss'}
               {step === 'officials' && 'Match Officials'}
               {step === 'openers' && 'Openers'}
             </p>
           </div>
           <button onClick={onCancel} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200">✕</button>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 w-full max-w-6xl mx-auto bg-slate-100 rounded-full overflow-hidden flex">
           <div className={`h-full bg-indigo-600 transition-all duration-500 ${step === 'team_select' ? 'w-[10%]' : step === 'squads' ? 'w-[30%]' : step === 'toss' ? 'w-[50%]' : step === 'officials' ? 'w-[75%]' : 'w-full'}`} />
        </div>
      </div>

      {/* SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto scroll-container custom-scrollbar p-4 md:p-6 pb-32">
        <div className="max-w-6xl mx-auto min-h-0">
            {/* STEP 1: CONFIG & TEAM SELECTION */}
            {step === 'team_select' && (
            <div className="animate-in fade-in duration-300">
                {/* Match Configuration Panel */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm mb-8">
                   <h3 className="font-black text-sm text-slate-900 mb-6 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                      Match Settings
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Format {existingFixture && '(Locked)'}</label>
                         <select 
                           value={config.format} 
                           disabled={!!existingFixture}
                           onChange={(e) => {
                             const fmt = e.target.value as TournamentFormat;
                             let defOvers = 20;
                             let defDays = 1;
                             let defMargin = 0;

                             if(fmt === 'T10') defOvers = 10;
                             if(fmt === '50-over') defOvers = 50;
                             if(fmt === 'Test') {
                                 defOvers = 450; // 5 days * 90 overs
                                 defDays = 5;
                                 defMargin = 200;
                             }
                             
                             setConfig(prev => ({
                                 ...prev, 
                                 format: fmt, 
                                 overs: defOvers, 
                                 matchDays: defDays, 
                                 followOnMargin: defMargin 
                             }))
                           }}
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm text-slate-900 outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                            <option value="T20">Twenty20 (T20)</option>
                            <option value="T10">Ten10 (T10)</option>
                            <option value="50-over">One Day (50)</option>
                            <option value="Test">Test Match</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                            {config.format === 'Test' ? 'Match Duration' : 'Overs per Innings'}
                         </label>
                         {config.format === 'Test' ? (
                            <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm text-slate-500 cursor-not-allowed flex items-center justify-between">
                                <span>{config.matchDays} Days</span>
                                <span className="text-[10px] bg-slate-200 px-2 py-1 rounded uppercase tracking-wider">~{config.overs} Ov</span>
                            </div>
                         ) : (
                            <input 
                                type="number" 
                                value={config.overs} 
                                disabled={!!existingFixture}
                                onChange={(e) => setConfig(prev => ({...prev, overs: parseInt(e.target.value) || 0}))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm text-slate-900 outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                            />
                         )}
                      </div>
                      
                      {/* Match Type Toggle */}
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Match Type</label>
                         <div 
                           onClick={() => setConfig(prev => ({...prev, isOfficial: !prev.isOfficial}))}
                           className={`flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 cursor-pointer transition-colors ${config.isOfficial ? 'bg-indigo-50 border-indigo-200' : 'bg-amber-50 border-amber-200'}`}
                         >
                            <div>
                               <div className={`font-bold text-xs ${config.isOfficial ? 'text-indigo-900' : 'text-amber-900'}`}>{config.isOfficial ? 'Official Match' : 'Unofficial / Friendly'}</div>
                               <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{config.isOfficial ? 'Counts to Stats' : 'Practice Only'}</div>
                            </div>
                            <div className={`w-10 h-6 rounded-full transition-all relative ${config.isOfficial ? 'bg-indigo-600' : 'bg-amber-500'}`}>
                               <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${config.isOfficial ? 'left-5' : 'left-1'}`} />
                            </div>
                         </div>
                      </div>
                   </div>
                   
                   {/* TEST MATCH SPECIFIC SETTINGS */}
                   {config.format === 'Test' && (
                      <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2">
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Scheduled Days</label>
                            <select 
                                value={config.matchDays} 
                                disabled={!!existingFixture}
                                onChange={(e) => {
                                    const days = parseInt(e.target.value);
                                    let margin = 200;
                                    if (days >= 5) margin = 200;
                                    else if (days >= 3) margin = 150;
                                    else if (days === 2) margin = 100;
                                    else margin = 75;
                                    
                                    setConfig(prev => ({
                                        ...prev, 
                                        matchDays: days,
                                        followOnMargin: margin,
                                        overs: days * 90
                                    }));
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm text-slate-900 outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                            >
                                <option value={5}>5 Days (Standard)</option>
                                <option value={4}>4 Days</option>
                                <option value={3}>3 Days</option>
                                <option value={2}>2 Days</option>
                                <option value={1}>1 Day</option>
                            </select>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Follow-On Margin</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={config.followOnMargin} 
                                    disabled={!!existingFixture}
                                    onChange={(e) => setConfig(prev => ({...prev, followOnMargin: parseInt(e.target.value) || 0}))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm text-slate-900 outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                                />
                                <span className="absolute right-4 top-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Runs</span>
                            </div>
                            <p className="text-[9px] text-slate-400 italic">Adjustable based on league rules</p>
                         </div>
                      </div>
                   )}
                </div>

                <div className="flex items-center gap-2 mb-4 px-2">
                   <h3 className="font-black text-sm text-slate-900 uppercase tracking-widest">Select {selectionStage} Team</h3>
                   <span className="h-px bg-slate-200 flex-1"></span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    <button onClick={() => { setIsCreatingTeam(true); setNewTeamPlayersInput(''); }} className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-white transition-all group">
                    <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">+</span>
                    <span className="text-[9px] font-black uppercase tracking-widest">Add Team</span>
                    </button>
                    {teams.map(t => {
                    const isSelectedAsHome = config.teamAId === t.id;
                    const isSelectedAsAway = config.teamBId === t.id;
                    const isDisabled = (selectionStage === 'HOME' && isSelectedAsAway) || (selectionStage === 'AWAY' && isSelectedAsHome);

                    return (
                        <button 
                        key={t.id} 
                        disabled={isDisabled}
                        onClick={() => handleTeamSelect(t.id)}
                        className={`aspect-square rounded-2xl p-4 flex flex-col items-center justify-center border transition-all relative overflow-hidden group ${
                            isSelectedAsHome ? 'bg-indigo-600 border-indigo-600 text-white' : 
                            isSelectedAsAway ? 'bg-purple-600 border-purple-600 text-white' : 
                            'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-lg'
                        } ${isDisabled ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
                        >
                            <img src={t.logoUrl || `https://ui-avatars.com/api/?name=${t.name}`} alt={t.name} className="w-12 h-12 rounded-full mb-3 object-cover shadow-sm bg-white" />
                            <h3 className={`font-black text-center text-xs leading-tight ${isSelectedAsHome || isSelectedAsAway ? 'text-white' : 'text-slate-900'}`}>{t.name}</h3>
                            <div className={`text-[8px] font-bold mt-1 ${isSelectedAsHome || isSelectedAsAway ? 'text-white/70' : 'text-slate-400'}`}>{t.players.length} Players</div>
                            
                            {(isSelectedAsHome || isSelectedAsAway) && (
                            <div className="absolute top-2 right-2 bg-white text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                                {isSelectedAsHome ? 'Home' : 'Away'}
                            </div>
                            )}
                        </button>
                    )
                    })}
                </div>
                
                {config.teamAId && selectionStage === 'AWAY' && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-2 rounded-full shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-10">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Home:</span>
                    <span className="text-xs font-black">{teams.find(t => t.id === config.teamAId)?.name}</span>
                    <button onClick={() => { setConfig(prev => ({ ...prev, teamAId: '' })); setSelectionStage('HOME'); }} className="ml-2 w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">✕</button>
                </div>
                )}
            </div>
            )}

            {/* STEP 2: SQUAD SELECTION */}
            {step === 'squads' && selectedTeamA && selectedTeamB && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-24 animate-in slide-in-from-right-8 duration-300 min-h-0">
                {[selectedTeamA, selectedTeamB].map((team, idx) => {
                    const side = idx === 0 ? 'A' : 'B';
                    const squad = side === 'A' ? config.teamASquad : config.teamBSquad;
                    
                    return (
                    <div key={team.id} className="bg-white rounded-3xl border border-slate-200 flex flex-col min-h-0 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                            <img src={team.logoUrl} className="w-8 h-8 rounded-full bg-white border border-slate-100" />
                            <div>
                                <h3 className="font-black text-sm text-slate-900">{team.name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{squad.length} Selected {config.allowFlexibleSquad ? '(Flexible)' : '/ 11'}</p>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 max-h-[60vh]">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {team.players.map(p => {
                                const isSelected = squad.includes(p.id);
                                return (
                                    <div 
                                        key={p.id} 
                                        onClick={() => togglePlayer(side, p.id)}
                                        className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-transparent hover:bg-slate-50'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${isSelected ? 'border-indigo-300 bg-white' : 'border-slate-200 bg-slate-100'}`}>
                                            <img src={p.photoUrl || `https://ui-avatars.com/api/?name=${p.name}&background=random`} className="w-full h-full rounded-full object-cover opacity-90" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{p.name}</div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase">{p.role}</div>
                                        </div>
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                            {isSelected && <span className="text-white text-[8px] font-black">✓</span>}
                                        </div>
                                    </div>
                                )
                            })}
                            {team.players.length === 0 && (
                                <div className="col-span-full p-4 text-center text-slate-400 text-xs font-bold uppercase">No players in this team.</div>
                            )}
                            </div>
                        </div>
                    </div>
                    )
                })}
            </div>
            )}

            {/* STEP 3: TOSS */}
            {step === 'toss' && selectedTeamA && selectedTeamB && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] pb-24 animate-in zoom-in-95 duration-500">
                <div className="flex items-center justify-center gap-8 md:gap-20 mb-12">
                    <div className={`text-center transition-all ${config.tossWinnerId === selectedTeamA.id ? 'scale-110 opacity-100' : config.tossWinnerId ? 'opacity-40 scale-90' : 'opacity-100'}`}>
                        <img src={selectedTeamA.logoUrl} className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-white shadow-xl mb-4 object-cover border-4 border-white" />
                        <h3 className="font-black text-sm md:text-lg text-slate-900">{selectedTeamA.name}</h3>
                        <button onClick={() => updateTossConfig({ tossWinnerId: selectedTeamA.id })} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors">Won Toss</button>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-amber-400 border-4 border-amber-500 flex items-center justify-center shadow-xl animate-[spin_3s_ease-in-out_infinite] relative">
                             <div className="absolute inset-0 rounded-full border-2 border-amber-300/50" />
                             <span className="text-4xl font-serif font-black text-amber-700 opacity-80">$</span>
                        </div>
                        <div className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">VS</div>
                    </div>

                    <div className={`text-center transition-all ${config.tossWinnerId === selectedTeamB.id ? 'scale-110 opacity-100' : config.tossWinnerId ? 'opacity-40 scale-90' : 'opacity-100'}`}>
                        <img src={selectedTeamB.logoUrl} className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-white shadow-xl mb-4 object-cover border-4 border-white" />
                        <h3 className="font-black text-sm md:text-lg text-slate-900">{selectedTeamB.name}</h3>
                        <button onClick={() => updateTossConfig({ tossWinnerId: selectedTeamB.id })} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors">Won Toss</button>
                    </div>
                </div>

                {config.tossWinnerId && (
                    <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 animate-in slide-in-from-bottom-8">
                        <h3 className="text-center font-black text-slate-900 mb-4 uppercase tracking-widest text-xs">Decision</h3>
                        <div className="flex gap-3">
                        <button onClick={() => updateTossConfig({ tossDecision: 'Bat' })} className={`px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest border transition-all ${config.tossDecision === 'Bat' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}>Bat First</button>
                        <button onClick={() => updateTossConfig({ tossDecision: 'Bowl' })} className={`px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest border transition-all ${config.tossDecision === 'Bowl' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}>Bowl First</button>
                        </div>
                    </div>
                )}
            </div>
            )}

            {/* STEP 4: OFFICIALS (NEW) */}
            {step === 'officials' && (
                <div className="animate-in slide-in-from-right-8 duration-300 min-h-0 max-w-4xl mx-auto">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-slate-900 text-lg">Appoint Officials</h3>
                            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Optional</span>
                        </div>
                        
                        {availableOfficials.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No registered officials found in this organization.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {availableOfficials.map(official => {
                                    const isSelected = config.umpires.includes(official.id);
                                    return (
                                        <button 
                                            key={official.id}
                                            onClick={() => toggleUmpire(official.id)}
                                            className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all group ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${isSelected ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                                                    {official.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold">{official.name}</div>
                                                    <div className={`text-[10px] font-bold uppercase ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>Official</div>
                                                </div>
                                            </div>
                                            {isSelected && <span className="text-xl">✓</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        <p className="mt-6 text-[10px] text-slate-400 italic text-center">Selected officials will have write access to the match if they log in.</p>
                    </div>
                </div>
            )}

            {/* STEP 5: OPENERS */}
            {step === 'openers' && getBattingTeam() && getBowlingTeam() && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-24 animate-in slide-in-from-right-8 duration-300 min-h-0">
                {/* Batting Openers - Filtered by Squad */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col min-h-0">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                        <img src={getBattingTeam()!.logoUrl} className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100" />
                        <div>
                        <h3 className="font-black text-base text-slate-900">Batting Openers</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{getBattingTeam()!.name}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4 shrink-0">
                        <div className="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100">
                        <div className="text-[8px] font-black uppercase text-indigo-400 tracking-widest mb-1">Striker</div>
                        <div className="font-black text-sm text-slate-900 truncate">{getBattingTeam()!.players.find(p => p.id === config.strikerId)?.name || 'Select below'}</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <div className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Non-Striker</div>
                        <div className="font-black text-sm text-slate-900 truncate">{getBattingTeam()!.players.find(p => p.id === config.nonStrikerId)?.name || 'Select below'}</div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[50vh]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {getBattingTeam()!.players.filter(p => (getBattingTeam()!.id === selectedTeamA!.id ? config.teamASquad : config.teamBSquad).includes(p.id)).map(p => {
                            const isStriker = config.strikerId === p.id;
                            const isNonStriker = config.nonStrikerId === p.id;
                            const isSelected = isStriker || isNonStriker;
                            const isFull = !!config.strikerId && !!config.nonStrikerId;

                            return (
                                <button 
                                key={p.id}
                                disabled={!isSelected && isFull} 
                                onClick={() => {
                                    if (isStriker) {
                                         setConfig(prev => ({...prev, strikerId: ''}));
                                    } else if (isNonStriker) {
                                         setConfig(prev => ({...prev, nonStrikerId: ''}));
                                    } else {
                                         if (!config.strikerId) setConfig(prev => ({...prev, strikerId: p.id}));
                                         else if (!config.nonStrikerId) setConfig(prev => ({...prev, nonStrikerId: p.id}));
                                    }
                                }}
                                className={`p-2 rounded-xl border text-left transition-all flex items-center gap-3 ${isSelected ? 'bg-slate-50 border-slate-200 opacity-100 ring-1 ring-indigo-200' : 'bg-white border-slate-100 hover:border-indigo-300'} ${!isSelected && isFull ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0">
                                        <img src={p.photoUrl || `https://ui-avatars.com/api/?name=${p.name}`} className="w-full h-full rounded-full object-cover opacity-80" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-xs text-slate-900 truncate">{p.name}</div>
                                        <div className="text-[9px] font-bold text-slate-400 uppercase">{p.role}</div>
                                    </div>
                                    {isStriker && <span className="text-[8px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded uppercase">STR</span>}
                                    {isNonStriker && <span className="text-[8px] font-black bg-slate-500 text-white px-1.5 py-0.5 rounded uppercase">NON</span>}
                                </button>
                            )
                        })}
                        </div>
                    </div>
                    <button onClick={() => setConfig(prev => ({...prev, strikerId: '', nonStrikerId: ''}))} className="mt-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-red-500 text-center transition-colors shrink-0">Reset Selection</button>
                </div>

                {/* Opening Bowler - Filtered by Squad */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col min-h-0">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                        <img src={getBowlingTeam()!.logoUrl} className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100" />
                        <div>
                        <h3 className="font-black text-base text-slate-900">Opening Bowler</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{getBowlingTeam()!.name}</p>
                        </div>
                    </div>

                    <div className="mb-4 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100 shrink-0">
                        <div className="text-[8px] font-black uppercase text-emerald-500 tracking-widest mb-1">Bowler</div>
                        <div className="font-black text-sm text-slate-900 truncate">{getBowlingTeam()!.players.find(p => p.id === config.bowlerId)?.name || 'Select below'}</div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[50vh]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {getBowlingTeam()!.players.filter(p => (getBowlingTeam()!.id === selectedTeamA!.id ? config.teamASquad : config.teamBSquad).includes(p.id)).map(p => {
                            const isSelected = config.bowlerId === p.id;

                            return (
                                <button 
                                key={p.id}
                                onClick={() => setConfig(prev => ({...prev, bowlerId: p.id}))}
                                className={`p-2 rounded-xl border text-left transition-all flex items-center gap-3 ${isSelected ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-100 hover:border-emerald-300'}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0">
                                        <img src={p.photoUrl || `https://ui-avatars.com/api/?name=${p.name}`} className="w-full h-full rounded-full object-cover opacity-80" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className={`font-bold text-xs truncate ${isSelected ? 'text-emerald-900' : 'text-slate-900'}`}>{p.name}</div>
                                        <div className="text-[9px] font-bold text-slate-400 uppercase">{p.role}</div>
                                    </div>
                                    {isSelected && <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[8px]">✓</div>}
                                </button>
                            )
                        })}
                        </div>
                    </div>
                </div>

            </div>
            )}
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="p-4 md:p-6 bg-white border-t border-slate-200 flex justify-between z-10 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] absolute bottom-0 left-0 right-0">
         {step === 'team_select' ? (
            <button onClick={onCancel} className="px-6 py-3 rounded-xl text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-slate-50">Cancel Setup</button>
         ) : (
            <button 
               onClick={() => {
                  if (step === 'squads') setStep('team_select');
                  if (step === 'toss') setStep('squads');
                  if (step === 'officials') setStep('toss');
                  if (step === 'openers') setStep('officials');
               }} 
               disabled={step === 'squads' && !!existingFixture}
               className="px-6 py-3 rounded-xl text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
               Back
            </button>
         )}

         {step === 'squads' && (
            <button 
               disabled={config.teamASquad.length < 2 || config.teamBSquad.length < 2}
               onClick={() => setStep('toss')} 
               className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-500 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
            >
               Confirm Squads
            </button>
         )}

         {step === 'toss' && (
            <button 
               disabled={!config.tossWinnerId}
               onClick={() => setStep('officials')} 
               className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-500 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
            >
               Set Logistics
            </button>
         )}

         {step === 'officials' && (
            <button 
               onClick={() => setStep('openers')} 
               className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-500 hover:scale-105 transition-all"
            >
               Continue
            </button>
         )}

         {step === 'openers' && (
            <button 
               disabled={!config.strikerId || !config.nonStrikerId || !config.bowlerId}
               onClick={handleFinish} 
               className="px-10 py-3 bg-emerald-500 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-400 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
            >
               Start Match
            </button>
         )}
      </div>
    </div>
  );
};

