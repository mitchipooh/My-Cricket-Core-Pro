import React, { useState, useEffect } from 'react';
import { MatchFixture, Team, Organization, MatchState, Player, MediaPost } from '../../types';
import { ScoreSummaryWidget } from './ScoreSummaryWidget.tsx';
import { ActivePlayersWidget } from './ActivePlayersWidget.tsx';
import { TimelineWidget } from './TimelineWidget.tsx';
import { ControlPadWidget } from './ControlPadWidget.tsx';

interface LiveScorerProps {
    match: MatchFixture;
    teams: Team[];
    userRole: string;
    organizations: Organization[];
    onUpdateOrgs: (orgs: Organization[]) => void;
    onUpdateMatchState: (matchId: string, newState: MatchState, finalStatus?: MatchFixture['status']) => void;
    onComplete: () => void;
    onRequestNewMatch: () => void;
    onAddMediaPost: (post: MediaPost) => void;
    onExit: () => void;
    currentUserId: string;
}

export const LiveScorer: React.FC<LiveScorerProps> = ({
    match, teams, onUpdateMatchState, onExit
}) => {
    // --- MATCH LOGIC INITIALIZATION ---
    const [state, setState] = useState<MatchState>(() => match.savedState || {
        innings: 1,
        battingTeamId: match.teamAId,
        bowlingTeamId: match.teamBId,
        score: 0,
        wickets: 0,
        totalBalls: 0,
        inningsScores: [],
        strikerId: '',
        nonStrikerId: '',
        bowlerId: '',
        isCompleted: false,
        history: [],
        matchTimer: { startTime: Date.now(), totalAllowances: 0, isPaused: false, lastPauseTime: null }
    });

    useEffect(() => {
        if (match.savedState) setState(match.savedState);
    }, [match.savedState]);

    const battingTeam = teams.find(t => t.id === state.battingTeamId);

    // --- ACTIONS ---
    const handleInput = (val: string | number) => {
        const runs = typeof val === 'number' ? val : 0;
        const newBall = {
            timestamp: Date.now(),
            over: Math.floor(state.totalBalls / 6),
            ballNumber: (state.totalBalls % 6) + 1,
            strikerId: state.strikerId,
            bowlerId: state.bowlerId,
            runs: runs,
            isWicket: false,
            commentary: 'Ball bowled',
            innings: state.innings
        };
        const newState: MatchState = {
            ...state,
            score: state.score + runs,
            totalBalls: state.totalBalls + 1,
            history: [...state.history, newBall]
        };
        setState(newState);
        onUpdateMatchState(match.id, newState);
    };

    const handleWicket = () => {
        const newBall = {
            timestamp: Date.now(),
            over: Math.floor(state.totalBalls / 6),
            ballNumber: (state.totalBalls % 6) + 1,
            strikerId: state.strikerId,
            bowlerId: state.bowlerId,
            runs: 0,
            isWicket: true,
            wicketType: 'Bowled',
            commentary: 'Wicket!',
            innings: state.innings
        };
        const newState: MatchState = {
            ...state,
            wickets: state.wickets + 1,
            totalBalls: state.totalBalls + 1,
            history: [...state.history, newBall]
        };
        setState(newState);
        onUpdateMatchState(match.id, newState);
    };

    // FIXED SINGLE SCREEN LAYOUT WITHOUT SCROLL
    // Using CSS Grid to allocate space efficiently
    return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col z-50">
            {/* 1. Header (Fixed Height) */}
            <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2">
                    <button onClick={onExit} className="text-slate-400 hover:text-white">✕</button>
                    <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest block leading-none">{match.teamAName} vs {match.teamBName}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded">Live</span>
                </div>
            </div>

            {/* 2. Main Content Area (Flex Grow - Takes remaining space but no scroll) */}
            <div className="flex-1 flex flex-col min-h-0 p-2 gap-2">
                {/* Top Section: Summary & Players */}
                <div className="flex-[2] flex flex-col gap-2 min-h-0">
                    <ScoreSummaryWidget match={match} state={state} battingTeam={battingTeam} />
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <ActivePlayersWidget state={state} teams={teams} />
                    </div>
                </div>

                {/* Middle Section: Timeline (Fixed Height) */}
                <div className="shrink-0 h-10 mt-1">
                    <TimelineWidget state={state} />
                </div>

                {/* Bottom Section: Controls (Flex Grow to fill bottom) */}
                <div className="flex-[3] min-h-0 mt-1">
                    <ControlPadWidget onScoringInput={handleInput} onUndo={() => { }} onExtra={() => { }} onWicket={handleWicket} />
                </div>
            </div>
        </div>
    );
};
