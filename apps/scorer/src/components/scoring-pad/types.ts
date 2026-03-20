import { PadView } from '../../../scoring/hooks/useScoringPad';
import { Player, Team } from '../../../types';

export interface ScoringPadProps {
    padView: PadView;
    striker?: Player;
    nonStriker?: Player;
    bowlingTeam?: Team;
    onRun: (runs: number) => void;
    onCommitExtra: (type: string, runs: number, isOffBat?: boolean) => void;
    onStartWicket: (defaultBatterId?: string) => void;
    onNav: (view: PadView) => void;
    onBack: () => void;
    onMediaCapture?: () => void;
    onDeclare?: () => void;
    onEndInnings?: () => void;
    onSubRequest?: () => void;
    onEndGame?: () => void;
    matchFormat?: string;
    onAnalyticsClick?: () => void;
    onBroadcasterMode?: () => void;
    autoAnalytics?: boolean;
    onToggleAnalytics?: () => void;
    onOfficialsClick?: () => void;
    readOnly?: boolean;
    compact?: boolean;
}
