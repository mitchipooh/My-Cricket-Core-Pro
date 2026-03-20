
/**
 * Cricket-Core 2026 Management System
 * Created by mitchipoohdevs
 */

import React, { useEffect, useState } from 'react';
import { MatchState, Team, Sponsor, SponsorSettings } from '../../types.ts';
import { getBattingStats, getBowlingStats } from '../../scoring/MatchSelectors.ts';
import { useBallTimeline } from '../../scoring/hooks/useBallTimeline.ts';
import { FullMatchScorecard } from './FullMatchScorecard.tsx';

// Internal types for the window
type ViewMode = 'LIVE' | 'CARD' | 'SQUADS';

export const ScoreboardWindow: React.FC = () => {
    const [data, setData] = useState<{
        state: MatchState | null;
        teams: { batting?: Team; bowling?: Team };
        sponsors?: Sponsor[];
        sponsorSettings?: SponsorSettings;
    }>({ state: null, teams: {} });

    const [activeTab, setActiveTab] = useState<ViewMode>('LIVE');
    const [isEditMode, setIsEditMode] = useState(false);
    const [customMessage, setCustomMessage] = useState('');
    const [showSponsors, setShowSponsors] = useState(true);

    useEffect(() => {
        const channel = new BroadcastChannel('cricket_sync_channel');
        channel.onmessage = (event) => {
            if (event.data.type === 'UPDATE') {
                setData({
                    state: event.data.state,
                    teams: event.data.teams,
                    sponsors: event.data.sponsors || [],
                    sponsorSettings: event.data.sponsorSettings
                });
            }
        };
        return () => channel.close();
    }, []);

    if (!data.state) {
        return (
            <div className="h-screen w-screen bg-slate-950 flex items-center justify-center flex-col text-slate-500">
                <div className="text-4xl animate-pulse mb-4">📡</div>
                <h1 className="text-xl font-black uppercase tracking-widest">Waiting for Live Feed...</h1>
                <p className="text-xs font-bold mt-2">Scoreboard will update automatically</p>
                <div className="mt-8 text-[10px] font-bold text-slate-700 uppercase tracking-widest">Powered by mitchipoohdevs</div>
            </div>
        );
    }

    const { state, teams, sponsors, sponsorSettings: settings } = data;

    const sponsorSettings = settings || {
        mediaTopHeight: 320,
        mediaBottomHeight: 320,
        scoreboardTopHeight: 400,
        scoreboardBottomHeight: 480
    };
    const striker = teams.batting?.players.find(p => p.id === state.strikerId);
    const nonStriker = teams.batting?.players.find(p => p.id === state.nonStrikerId);
    const bowler = teams.bowling?.players.find(p => p.id === state.bowlerId);

    const strikerStats = state.strikerId ? getBattingStats(state.strikerId, state.history, state.innings) : null;
    const nonStrikerStats = state.nonStrikerId ? getBattingStats(state.nonStrikerId, state.history, state.innings) : null;
    const bowlerStats = state.bowlerId ? getBowlingStats(state.bowlerId, state.history, state.innings) : null;

    const runRate = state.totalBalls > 0 ? ((state.score / state.totalBalls) * 6).toFixed(2) : '0.00';
    const reqRunRate = state.target && state.totalBalls < 120 // Assuming T20 base for calculation
        ? ((state.target - state.score) / ((120 - state.totalBalls) / 6)).toFixed(2)
        : null;

    // Runs off balls (This Over)
    const timeline = useBallTimeline(state).slice(0, 6).reverse();

    // Match Timer logic (simplified for display)
    const startTime = state.matchTimer.startTime;
    const elapsedTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const topSponsors = sponsors?.filter(s => s.isActive && s.placements.includes('SCOREBOARD_TOP')) || [];
    const bottomSponsors = sponsors?.filter(s => s.isActive && s.placements.includes('SCOREBOARD_BOTTOM')) || [];

    return (
        <div className="h-screen w-screen bg-slate-950 text-white overflow-hidden flex flex-col relative group">

            {/* EDIT OVERLAY TRIGGER */}
            <div className="absolute top-0 right-0 p-2 z-[60] opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setIsEditMode(!isEditMode)} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-xs font-bold uppercase backdrop-blur-md">
                    {isEditMode ? 'Close Edit' : 'Edit View'}
                </button>
            </div>

            {/* EDIT CONTROLS */}
            {isEditMode && (
                <div className="absolute top-10 right-2 bg-slate-800 p-4 rounded-xl shadow-2xl z-[60] border border-slate-700 w-64 space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Active Tab</label>
                        <div className="flex bg-slate-900 rounded p-1">
                            {(['LIVE', 'CARD', 'SQUADS'] as const).map(m => (
                                <button
                                    key={m}
                                    onClick={() => setActiveTab(m)}
                                    className={`flex-1 py-1 text-[9px] font-bold uppercase rounded ${activeTab === m ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Ticker Message</label>
                        <input
                            value={customMessage}
                            onChange={e => setCustomMessage(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                            placeholder="e.g. Lunch Break"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Show Sponsors</span>
                        <button
                            onClick={() => setShowSponsors(!showSponsors)}
                            className={`w-8 h-4 rounded-full relative transition-colors ${showSponsors ? 'bg-emerald-500' : 'bg-slate-600'}`}
                        >
                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showSponsors ? 'left-4.5' : 'left-0.5'}`} />
                        </button>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 relative bg-[#0f172a] overflow-hidden flex flex-col">
                {activeTab === 'LIVE' && (
                    <div className="flex-1 flex flex-col justify-end p-8 pb-4 relative">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none"></div>

                        {/* MATCH INFO HEADER */}
                        <div className="absolute top-8 left-8 flex gap-6 items-start">
                            <div className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-xl p-4 min-w-[150px] text-center">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Match Timer</div>
                                <div className="text-2xl font-mono font-bold text-white">{formatTime(elapsedTime)}</div>
                            </div>
                            {state.target && (
                                <div className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-xl p-4 min-w-[150px] text-center">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target</div>
                                    <div className="text-2xl font-mono font-bold text-white">{state.target}</div>
                                    <div className="text-[9px] font-bold text-indigo-400 mt-1 uppercase">Need {state.target - state.score} Runs</div>
                                </div>
                            )}
                            <div className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-xl p-4 min-w-[150px] text-center">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Run Rates</div>
                                <div className="flex justify-center gap-4">
                                    <div><div className="text-xl font-mono font-bold text-white">{runRate}</div><span className="text-[8px] uppercase text-slate-500">CRR</span></div>
                                    {reqRunRate && <div><div className="text-xl font-mono font-bold text-amber-500">{reqRunRate}</div><span className="text-[8px] uppercase text-slate-500">RRR</span></div>}
                                </div>
                            </div>
                        </div>

                        {/* MAIN SCOREBOARD BAR */}
                        <div className="flex items-end mb-4 relative z-10">
                            {/* Team & Score */}
                            <div className="bg-slate-900 text-white rounded-t-3xl rounded-bl-3xl p-8 shadow-2xl border-l-[12px] border-indigo-600 min-w-[420px] relative z-20">
                                <div className="flex items-center gap-6 mb-4">
                                    {teams.batting?.logoUrl && <img src={teams.batting.logoUrl} className="w-16 h-16 bg-white rounded-full p-1" />}
                                    <div>
                                        <h1 className="text-4xl font-black uppercase leading-none tracking-tight">{teams.batting?.name || 'Batting'}</h1>
                                        <p className="text-indigo-400 font-bold text-sm uppercase tracking-widest mt-1">{state.innings === 1 ? '1st Innings' : 'Chase'}</p>
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-6">
                                    <span className="text-7xl font-black tabular-nums tracking-tighter">{state.score}/{state.wickets}</span>
                                    <span className="text-3xl text-slate-400 font-bold">{Math.floor(state.totalBalls / 6)}.{state.totalBalls % 6} Ov</span>
                                </div>
                            </div>

                            {/* Batters Card */}
                            <div className="bg-slate-800/95 backdrop-blur text-white p-6 mb-0 ml-[-20px] pl-12 rounded-tr-[3rem] relative z-10 border-b-8 border-slate-900 flex-1 min-w-0 max-w-5xl flex justify-between items-center shadow-xl">
                                <div className="flex-1 flex items-center justify-around px-8">
                                    {/* Striker */}
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="font-black text-3xl leading-none flex items-center gap-3 justify-end mb-2">
                                                {striker?.name} <span className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_20px_#10b981]"></span>
                                            </div>
                                            <div className="text-emerald-300 font-mono font-bold text-2xl">
                                                {strikerStats?.runs}<span className="text-lg text-slate-500 ml-2">({strikerStats?.balls})</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-16 w-px bg-slate-600 mx-8"></div>

                                    {/* Non-Striker */}
                                    <div className="flex items-center gap-6 opacity-60">
                                        <div className="text-left">
                                            <div className="font-bold text-2xl leading-none text-slate-300 mb-2">
                                                {nonStriker?.name}
                                            </div>
                                            <div className="text-slate-400 font-mono font-bold text-xl">
                                                {nonStrikerStats?.runs}<span className="text-base text-slate-600 ml-2">({nonStrikerStats?.balls})</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BOWLER & THIS OVER */}
                        <div className="flex gap-6 relative z-10">
                            <div className="bg-white text-slate-900 rounded-[2rem] p-5 shadow-xl flex items-center gap-6 min-w-[400px]">
                                <div className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">Current Bowler</div>
                                <div>
                                    <div className="font-black text-2xl uppercase leading-none">{bowler?.name}</div>
                                    <div className="font-mono text-lg font-bold text-slate-600 mt-1">
                                        {bowlerStats?.wickets}-{bowlerStats?.runs} <span className="text-sm text-slate-400">({bowlerStats?.overs})</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-800/80 backdrop-blur rounded-[2rem] p-5 flex items-center gap-3 flex-1 shadow-xl border border-slate-700">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">This Over</div>
                                {timeline.map((ball) => (
                                    <div key={ball.id} className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${ball.color} text-white shadow-lg border-2 border-white/10`}>
                                        {ball.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'CARD' && teams.batting && teams.bowling && (
                    <div className="flex-1 overflow-y-auto p-8">
                        <FullMatchScorecard matchState={state} teamA={teams.batting} teamB={teams.bowling} />
                    </div>
                )}

                {activeTab === 'SQUADS' && (
                    <div className="flex-1 p-8 grid grid-cols-2 gap-8">
                        {[teams.batting, teams.bowling].map(t => t && (
                            <div key={t.id} className="bg-slate-800 rounded-2xl p-6">
                                <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                                    <img src={t.logoUrl} className="w-8 h-8 bg-white rounded-full" /> {t.name}
                                </h2>
                                <div className="grid grid-cols-1 gap-2">
                                    {t.players.map(p => (
                                        <div key={p.id} className="bg-slate-700/50 p-2 rounded flex justify-between">
                                            <span>{p.name}</span>
                                            <span className="text-slate-400 text-xs">{p.role}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* BOTTOM TICKER / SPONSORS */}
            <div className="bg-slate-900 border-t border-slate-800 shrink-0 relative z-30">
                {customMessage && (
                    <div className="bg-indigo-600 text-white py-1 px-4 text-xs font-black uppercase tracking-widest text-center animate-pulse">
                        {customMessage}
                    </div>
                )}
                <div className="bg-black py-1 text-center">
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Powered by mitchipoohdevs</p>
                </div>
            </div>
        </div>
    );
};

