import React, { useMemo } from 'react';
import { MatchState, Team, Player } from '../../types.ts';
import { getBattingStats, getBowlingStats } from '../../scoring/MatchSelectors.ts';
import { calculateMVP } from '../scoring/logic/MVPCalculator.ts';
import { buildBattingCard } from '../../scorer/scorecard/buildBattingCard.ts';
import { buildBowlingCard } from '../../scorer/scorecard/buildBowlingCard.ts';
import { generateMatchPDF } from '../scoring/logic/generateMatchPDF.ts';

interface MatchResultSummaryProps {
    matchState: MatchState;
    teamA: Team;
    teamB: Team;
    format?: string;
    onExit: () => void;
    onViewScorecard: () => void;
    totalOvers?: number;
    onPinToMedia?: () => void;
    nextInningsAction?: { label: string; onClick: () => void };
    followOnAction?: { label: string; onClick: () => void };
}


export const MatchResultSummary: React.FC<MatchResultSummaryProps> = ({
    matchState, teamA, teamB, format = 'Cricket Match', onExit, onViewScorecard, totalOvers = 20, onPinToMedia,
    nextInningsAction, followOnAction
}) => {

    // 4. PDF Generation
    // 4. PDF Generation
    const handleDownloadPDF = () => {
        generateMatchPDF(matchState, teamA, teamB, format);
    };
    const result = useMemo(() => {
        const scoreA = matchState.inningsScores.find(i => i.teamId === teamA.id)?.score || 0;
        const scoreB = matchState.inningsScores.find(i => i.teamId === teamB.id)?.score || 0;
        const wicketsB = matchState.inningsScores.find(i => i.teamId === teamB.id)?.wickets || 0;

        let text = "Match Concluded";
        let subText = "Scores Level";
        let winnerId = null;

        if (scoreA > scoreB) {
            text = `${teamA.name} Win`;
            subText = `by ${scoreA - scoreB} runs`;
            winnerId = teamA.id;
        } else if (scoreB > scoreA) {
            text = `${teamB.name} Win`;
            subText = `by ${10 - wicketsB} wickets`;
            winnerId = teamB.id;
        } else {
            text = "Match Tied";
        }
        return { text, subText, winnerId };
    }, [matchState, teamA, teamB]);

    // 2. MVP
    const mvp = useMemo(() => {
        const allPlayers = [...teamA.players, ...teamB.players];
        const ranked = calculateMVP(matchState, allPlayers);
        const top = ranked[0];
        const player = allPlayers.find(p => p.id === top.playerId);
        return { player, stats: top.stats, points: top.points };
    }, [matchState, teamA, teamB]);

    // 3. Innings Summaries (Top 3 Batters, Top 3 Bowlers)
    // 3. Innings Summaries (Top 3 Batters, Top 3 Bowlers)
    const getInningsSummary = (teamId: string, inningsNum: number) => {
        const team = teamId === teamA.id ? teamA : teamB;
        const oppTeam = teamId === teamA.id ? teamB : teamA;

        // Calculate Score from History (More robust than inningsScores)
        // Note: We use empty strings for striker/nonStriker as we just need the totals
        const battingCard = buildBattingCard(matchState.history, team.players, inningsNum, '', '');
        const score = battingCard.totalScore;

        // Top 3 Batters
        const batters = battingCard.rows
            .sort((a, b) => b.runs - a.runs)
            .slice(0, 3)
            .filter(b => b.balls > 0)
            .map(row => {
                const p = team.players.find(pl => pl.name === row.name) || { name: row.name, id: 'unknown' } as Player;
                return { p, s: { runs: row.runs, balls: row.balls } };
            });

        // Top 3 Bowlers (from opposition)
        // usage of getBowlingStats is fine, or we could use buildBowlingCard
        const bowlers = oppTeam.players
            .map(p => ({ p, s: getBowlingStats(p.id, matchState.history, inningsNum) }))
            .sort((a, b) => b.s.wickets - a.s.wickets || a.s.runs - b.s.runs)
            .slice(0, 3)
            .filter(b => parseFloat(b.s.overs) > 0);

        return { team, score, batters, bowlers };
    };

    // Determine Innings logic
    // If completed, we should have history for both.
    const firstBall = matchState.history.find(b => b.innings === 1);
    const firstStrikerId = firstBall?.strikerId;
    // Check which team the first striker belongs to
    // If no history (e.g. 0 balls bowled), fallback to battingTeamId
    let firstBatTeamId = matchState.battingTeamId;
    if (firstStrikerId) {
        if (teamA.players.some(p => p.id === firstStrikerId)) firstBatTeamId = teamA.id;
        else if (teamB.players.some(p => p.id === firstStrikerId)) firstBatTeamId = teamB.id;
    }

    // If we can't determine from players (shouldn't happen), check inningsScores fallback
    if (!firstBall && matchState.inningsScores.length > 0) {
        const log = matchState.inningsScores.find(i => i.innings === 1);
        if (log) firstBatTeamId = log.teamId;
    }

    const secondBatTeamId = firstBatTeamId === teamA.id ? teamB.id : teamA.id;

    const summary1 = getInningsSummary(firstBatTeamId, 1);
    const summary2 = getInningsSummary(secondBatTeamId, 2);

    // Live Stats Calculations
    const currentBatters = useMemo(() => {
        if (matchState.isCompleted) return [];
        const team = matchState.innings === 1 ? (firstBatTeamId === teamA.id ? teamA : teamB) : (secondBatTeamId === teamA.id ? teamA : teamB);
        return [matchState.strikerId, matchState.nonStrikerId]
            .filter(Boolean)
            .map(id => ({
                p: team.players.find(p => p.id === id),
                s: getBattingStats(id, matchState.history, matchState.innings)
            }));
    }, [matchState, teamA, teamB]);

    const currentBowler = useMemo(() => {
        if (matchState.isCompleted || !matchState.bowlerId) return null;
        const oppTeam = matchState.innings === 1 ? (secondBatTeamId === teamA.id ? teamA : teamB) : (firstBatTeamId === teamA.id ? teamA : teamB);
        return {
            p: oppTeam.players.find(p => p.id === matchState.bowlerId),
            s: getBowlingStats(matchState.bowlerId, matchState.history, matchState.innings)
        };
    }, [matchState, teamA, teamB]);

    const projections = useMemo(() => {
        if (matchState.isCompleted) return null;
        const crr = matchState.totalBalls > 0 ? (matchState.score / (matchState.totalBalls / 6)) : 0;
        const projected = crr * totalOvers;

        // RRR logic for 2nd innings
        let rrr = 0;
        let runsNeeded = 0;
        let ballsRemaining = 0;
        if (matchState.innings === 2 && matchState.target) {
            runsNeeded = matchState.target - matchState.score;
            ballsRemaining = (totalOvers * 6) - matchState.totalBalls;
            rrr = ballsRemaining > 0 ? (runsNeeded / (ballsRemaining / 6)) : 0;
        }

        return { crr: crr.toFixed(2), projected: Math.round(projected), rrr: rrr.toFixed(2), runsNeeded, ballsRemaining };
    }, [matchState, totalOvers]);

    return (
        <div className={`${matchState.isCompleted ? 'fixed inset-0 z-[200]' : 'absolute inset-0 z-50'} bg-gray-100 overflow-y-auto animate-in fade-in duration-200`}>
            <div className="max-w-md mx-auto min-h-screen bg-gray-50 shadow-2xl relative">

                {/* Header */}
                <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <img src="/logo.jpg" alt="Logo" className="h-8 w-8 object-contain" />
                        <div>
                            <h1 className="text-sm font-black text-gray-800 uppercase tracking-tight">
                                {matchState.isCompleted ? 'Match Result' : 'Match Summary'}
                            </h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{format}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {onPinToMedia && (
                            <button
                                onClick={onPinToMedia}
                                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-indigo-500 transition-all flex items-center gap-2"
                                title="Pin to Media Center"
                            >
                                📌 Pin
                            </button>
                        )}
                        <button onClick={onExit} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200">
                            ❌
                        </button>
                    </div>

                </div>

                <div className="p-4 space-y-6">
                    {/* Live Dashboard Section */}
                    {!matchState.isCompleted && (
                        <div className="space-y-4">
                            {/* Score & Projections */}
                            <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl border border-slate-800 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <span className="text-6xl font-black italic">LIVE</span>
                                </div>

                                <div className="flex justify-between items-end relative z-10">
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Score</div>
                                        <div className="text-4xl font-black text-white leading-none">
                                            {matchState.score}-{matchState.wickets}
                                            <span className="text-sm font-bold text-slate-500 ml-2">({Math.floor(matchState.totalBalls / 6)}.{matchState.totalBalls % 6})</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CRR</div>
                                        <div className="text-2xl font-black text-teal-400 leading-none">{projections?.crr}</div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between relative z-10">
                                    {matchState.innings === 1 ? (
                                        <>
                                            <div>
                                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Projected (at {projections?.crr})</div>
                                                <div className="text-lg font-black text-white">{projections?.projected}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Target Setting</div>
                                                <div className="text-lg font-black text-indigo-400 italic">Innings 1</div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Target: {matchState.target}</div>
                                                <div className="text-lg font-black text-white">{projections?.runsNeeded} <span className="text-[10px] text-slate-400 font-bold">REQD</span></div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">RRR</div>
                                                <div className="text-lg font-black text-orange-400">{projections?.rrr}</div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Current Batters & Bowler */}
                            <div className="grid grid-cols-1 gap-3">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                                        Active Batters
                                    </div>
                                    <div className="space-y-3">
                                        {currentBatters.map((b, i) => (
                                            <div key={i} className="flex justify-between items-center group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs">🏏</div>
                                                    <div>
                                                        <div className="text-xs font-black text-gray-800">{b.p?.name} {i === 0 ? '*' : ''}</div>
                                                        <div className="text-[9px] font-bold text-gray-400">Batting at Innings {matchState.innings}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-black text-gray-900">{b.s.runs} <span className="text-[10px] text-gray-400 font-normal">({b.s.balls})</span></div>
                                                    <div className="text-[8px] font-bold text-gray-400 uppercase">SR {b.s.sr}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {currentBowler && (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                            Active Bowler
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs">⚾</div>
                                                <div>
                                                    <div className="text-xs font-black text-gray-800">{currentBowler.p?.name}</div>
                                                    <div className="text-[9px] font-bold text-gray-400">Current Over</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-black text-teal-700">{currentBowler.s.wickets}-{currentBowler.s.runs} <span className="text-[10px] text-gray-400 font-normal">({currentBowler.s.overs})</span></div>
                                                <div className="text-[8px] font-bold text-gray-400 uppercase">ECON {currentBowler.s.econ}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Innings 1 Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-teal-600 p-3 flex justify-between items-center text-white">
                            <div className="font-bold text-sm tracking-wide">{summary1.team.name}</div>
                            <div className="font-black text-lg">{summary1.score}</div>
                        </div>
                        <div className="p-3 grid grid-cols-2 gap-4 text-[10px]">
                            <div className="space-y-1.5">
                                <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-1 mb-1 border-b border-gray-100 pb-1">Batters</div>
                                {summary1.batters.map((b, i) => (
                                    <div key={i} className="flex flex-col p-1.5 bg-gray-50 rounded border-l-2 border-teal-500">
                                        <div className="font-bold text-gray-700 truncate">{b.p.name}</div>
                                        <div className="font-black text-gray-900">{b.s.runs} <span className="text-gray-400 font-normal">({b.s.balls})</span></div>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-1.5 text-right">
                                <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-1 mb-1 border-b border-gray-100 pb-1">Bowlers</div>
                                {summary1.bowlers.map((b, i) => (
                                    <div key={i} className="flex flex-col p-1.5 bg-gray-50 rounded border-r-2 border-indigo-500">
                                        <div className="font-bold text-gray-700 truncate">{b.p.name}</div>
                                        <div className="font-black text-teal-600">{b.s.wickets}-{b.s.runs} <span className="text-gray-400 font-normal">({b.s.overs})</span></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Innings 2 Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-orange-500 p-3 flex justify-between items-center text-white">
                            <div className="font-bold text-sm tracking-wide">{summary2.team.name}</div>
                            <div className="font-black text-lg">{summary2.score}</div>
                        </div>
                        <div className="p-3 grid grid-cols-2 gap-4 text-[10px]">
                            <div className="space-y-1.5">
                                <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-1 mb-1 border-b border-gray-100 pb-1">Batters</div>
                                {summary2.batters.map((b, i) => (
                                    <div key={i} className="flex flex-col p-1.5 bg-gray-50 rounded border-l-2 border-orange-500">
                                        <div className="font-bold text-gray-700 truncate">{b.p.name}</div>
                                        <div className="font-black text-gray-900">{b.s.runs} <span className="text-gray-400 font-normal">({b.s.balls})</span></div>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-1.5 text-right">
                                <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-1 mb-1 border-b border-gray-100 pb-1">Bowlers</div>
                                {summary2.bowlers.map((b, i) => (
                                    <div key={i} className="flex flex-col p-1.5 bg-gray-50 rounded border-r-2 border-orange-500">
                                        <div className="font-bold text-gray-700 truncate">{b.p.name}</div>
                                        <div className="font-black text-orange-600">{b.s.wickets}-{b.s.runs} <span className="text-gray-400 font-normal">({b.s.overs})</span></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Result Banner (Only shown if completed) */}
                    {matchState.isCompleted && (
                        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-6 rounded-2xl text-center text-white shadow-lg animate-in zoom-in-95 duration-300">
                            <h2 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">{result.text}</h2>
                            <p className="text-sm font-bold opacity-90 uppercase tracking-widest">{result.subText}</p>
                        </div>
                    )}

                    {/* MVP Section (Only shown if completed) */}
                    {matchState.isCompleted && mvp.player && (
                        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                            <div className="inline-block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Man of the Match</div>
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 text-left">
                                <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden shrink-0">
                                    <img src={mvp.player.photoUrl || `https://ui-avatars.com/api/?name=${mvp.player.name}`} className="w-full h-full object-cover" />
                                </div >
                                <div>
                                    <div className="font-black text-gray-800">{mvp.player.name}</div>
                                    <div className="text-xs text-gray-500 font-medium mt-0.5">
                                        {mvp.stats.runs > 0 && <span className="mr-2">🏏 {mvp.stats.runs}</span>}
                                        {mvp.stats.wickets > 0 && <span>⚾ {mvp.stats.wickets}</span>}
                                    </div>
                                </div>
                                <div className="ml-auto text-right">
                                    <div className="text-xl font-black text-teal-600 leading-none">{Math.round(mvp.points)}</div>
                                    <div className="text-[9px] font-bold text-gray-400 uppercase">PTS</div>
                                </div>
                            </div >
                        </div >
                    )}

                    <div className="flex flex-col gap-3">
                        {/* Custom Actions (Next Innings / Follow On) */}
                        {nextInningsAction && (
                            <button
                                onClick={nextInningsAction.onClick}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl uppercase text-xs tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                            >
                                {nextInningsAction.label}
                            </button>
                        )}

                        {followOnAction && (
                            <button
                                onClick={followOnAction.onClick}
                                className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl uppercase text-xs tracking-widest shadow-lg shadow-amber-600/20 active:scale-95 transition-all border-2 border-amber-400"
                            >
                                {followOnAction.label}
                            </button>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={handleDownloadPDF} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-600/20">
                                Download PDF
                            </button>
                            <button onClick={onViewScorecard} className="w-full py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-colors">
                                View Scorecard
                            </button>
                        </div>

                        <button onClick={onExit} className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-lg">
                            <span>←</span>
                            <span>{matchState.isCompleted ? 'Return to Dashboard' : 'Back to Scoring'}</span>
                        </button>
                    </div>

                </div >
            </div >
        </div >
    );
};
