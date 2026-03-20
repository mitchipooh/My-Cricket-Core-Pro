
import React, { useState, useMemo } from 'react';
import { MatchFixture, Team, PlayerMatchPerformance, MatchReportSubmission, Player } from '../../types';

interface MatchReportFormProps {
    fixture: MatchFixture;
    team: Team; // Kept for context of "My Team" vs "Opponent" if needed, but we rely more on fixture IDs now
    onCancel: () => void;
    onSubmit: (report: MatchReportSubmission) => void;
    currentUserId: string;
    allPlayers: Player[];
}

export const MatchReportForm: React.FC<MatchReportFormProps> = ({
    fixture,
    team,
    onCancel,
    onSubmit,
    currentUserId,
    allPlayers
}) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Summary Scores
    const [teamAScore, setTeamAScore] = useState('');
    const [teamAWickets, setTeamAWickets] = useState('');
    const [teamAOvers, setTeamAOvers] = useState('');
    const [teamBScore, setTeamBScore] = useState('');
    const [teamBWickets, setTeamBWickets] = useState('');
    const [teamBOvers, setTeamBOvers] = useState('');

    // Umpires
    const [umpire1, setUmpire1] = useState('');
    const [umpire2, setUmpire2] = useState('');

    // File Upload (Scorecard)
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [fileType, setFileType] = useState<'image' | 'pdf' | null>(null);

    // Players Logic
    const teamAPlayers = useMemo(() => {
        // Use squad IDs if available, otherwise filter by teamId (assuming allPlayers has context or we find by iterating teams)
        // Since allPlayers might be just Player[], we check if we can match by teamId if present, or we rely on fixture.teamASquadIds
        if (fixture.teamASquadIds) {
            return allPlayers.filter(p => fixture.teamASquadIds?.includes(p.id));
        }
        // Fallback: try to match by teamId property if it exists (cast to any for safety)
        return allPlayers.filter(p => (p as any).teamId === fixture.teamAId);
    }, [allPlayers, fixture]);

    const teamBPlayers = useMemo(() => {
        if (fixture.teamBSquadIds) {
            return allPlayers.filter(p => fixture.teamBSquadIds?.includes(p.id));
        }
        return allPlayers.filter(p => (p as any).teamId === fixture.teamBId);
    }, [allPlayers, fixture]);

    // Initialize performances for ALL players
    const [performances, setPerformances] = useState<PlayerMatchPerformance[]>(() => {
        const allMatchPlayers = [...teamAPlayers, ...teamBPlayers];
        return allMatchPlayers.map(p => ({
            playerId: p.id,
            playerName: p.name,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            wickets: 0,
            overs: 0,
            maidens: 0,
            runsConceded: 0,
            catches: 0,
            stumpings: 0,
            runOuts: 0
        }));
    });

    // Ratings State
    const [umpire1Rating, setUmpire1Rating] = useState(0);
    const [umpire1Comment, setUmpire1Comment] = useState('');
    const [umpire2Rating, setUmpire2Rating] = useState(0);
    const [umpire2Comment, setUmpire2Comment] = useState('');

    const [pitchRating, setPitchRating] = useState(0);
    const [outfieldRating, setOutfieldRating] = useState(0);
    const [facilityRating, setFacilityRating] = useState(0);
    const [facilityComment, setFacilityComment] = useState('');

    const [spiritRating, setSpiritRating] = useState(0);
    const [spiritComment, setSpiritComment] = useState('');

    const [activeTab, setActiveTab] = useState<'TEAM_A' | 'TEAM_B'>('TEAM_A');

    const handlePerformanceChange = (playerId: string, field: keyof PlayerMatchPerformance, value: number) => {
        setPerformances(prev => prev.map(p => p.playerId === playerId ? { ...p, [field]: value } : p));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPhotoUrl(url);
            setFileType(file.type === 'application/pdf' ? 'pdf' : 'image');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const report: MatchReportSubmission = {
            id: `report-${Date.now()}`,
            matchId: fixture.id,
            submittedBy: currentUserId,
            timestamp: Date.now(),
            status: 'PENDING',
            teamAScore: parseInt(teamAScore) || 0,
            teamAWickets: parseInt(teamAWickets) || 0,
            teamAOvers: teamAOvers || '0',
            teamBScore: parseInt(teamBScore) || 0,
            teamBWickets: parseInt(teamBWickets) || 0,
            teamBOvers: teamBOvers || '0',
            playerPerformances: performances,
            scorecardPhotoUrl: photoUrl || undefined,
            umpires: [umpire1, umpire2].filter(Boolean),
            umpireRatings: {
                ...(umpire1 ? { [umpire1]: { rating: umpire1Rating, comment: umpire1Comment } } : {}),
                ...(umpire2 ? { [umpire2]: { rating: umpire2Rating, comment: umpire2Comment } } : {})
            },
            facilityRating: {
                pitch: pitchRating,
                outfield: outfieldRating,
                facilities: facilityRating,
                comment: facilityComment
            },
            spiritRating: {
                rating: spiritRating,
                comment: spiritComment
            }
        };
        onSubmit(report);
    };

    // Filter displayed performances based on active tab
    const currentTeamPlayers = activeTab === 'TEAM_A' ? teamAPlayers : teamBPlayers;
    const currentTeamName = activeTab === 'TEAM_A' ? fixture.teamAName : fixture.teamBName;

    return (
        <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-slate-100 max-w-5xl mx-auto min-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Match Report</h2>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-1">
                        {fixture.format} • {fixture.venue}
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className={`w-3 h-3 rounded-full transition-all ${step === 1 ? 'bg-indigo-600 scale-125' : 'bg-slate-200'}`}></div>
                    <div className={`w-3 h-3 rounded-full transition-all ${step === 2 ? 'bg-indigo-600 scale-125' : 'bg-slate-200'}`}></div>
                    <div className={`w-3 h-3 rounded-full transition-all ${step === 3 ? 'bg-indigo-600 scale-125' : 'bg-slate-200'}`}></div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                {step === 1 ? (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
                        {/* SCORE SUMMARY */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* TEAM A INPUTS */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-slate-900 border-b-2 border-slate-100 pb-2 flex justify-between">
                                    {fixture.teamAName}
                                    <span className="text-slate-300 text-sm">Team A</span>
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Runs</label>
                                        <input type="number" min="0" value={teamAScore} onChange={e => setTeamAScore(e.target.value)} className="w-full bg-white border-2 border-slate-200 focus:border-indigo-500 rounded-2xl px-5 py-4 font-black text-slate-900 text-lg outline-none focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-300" placeholder="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Wkts</label>
                                        <input type="number" min="0" max="10" value={teamAWickets} onChange={e => setTeamAWickets(e.target.value)} className="w-full bg-white border-2 border-slate-200 focus:border-indigo-500 rounded-2xl px-5 py-4 font-black text-slate-900 text-lg outline-none focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-300" placeholder="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Overs</label>
                                        <input type="text" value={teamAOvers} onChange={e => setTeamAOvers(e.target.value)} className="w-full bg-white border-2 border-slate-200 focus:border-indigo-500 rounded-2xl px-5 py-4 font-black text-slate-900 text-lg outline-none focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-300" placeholder="0.0" />
                                    </div>
                                </div>
                            </div>

                            {/* TEAM B INPUTS */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-slate-900 border-b-2 border-slate-100 pb-2 flex justify-between">
                                    {fixture.teamBName}
                                    <span className="text-slate-300 text-sm">Team B</span>
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Runs</label>
                                        <input type="number" min="0" value={teamBScore} onChange={e => setTeamBScore(e.target.value)} className="w-full bg-white border-2 border-slate-200 focus:border-indigo-500 rounded-2xl px-5 py-4 font-black text-slate-900 text-lg outline-none focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-300" placeholder="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Wkts</label>
                                        <input type="number" min="0" max="10" value={teamBWickets} onChange={e => setTeamBWickets(e.target.value)} className="w-full bg-white border-2 border-slate-200 focus:border-indigo-500 rounded-2xl px-5 py-4 font-black text-slate-900 text-lg outline-none focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-300" placeholder="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Overs</label>
                                        <input type="text" value={teamBOvers} onChange={e => setTeamBOvers(e.target.value)} className="w-full bg-white border-2 border-slate-200 focus:border-indigo-500 rounded-2xl px-5 py-4 font-black text-slate-900 text-lg outline-none focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-300" placeholder="0.0" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MATCH INFO Inputs */}
                        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Umpire 1</label>
                                <input type="text" value={umpire1} onChange={e => setUmpire1(e.target.value)} className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300" placeholder="Name" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Umpire 2</label>
                                <input type="text" value={umpire2} onChange={e => setUmpire2(e.target.value)} className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300" placeholder="Name" />
                            </div>
                        </div>

                        {/* FILE UPLOAD */}
                        <div className="mt-8 bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100">
                            <h3 className="text-xl font-black text-indigo-900 mb-6 flex items-center gap-2">
                                <span>📄</span> Scorecard File
                                <span className="text-[10px] bg-white text-indigo-500 px-2 py-1 rounded-md uppercase tracking-wider">Required</span>
                            </h3>
                            <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 rounded-[2rem] p-10 bg-white/50 hover:bg-white transition-all group cursor-pointer">
                                {photoUrl ? (
                                    <div className="relative w-full h-48 rounded-2xl overflow-hidden shadow-lg bg-white flex items-center justify-center">
                                        {fileType === 'image' ? (
                                            <img src={photoUrl} className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="text-center p-6">
                                                <span className="text-4xl">📑</span>
                                                <p className="font-black text-slate-900 mt-2">PDF Document Uploaded</p>
                                            </div>
                                        )}
                                        <button type="button" onClick={(e) => { e.preventDefault(); setPhotoUrl(null); }} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-xl hover:bg-red-600 transition-colors z-10">✕</button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-500 mb-4 mx-auto group-hover:scale-110 transition-transform">
                                            📤
                                        </div>
                                        <p className="text-indigo-900 font-black uppercase text-xs tracking-widest">Click to upload Scorecard</p>
                                        <p className="text-slate-400 font-bold text-[10px] mt-2 italic">Support: JPG, PNG, PDF</p>
                                        <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-4 mt-auto pt-8">
                            <button type="button" onClick={onCancel} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-600 transition-colors">Cancel</button>
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                disabled={!teamAScore || !teamBScore || !photoUrl}
                                className="flex-[2] py-4 bg-indigo-600 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl hover:bg-indigo-500 disabled:opacity-50 disabled:grayscale transition-all"
                            >
                                Next: Player Stats →
                            </button>
                        </div>
                    </div>
                ) : step === 2 ? (
                    <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
                        {/* TEAM TABS */}
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner mb-6 mx-auto w-full max-w-md">
                            <button
                                type="button"
                                onClick={() => setActiveTab('TEAM_A')}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'TEAM_A' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {fixture.teamAName}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('TEAM_B')}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'TEAM_B' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {fixture.teamBName}
                            </button>
                        </div>

                        <div className="flex-1 overflow-visible">
                            <div className="flex justify-between items-center mb-4 px-2">
                                <h3 className="text-xl font-black text-slate-900">{currentTeamName} Performance</h3>
                                <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">{currentTeamPlayers.length} Players</span>
                            </div>

                            <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                                {currentTeamPlayers.map(p => {
                                    const perf = performances.find(perf => perf.playerId === p.id) || {
                                        runs: 0, balls: 0, wickets: 0, overs: 0, runsConceded: 0, catches: 0
                                    } as PlayerMatchPerformance;

                                    return (
                                        <div key={p.id} className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-200 hover:border-indigo-200 transition-all">
                                            <div className="flex justify-between items-center mb-4">
                                                <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{p.name}</p>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{p.role === 'All-rounder' ? 'All-Rndr' : p.role}</span>
                                            </div>
                                            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                                <div>
                                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Runs</label>
                                                    <input type="number" min="0" value={perf.runs} onChange={e => handlePerformanceChange(p.id, 'runs', parseInt(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-center outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50" />
                                                </div>
                                                <div>
                                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Balls</label>
                                                    <input type="number" min="0" value={perf.balls} onChange={e => handlePerformanceChange(p.id, 'balls', parseInt(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-center outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50" />
                                                </div>
                                                <div>
                                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Wkts</label>
                                                    <input type="number" min="0" value={perf.wickets} onChange={e => handlePerformanceChange(p.id, 'wickets', parseInt(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-center outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50" />
                                                </div>
                                                <div>
                                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Overs</label>
                                                    <input type="number" min="0" value={perf.overs} onChange={e => handlePerformanceChange(p.id, 'overs', parseInt(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-center outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50" />
                                                </div>
                                                <div>
                                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Conc</label>
                                                    <input type="number" min="0" value={perf.runsConceded} onChange={e => handlePerformanceChange(p.id, 'runsConceded', parseInt(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-center outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50" />
                                                </div>
                                                <div>
                                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Catch</label>
                                                    <input type="number" min="0" value={perf.catches} onChange={e => handlePerformanceChange(p.id, 'catches', parseInt(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-center outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex gap-4 mt-6 pt-6 border-t border-slate-100">
                            <button type="button" onClick={() => setStep(1)} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-600 transition-colors">← Back</button>
                            <button
                                type="button"
                                onClick={() => setStep(3)}
                                className="flex-[2] py-4 bg-indigo-600 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl hover:bg-indigo-500 transition-all"
                            >
                                Next: Ratings →
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
                        {/* STEP 3: RATINGS & FEEDBACK */}
                        <div className="space-y-8 overflow-y-auto custom-scrollbar max-h-[60vh] pr-2">

                            {/* UMPIRE RATINGS */}
                            {(umpire1 || umpire2) && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-black text-slate-900 border-b-2 border-slate-100 pb-2">Umpire Performance</h3>
                                    {[
                                        { name: umpire1, rating: umpire1Rating, setRating: setUmpire1Rating, comment: umpire1Comment, setComment: setUmpire1Comment },
                                        { name: umpire2, rating: umpire2Rating, setRating: setUmpire2Rating, comment: umpire2Comment, setComment: setUmpire2Comment }
                                    ].filter(u => u.name).map((u, idx) => (
                                        <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-bold text-slate-900">{u.name}</h4>
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => u.setRating(star)}
                                                            className={`text-2xl transition-transform hover:scale-110 ${star <= u.rating ? 'grayscale-0' : 'grayscale opacity-30'}`}
                                                        >
                                                            ⭐
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <input
                                                value={u.comment}
                                                onChange={e => u.setComment(e.target.value)}
                                                placeholder={`Feedback for ${u.name}...`}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* FACILITIES RATING */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-slate-900 border-b-2 border-slate-100 pb-2">Ground & Facilities</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { label: 'Pitch Quality', val: pitchRating, set: setPitchRating },
                                        { label: 'Outfield', val: outfieldRating, set: setOutfieldRating },
                                        { label: 'Facilities', val: facilityRating, set: setFacilityRating },
                                    ].map((item, idx) => (
                                        <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{item.label}</p>
                                            <div className="flex justify-center gap-1">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => item.set(star)}
                                                        className={`text-xl transition-transform hover:scale-110 ${star <= item.val ? 'grayscale-0' : 'grayscale opacity-30'}`}
                                                    >
                                                        ⭐
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <textarea
                                    value={facilityComment}
                                    onChange={e => setFacilityComment(e.target.value)}
                                    placeholder="Any comments on the ground conditions?"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 h-24 resize-none"
                                />
                            </div>

                            {/* SPIRIT OF THE GAME */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-slate-900 border-b-2 border-slate-100 pb-2">Spirit of the Game</h3>
                                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                                    <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                                        <p className="font-bold text-indigo-900 text-sm">Rate the opposition ({activeTab === 'TEAM_A' ? fixture.teamBName : fixture.teamAName}) behavior</p>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setSpiritRating(star)}
                                                    className={`text-3xl transition-transform hover:scale-110 ${star <= spiritRating ? 'grayscale-0' : 'grayscale opacity-30'}`}
                                                >
                                                    🤝
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <textarea
                                        value={spiritComment}
                                        onChange={e => setSpiritComment(e.target.value)}
                                        placeholder="Comments on sportsmanship..."
                                        className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 h-20 resize-none"
                                    />
                                </div>
                            </div>

                        </div>

                        <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100">
                            <button type="button" onClick={() => setStep(2)} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-600 transition-colors">← Back</button>
                            <button
                                type="submit"
                                className="flex-[2] py-4 bg-emerald-500 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl hover:bg-emerald-400 transition-all"
                            >
                                Submit Report ✓
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};
