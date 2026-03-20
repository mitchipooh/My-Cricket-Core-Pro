import { MatchState, Team } from '../../../types.ts';
import { buildBattingCard } from '../../../scorer/scorecard/buildBattingCard.ts';
import { buildBowlingCard } from '../../../scorer/scorecard/buildBowlingCard.ts';

export const generateMatchPDF = (matchState: MatchState, teamA: Team, teamB: Team, format: string) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    let htmlContent = `
        <html>
        <head>
            <title>Match Scorecard - ${teamA.name} vs ${teamB.name}</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1e293b; }
                h1 { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; color: #0f172a; margin-bottom: 5px; }
                .match-info { text-align: center; font-size: 14px; color: #64748b; margin-bottom: 20px; }
                .innings-section { margin-bottom: 30px; page-break-inside: avoid; }
                .innings-header { background: #f1f5f9; padding: 8px 12px; font-weight: bold; font-size: 16px; border-left: 4px solid #3b82f6; display: flex; justify-content: space-between; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #e2e8f0; }
                th { font-weight: bold; background: #f8fafc; color: #475569; }
                .text-right { text-align: right; }
                .extras-row { font-weight: bold; background: #f8fafc; }
                .fow-section { margin-top: 10px; font-size: 11px; color: #475569; }
                .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
                .winner-banner { text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; color: #059669; }
                .mvp-banner { text-align: center; font-size: 14px; color: #d97706; font-weight: bold; }
                @media print {
                    body { padding: 0; }
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            <div style="text-align: center; margin-bottom: 10px;">
                <img src="${window.location.origin}/logo.jpg" style="height: 60px; width: auto;" />
            </div>
            <h1>${teamA.name} vs ${teamB.name}</h1>
            <div class="match-info">${format} • ${new Date().toLocaleDateString()}</div>
    `;

    // Iterate through all played innings
    const playedInnings = matchState.inningsScores.map(i => i.innings).sort((a, b) => a - b);
    if (!playedInnings.includes(matchState.innings)) playedInnings.push(matchState.innings);

    playedInnings.forEach(inn => {
        // Determine Batting Team
        let battingTeamId;
        const completedRecord = matchState.inningsScores.find(s => s.innings === inn);
        if (completedRecord) battingTeamId = completedRecord.teamId;
        else if (inn === matchState.innings) battingTeamId = matchState.battingTeamId;
        else return;

        const battingTeam = battingTeamId === teamA.id ? teamA : teamB;
        const bowlingTeam = battingTeamId === teamA.id ? teamB : teamA;

        const bCard = buildBattingCard(matchState.history, battingTeam.players, inn, '', '');
        const bowlCard = buildBowlingCard(matchState.history, bowlingTeam.players, inn);

        htmlContent += `
            <div class="innings-section">
                <div class="innings-header">
                    <span>${battingTeam.name} Innings</span>
                    <span>${bCard.totalScore} (${bCard.overs} ov)</span>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Batter</th>
                            <th></th>
                            <th class="text-right">R</th>
                            <th class="text-right">B</th>
                            <th class="text-right">4s</th>
                            <th class="text-right">6s</th>
                            <th class="text-right">SR</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bCard.rows.map(row => `
                            <tr>
                                <td>${row.name} ${row.isOut ? '' : '*'}</td>
                                <td>${row.dismissal}</td>
                                <td class="text-right"><strong>${row.runs}</strong></td>
                                <td class="text-right">${row.balls}</td>
                                <td class="text-right">${row.fours}</td>
                                <td class="text-right">${row.sixes}</td>
                                <td class="text-right">${row.strikeRate}</td>
                            </tr>
                        `).join('')}
                        <tr class="extras-row">
                            <td colspan="2">Extras</td>
                            <td colspan="5">
                              ${bCard.extras.total} 
                              (w ${bCard.extras.wides}, nb ${bCard.extras.noBalls}, b ${bCard.extras.byes}, lb ${bCard.extras.legByes}, p ${bCard.extras.penalty})
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div class="fow-section">
                    <strong>Fall of Wickets:</strong> 
                    ${bCard.fow.map(f => `${f.score}-${f.wicketNumber} (${f.batterName}, ${f.over})`).join(', ')}
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Bowler</th>
                            <th class="text-right">O</th>
                            <th class="text-right">M</th>
                            <th class="text-right">R</th>
                            <th class="text-right">W</th>
                            <th class="text-right">Eco</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bowlCard.map(row => `
                            <tr>
                                <td>${row.name}</td>
                                <td class="text-right">${row.overs}</td>
                                <td class="text-right">${row.maidens}</td>
                                <td class="text-right">${row.runs}</td>
                                <td class="text-right"><strong>${row.wickets}</strong></td>
                                <td class="text-right">${row.economy}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    });

    // determine result text
    // (Simulated logic or passed in - for now simple check)
    // We can allow the component to pass the result string or calculate it
    // For now, simpler footer

    htmlContent += `
            <div class="footer">
                Generated by Cricket Core 2026
            </div>
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};
