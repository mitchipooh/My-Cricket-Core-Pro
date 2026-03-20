import { BallEvent, Player, InningsStats, ExtrasBreakdown, FallOfWicket, BattingCardRow } from '../types.ts';
import { isLegalBall, getOverString } from '../utils/cricket-engine.ts';

export function buildBattingCard(
  history: BallEvent[],
  batters: Player[],
  innings: number,
  strikerId: string,
  nonStrikerId: string
): InningsStats {
  const card = new Map<string, BattingCardRow>();
  const extras: ExtrasBreakdown = { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0, total: 0 };
  const fow: FallOfWicket[] = [];
  
  let currentScore = 0;
  let currentWickets = 0;
  let validBalls = 0;

  // Initialize all squad members
  batters.forEach(p => {
    card.set(p.id, {
      playerId: p.id,
      name: p.name,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      strikeRate: 0,
      scoringSequence: [],
      isOut: false,
      dismissal: '',
      bowlerName: '',
      atCrease: p.id === strikerId || p.id === nonStrikerId
    });
  });

  // Filter history for this innings and reverse to process chronologically
  const chronHistory = [...history].filter(b => b.innings === innings).reverse();

  chronHistory.forEach(b => {
    if (b.commentary?.startsWith('EVENT')) return;

    // --- Extras Calculation ---
    if (b.extraType === 'Wide') {
        const runs = 1 + (b.extraRuns || 0);
        extras.wides += runs;
        extras.total += runs;
        currentScore += runs;
    } else if (b.extraType === 'NoBall') {
        const nbRuns = 1; 
        extras.noBalls += nbRuns;
        extras.total += nbRuns;
        
        if (b.batRuns === 0 && b.extraRuns && b.extraRuns > 0) {
             extras.noBalls += b.extraRuns;
             extras.total += b.extraRuns;
        }
        currentScore += nbRuns + (b.batRuns || 0) + (b.extraRuns || 0);
    } else if (b.extraType === 'Bye') {
        extras.byes += b.extraRuns || 0;
        extras.total += b.extraRuns || 0;
        currentScore += b.extraRuns || 0;
    } else if (b.extraType === 'LegBye') {
        extras.legByes += b.extraRuns || 0;
        extras.total += b.extraRuns || 0;
        currentScore += b.extraRuns || 0;
    } else {
        currentScore += b.runs;
    }

    if (isLegalBall(b.extraType)) {
        validBalls++;
    }

    // --- Batter Stats & Scoring Sequence ---
    const row = card.get(b.strikerId);
    if (row) {
      const isLegal = isLegalBall(b.extraType);
      const isNoBall = b.extraType === 'NoBall';
      
      if (isLegal || isNoBall) {
          let symbol = '';
          
          if (b.isWicket && b.outPlayerId === b.strikerId) {
              symbol = 'W';
          } else {
              const r = b.batRuns ?? b.runs ?? 0;
              if (r === 0) symbol = '•';
              else symbol = r.toString();
          }
          
          // Append sequence
          row.scoringSequence.push(symbol);

          // Update numeric stats
          if (isLegal || (isNoBall && (b.batRuns || 0) > 0)) {
             // Credit runs
             const r = b.batRuns ?? b.runs ?? 0;
             row.runs += r;
             if (r === 4) row.fours += 1;
             if (r === 6) row.sixes += 1;
          }
          
          if (isLegal || isNoBall) {
             row.balls += 1;
          }
      }
    }

    // --- Fall of Wickets ---
    if (b.isWicket && b.outPlayerId) {
      currentWickets++;
      const outRow = card.get(b.outPlayerId);
      if (outRow) {
        outRow.isOut = true;
        outRow.dismissal = b.dismissalType || b.wicketType || 'Out';
        outRow.atCrease = false;
        
        // Find Bowler Name for the scorecard
        // Note: Run outs usually don't credit bowler, but we might want to show who was bowling
        const bowler = batters.find(p => false) || {name: ''}; // We don't have access to bowling team players here easily without passing them in. 
        // Improvement: We will pass bowler name logic via the UI or look it up if we had all players.
        // For now, let's assume the UI handles the bowler name lookup or we leave it blank if not credited.
        
        // Actually, we can't easily get the bowler NAME here because `batters` only contains the batting team.
        // We will store the bowler ID and let the UI resolve it, OR rely on `b.bowlerId` 
        // For the purpose of this function, we will store the ID in a temporary field if needed, 
        // but typically the UI (LinearScorebook) has access to both teams.
        
        fow.push({
            score: currentScore,
            wicketNumber: currentWickets,
            over: getOverString(validBalls),
            batterName: outRow.name
        });
      }
    }
  });

  const allRows = Array.from(card.values());
  
  allRows.forEach(r => {
      r.strikeRate = r.balls > 0 ? parseFloat(((r.runs / r.balls) * 100).toFixed(2)) : 0;
  });

  // Split into batted and DNB
  const battedRows = allRows.filter(r => r.balls > 0 || r.isOut || r.atCrease);
  const didNotBat = allRows.filter(r => !r.balls && !r.isOut && !r.atCrease);

  const overs = getOverString(validBalls);
  const totalOvers = validBalls / 6;
  const runRate = totalOvers > 0 ? (currentScore / totalOvers).toFixed(2) : '0.00';

  return {
      rows: battedRows,
      extras,
      totalScore: `${currentScore}/${currentWickets}`,
      overs,
      runRate,
      fow,
      didNotBat: didNotBat.map(r => batters.find(p => p.id === r.playerId)!).filter(Boolean)
  };
}
