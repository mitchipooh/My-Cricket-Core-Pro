
import React, { useState, useEffect, useMemo } from 'react';
import { MatchFixture, Team, Organization, UserProfile, MediaPost, MatchState, BallEvent } from '../../types';
import { getBallColor } from '../../utils/cricket-engine';
import { generateCommentary, generateEndOfOverCommentary } from '../../utils/commentaryGenerator.ts';
import { generateMatchNews } from '../../utils/newsGenerator.ts';
import { useMatchEngine } from '../../scoring/hooks/useMatchEngine.ts';
import { useScoringPad } from '../../scoring/hooks/useScoringPad.ts';
import { useMatchRules } from '../../scoring/hooks/useMatchRules.ts';
import { useDerivedStats } from '../../scoring/hooks/useDerivedStats.ts';
import { useWicketFlow } from '../../scoring/hooks/useWicketFlow.ts';
import { useInningsOverRateTimer } from '../../scoring/hooks/useInningsOverRateTimer.ts';

// Views
import { MobileScorerLayout } from './scorer-views/MobileScorerLayout.tsx';
import { MatchResultSummary } from '../display/MatchResultSummary.tsx';
import { FullMatchScorecard } from '../display/FullMatchScorecard.tsx';
import { BroadcasterView } from '../media/BroadcasterView.tsx';

// Modals
import { ShotEntryModal } from '../analytics/ShotEntryModal.tsx';
import { WicketModal } from '../modals/WicketModal.tsx';
import { EndOfOverModal } from '../modals/EndOfOverModal.tsx';
import { InningsBreakModal } from '../modals/InningsBreakModal.tsx';
import { MatchStartModal } from '../modals/MatchStartModal.tsx';
import { NewBatterModal } from '../modals/NewBatterModal.tsx';
import { PlayerEditModal } from '../modals/PlayerEditModal.tsx';
import { BallCorrectionModal } from '../modals/BallCorrectionModal.tsx';
import { CameraModal } from '../modals/CameraModal.tsx';
import { OfficialsModal } from '../modals/OfficialsModal.tsx';
import { checkEndOfInnings } from '../../scoring/engines/inningsEngine.ts';
import { generateMatchPDF } from './logic/generateMatchPDF.ts';
import { useAudioCommentary } from '../../hooks/useAudioCommentary.ts';
import { AudioCommentaryToggle } from './AudioCommentaryToggle.tsx';
import { AudioSettingsModal } from './AudioSettingsModal.tsx';
interface ScorerProps {
    match: MatchFixture;
    teams: Team[];
    userRole: UserProfile['role'];
    organizations: Organization[];
    onUpdateOrgs: (orgs: Organization[]) => void;
    onUpdateMatchState: (matchId: string, newState: MatchState, finalStatus?: MatchFixture['status']) => void;
    onComplete: () => void;
    onRequestNewMatch: () => void;
    onAddMediaPost: (post: MediaPost) => void;
    onExit: () => void;
    currentUserId: string;
    readOnly?: boolean;
}

export const Scorer: React.FC<ScorerProps> = ({
    match,
    teams,
    userRole,
    onUpdateMatchState,
    onComplete,
    onAddMediaPost,
    onExit,
    currentUserId,
    organizations,
    onUpdateOrgs,
    readOnly = false
}) => {

    // -- State Initialization --
    const initialMatchState: MatchState = match.savedState || {
        battingTeamId: match.teamAId,
        bowlingTeamId: match.teamBId,
        score: 0,
        wickets: 0,
        totalBalls: 0,
        strikerId: match.initialPlayers?.strikerId || '',
        nonStrikerId: match.initialPlayers?.nonStrikerId || '',
        bowlerId: match.initialPlayers?.bowlerId || '',
        innings: 1,
        history: [],
        inningsScores: [],
        isCompleted: false,
        matchTimer: { startTime: null, totalAllowances: 0, isPaused: false, lastPauseTime: null },
        umpires: match.umpires || []
    };

    const engine = useMatchEngine(initialMatchState);
    const pad = useScoringPad();
    const wicket = useWicketFlow();

    const battingTeam = teams.find(t => t.id === engine.state.battingTeamId);
    const bowlingTeam = teams.find(t => t.id === engine.state.bowlingTeamId);

    const rules = useMatchRules(match, engine.state, bowlingTeam);
    const stats = useDerivedStats(engine.state, rules.totalOversAllowed, battingTeam, bowlingTeam);

    const timer = useInningsOverRateTimer(
        engine.state.matchTimer.startTime,
        engine.state.totalBalls,
        !engine.state.isCompleted && !engine.state.matchTimer.isPaused
    );

    // -- UI State --
    const [showBroadcaster, setShowBroadcaster] = useState(false);
    const [showShotModal, setShowShotModal] = useState(false);
    const [showStartModal, setShowStartModal] = useState(!engine.state.strikerId && !match.savedState);
    const [showSubModal, setShowSubModal] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [autoAnalytics, setAutoAnalytics] = useState(false);
    const [showOfficialsModal, setShowOfficialsModal] = useState(false);

    // Audio Commentary
    const audioCommentary = useAudioCommentary();
    const [showAudioSettings, setShowAudioSettings] = useState(false);
    const [mobileTab, setMobileTab] = useState<'SCORING' | 'SCORECARD' | 'BALLS' | 'INFO' | 'SUMMARY'>('SCORING');

    const [inningsBreak, setInningsBreak] = useState<{ open: boolean; reason: string | null }>({ open: false, reason: null });

    const [correctionTarget, setCorrectionTarget] = useState<'bowler' | '@striker' | '@nonStriker' | null>(null);
    const [editingBall, setEditingBall] = useState<BallEvent | null>(null);
    const [newBatterTarget, setNewBatterTarget] = useState<'Striker' | 'NonStriker' | null>(null);
    const [postMatchView, setPostMatchView] = useState<'SUMMARY' | 'SCORECARD'>('SUMMARY');

    const isAuthorized = userRole === 'Scorer' || userRole === 'Administrator' || (userRole === 'Umpire' && match.umpires?.includes(currentUserId));

    const isLockedByOther = engine.state.activeScorerId && engine.state.activeScorerId !== currentUserId;
    const isReadOnly = !isAuthorized || isLockedByOther;

    const claimLock = () => {
        if (!engine.state.activeScorerId && currentUserId) {
            engine.updateMetadata({ activeScorerId: currentUserId });
        }
    };

    // Determine available officials from the relevant organization
    const availableOfficials = useMemo(() => {
        // Find org for this fixture
        const hostOrg = organizations.find(o => o.fixtures.some(f => f.id === match.id));
        if (!hostOrg) return [];

        return hostOrg.members
            .filter(m => m.role === 'Umpire' || m.role === 'Match Official')
            .map(m => ({ id: m.userId, name: m.name, handle: m.handle, role: 'Umpire', createdAt: m.addedAt } as UserProfile));
    }, [organizations, match.id]);

    // -- Derived Stats --
    const calculateScore = () => {
        const battingTeamId = engine.state.battingTeamId;
        const bowlingTeamId = engine.state.bowlingTeamId;

        // Use Test Engine helpers if available/imported, else direct calculation
        const inningsScores = engine.state.inningsScores || [];

        let leadText = '';
        let targetText = '';

        const battingCompleted = inningsScores.filter(is => is.teamId === battingTeamId && is.isComplete).reduce((a, b) => a + b.score, 0);
        const bowlingCompleted = inningsScores.filter(is => is.teamId === bowlingTeamId && is.isComplete).reduce((a, b) => a + b.score, 0);

        const currentScore = engine.state.score;
        const battingTotal = battingCompleted + currentScore;
        const bowlingTotal = bowlingCompleted + (engine.state.innings === 4 ? 0 : 0); // Logic depends on current state

        // Simplified Lead/Trail Logic
        if (engine.state.innings === 1) {
            // No lead/trail yet
        } else if (engine.state.innings === 2) {
            const inn1 = inningsScores.find(is => is.innings === 1);
            if (inn1) {
                const lead = battingTotal - inn1.score;
                if (lead > 0) leadText = `Lead by ${lead}`;
                else if (lead < 0) leadText = `Trail by ${Math.abs(lead)}`;
                else leadText = 'Scores Level';
            }
        } else if (engine.state.innings === 3) {
            // Aggregate check
            const lead = battingTotal - bowlingCompleted; // Bowling team has 1 completed (usually)
            // Correct logic: Team A (Batting) has Inn1 + Curr. Team B has Inn1.
            if (lead > 0) leadText = `Lead by ${lead}`;
            else leadText = `Trail by ${Math.abs(lead)}`;
        } else if (engine.state.innings === 4) {
            const target = (bowlingCompleted - battingCompleted) + 1;
            const needed = target - currentScore;
            targetText = `Target: ${target}`;
            if (needed > 0) leadText = `Need ${needed} to win`;
            else leadText = `Win by ${10 - engine.state.wickets} wickets`;
        }

        return { leadText, targetText };
    };

    const { leadText, targetText } = calculateScore();

    // -- Handlers --
    const handleLastHourTrigger = () => {
        engine.triggerLastHour();
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab === 'SUMMARY') {
            setMobileTab('SUMMARY');
        }
    }, []);

    useEffect(() => {
        onUpdateMatchState(match.id, engine.state);
    }, [engine.state, match.id]);

    useEffect(() => {
        const reason = checkEndOfInnings(engine.state, rules.totalOversAllowed, battingTeam?.players.length, match.allowFlexibleSquad, match.format);
        if (reason) {
            setInningsBreak({ open: true, reason });
        } else if (!engine.state.isCompleted && !showStartModal) {
            // Auto-prompt for new batter if someone is missing and innings is NOT over
            if (!engine.state.strikerId) setNewBatterTarget('Striker');
            else if (!engine.state.nonStrikerId) setNewBatterTarget('NonStriker');
        }
    }, [engine.state, rules.totalOversAllowed, battingTeam, match, showStartModal]);

    const handleRun = (runs: number) => {
        if (isReadOnly) return;
        claimLock();
        engine.applyBall({ runs });

        // Audio commentary with player context
        if (audioCommentary.enabled) {
            const striker = battingTeam?.players.find(p => p.id === engine.state.strikerId);
            const bowler = bowlingTeam?.players.find(p => p.id === engine.state.bowlerId);
            const commentary = generateCommentary({
                runs,
                batter: striker,
                bowler
            });
            audioCommentary.speak(commentary);

            // Check if over just completed (totalBalls is now divisible by 6)
            const ballsAfter = engine.state.totalBalls;
            if (ballsAfter > 0 && ballsAfter % 6 === 0) {
                // End of over - announce game update
                const overNumber = Math.floor(ballsAfter / 6);
                const striker = battingTeam?.players.find(p => p.id === engine.state.strikerId);
                const batterStats = stats.batterStats[engine.state.strikerId];

                const endOfOverCommentary = generateEndOfOverCommentary({
                    overNumber,
                    score: engine.state.score,
                    wickets: engine.state.wickets,
                    currentRunRate: stats.runRate.toString(),
                    innings: engine.state.innings,
                    target: engine.state.target,
                    requiredRate: stats.requiredRate.toString(),
                    batterName: striker?.name,
                    batterScore: batterStats?.runs,
                    projectedScore: engine.state.innings === 1 && stats.runRate ?
                        Math.round((stats.runRate || 0) * rules.totalOversAllowed) : undefined,
                    lead: engine.state.lead
                });

                // Delay end-of-over commentary slightly so it doesn't overlap with ball commentary
                setTimeout(() => {
                    audioCommentary.speak(endOfOverCommentary);
                }, 2000);
            }
        }

        if (autoAnalytics) setShowShotModal(true);
    };

    const handleCommitExtra = (type: string, runs: number, isOffBat?: boolean) => {
        if (isReadOnly) return;
        claimLock();
        let extraType: 'Wide' | 'NoBall' | 'Bye' | 'LegBye' | 'None' = 'None';
        if (type === 'Wide') extraType = 'Wide';
        if (type === 'NoBall') extraType = 'NoBall';
        if (type === 'Bye') extraType = 'Bye';
        if (type === 'LegBye') extraType = 'LegBye';

        engine.applyBall({
            extraType,
            extraRuns: isOffBat ? 0 : runs,
            runs: isOffBat ? runs : 0,
            batRuns: isOffBat ? runs : 0
        });

        // Audio commentary for extras
        if (audioCommentary.enabled) {
            const bowler = bowlingTeam?.players.find(p => p.id === engine.state.bowlerId);
            const commentary = generateCommentary({
                runs,
                isWide: extraType === 'Wide',
                isNoBall: extraType === 'NoBall',
                isBye: extraType === 'Bye',
                isLegBye: extraType === 'LegBye',
                bowler
            });
            audioCommentary.speak(commentary);
        }

        pad.resetPad();
        if (autoAnalytics) setShowShotModal(true);
    };

    const handleSwapBatters = () => {
        if (isReadOnly) return;
        const currentStriker = engine.state.strikerId;
        const currentNonStriker = engine.state.nonStrikerId;

        engine.updateMetadata({
            strikerId: currentNonStriker,
            nonStrikerId: currentStriker
        });
    };

    const startNextInnings = () => {
        if (isReadOnly) return;
        claimLock();
        if (match.format === 'Test' && engine.state.innings < 4) {
            const followOn = false;
            engine.endInnings(false);
            engine.startInnings(engine.state.bowlingTeamId, engine.state.battingTeamId, undefined, followOn);
        } else if (match.format !== 'Test' && engine.state.innings < 2) {
            engine.endInnings(false);
            engine.startInnings(engine.state.bowlingTeamId, engine.state.battingTeamId, engine.state.score + 1);
        } else if (match.format === 'Test' && engine.state.innings === 1) {
            engine.endInnings(false);
            engine.startInnings(engine.state.bowlingTeamId, engine.state.battingTeamId, engine.state.score + 1);
        }
        setInningsBreak({ open: false, reason: null });
        setShowStartModal(true);
    };

    // Calculate Lead/Trail message
    const leadMessage = useMemo(() => {
        if (targetText) return targetText;
        if (leadText) return leadText;
        // Fallback or legacy
        if (engine.state.target) {
            const needed = engine.state.target - engine.state.score;
            if (needed > 0) return `Target: ${engine.state.target} (${needed} to win)`;
            return `Target Reached`;
        }
        return null;
    }, [engine.state.target, engine.state.score, leadText, targetText]);


    const handleMatchFinish = () => {
        engine.endInnings(true);
        // Generat AI News
        const news = generateMatchNews(match, engine.state);
        onAddMediaPost(news);

        // Persist final status as 'Completed'
        onUpdateMatchState(match.id, engine.state, 'Completed');
        onComplete();
    };

    const handlePinToMedia = () => {
        const teamA = teams.find(t => t.id === match.teamAId);
        const teamB = teams.find(t => t.id === match.teamBId);

        let resultText = "Game in Progress";
        if (engine.state.isCompleted) {
            const scoreA = engine.state.inningsScores.find(i => i.teamId === teamA?.id)?.score || 0;
            const scoreB = engine.state.inningsScores.find(i => i.teamId === teamB?.id)?.score || 0;
            if (scoreA > scoreB) resultText = `${teamA?.name} won by ${scoreA - scoreB} runs`;
            else if (scoreB > scoreA) resultText = `${teamB?.name} won`;
            else resultText = "Match Tied";
        }

        const post: MediaPost = {
            id: `post-${Date.now()}`,
            type: 'LIVE_STATUS',
            authorName: 'Match Scorer',
            caption: `🏏 ${teamA?.name} vs ${teamB?.name}\nStatus: ${resultText}\nScore: ${engine.state.score}/${engine.state.wickets} (${Math.floor(engine.state.totalBalls / 6)}.${engine.state.totalBalls % 6} ov)`,
            timestamp: Date.now(),
            likes: [],
            dislikes: [],
            shares: 0,
            comments: [],
            matchId: match.id
        };

        onAddMediaPost(post);
        alert('Match summary pinned to Media Center!');
    };

    const handleManualConclude = () => {

        engine.endInnings(true);
        // Generate AI News
        const news = generateMatchNews(match, engine.state);
        onAddMediaPost(news);

        onUpdateMatchState(match.id, engine.state, 'Completed');
        onComplete();
    };

    const enforceFollowOn = () => {
        engine.startInnings(engine.state.battingTeamId, engine.state.bowlingTeamId, undefined, true);
        setInningsBreak({ open: false, reason: null });
    };

    const handleManualSave = () => {
        onUpdateMatchState(match.id, engine.state);
        alert('Game Saved Successfully!');
    };

    const canEnforceFollowOn = match.format === 'Test' && engine.state.innings === 2;

    const handleAnalyticsSave = (pitch?: { x: number, y: number }, shot?: { x: number, y: number }, height?: 'Ground' | 'Aerial') => {
        if (engine.state.history.length > 0) {
            engine.editBall(engine.state.history[0].timestamp, { pitchCoords: pitch, shotCoords: shot, shotHeight: height });
        }
    };

    const openScoreboardWindow = () => {
        const width = 800;
        const height = 600;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        window.open(
            `${window.location.origin}${window.location.pathname}?mode=scoreboard`,
            'ScoreboardWindow',
            `width=${width},height=${height},left=${left},top=${top}`
        );
    };

    const handleUpdateOfficials = (newUmpires: string[]) => {
        engine.updateMetadata({ umpires: newUmpires });
    };

    useEffect(() => {
        const channel = new BroadcastChannel('cricket_sync_channel');
        // Find host org to get settings
        const hostOrg = organizations.find(o => o.fixtures.some(f => f.id === match.id));

        channel.postMessage({
            type: 'UPDATE',
            state: engine.state,
            teams: { batting: battingTeam, bowling: bowlingTeam },
            sponsors: hostOrg?.sponsors || [],
            sponsorSettings: hostOrg?.sponsorSettings
        });
        return () => channel.close();
    }, [engine.state, battingTeam, bowlingTeam, organizations, match.id]);

    const getLastBall = () => engine.state.history[0];

    const striker = battingTeam?.players.find(p => p.id === engine.state.strikerId);
    const nonStriker = battingTeam?.players.find(p => p.id === engine.state.nonStrikerId);

    // Filter out dismissed players
    const dismissedPlayerIds = new Set(
        engine.state.history
            .filter(b => b.innings === engine.state.innings && b.isWicket && b.outPlayerId)
            .map(b => b.outPlayerId!)
    );

    // Determine Squad IDs for strict selection
    const battingSquadIds = (battingTeam?.id === match.teamAId ? match.teamASquadIds : match.teamBSquadIds) || [];
    const bowlingSquadIds = (bowlingTeam?.id === match.teamAId ? match.teamASquadIds : match.teamBSquadIds) || [];
    const isStrictSquad = !match.allowFlexibleSquad;

    const selectableBatters = battingTeam?.players.filter(p =>
        // Not At Crease
        p.id !== engine.state.strikerId &&
        p.id !== engine.state.nonStrikerId &&
        // Not Dismissed
        !dismissedPlayerIds.has(p.id) &&
        // In Squad (if strict)
        (!isStrictSquad || battingSquadIds.length === 0 || battingSquadIds.includes(p.id))
    ) || [];

    const selectableBowlers = bowlingTeam?.players.filter(p =>
        // In Squad (if strict)
        (!isStrictSquad || bowlingSquadIds.length === 0 || bowlingSquadIds.includes(p.id))
    ) || [];

    const availableBatters = selectableBatters.filter(p => {
        // Exclude current batters
        if (p.id === engine.state.strikerId) return false;
        if (p.id === engine.state.nonStrikerId) return false;

        // Exclude dismissed batters in current innings
        const isDismissed = engine.state.history.some(ball =>
            ball.isWicket &&
            ball.outPlayerId === p.id &&
            ball.innings === engine.state.innings
        );
        if (isDismissed) return false;

        return true;
    });

    // --- FIX: END OF OVER LOGIC ---
    const currentOverIndex = Math.floor(engine.state.totalBalls / 6);
    const hasSelectedBowlerForThisOver = engine.state.history.some(b =>
        b.innings === engine.state.innings && // Filter by current innings
        b.over === currentOverIndex &&
        b.commentary?.startsWith('EVENT: New Bowler')
    );
    const needsBowlerChange = engine.state.totalBalls > 0 && engine.state.totalBalls % 6 === 0 && !engine.state.isCompleted && !hasSelectedBowlerForThisOver;

    if (engine.state.isCompleted) {
        if (postMatchView === 'SCORECARD') {
            return (
                <div className="h-full bg-slate-950">
                    <FullMatchScorecard
                        matchState={engine.state}
                        teamA={teams.find(t => t.id === match.teamAId)!}
                        teamB={teams.find(t => t.id === match.teamBId)!}
                        onBack={() => setPostMatchView('SUMMARY')}
                    />
                </div>
            );
        }
        return (
            <MatchResultSummary
                matchState={engine.state}
                teamA={teams.find(t => t.id === match.teamAId)!}
                teamB={teams.find(t => t.id === match.teamBId)!}
                format={match.format}
                onExit={onExit}
                onViewScorecard={() => setPostMatchView('SCORECARD')}
            />
        );
    }

    // Shared Props for children
    const isReadOnlyView = readOnly || isLockedByOther;

    const handleAddPlayer = (name: string, teamId: string) => {
        const newPlayer: React.ComponentProps<typeof MobileScorerLayout>['teams'][0]['players'][0] = {
            id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name,
            role: 'All-rounder',
            stats: {
                runs: 0, wickets: 0, ballsFaced: 0, ballsBowled: 0,
                runsConceded: 0, matches: 0, catches: 0, runOuts: 0,
                stumpings: 0, fours: 0, sixes: 0, hundreds: 0,
                fifties: 0, ducks: 0, threeWickets: 0, fiveWickets: 0, maidens: 0
            }
        };

        const org = organizations.find(o => o.memberTeams.some(t => t.id === teamId));
        if (org) {
            const updatedOrg = {
                ...org,
                memberTeams: org.memberTeams.map(t =>
                    t.id === teamId ? { ...t, players: [...t.players, newPlayer] } : t
                )
            };
            onUpdateOrgs(organizations.map(o => o.id === updatedOrg.id ? updatedOrg : o));
        }
    };

    const layoutProps = {
        match, engine, teams, battingTeam, bowlingTeam,
        stats, timer, pad, wicket, rules,
        onExit, isAuthorized: !isReadOnlyView,
        onComplete,
        handlers: {
            handleRun,
            handleCommitExtra,
            handleSwapBatters,
            handleMatchFinish,
            handleManualConclude,
            handleManualSave,
            openScoreboardWindow,
            handleUpdateOfficials,
            handleAnalyticsSave
        },
        modals: {
            setIsCameraOpen,
            setShowSubModal,
            setShowBroadcaster,
            setShowOfficialsModal,
            setShowShotModal,
            autoAnalytics,
            setAutoAnalytics,
            showShotModal,
            showStartModal,
            setShowStartModal,
            showSubModal,
            isCameraOpen,
            showOfficialsModal,
        },

        onBallClick: setEditingBall,
        mobileTab,
        setMobileTab,
        onEditPlayer: setCorrectionTarget,
        onPinToMedia: handlePinToMedia,
        onAddPlayer: handleAddPlayer,
        // onComplete: handleMatchFinish // Removed if redundant with onComplete above
    };


    return (
        <div className="h-full w-full relative">
            {isReadOnlyView && (
                <div className="absolute top-0 left-0 right-0 bg-indigo-600 text-white py-1 px-4 text-center text-[10px] font-black z-[100] shadow-lg flex items-center justify-center gap-2">
                    <span>👀</span> LIVE VIEW (READ ONLY) {isLockedByOther ? '• SCORED BY ANOTHER USER' : ''}
                </div>
            )}
            <MobileScorerLayout {...layoutProps} />

            {/* Audio Commentary Toggle */}
            <div className="fixed top-4 right-4 z-50">
                <AudioCommentaryToggle
                    enabled={audioCommentary.enabled}
                    speaking={audioCommentary.speaking}
                    onToggle={() => audioCommentary.setEnabled(!audioCommentary.enabled)}
                    onOpenSettings={() => setShowAudioSettings(true)}
                    isSupported={audioCommentary.isSupported}
                />
            </div>

            {/* Test Match Status Overlay (Optional) */}
            {/* Test Match Status Overlay */}
            {match.format === 'Test' && (
                <div className="fixed top-20 right-4 z-40 bg-slate-900/90 backdrop-blur text-white p-3 rounded-lg border border-slate-700 shadow-xl pointer-events-auto flex flex-col items-end gap-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                        Day {engine.state.currentDay || 1} • {engine.state.adjustments?.session || 'Session 1'}
                    </div>

                    <div className="font-mono text-sm font-bold text-white">
                        {leadMessage || 'Match in Progress'}
                    </div>

                    {engine.state.adjustments?.isLastHour ? (
                        <div className="mt-1 bg-amber-500/20 text-amber-400 px-2 py-1 rounded text-xs font-bold border border-amber-500/50 animate-pulse">
                            ⚠ LAST HOUR: {engine.state.adjustments.lastHourOversRemaining} Overs
                        </div>
                    ) : (
                        (!engine.state.adjustments?.concluded && !engine.state.isCompleted) && (
                            <button
                                onClick={handleLastHourTrigger}
                                className="mt-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] uppercase font-bold px-2 py-1 rounded border border-slate-600 transition-colors"
                            >
                                Signal Last Hour
                            </button>
                        )
                    )}
                </div>
            )}

            {/* GLOBAL MODALS */}
            <ShotEntryModal
                isOpen={showShotModal}
                onClose={() => setShowShotModal(false)}
                onSave={handleAnalyticsSave}
                existingPitch={getLastBall()?.pitchCoords}
                existingShot={getLastBall()?.shotCoords}
                existingHeight={getLastBall()?.shotHeight}
                ballColor={getLastBall() ? getBallColor(getLastBall()!) : undefined}
                isWaiting={!getLastBall() || (!!getLastBall()?.pitchCoords && !!getLastBall()?.shotCoords && !!getLastBall()?.shotHeight)}
            />

            <WicketModal
                open={wicket.isOpen}
                batters={[striker!, nonStriker!].filter(Boolean)}
                fielders={selectableBowlers}
                wicketType={wicket.wicketType}
                outPlayerId={wicket.outPlayerId}
                fielderId={wicket.fielderId}
                onSelectType={wicket.setWicketType}
                onSelectOutPlayer={wicket.setOutPlayerId}
                onSelectFielder={wicket.setFielderId}
                onConfirm={() => {
                    if (isReadOnly) return;
                    claimLock();
                    engine.recordWicket({ type: 'WICKET', wicketType: wicket.wicketType!, batterId: wicket.outPlayerId!, fielderId: wicket.fielderId || undefined });

                    // Audio commentary for wicket with player context
                    if (audioCommentary.enabled && wicket.wicketType) {
                        const striker = battingTeam?.players.find(p => p.id === engine.state.strikerId);
                        const nonStriker = battingTeam?.players.find(p => p.id === engine.state.nonStrikerId);
                        const bowler = bowlingTeam?.players.find(p => p.id === engine.state.bowlerId);
                        const outPlayer = [striker, nonStriker].find(p => p?.id === wicket.outPlayerId);
                        const fielderPlayer = bowlingTeam?.players.find(p => p?.id === wicket.fielderId);
                        const commentary = generateCommentary({
                            runs: 0,
                            wicketType: wicket.wicketType,
                            outPlayer,
                            fielder: fielderPlayer,
                            bowler
                        });
                        audioCommentary.speak(commentary);
                    }

                    wicket.reset();
                    if (autoAnalytics) setShowShotModal(true);
                }}
                onCancel={wicket.reset}
            />

            <EndOfOverModal
                isOpen={needsBowlerChange && isAuthorized}
                overNumber={Math.floor(engine.state.totalBalls / 6) + 1}
                bowlingTeamName={bowlingTeam?.name || ''}
                currentBowlerId={engine.state.bowlerId}
                bowlers={selectableBowlers}
                getAvailability={rules.getBowlerAvailability}
                onSelectBowler={(id) => engine.applyBall({ commentary: 'EVENT: New Bowler', bowlerId: id } as BallEvent)}
            />

            {inningsBreak.open && (
                <div className="fixed inset-0 z-[200]">
                    <MatchResultSummary
                        matchState={engine.state}
                        teamA={teams.find(t => t.id === match.teamAId)!}
                        teamB={teams.find(t => t.id === match.teamBId)!}
                        format={match.format}
                        onExit={() => setInningsBreak({ open: false, reason: null })}
                        onViewScorecard={() => {
                            setInningsBreak({ open: false, reason: null });
                            setMobileTab('SCORECARD');
                        }}
                        onPinToMedia={handlePinToMedia}
                        nextInningsAction={(() => {
                            const isTest = match.format === 'Test';
                            // Determine if match end
                            let isMatchEnd = false;
                            if (isTest) {
                                if (engine.state.innings === 4) isMatchEnd = true;
                                // Check if innings victory etc logic already handled by engine.state.isCompleted
                                if (engine.state.isCompleted) isMatchEnd = true;
                            } else {
                                if (engine.state.innings >= 2) isMatchEnd = true;
                            }

                            if (isMatchEnd) {
                                return { label: "Finalize Match Result", onClick: handleMatchFinish };
                            }
                            return { label: "Start Next Innings", onClick: startNextInnings };
                        })()}
                        followOnAction={canEnforceFollowOn ? { label: "Enforce Follow-On", onClick: enforceFollowOn } : undefined}
                    />
                </div>
            )}

            <MatchStartModal
                isOpen={showStartModal}
                battingPlayers={selectableBatters}
                bowlingPlayers={selectableBowlers}
                onConfirm={(sId, nsId, bId) => {
                    if (isReadOnly) return;
                    claimLock();
                    // 1. Immediate State Update (Crucial for UI)
                    engine.updateMetadata({ strikerId: sId, nonStrikerId: nsId, bowlerId: bId });

                    // 2. Record Event (Logged in history)
                    setTimeout(() => {
                        engine.applyBall({
                            commentary: 'EVENT: Match Started',
                            strikerId: sId,
                            nonStrikerId: nsId,
                            bowlerId: bId,
                            innings: engine.state.innings
                        } as any);
                    }, 50);

                    setShowStartModal(false);
                }}
                onAddPlayer={handleAddPlayer}
                battingTeamId={battingTeam?.id}
                bowlingTeamId={bowlingTeam?.id}
            />

            {pad.padView === 'bowler_replacement_select' && (
                <NewBatterModal
                    isOpen={true}
                    teamName={bowlingTeam?.name || ''}
                    availableBatters={selectableBowlers.filter(p => p.id !== engine.state.bowlerId)}
                    targetRole="Striker"
                    onSelect={(id) => { engine.replaceBowlerMidOver(id); pad.resetPad(); setCorrectionTarget(null); }}
                    onAddPlayer={handleAddPlayer}
                    teamId={bowlingTeam?.id}
                />
            )}

            {newBatterTarget && !showStartModal && isAuthorized && (
                <NewBatterModal
                    isOpen={true}
                    teamName={battingTeam?.name || ''}
                    availableBatters={availableBatters}
                    targetRole={newBatterTarget}
                    onSelect={(id) => {
                        // Properly update the batter position
                        if (newBatterTarget === 'Striker') {
                            engine.updateMetadata({ strikerId: id });
                        } else {
                            engine.updateMetadata({ nonStrikerId: id });
                        }
                        setNewBatterTarget(null);
                    }}
                    onAddPlayer={handleAddPlayer}
                    teamId={battingTeam?.id}
                />
            )}

            <CameraModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onUpload={(url, type) => {
                    onAddMediaPost({ id: Date.now().toString(), type, contentUrl: url, authorName: 'Scorer', caption: 'Match Moment', timestamp: Date.now(), likes: [], dislikes: [], shares: 0, comments: [] });
                    setIsCameraOpen(false);
                }}
            />

            {showBroadcaster && <BroadcasterView matchState={engine.state} battingTeam={battingTeam} bowlingTeam={bowlingTeam} onClose={() => setShowBroadcaster(false)} />}

            <OfficialsModal
                isOpen={showOfficialsModal}
                onClose={() => setShowOfficialsModal(false)}
                currentUmpires={engine.state.umpires || []}
                availableOfficials={availableOfficials}
                onSave={handleUpdateOfficials}
            />

            {correctionTarget && (
                <PlayerEditModal
                    isOpen={true}
                    onClose={() => setCorrectionTarget(null)}
                    teamName={correctionTarget === 'bowler' ? bowlingTeam?.name || '' : battingTeam?.name || ''}
                    currentPlayerId={correctionTarget === 'bowler' ? engine.state.bowlerId : (correctionTarget === '@striker' ? engine.state.strikerId : engine.state.nonStrikerId)}
                    currentPlayerName={
                        (correctionTarget === 'bowler'
                            ? bowlingTeam?.players?.find(p => p.id === engine.state.bowlerId)?.name
                            : battingTeam?.players?.find(p => p.id === (correctionTarget === '@striker' ? engine.state.strikerId : engine.state.nonStrikerId))?.name
                        ) || 'Unknown Player'
                    }
                    role={correctionTarget === 'bowler' ? 'Bowler' : (correctionTarget === '@striker' ? 'Striker' : 'NonStriker')}
                    availablePlayers={correctionTarget === 'bowler' ? selectableBowlers : availableBatters}
                    onReplace={(oldId, newId, role) => {
                        engine.correctPlayerIdentity(oldId, newId, role);
                        setCorrectionTarget(null);
                    }}
                    onRetire={(playerId, type) => {
                        engine.retireBatter(playerId, type);
                        setCorrectionTarget(null);
                        // Trigger new batter modal immediately
                        setTimeout(() => {
                            setNewBatterTarget(correctionTarget === '@striker' ? 'Striker' : 'NonStriker');
                        }, 100);
                    }}
                    onInjury={(newPlayerId) => {
                        engine.replaceBowlerMidOver(newPlayerId);
                        setCorrectionTarget(null);
                    }}
                />
            )}

            <BallCorrectionModal
                isOpen={!!editingBall}
                onClose={() => setEditingBall(null)}
                ball={editingBall}
                onSave={(updates) => {
                    if (editingBall) {
                        engine.editBall(editingBall.timestamp, updates);
                    }
                }}
            />

            {engine.state.isCompleted && postMatchView === 'SUMMARY' && (
                <MatchResultSummary
                    matchState={engine.state}
                    teamA={teams.find(t => t.id === match.teamAId)!}
                    teamB={teams.find(t => t.id === match.teamBId)!}
                    onExit={onExit}
                    onViewScorecard={() => setPostMatchView('SCORECARD')}
                    totalOvers={rules.totalOversAllowed}
                    onPinToMedia={handlePinToMedia}
                />
            )}

            {/* Audio Settings Modal */}
            <AudioSettingsModal
                isOpen={showAudioSettings}
                onClose={() => setShowAudioSettings(false)}
                voices={audioCommentary.voices}
                settings={audioCommentary.settings}
                onVoiceChange={audioCommentary.setVoice}
                onSpeedChange={audioCommentary.setSpeed}
                onPitchChange={audioCommentary.setPitch}
                onVolumeChange={audioCommentary.setVolume}
                onTest={() => audioCommentary.speak('This is a test of the audio commentary system. Four! Six! Wicket!')}
            />

        </div>
    );
};

