import { BallEvent, Player, BowlingCardRow } from '../types.ts';
import { isLegalBall, getOverString } from '../utils/cricket-engine.ts';

export function buildBowlingCard(
  history: BallEvent[],
  bowlers: Player[],
  innings: number
): BowlingCardRow[] {
  const card = new Map<string, BowlingCardRow>();

  bowlers.forEach(p => {
    card.set(p.id, {
      playerId: p.id,
      name: p.name,
      balls: 0,
      runs: 0,
      wickets: 0,
      maidens: 0,
      overs: '0.0',
      economy: 0,
      oversHistory: [] 
    });
  });

  const filteredHistory = history.filter(b => b.innings === innings && !b.commentary?.startsWith('EVENT'));

  // Sort chronologically for accurate over construction
  const chronHistory = [...filteredHistory].sort((a,b) => a.timestamp - b.timestamp);

  // Group by bowler and over
  const bowlerOversMap = new Map<string, Map<number, BallEvent[]>>();

  chronHistory.forEach(b => {
    const row = card.get(b.bowlerId);
    if (!row) return;

    // --- Stats Calculation ---
    if (b.extraType !== 'Bye' && b.extraType !== 'LegBye') {
      const penalty = (b.extraType === 'Wide' || b.extraType === 'NoBall') ? 1 : 0;
      row.runs += (b.runs + (b.extraRuns || 0) + penalty);
    }

    if (isLegalBall(b.extraType)) {
      row.balls += 1;
    }

    if (b.isWicket && b.creditBowler !== false) {
      row.wickets += 1;
    }

    // --- Over Grid Construction ---
    if (!bowlerOversMap.has(b.bowlerId)) {
      bowlerOversMap.set(b.bowlerId, new Map());
    }
    const bowlerMap = bowlerOversMap.get(b.bowlerId)!;
    
    // We use the ball's over index.
    if (!bowlerMap.has(b.over)) {
      bowlerMap.set(b.over, []);
    }
    bowlerMap.get(b.over)!.push(b);
  });

  // Populate oversHistory array for each bowler
  card.forEach((row, bowlerId) => {
     const bowlerMap = bowlerOversMap.get(bowlerId);
     if (bowlerMap) {
        // Sort overs by index
        const sortedOverIndices = Array.from(bowlerMap.keys()).sort((a,b) => a - b);
        row.oversHistory = sortedOverIndices.map(idx => bowlerMap.get(idx)!);
     }
  });

  // Calculate final stats
  return Array.from(card.values())
    .filter(r => r.balls > 0 || r.oversHistory.length > 0) // Include if they bowled at all
    .map(r => {
      const totalOvers = r.balls / 6;
      return {
        ...r,
        overs: getOverString(r.balls),
        economy: totalOvers > 0 ? parseFloat(((r.runs / totalOvers)).toFixed(2)) : 0
      };
    });
}
