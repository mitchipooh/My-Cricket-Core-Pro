
import React, { useState, useMemo } from 'react';
import { PlayerWithContext, Player, MatchFixture, BallEvent } from '../../types.ts';
import { FieldView } from '../analytics/FieldView.tsx';
import { PitchView } from '../analytics/PitchView.tsx';

interface PlayerProfileModalProps {
    player: PlayerWithContext | null;
    isOpen: boolean;
    onClose: () => void;
    isFollowed: boolean;
    onToggleFollow: () => void;
    allFixtures?: MatchFixture[];
    onViewMatch?: (match: MatchFixture) => void;
    onUpdatePlayer?: (player: Partial<Player>) => void;
    onDeletePlayer?: (playerId: string) => void;
    onClaim?: (playerId: string) => void;
}

type StatTab = 'BATTING' | 'BOWLING' | 'FIELDING' | 'KEEPING' | 'SPATIAL' | 'MATCHES';
type StatContext = 'OFFICIAL' | 'UNOFFICIAL';

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
    player, isOpen, onClose, isFollowed, onToggleFollow, allFixtures = [], onViewMatch, onUpdatePlayer, onDeletePlayer, onClaim
}) => {
    const [viewMode, setViewMode] = useState<'SUMMARY' | 'DETAILED'>('SUMMARY');
    const [activeTab, setActiveTab] = useState<StatTab>('BATTING');
    const [statContext, setStatContext] = useState<StatContext>('OFFICIAL');
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<{
        name: string;
        role: string;
        bio: string;
        age?: string;
        battingStyle?: string;
        bowlingStyle?: string;
        teamName?: string;
        teamRole?: string;
        nickname?: string;
        favoritePlayer?: string;
        favoriteWorldCupMoment?: string;
        favoriteGround?: string;
    }>({
        name: '', role: '', bio: '', age: '', battingStyle: '', bowlingStyle: '', teamName: '', teamRole: '',
        nickname: '', favoritePlayer: '', favoriteWorldCupMoment: '', favoriteGround: ''
    });

    const contextFixtures = useMemo(() => {
        return allFixtures.filter(f =>
            statContext === 'OFFICIAL' ? f.isOfficial !== false : f.isOfficial === false
        );
    }, [allFixtures, statContext]);

    const calculatedStats = useMemo(() => {
        if (!player) return { matches: 0, runs: 0, wickets: 0, ballsFaced: 0, ballsBowled: 0, runsConceded: 0, catches: 0, stumpings: 0, highestScore: 0, fours: 0, sixes: 0, fiveWickets: 0, threeWickets: 0, maidens: 0, ducks: 0, hundreds: 0, fifties: 0, bestBowling: '' };

        let runs = 0, wickets = 0, ballsFaced = 0, ballsBowled = 0, runsConceded = 0;
        let matches = 0, catches = 0, stumpings = 0;
        let highestScore = 0, fours = 0, sixes = 0;
        let fiveWickets = 0, threeWickets = 0, maidens = 0, ducks = 0, hundreds = 0, fifties = 0;
        let bestBowling = '';

        contextFixtures.forEach(f => {
            if (!f.savedState) return;
            const isPlayerInMatch = f.teamASquadIds?.includes(player.id) || f.teamBSquadIds?.includes(player.id) || f.teamAId === player.teamId || f.teamBId === player.teamId;
            if (isPlayerInMatch) matches++;
            const history = f.savedState.history;

            const playerBatting = history.filter(b => b.strikerId === player.id && !b.commentary?.startsWith('EVENT'));
            const matchRuns = playerBatting.reduce((sum, b) => sum + (b.runs || 0), 0);
            const legalBallsFaced = playerBatting.filter(b => b.extraType !== 'Wide').length;

            if (legalBallsFaced > 0 || playerBatting.some(b => b.isWicket && b.outPlayerId === player.id)) {
                ballsFaced += legalBallsFaced;
                runs += matchRuns;
                if (matchRuns > highestScore) highestScore = matchRuns;
                if (matchRuns >= 100) hundreds++;
                else if (matchRuns >= 50) fifties++;
                if (matchRuns === 0 && playerBatting.some(b => b.isWicket && b.outPlayerId === player.id)) ducks++;
                fours += playerBatting.filter(b => b.runs === 4).length;
                sixes += playerBatting.filter(b => b.runs === 6).length;
            }

            const playerBowling = history.filter(b => b.bowlerId === player.id && !b.commentary?.startsWith('EVENT'));
            const matchWickets = playerBowling.filter(b => b.isWicket && b.creditBowler).length;
            const matchRunsConceded = playerBowling.reduce((sum, b) => {
                const penalty = (b.extraType === 'Wide' || b.extraType === 'NoBall') ? 1 : 0;
                return sum + (b.runs || 0) + (b.extraRuns || 0) + penalty;
            }, 0);

            if (playerBowling.length > 0) {
                wickets += matchWickets;
                runsConceded += matchRunsConceded;
                ballsBowled += playerBowling.filter(b => b.extraType !== 'Wide' && b.extraType !== 'NoBall').length;
                if (matchWickets >= 5) fiveWickets++; else if (matchWickets >= 3) threeWickets++;
            }

            catches += history.filter(b => b.isWicket && b.wicketType === 'Caught' && b.fielderId === player.id).length;
            stumpings += history.filter(b => b.isWicket && b.wicketType === 'Stumped' && b.fielderId === player.id).length;
        });
        return { matches, runs, wickets, ballsFaced, ballsBowled, runsConceded, catches, stumpings, highestScore, fours, sixes, fiveWickets, threeWickets, maidens, ducks, hundreds, fifties, bestBowling };
    }, [contextFixtures, player]);

    const relevantBalls = useMemo(() => {
        if (!player) return [];
        const balls: BallEvent[] = [];
        contextFixtures.forEach(f => {
            if (f.savedState?.history) {
                f.savedState.history.forEach(b => {
                    if (b.strikerId === player.id || b.bowlerId === player.id) balls.push(b);
                });
            }
        });
        return balls;
    }, [contextFixtures, player]);

    const pitchData = useMemo(() => relevantBalls.filter(b => player && b.strikerId === player.id && b.pitchCoords).map(b => ({ coords: b.pitchCoords!, color: b.isWicket ? 'red' : b.runs >= 4 ? 'yellow' : 'green' })), [relevantBalls, player]);
    const shotData = useMemo(() => relevantBalls.filter(b => player && b.strikerId === player.id && b.shotCoords).map(b => ({ coords: b.shotCoords!, color: b.runs === 4 ? 'indigo' : b.runs === 6 ? 'emerald' : 'yellow' })), [relevantBalls, player]);

    const battingAvg = calculatedStats.matches > 0 ? (calculatedStats.runs / Math.max(1, calculatedStats.matches - calculatedStats.ducks)).toFixed(1) : '0.0';
    const battingSR = calculatedStats.ballsFaced > 0 ? ((calculatedStats.runs / calculatedStats.ballsFaced) * 100).toFixed(1) : '0.0';
    const oversBowled = Math.floor(calculatedStats.ballsBowled / 6) + (calculatedStats.ballsBowled % 6) / 10;
    const bowlingEcon = calculatedStats.ballsBowled > 0 ? (calculatedStats.runsConceded / (calculatedStats.ballsBowled / 6)).toFixed(2) : '0.0';
    const bowlingAvg = calculatedStats.wickets > 0 ? (calculatedStats.runsConceded / calculatedStats.wickets).toFixed(1) : '0.0';

    if (!isOpen || !player) return null;

    const isKeeper = player.role === 'Wicket-keeper';

    const playerMatches = contextFixtures.filter(f =>
        f.teamAId === player.teamId || f.teamBId === player.teamId ||
        f.teamASquadIds?.includes(player.id) || f.teamBSquadIds?.includes(player.id)
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleDetailedView = () => {
        setViewMode('DETAILED');
        if (player.role === 'Bowler') setActiveTab('BOWLING'); else if (isKeeper) setActiveTab('KEEPING'); else setActiveTab('BATTING');
    };

    const tabs: StatTab[] = ['BATTING', 'BOWLING', 'SPATIAL', 'MATCHES'].filter(t => { if (t === 'KEEPING' && !isKeeper) return false; return true; }) as StatTab[];

    const handleEditToggle = () => {
        if (isEditing) {
            if (onUpdatePlayer) {
                onUpdatePlayer({
                    name: editForm.name,
                    role: editForm.role as any,
                    bio: editForm.bio,
                    playerDetails: {
                        ...(player.playerDetails || { battingStyle: 'Right-hand', bowlingStyle: '', primaryRole: editForm.role as any, lookingForClub: false, isHireable: false }),
                        battingStyle: (editForm.battingStyle || 'Right-hand') as any,
                        bowlingStyle: editForm.bowlingStyle || '',
                        primaryRole: editForm.role as any,
                        age: editForm.age,
                        teamRole: editForm.teamRole,
                        nickname: editForm.nickname,
                        favoritePlayer: editForm.favoritePlayer,
                        favoriteWorldCupMoment: editForm.favoriteWorldCupMoment,
                        favoriteGround: editForm.favoriteGround
                    }
                });
            }
            setIsEditing(false);
        } else {
            setEditForm({
                name: player.name,
                role: player.role,
                bio: player.bio || '',
                age: player.playerDetails?.age || '',
                battingStyle: player.playerDetails?.battingStyle || 'Right-hand',
                bowlingStyle: player.playerDetails?.bowlingStyle || '',
                teamName: player.teamName || '',
                teamRole: player.playerDetails?.teamRole || '',
                nickname: player.playerDetails?.nickname || '',
                favoritePlayer: player.playerDetails?.favoritePlayer || '',
                favoriteWorldCupMoment: player.playerDetails?.favoriteWorldCupMoment || '',
                favoriteGround: player.playerDetails?.favoriteGround || ''
            });
            setIsEditing(true);
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onUpdatePlayer) {
            setUploading(true);
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const MAX_SIZE = 800;
                    let width = img.width;
                    let height = img.height;
                    if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
                    else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
                    canvas.width = width; canvas.height = height;
                    ctx?.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    onUpdatePlayer({ photoUrl: dataUrl });
                    setUploading(false);
                };
                img.src = readerEvent.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[200] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#1A1A2E] w-full max-w-5xl md:h-[85vh] rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-slate-800 relative overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500">

                {/* LEFT PANE: MEDIA & BRANDING */}
                <div className="w-full md:w-1/2 relative bg-slate-950 overflow-hidden shrink-0 group">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A2E] via-transparent to-transparent z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A2E]/40 to-transparent z-10" />

                    {player.highlightVideoUrl ? (
                        <video src={player.highlightVideoUrl} autoPlay muted loop playsInline className="w-full h-full object-cover opacity-90 scale-105" />
                    ) : (
                        <img
                            src={player.photoUrl || `https://ui-avatars.com/api/?name=${player.name}&background=1A1A2E&color=fff&size=1024`}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            alt={player.name}
                        />
                    )}

                    {/* CLOSE/BACK BUTTONS */}
                    <div className="absolute top-8 left-8 z-30 flex gap-3">
                        <button onClick={onClose} className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full text-white flex items-center justify-center transition-all border border-white/10 shadow-2xl">←</button>
                    </div>

                    {/* PHOTO UPLOAD OVERLAY */}
                    {onUpdatePlayer && (
                        <div className="absolute bottom-8 left-8 z-30">
                            <label className="bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-xl cursor-pointer text-[10px] font-black uppercase text-white tracking-widest transition-all">
                                {uploading ? 'Uploading...' : 'Change Photo'}
                                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                            </label>
                        </div>
                    )}
                </div>

                {/* RIGHT PANE: INFO CARD */}
                <div className="flex-1 bg-white relative flex flex-col min-w-0">

                    {/* TRADING CARD LOGO/HEADER */}
                    <div className="bg-[#FCE4EC] p-12 flex justify-between items-start shrink-0">
                        <div className="space-y-1">
                            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-600">PLAYER</div>
                            <div className="text-3xl font-serif italic text-pink-800 leading-none">profile</div>
                        </div>
                        <div className="flex items-center gap-4">
                            {isEditing && (
                                <div className="space-y-1 text-right">
                                    <div className="text-[9px] font-black text-pink-400 uppercase tracking-widest">Select Role:</div>
                                    <select
                                        value={editForm.role}
                                        onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                        className="bg-transparent border-b border-pink-300 font-black text-slate-800 uppercase focus:border-indigo-500 outline-none text-xs"
                                    >
                                        <option value="Batsman">Batsman</option>
                                        <option value="Bowler">Bowler</option>
                                        <option value="All-rounder">All-rounder</option>
                                        <option value="Wicket-keeper">Wicket-keeper</option>
                                    </select>
                                </div>
                            )}
                            <div className="w-12 h-12">
                                <svg viewBox="0 0 100 100" className="w-full h-full fill-pink-600 opacity-20">
                                    <rect x="10" y="10" width="80" height="80" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* MAIN INFO */}
                    <div className="px-12 py-8 flex-1 overflow-y-auto no-scrollbar bg-gradient-to-b from-[#FCE4EC] to-white">
                        <div className="mb-12">
                            <div className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-1">Name:</div>
                            {isEditing ? (
                                <input
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="text-5xl font-black text-slate-900 bg-transparent border-b-4 border-pink-400 focus:border-indigo-600 outline-none w-full uppercase"
                                />
                            ) : (
                                <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none uppercase">
                                    {player.name.split(' ').map((n, i) => (
                                        <div key={i}>{n}</div>
                                    ))}
                                </h1>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <div className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Age:</div>
                                {isEditing ? (
                                    <input value={editForm.age} onChange={e => setEditForm({ ...editForm, age: e.target.value })} className="bg-transparent border-b border-pink-300 font-black text-slate-800 uppercase focus:border-indigo-500 outline-none w-full" />
                                ) : (
                                    <div className="text-xl font-black text-slate-800 uppercase">{player.playerDetails?.age || '26'}</div>
                                )}
                            </div>
                            <div className="space-y-1">
                                <div className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Local Team:</div>
                                {isEditing ? (
                                    <input value={editForm.teamName} onChange={e => setEditForm({ ...editForm, teamName: e.target.value })} className="bg-transparent border-b border-pink-300 font-black text-slate-800 uppercase focus:border-indigo-500 outline-none w-full" />
                                ) : (
                                    <div className="text-xl font-black text-slate-800 uppercase">{player.teamName || 'HOODS'}</div>
                                )}
                            </div>
                            <div className="space-y-1">
                                <div className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Batting:</div>
                                {isEditing ? (
                                    <select value={editForm.battingStyle} onChange={e => setEditForm({ ...editForm, battingStyle: e.target.value })} className="bg-transparent border-b border-pink-300 font-black text-slate-800 uppercase focus:border-indigo-500 outline-none w-full">
                                        <option value="Right-hand">RIGHT-HANDED</option>
                                        <option value="Left-hand">LEFT-HANDED</option>
                                    </select>
                                ) : (
                                    <div className="text-xl font-black text-slate-800 uppercase">{player.playerDetails?.battingStyle || 'RIGHT-HANDED'}</div>
                                )}
                            </div>
                            <div className="space-y-1">
                                <div className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Bowling:</div>
                                {isEditing ? (
                                    <input value={editForm.bowlingStyle} onChange={e => setEditForm({ ...editForm, bowlingStyle: e.target.value })} className="bg-transparent border-b border-pink-300 font-black text-slate-800 uppercase focus:border-indigo-500 outline-none w-full" />
                                ) : (
                                    <div className="text-xl font-black text-slate-800 uppercase">{player.playerDetails?.bowlingStyle || 'RIGHT-ARM OFFSPIN'}</div>
                                )}
                            </div>
                            <div className="space-y-1 col-span-2">
                                <div className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Role in Team:</div>
                                {isEditing ? (
                                    <select
                                        value={editForm.teamRole}
                                        onChange={e => setEditForm({ ...editForm, teamRole: e.target.value })}
                                        className="bg-transparent border-b border-pink-300 font-black text-slate-800 uppercase focus:border-indigo-500 outline-none w-full"
                                    >
                                        <option value="">SELECT ROLE</option>
                                        <option value="Batter">BATTER</option>
                                        <option value="Bowler">BOWLER</option>
                                        <option value="Wicket-keeper">WICKET-KEEPER</option>
                                        <option value="Captain">CAPTAIN</option>
                                        <option value="Vice Captain">VICE CAPTAIN</option>
                                    </select>
                                ) : (
                                    <div className="text-xl font-black text-slate-800 uppercase">{player.playerDetails?.teamRole || 'PLAYER'}</div>
                                )}
                            </div>

                            <div className="space-y-1 col-span-2">
                                <div className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Nickname:</div>
                                {isEditing ? (
                                    <input value={editForm.nickname} onChange={e => setEditForm({ ...editForm, nickname: e.target.value })} className="bg-transparent border-b border-pink-300 font-black text-slate-800 uppercase focus:border-indigo-500 outline-none w-full" />
                                ) : (
                                    <div className="text-xl font-black text-slate-800 uppercase">{player.playerDetails?.nickname || '-'}</div>
                                )}
                            </div>

                            <div className="space-y-1 col-span-2">
                                <div className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Favorite Player:</div>
                                {isEditing ? (
                                    <input value={editForm.favoritePlayer} onChange={e => setEditForm({ ...editForm, favoritePlayer: e.target.value })} className="bg-transparent border-b border-pink-300 font-black text-slate-800 uppercase focus:border-indigo-500 outline-none w-full" />
                                ) : (
                                    <div className="text-base font-black text-slate-800 uppercase">{player.playerDetails?.favoritePlayer || '-'}</div>
                                )}
                            </div>

                            <div className="space-y-1 col-span-2">
                                <div className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Favorite WC Moment:</div>
                                {isEditing ? (
                                    <input value={editForm.favoriteWorldCupMoment} onChange={e => setEditForm({ ...editForm, favoriteWorldCupMoment: e.target.value })} className="bg-transparent border-b border-pink-300 font-black text-slate-800 uppercase focus:border-indigo-500 outline-none w-full" />
                                ) : (
                                    <div className="text-base font-black text-slate-800 uppercase">{player.playerDetails?.favoriteWorldCupMoment || '-'}</div>
                                )}
                            </div>

                            <div className="space-y-1 col-span-2">
                                <div className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Favorite Ground:</div>
                                {isEditing ? (
                                    <input value={editForm.favoriteGround} onChange={e => setEditForm({ ...editForm, favoriteGround: e.target.value })} className="bg-transparent border-b border-pink-300 font-black text-slate-800 uppercase focus:border-indigo-500 outline-none w-full" />
                                ) : (
                                    <div className="text-base font-black text-slate-800 uppercase">{player.playerDetails?.favoriteGround || '-'}</div>
                                )}
                            </div>
                        </div>

                        {/* BIO SECTION */}
                        <div className="mt-12 pt-12 border-t border-pink-100">
                            <div className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-4 italic">Biography</div>
                            {isEditing ? (
                                <textarea
                                    value={editForm.bio}
                                    onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                                    className="w-full bg-slate-50 rounded-2xl p-4 text-slate-600 text-sm border-2 border-pink-200 focus:border-indigo-500 outline-none h-32"
                                />
                            ) : (
                                <p className="text-slate-600 text-sm font-medium leading-relaxed">
                                    {player.bio || "A vital part of the team, bringing consistency and high-level performance to every match."}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* FOOTER ACTIONS */}
                    <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4 shrink-0">
                        <div className="flex gap-2">
                            {onUpdatePlayer && (
                                <button
                                    onClick={handleEditToggle}
                                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 ${isEditing ? 'bg-indigo-600 text-white' : 'bg-[#10B981] text-white'}`}
                                >
                                    {isEditing ? 'Save Changes' : 'Edit Profile'}
                                </button>
                            )}
                            {isEditing && onDeletePlayer && (
                                <button
                                    onClick={() => confirm(`Delete ${player.name}?`) && onDeletePlayer(player.id)}
                                    className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-red-600 text-white shadow-xl hover:bg-red-700 transition-all"
                                >
                                    Delete
                                </button>
                            )}
                            {!isEditing && (
                                <>
                                    {!player.userId && onClaim && (
                                        <button
                                            onClick={() => {
                                                if (confirm(`Are you sure this is you? This will send a claim request to the team admin.`)) {
                                                    onClaim(player.id);
                                                }
                                            }}
                                            className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white shadow-xl hover:bg-indigo-500 transition-all shadow-indigo-200"
                                        >
                                            Claim Profile
                                        </button>
                                    )}
                                    <button
                                        onClick={onToggleFollow}
                                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isFollowed ? 'bg-[#10B981] text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                                    >
                                        {isFollowed ? 'Following' : 'Follow'}
                                    </button>
                                </>
                            )}
                        </div>
                        <button
                            onClick={handleDetailedView}
                            className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-all flex items-center gap-2"
                        >
                            Analytics →
                        </button>
                    </div>

                    {/* DETAILED VIEW OVERLAY */}
                    {viewMode === 'DETAILED' && (
                        <div className="absolute inset-0 bg-[#FCE4EC] z-50 flex flex-col p-12 overflow-y-auto custom-scrollbar animate-in slide-in-from-right-10 duration-500">
                            <div className="flex justify-between items-center mb-8 shrink-0">
                                <button onClick={() => setViewMode('SUMMARY')} className="text-pink-600 font-black text-sm flex items-center gap-2 hover:gap-4 transition-all">← Back to Profile</button>
                                <div className="bg-white/50 backdrop-blur-md p-1 rounded-xl flex gap-1">
                                    {(['OFFICIAL', 'UNOFFICIAL'] as StatContext[]).map(ctx => (
                                        <button key={ctx} onClick={() => setStatContext(ctx)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${statContext === ctx ? 'bg-pink-600 text-white shadow-lg' : 'text-pink-400 hover:bg-pink-100'}`}>{ctx}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6 shrink-0">
                                {tabs.map(tab => (
                                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-pink-600 text-white shadow-xl' : 'bg-white text-pink-400 hover:bg-pink-50'}`}>{tab}</button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 gap-6 flex-1">
                                {activeTab === 'BATTING' && (
                                    <div className="bg-white rounded-[2rem] p-8 shadow-sm space-y-8">
                                        <div className="flex justify-between items-end border-b border-pink-50 pb-6">
                                            <div><div className="text-6xl font-black text-pink-600 leading-none">{calculatedStats.runs}</div><div className="text-xs font-bold text-pink-300 uppercase tracking-widest mt-2">Career Runs</div></div>
                                            <div className="text-right"><div className="text-4xl font-black text-slate-800 leading-none">{calculatedStats.highestScore || 0}</div><div className="text-[10px] font-bold text-pink-300 uppercase tracking-widest mt-1">High Score</div></div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            {[
                                                { l: 'Average', v: battingAvg }, { l: 'SR', v: battingSR }, { l: '100s', v: calculatedStats.hundreds },
                                                { l: '50s', v: calculatedStats.fifties }, { l: 'Ducks', v: calculatedStats.ducks }, { l: 'Fours', v: calculatedStats.fours }, { l: 'Sixes', v: calculatedStats.sixes }, { l: 'Matches', v: calculatedStats.matches }
                                            ].map((s, i) => (
                                                <div key={i} className="bg-pink-50/50 p-6 rounded-2xl border border-pink-100/50">
                                                    <div className="text-2xl font-black text-slate-800">{s.v}</div>
                                                    <div className="text-[10px] text-pink-300 uppercase tracking-widest font-black">{s.l}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'BOWLING' && (
                                    <div className="bg-white rounded-[2rem] p-8 shadow-sm space-y-8">
                                        <div className="flex justify-between items-end border-b border-pink-50 pb-6">
                                            <div><div className="text-6xl font-black text-indigo-600 leading-none">{calculatedStats.wickets}</div><div className="text-xs font-bold text-indigo-300 uppercase tracking-widest mt-2">Career Wickets</div></div>
                                            <div className="text-right"><div className="text-4xl font-black text-slate-800 leading-none">{calculatedStats.bestBowling || '-/-'}</div><div className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mt-1">Best Fig.</div></div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                            {[
                                                { l: 'Economy', v: bowlingEcon }, { l: 'Average', v: bowlingAvg }, { l: '5W Hauls', v: calculatedStats.fiveWickets },
                                                { l: '3W Hauls', v: calculatedStats.threeWickets }, { l: 'Maidens', v: calculatedStats.maidens }, { l: 'Overs', v: oversBowled }
                                            ].map((s, i) => (
                                                <div key={i} className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50">
                                                    <div className="text-2xl font-black text-slate-800">{s.v}</div>
                                                    <div className="text-[10px] text-indigo-300 uppercase tracking-widest font-black">{s.l}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'SPATIAL' && (
                                    <div className="bg-white rounded-[2rem] p-8 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-pink-400 uppercase tracking-widest text-center">Pitch Dispersion</h4>
                                            <div className="bg-pink-50 p-4 rounded-3xl"><PitchView deliveries={pitchData} readonly /></div>
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-pink-400 uppercase tracking-widest text-center">Wagon Wheel</h4>
                                            <div className="bg-pink-50 p-4 rounded-3xl"><FieldView shots={shotData} readonly /></div>
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'MATCHES' && (
                                    <div className="bg-white rounded-[2rem] p-8 shadow-sm space-y-4">
                                        <h3 className="text-sm font-black text-pink-600 uppercase tracking-widest mb-4">Match History</h3>
                                        <div className="space-y-3">
                                            {playerMatches.map(m => (
                                                <div key={m.id} onClick={() => onViewMatch && onViewMatch(m)} className="p-4 rounded-2xl border border-pink-100 hover:bg-pink-50 transition-all cursor-pointer flex justify-between items-center group">
                                                    <div>
                                                        <div className="text-[10px] text-pink-300 font-bold uppercase">{new Date(m.date).toLocaleDateString()}</div>
                                                        <div className="font-bold text-slate-800 text-sm group-hover:text-pink-600 transition-colors">{m.teamAName} vs {m.teamBName}</div>
                                                    </div>
                                                    <div className={`text-[10px] font-black uppercase px-2 py-1 rounded ${m.status === 'Completed' ? 'text-emerald-600' : 'text-amber-600'}`}>{m.status}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* EXIT BUTTON */}
                <button onClick={onClose} className="absolute top-8 right-8 z-[60] w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full text-white flex items-center justify-center transition-all border border-white/10 shadow-2xl md:hidden">✕</button>
            </div>
        </div>
    );
};
