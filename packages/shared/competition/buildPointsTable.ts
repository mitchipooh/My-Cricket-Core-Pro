
import { CompletedMatch, PointsRow } from './types.ts';
import { calculatePoints } from './pointsEngine.ts';
import { Team } from '../types.ts';

export function buildPointsTable(matches: CompletedMatch[], teams: Team[]): PointsRow[] {
  const table = new Map<string, PointsRow>();

  // Initialize all teams in the competition
  teams.forEach(t => {
    table.set(t.id, {
      teamId: t.id,
      teamName: t.name,
      played: 0,
      won: 0,
      lost: 0,
      tied: 0,
      nr: 0,
      drawn: 0,
      points: 0,
      bonusPoints: 0,
      runsFor: 0,
      oversFor: 0,
      runsAgainst: 0,
      oversAgainst: 0,
      nrr: 0
    });
  });

  matches.forEach(m => {
    const teamA = table.get(m.teamAId);
    const teamB = table.get(m.teamBId);

    if (!teamA || !teamB) return;

    teamA.played++;
    teamB.played++;

    // NRR Components
    teamA.runsFor += m.teamAScore;
    teamA.oversFor += m.teamAOvers;
    teamA.runsAgainst += m.teamBScore;
    teamA.oversAgainst += m.teamBOvers;

    teamB.runsFor += m.teamBScore;
    teamB.oversFor += m.teamBOvers;
    teamB.runsAgainst += m.teamAScore;
    teamB.oversAgainst += m.teamAOvers;

    // Points
    teamA.points += calculatePoints(m.result, 'A');
    teamB.points += calculatePoints(m.result, 'B');

    // Result Tally
    if (m.result === 'TIE') {
      teamA.tied++;
      teamB.tied++;
    } else if (m.result === 'HOME_WIN') {
      teamA.won++;
      teamB.lost++;
    } else if (m.result === 'AWAY_WIN') {
      teamB.won++;
      teamA.lost++;
    } else {
      teamA.nr++;
      teamB.nr++;
    }
  });

  return Array.from(table.values())
    .map(row => {
      // Net Run Rate = (Runs Scored / Overs Faced) - (Runs Conceded / Overs Bowled)
      const rrFor = row.oversFor > 0 ? row.runsFor / row.oversFor : 0;
      const rrAgainst = row.oversAgainst > 0 ? row.runsAgainst / row.oversAgainst : 0;
      return {
        ...row,
        nrr: parseFloat((rrFor - rrAgainst).toFixed(3))
      };
    })
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.nrr - a.nrr;
    });
}
