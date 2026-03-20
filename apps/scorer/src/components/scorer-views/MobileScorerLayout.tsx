import React, { useState } from 'react';
import { ScorerLayoutProps } from './types';
import { ScoringPad } from '../ScoringPad';
import { FullMatchScorecard } from '../../display/FullMatchScorecard.tsx';
import { MatchResultSummary } from '../../display/MatchResultSummary.tsx';
import { MatchState, BallEvent } from '../../../types';
import { ShotMapPanel } from '../../analytics/ShotMapPanel.tsx';
import { AdvancedAnalysis } from '../../analytics/AdvancedAnalysis.tsx';
import { getBallColor } from '../../../utils/cricket-engine.ts';

export const MobileScorerLayout = ({
    match, engine, teams, battingTeam, bowlingTeam,
    stats, pad, wicket, rules, timer,
    onExit, isAuthorized,
    handlers, modals, onEditPlayer, onBallClick,
    mobileTab, setMobileTab, onPinToMedia, onComplete
}: ScorerLayoutProps) => {

    const [leftPanel, setLeftPanel] = useState<'SCORECARD' | 'BALLS' | 'INFO' | 'SUMMARY' | null>(null);
    const [rightPanel, setRightPanel] = useState<'SCORECARD' | 'BALLS' | 'INFO' | 'SUMMARY' | null>(null);
    const [showShotMapPanel, setShowShotMapPanel] = useState(false);
    const [showCopiedToast, setShowCopiedToast] = useState(false);
    const [isInternalFullscreen, setIsInternalFullscreen] = useState(!!document.fullscreenElement);

    React.useEffect(() => {
        // Auto-fullscreen when entering scoring mode
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        }

        const handleFullscreenChange = () => {
            setIsInternalFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const handleShareMatch = async () => {
        const url = new URL(window.location.origin + window.location.pathname);
        url.searchParams.set('matchId', match.id);
        url.searchParams.set('tab', 'FIXTURES'); // Fixtures tab has the Match Details logic
        url.searchParams.set('mode', 'media');

        const shareData = {
            title: `${match.teamAName} vs ${match.teamBName} - Live Score`,
            text: `Follow the live score of ${match.teamAName} vs ${match.teamBName} on Cricket-Core!`,
            url: url.toString()
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                // If sharing fails or cancelled, fallback to clipboard
                console.log('Share failed or cancelled:', err);
                navigator.clipboard.writeText(url.toString());
                setShowCopiedToast(true);
                setTimeout(() => setShowCopiedToast(false), 2000);
            }
        } else {
            navigator.clipboard.writeText(url.toString());
            setShowCopiedToast(true);
            setTimeout(() => setShowCopiedToast(false), 2000);
        }
    };

    const handleTabClick = (tab: typeof mobileTab) => {
        if (window.innerWidth < 1024) {
            setMobileTab(tab);
            return;
        }

        if (tab === 'SCORING') {
            setMobileTab('SCORING');
            return;
        }

        // Desktop logic: open in side panel if in SCORING mode
        if (mobileTab === 'SCORING') {
            if (leftPanel === tab) { setLeftPanel(null); return; }
            if (rightPanel === tab) { setRightPanel(null); return; }

            if (!leftPanel) setLeftPanel(tab);
            else setRightPanel(tab);
        } else {
            setMobileTab(tab);
        }
    };
    // const [mobileTab, setMobileTab] = useState<'SCORING' | 'SCORECARD' | 'BALLS' | 'INFO' | 'SUMMARY'>('SCORING'); // Lifted to parent

    const striker = battingTeam?.players.find(p => p.id === engine.state.strikerId);
    const nonStriker = battingTeam?.players.find(p => p.id === engine.state.nonStrikerId);
    const bowler = bowlingTeam?.players.find(p => p.id === engine.state.bowlerId);

    // Safety check for teams
    const teamA = teams.find(t => t.id === match.teamAId);
    const teamB = teams.find(t => t.id === match.teamBId);

    // Ball history helpers for BALLS tab - Ensure latest matches user expectation
    const reversedHistory = [...engine.state.history].sort((a, b) => b.timestamp - a.timestamp);

    // Helper to calculate runs needed
    const runsNeeded = engine.state.target ? engine.state.target - engine.state.score : 0;
    const ballsRemaining = (rules.totalOversAllowed * 6) - engine.state.totalBalls;

    // Helper inside the same file for now to keep logic tidy
    const renderTabContent = (tab: string) => {
        if (tab === 'SCORING') {
            return (
                <div className="h-full flex flex-col min-h-0">
                    {/* Scrollable Content Area - Score summary and tables */}
                    <div className="flex-1 overflow-y-auto px-4 pt-2 pb-2 space-y-4 no-scrollbar min-h-0">



                        {/* Match Summary Section - Compacted (approx 25% smaller) */}
                        <div className="text-center">
                            <div className="flex justify-between items-center mb-0.5">
                                <h2 className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{battingTeam?.name}</h2>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[8px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full border border-teal-100">
                                        ⏱️ {(() => {
                                            const s = timer?.elapsedSeconds || 0;
                                            const m = Math.floor(s / 60);
                                            const sec = s % 60;
                                            return `${m}:${sec.toString().padStart(2, '0')}`;
                                        })()}
                                    </span>
                                    <span className="text-[8px] font-bold text-gray-400 uppercase">{engine.state.innings === 1 ? '1st' : '2nd'} Inn</span>
                                </div>
                            </div>

                            {/* SCORE DISPLAY - Reduced Size */}
                            <div className="text-4xl font-black text-teal-900 mb-0.5 leading-none tracking-tight">
                                {engine.state.score}-{engine.state.wickets}
                                <span className="text-xs font-bold text-gray-400 ml-2">({Math.floor(engine.state.totalBalls / 6)}.{engine.state.totalBalls % 6})</span>
                            </div>

                            {/* MATCH STATS ROW - Compacted */}
                            <div className="flex justify-center gap-3 text-[9px] font-bold text-gray-600 mb-1.5">
                                <div className="flex items-center gap-1">
                                    <span className="text-[7px] text-gray-400 uppercase">Ex:</span>
                                    <span>{engine.state.history.filter(b => b.innings === engine.state.innings && b.extraRuns && b.extraRuns > 0).reduce((acc, b) => acc + (b.extraRuns || 0), 0) + engine.state.history.filter(b => b.innings === engine.state.innings && ['Wide', 'NoBall'].includes(b.extraType || '')).length}</span>
                                </div>
                                <div className="w-px h-3 bg-gray-200"></div>
                                <div className="flex items-center gap-1">
                                    <span className="text-[7px] text-gray-400 uppercase">CRR:</span>
                                    <span>{stats.runRate}</span>
                                </div>
                                {engine.state.innings === 2 && (
                                    <>
                                        <div className="w-px h-3 bg-gray-200"></div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[7px] text-gray-400 uppercase">RRR:</span>
                                            <span className="text-orange-600">{stats.requiredRate}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* CHASE EQUATION - Compact */}
                            {engine.state.innings === 2 && (
                                <div className="bg-orange-50 rounded-md py-1 px-3 border border-orange-100 mb-2 inline-block">
                                    <div className="text-[9px] font-black text-orange-600 uppercase tracking-tight">
                                        Need {runsNeeded} runs of {ballsRemaining} balls
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Batting Table - Ensuring Names are Visible */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                            <div className="flex bg-gray-50 px-2 py-1 text-[8px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                <div className="flex-1">Batsman</div>
                                <div className="w-7 text-center">R</div>
                                <div className="w-7 text-center">B</div>
                                <div className="w-5 text-center">4s</div>
                                <div className="w-5 text-center">6s</div>
                                <div className="w-8 text-center">SR</div>
                            </div>
                            {/* Render explicit Striker/NonStriker rows if IDs are set, even if player not found */}
                            {[engine.state.strikerId, engine.state.nonStrikerId].filter(Boolean).map(id => {
                                const p = battingTeam?.players.find(pl => pl.id === id);
                                const name = p?.name || 'Unknown Batter';
                                const s = stats.batterStats[id] || { runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 };
                                const isStriker = id === engine.state.strikerId;

                                return (
                                    <div key={id} className="flex items-center px-2 py-1 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors min-h-[32px]">
                                        <div onClick={() => pad.openBatterActions(isStriker ? 'striker' : 'nonStriker')} className="flex-1 font-bold text-gray-800 text-[11px] flex items-center cursor-pointer min-w-0">
                                            {isStriker
                                                ? <span className="bg-orange-500 text-white px-1.5 py-0.5 rounded text-[10px] truncate shadow-sm">{name}</span>
                                                : <span className="pl-1 truncate">{name}</span>
                                            }
                                        </div>

                                        {/* Edit Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditPlayer(isStriker ? '@striker' : '@nonStriker');
                                            }}
                                            className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-indigo-600 hover:bg-slate-100 rounded-full mr-1 transition-colors text-[10px]"
                                        >
                                            ✏️
                                        </button>

                                        <div className={`w-7 text-center font-black text-xs ${isStriker ? 'text-teal-700' : 'text-gray-900'}`}>{s.runs}</div>
                                        <div className="w-7 text-center text-[10px] text-gray-400 font-bold">{s.balls}</div>
                                        <div className="w-5 text-center text-[9px] text-gray-400">{s.fours}</div>
                                        <div className="w-5 text-center text-[9px] text-gray-400">{s.sixes}</div>
                                        <div className="w-8 text-center text-[8px] text-gray-400 font-mono tracking-tighter">{s.strikeRate}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Bowling Table */}
                        {engine.state.bowlerId && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                                {(() => {
                                    const bId = engine.state.bowlerId;
                                    const p = bowlingTeam?.players.find(pl => pl.id === bId);
                                    const name = p?.name || 'Unknown Bowler';
                                    const s = stats.bowlerStats[bId] || { overs: 0, maidens: 0, runs: 0, wickets: 0, economy: 0 };

                                    return (
                                        <div className="flex items-center px-2 py-1 min-h-[32px]">
                                            <div onClick={() => pad.startBowlerReplacement('correction')} className="flex-1 font-bold text-gray-800 text-[11px] pl-1 truncate cursor-pointer">{name}</div>

                                            {/* Edit Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditPlayer('bowler');
                                                }}
                                                className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-indigo-600 hover:bg-slate-100 rounded-full mr-1 transition-colors text-[10px]"
                                            >
                                                ✏️
                                            </button>

                                            <div className="w-7 text-center text-[10px] text-gray-400 font-bold">{s.overs}</div>
                                            <div className="w-7 text-center text-[10px] text-gray-400">{s.maidens}</div>
                                            <div className="w-7 text-center text-[10px] text-gray-400">{s.runs}</div>
                                            <div className="w-5 text-center font-black text-xs text-teal-700">{s.wickets}</div>
                                            <div className="w-8 text-center text-[8px] text-gray-400 font-mono tracking-tighter">{s.economy}</div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>

                    {/* Recent Activity Strip (Two Rows: Current and Previous Over) */}
                    <div className="shrink-0 bg-white border-y border-gray-200 py-2 relative shadow-inner z-10 flex flex-col gap-2">
                        {(() => {
                            const currentOverIndex = Math.floor(engine.state.totalBalls / 6);
                            const getBallsForOver = (overIdx: number) =>
                                engine.state.history.filter(b => b.innings === engine.state.innings && b.over === overIdx).reverse();

                            const currentOverBalls = getBallsForOver(currentOverIndex);
                            const prevOverBalls = currentOverIndex > 0 ? getBallsForOver(currentOverIndex - 1) : [];

                            const renderOverRow = (balls: BallEvent[], label: string, isCurrent: boolean) => (
                                <div className="flex items-center gap-2 px-4">
                                    <span className={`text-[8px] font-black uppercase shrink-0 w-12 tracking-tighter ${isCurrent ? 'text-teal-600' : 'text-gray-400'}`}>
                                        {label}
                                    </span>
                                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                                        {balls.length > 0 ? balls.map((b, i) => (
                                            <div key={i} className={`w-7 h-7 rounded-sm flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm border ${b.isWicket ? 'bg-red-500 text-white border-red-600' : (b.runs >= 4 ? 'bg-teal-600 text-white border-teal-700' : 'bg-gray-50 text-gray-600 border-gray-200')}`}>
                                                {b.isWicket ? 'W' : (b.runs + (b.extraRuns || 0))}
                                            </div>
                                        )) : <div className="text-[10px] text-gray-300 font-bold">Waiting...</div>}
                                    </div>
                                </div>
                            );

                            return (
                                <>
                                    {renderOverRow(currentOverBalls, `Over ${currentOverIndex + 1}`, true)}
                                    {currentOverIndex > 0 && renderOverRow(prevOverBalls, `Over ${currentOverIndex}`, false)}
                                </>
                            );
                        })()}
                    </div>

                    {/* Footer Section: Keypad - Fixed height/Compact, but grounded */}
                    <div className="shrink-0 bg-gray-200 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] z-20 rounded-t-3xl mt-[-10px] relative border-t border-gray-300 min-h-[224px]">

                        <div className="pb-safe pt-2 h-full">
                            <ScoringPad
                                padView={pad.padView}
                                striker={striker}
                                nonStriker={nonStriker}
                                bowlingTeam={bowlingTeam}
                                onRun={handlers.handleRun}
                                onCommitExtra={handlers.handleCommitExtra}
                                onStartWicket={wicket.start}
                                onNav={pad.setPadView}
                                onBack={pad.resetPad}
                                onMediaCapture={() => modals.setIsCameraOpen(true)}
                                onDeclare={engine.declareInnings}
                                onEndInnings={engine.concludeInnings}
                                onSubRequest={() => modals.setShowSubModal(true)}
                                onEndGame={handlers.handleManualConclude}
                                matchFormat={match.format}
                                onAnalyticsClick={() => setShowShotMapPanel(!showShotMapPanel)}
                                autoAnalytics={modals.autoAnalytics}
                                onToggleAnalytics={() => modals.setAutoAnalytics(!modals.autoAnalytics)}
                                onOfficialsClick={() => modals.setShowOfficialsModal(true)}
                                readOnly={!isAuthorized || engine.state.isCompleted}
                                compact={window.innerWidth < 1024}
                            />
                        </div>
                    </div>
                </div >
            );
        }

        if (tab === 'SCORECARD') {
            return (
                <div className="p-4 bg-gray-50 min-h-full">
                    {teamA && teamB && <FullMatchScorecard matchState={engine.state} teamA={teamA} teamB={teamB} />}
                </div>
            );
        }

        if (tab === 'SUMMARY') {
            return (
                <div className="h-full overflow-y-auto no-scrollbar relative">
                    <MatchResultSummary
                        matchState={engine.state}
                        teamA={teamA!}
                        teamB={teamB!}
                        format={match.format}
                        onExit={() => setMobileTab('SCORING')}
                        onViewScorecard={() => setMobileTab('SCORECARD')}
                        totalOvers={rules.totalOversAllowed}
                        onPinToMedia={onPinToMedia}
                    />

                </div>
            );
        }

        if (tab === 'BALLS') {
            return (
                <div className="p-4 space-y-2 overflow-y-auto h-full bg-gray-50">
                    {reversedHistory.map((b, i) => {
                        // Helper to find player details
                        const getPlayer = (id: string) => teams.flatMap(t => t.players).find(p => p.id === id);
                        const ballBowler = getPlayer(b.bowlerId);
                        const ballStriker = getPlayer(b.strikerId);
                        const isExtra = b.extraType && b.extraType !== 'None';

                        return (
                            <div
                                key={i}
                                onClick={() => onBallClick && onBallClick(b)}
                                className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors"
                            >
                                {/* Left: Over & Context */}
                                <div className="flex flex-col items-center min-w-[3rem] border-r border-gray-100 pr-3 mr-3">
                                    <div className="text-xs font-black text-gray-700">
                                        {b.over}.{b.ballNumber}
                                    </div>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 ${b.innings === 1 ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                                        Inn {b.innings}
                                    </span>
                                </div>

                                {/* Middle: Action Context */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] uppercase font-bold text-gray-400 mb-0.5 tracking-wider">
                                        {ballBowler?.name?.split(' ').pop() || 'Unknown'} to
                                    </div>
                                    <div className="text-xs font-bold text-gray-900 truncate">
                                        {ballStriker?.name || 'Unknown Batter'}
                                    </div>
                                    {b.isWicket && (
                                        <div className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                            WICKET ({b.wicketType})
                                        </div>
                                    )}
                                </div>

                                {/* Right: Score Result */}
                                <div className="flex flex-col items-end gap-1 text-right pl-2">
                                    <div className={`text-lg font-black leading-none ${b.isWicket ? 'text-red-500' : (b.runs >= 4 ? 'text-teal-600' : 'text-gray-800')}`}>
                                        {(() => {
                                            const penalty = (b.extraType === 'Wide' || b.extraType === 'NoBall') ? 1 : 0;
                                            return b.runs + (b.extraRuns || 0) + penalty;
                                        })()}
                                    </div>
                                    {isExtra && (
                                        <div className={`text-[9px] font-bold px-1 rounded uppercase ${b.extraType === 'Wide' ? 'text-blue-500 bg-blue-50' : 'text-orange-500 bg-orange-50'}`}>
                                            {b.extraType === 'NoBall' ? 'NB' : b.extraType === 'Wide' ? 'WD' : b.extraType}
                                            {(b.runs + (b.extraRuns || 0)) > 0 ? `+${b.runs + (b.extraRuns || 0)}` : ''}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }

        if (tab === 'INFO') {
            return (
                <div className="p-4 space-y-4 bg-gray-50 h-full overflow-y-auto no-scrollbar">
                    {/* Match Details */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2">Match Specification</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 font-bold uppercase tracking-tighter">Event</span>
                                <span className="font-black text-slate-800">{match.tournamentId ? 'League Match' : 'Friendly'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 font-bold uppercase tracking-tighter">Venue</span>
                                <span className="font-black text-slate-800">{match.venue || 'No venue set'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 font-bold uppercase tracking-tighter">Date</span>
                                <span className="font-black text-slate-800">{match.date ? new Date(match.date).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 font-bold uppercase tracking-tighter">Format</span>
                                <span className="font-black text-indigo-600">{match.format} ({rules.totalOversAllowed} Overs)</span>
                            </div>
                        </div>
                    </div>

                    {/* Officials */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2">Match Officials</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">⚖️</span>
                                <div className="text-xs">
                                    <div className="text-gray-400 font-bold uppercase text-[8px]">Umpires</div>
                                    <div className="font-black text-slate-800">{engine.state.umpires?.join(', ') || 'N/A'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">📝</span>
                                <div className="text-xs">
                                    <div className="text-gray-400 font-bold uppercase text-[8px]">Scorer</div>
                                    <div className="font-black text-slate-800">Assignee {match.scorerId ? '(Set)' : '(Auto)'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rosters */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                            <h3 className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-3">{battingTeam?.name} Squad</h3>
                            <div className="space-y-1.5">
                                {battingTeam?.players.map(p => (
                                    <div key={p.id} className={`text-[10px] font-bold ${p.id === engine.state.strikerId || p.id === engine.state.nonStrikerId ? 'text-teal-700' : 'text-gray-600'}`}>
                                        {p.name} {p.id === engine.state.strikerId ? '*' : ''}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                            <h3 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-3">{bowlingTeam?.name} Squad</h3>
                            <div className="space-y-1.5">
                                {bowlingTeam?.players.map(p => (
                                    <div key={p.id} className={`text-[10px] font-bold ${p.id === engine.state.bowlerId ? 'text-indigo-700' : 'text-gray-600'}`}>
                                        {p.name} {p.id === engine.state.bowlerId ? ' (B)' : ''}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Admin */}
                    {isAuthorized && (
                        <div className="bg-slate-900 rounded-2xl p-4 shadow-xl border border-slate-700">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Operations</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => modals.setShowOfficialsModal(true)} className="py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">
                                    Officials
                                </button>
                                <button onClick={handlers.handleManualConclude} className="py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">
                                    End Match
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        if (tab === 'ANALYSIS') {
            return (
                <AdvancedAnalysis
                    history={engine.state.history}
                    teams={teams}
                    battingTeamId={engine.state.battingTeamId}
                    bowlingTeamId={engine.state.bowlingTeamId}
                />
            );
        }

        return null;
    };

    return (
        <div className="h-full bg-white text-slate-900 flex flex-col w-full relative">
            {/* 1. Header & Tabs */}
            <div className="bg-white border-b border-gray-200 shrink-0 sticky top-0 z-50">
                <div className="flex justify-between items-center p-4 pb-2">
                    <button onClick={onExit} className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200">←</button>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-lg">Match Centre</span>
                        <button
                            onClick={toggleFullscreen}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                            title={isInternalFullscreen ? "Minimize" : "Maximize"}
                        >
                            {isInternalFullscreen ? '📉' : '📈'}
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={engine.undoBall}
                            disabled={!engine.canUndo || !isAuthorized}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${engine.canUndo && isAuthorized ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'bg-gray-100 text-gray-300'}`}
                        >
                            ↩️
                        </button>
                        <button
                            onClick={handlers.handleManualSave}
                            disabled={!isAuthorized}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isAuthorized ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-gray-100 text-gray-300'}`}
                            title="Save"
                        >
                            💾
                        </button>
                        <button
                            onClick={() => {
                                if (window.confirm('End Match?')) handlers.handleManualConclude();
                            }}
                            disabled={!isAuthorized}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isAuthorized ? 'bg-red-100 text-red-600 hover:bg-red-200 active:scale-90' : 'bg-gray-100 text-gray-300'}`}
                            title="End"
                        >
                            🏁
                        </button>
                        <button
                            onClick={onPinToMedia}
                            disabled={!isAuthorized}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isAuthorized ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200 active:scale-90' : 'bg-gray-100 text-gray-300'}`}
                            title="Post Update to Feed"
                        >
                            📢
                        </button>
                        <button onClick={handleShareMatch} className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center hover:bg-teal-200 transition-all active:scale-90 relative" title="Share Match">
                            🔗
                            {showCopiedToast && (
                                <div className="absolute -bottom-10 right-0 bg-gray-900 text-white text-[8px] font-black py-1 px-2 rounded uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-top-2 fade-in duration-200 z-50">
                                    Link Copied!
                                </div>
                            )}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex justify-around items-stretch border-t border-gray-100">
                    {['SCORING', 'SCORECARD', 'BALLS', 'ANALYSIS', 'SUMMARY', 'INFO'].map((tab, idx, arr) => (
                        <button
                            key={tab}
                            onClick={() => handleTabClick(tab as any)}
                            className={`flex-1 py-3 text-[9px] font-black uppercase tracking-tighter transition-all flex items-center justify-center text-center
                                ${mobileTab === tab || leftPanel === tab || rightPanel === tab
                                    ? 'text-teal-700 bg-teal-50/50 shadow-[inset_0_-2px_0_0_#0f766e]'
                                    : 'text-gray-400 hover:bg-gray-50'
                                }
                                ${idx < arr.length - 1 ? 'border-r border-gray-100' : ''}
                            `}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. Main Content Area */}
            <div className="flex-1 flex overflow-hidden bg-gray-50">
                {/* Left Side Panel (Desktop only) */}
                {leftPanel && mobileTab === 'SCORING' && (
                    <div className="hidden lg:block w-[400px] border-r border-gray-200 overflow-y-auto relative bg-white shadow-sm">
                        <div className="sticky top-0 right-0 p-2 flex justify-end z-20">
                            <button onClick={() => setLeftPanel(null)} className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center text-xs">✕</button>
                        </div>
                        {renderTabContent(leftPanel)}
                    </div>
                )}

                {/* Middle Column */}
                <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
                    {renderTabContent(mobileTab)}
                </div>

                {/* Right Side Panel (Desktop only) */}
                {rightPanel && mobileTab === 'SCORING' && (
                    <div className="hidden lg:block w-[400px] border-l border-gray-200 overflow-y-auto relative bg-white shadow-sm">
                        <div className="sticky top-0 right-0 p-2 flex justify-end z-20">
                            <button onClick={() => setRightPanel(null)} className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center text-xs">✕</button>
                        </div>
                        {renderTabContent(rightPanel)}
                    </div>
                )}

                {/* 4th Column: Shot Map Panel (Desktop only) */}
                {showShotMapPanel && mobileTab === 'SCORING' && (
                    <div className="hidden lg:block w-[320px] shrink-0 border-l border-slate-800 bg-slate-900 shadow-xl animate-in slide-in-from-right duration-300">
                        <ShotMapPanel
                            onSave={handlers.handleAnalyticsSave}
                            onClose={() => setShowShotMapPanel(false)}
                            existingPitch={reversedHistory[0]?.pitchCoords}
                            existingShot={reversedHistory[0]?.shotCoords}
                            existingHeight={reversedHistory[0]?.shotHeight}
                            ballColor={reversedHistory[0] ? getBallColor(reversedHistory[0]) : undefined}
                            isWaiting={!reversedHistory[0] || (!!reversedHistory[0]?.pitchCoords && !!reversedHistory[0]?.shotCoords && !!reversedHistory[0]?.shotHeight)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};


