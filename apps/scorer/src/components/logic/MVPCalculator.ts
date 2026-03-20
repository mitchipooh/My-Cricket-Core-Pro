import { MatchState, Player, BallEvent } from '../../../types';
import { getBattingStats, getBowlingStats } from '../../../scoring/MatchSelectors.ts';

export interface PlayerPerformance {
    playerId: string;
    points: number;
    stats: {
        runs: number;
        balls: number;
        wickets: number;
        runsConceded: number;
        catches: number;
        runOuts: number;
        stumpings: number;
    };
    breakdown: {
        battingPoints: number;
        bowlingPoints: number;
        fieldingPoints: number;
    };
}

const POINTS_SYSTEM = {
    RUN: 1,
    FOUR: 1,
    SIX: 2,
    WICKET: 20,
    MAIDEN: 4,
    DOT_BALL: 0.5,
    CATCH: 10,
    RUN_OUT: 15,
    STUMPING: 15,
    ECONOMY_BONUS: 10, // < 6 RPO
    STRIKE_RATE_BONUS: 10 // > 140 SR
};

export const calculateMVP = (matchState: MatchState, allPlayers: Player[]): PlayerPerformance[] => {
    const performances: PlayerPerformance[] = allPlayers.map(player => {
        let batPoints = 0;
        let bowlPoints = 0;
        let fieldingPoints = 0;
        let totalRuns = 0;
        let totalBalls = 0;
        let totalWickets = 0;
        let totalRunsConceded = 0;
        let totalMaidens = 0;
        let totalCatches = 0;
        let totalRunOuts = 0;
        let totalStumpings = 0;

        // Iterate through all possible innings (1-4)
        [1, 2, 3, 4].forEach(innings => {
            // 1. Batting Stats
            const batStats = getBattingStats(player.id, matchState.history, innings);
            totalRuns += batStats.runs;
            totalBalls += batStats.balls;
            batPoints += (batStats.runs * POINTS_SYSTEM.RUN) + (batStats.fours * POINTS_SYSTEM.FOUR) + (batStats.sixes * POINTS_SYSTEM.SIX);

            // 2. Bowling Stats
            const bowlStats = getBowlingStats(player.id, matchState.history, innings);
            totalWickets += bowlStats.wickets;
            totalRunsConceded += bowlStats.runs;
            bowlPoints += (bowlStats.wickets * POINTS_SYSTEM.WICKET);

            // Manual Maiden Calculation
            const bowlerBalls = matchState.history.filter(b => b.bowlerId === player.id && b.innings === innings && (b.extraType === 'None' || !b.extraType));
            const overs: Record<number, number> = {};
            bowlerBalls.forEach(b => {
                overs[b.over] = (overs[b.over] || 0) + b.runs;
            });
            const maidens = Object.values(overs).filter(r => r === 0).length;
            totalMaidens += maidens;
            bowlPoints += (maidens * POINTS_SYSTEM.MAIDEN);

            // Dot Balls
            const dotBalls = matchState.history.filter(b => b.innings === innings && b.bowlerId === player.id && b.runs === 0 && (b.extraType === 'None' || !b.extraType)).length;
            bowlPoints += (dotBalls * POINTS_SYSTEM.DOT_BALL);
        });

        // Bonuses (Match Totals)
        if (totalRuns > 30 && totalBalls > 0 && ((totalRuns / totalBalls) * 100) > 140) batPoints += POINTS_SYSTEM.STRIKE_RATE_BONUS;
        if (totalRuns >= 50) batPoints += 20;
        if (totalRuns >= 100) batPoints += 40;

        if (totalWickets >= 3) bowlPoints += 20;
        if (totalWickets >= 5) bowlPoints += 40;

        // Economy Bonus (Approximate over match) - only if bowled > 2 overs
        const totalOversBowledCount = matchState.history.filter(b => b.bowlerId === player.id && (b.extraType === 'None' || !b.extraType)).length;
        const totalOversBowled = totalOversBowledCount / 6;

        if (totalOversBowled >= 2 && (totalRunsConceded / totalOversBowled) < 6.0) bowlPoints += POINTS_SYSTEM.ECONOMY_BONUS;

        // 3. Fielding Stats
        matchState.history.forEach(b => {
            if (b.isWicket) {
                if (b.fielderId === player.id) {
                    if (b.wicketType === 'Caught') { totalCatches++; fieldingPoints += POINTS_SYSTEM.CATCH; }
                    if (b.wicketType === 'Run Out') { totalRunOuts++; fieldingPoints += POINTS_SYSTEM.RUN_OUT; }
                    if (b.wicketType === 'Stumped') { totalStumpings++; fieldingPoints += POINTS_SYSTEM.STUMPING; }
                }
                // Direct Hit / Assist logic could go here
                if (b.assistFielderId === player.id && b.wicketType === 'Run Out') {
                    fieldingPoints += (POINTS_SYSTEM.RUN_OUT / 2);
                }
            }
        });

        return {
            playerId: player.id,
            points: batPoints + bowlPoints + fieldingPoints,
            stats: {
                runs: totalRuns,
                balls: totalBalls,
                wickets: totalWickets,
                runsConceded: totalRunsConceded,
                catches: totalCatches,
                runOuts: totalRunOuts,
                stumpings: totalStumpings
            },
            breakdown: {
                battingPoints: batPoints,
                bowlingPoints: bowlPoints,
                fieldingPoints
            }
        };
    });

    return performances.sort((a, b) => b.points - a.points);
};
