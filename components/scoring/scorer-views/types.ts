import { MatchFixture, Team, MatchState } from '../../../types';
import { useMatchEngine } from '../../../scoring/hooks/useMatchEngine';
import { useScoringPad } from '../../../scoring/hooks/useScoringPad';
import { useWicketFlow } from '../../../scoring/hooks/useWicketFlow';
import { useInningsOverRateTimer } from '../../../scoring/hooks/useInningsOverRateTimer';
import { useDerivedStats } from '../../../scoring/hooks/useDerivedStats';
import { useMatchRules } from '../../../scoring/hooks/useMatchRules';

export interface ScorerLayoutProps {
    // Data
    match: MatchFixture;
    teams: Team[];
    battingTeam?: Team;
    bowlingTeam?: Team;

    // Hooks data
    engine: ReturnType<typeof useMatchEngine>;
    pad: ReturnType<typeof useScoringPad>;
    wicket: ReturnType<typeof useWicketFlow>;
    timer: ReturnType<typeof useInningsOverRateTimer>;
    stats: ReturnType<typeof useDerivedStats>;
    rules: ReturnType<typeof useMatchRules>;

    isAuthorized: boolean;

    // Navigation / Actions
    onExit: () => void;
    onComplete: () => void;

    // Handlers
    handlers: {
        handleRun: (runs: number) => void;
        handleCommitExtra: (type: string, runs: number, isOffBat?: boolean) => void;
        handleMatchFinish: () => void;
        handleManualConclude: () => void;
        handleManualSave: () => void;
        openScoreboardWindow: () => void;
        handleUpdateOfficials: (newUmpires: string[]) => void;
        handleAnalyticsSave: (pitch?: { x: number, y: number }, shot?: { x: number, y: number }) => void;
    };

    // Modal Controls
    modals: {
        setIsCameraOpen: (open: boolean) => void;
        setShowSubModal: (open: boolean) => void;
        setShowBroadcaster: (open: boolean) => void;
        setShowOfficialsModal: (open: boolean) => void;
        setShowShotModal: (open: boolean) => void;
        autoAnalytics: boolean;
        setAutoAnalytics: (val: boolean) => void;
    };

    // Player Correction
    onEditPlayer: (target: 'bowler' | '@striker' | '@nonStriker') => void;

    // Ball Correction
    onBallClick: (ballObj: any) => void;

    // Player Management
    onAddPlayer?: (name: string, teamId: string) => void;

    // Mobile Specific
    mobileTab: 'SCORING' | 'SCORECARD' | 'BALLS' | 'INFO' | 'SUMMARY';
    setMobileTab: (tab: 'SCORING' | 'SCORECARD' | 'BALLS' | 'INFO' | 'SUMMARY') => void;
    onPinToMedia?: () => void;
}
