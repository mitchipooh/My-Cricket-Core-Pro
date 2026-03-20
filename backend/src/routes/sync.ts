import { Router } from 'express';
import pool, { query } from '../db/db';

const router = Router();

// --- GLOBAL LEAGUE DATA SYNC ---

router.post('/sync/push', async (req, res) => {
    const { orgs, standaloneMatches, mediaPosts, issues, matchReports, umpireReports } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Organizations
        for (const org of orgs) {
            await client.query(
                `INSERT INTO public.organizations (id, name, type, country, logo_url, is_public, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, type = EXCLUDED.type, country = EXCLUDED.country,
         logo_url = EXCLUDED.logo_url, is_public = EXCLUDED.is_public, details = EXCLUDED.details`,
                [org.id, org.name, org.type, org.country, org.logoUrl, org.isPublic, JSON.stringify({
                    description: org.description,
                    address: org.address,
                    allowMemberEditing: org.allowMemberEditing,
                    members: org.members,
                    applications: org.applications,
                    sponsors: org.sponsors,
                    sponsorSettings: org.sponsorSettings
                })]
            );

            // 2. Teams (linked to orgs via junction or org_id)
            // Note: The original schema had org_id in teams, but service logic suggests a junction table.
            // We'll follow the sync logic which upserts teams and then junction links.
            for (const team of org.memberTeams) {
                await client.query(
                    `INSERT INTO public.teams (id, name, logo_url, location)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name, logo_url = EXCLUDED.logo_url, location = EXCLUDED.location`,
                    [team.id, team.name, team.logoUrl, team.location]
                );

                await client.query(
                    `INSERT INTO public.organization_teams (organization_id, team_id)
           VALUES ($1, $2)
           ON CONFLICT (organization_id, team_id) DO NOTHING`,
                    [org.id, team.id]
                );

                // 3. Players
                for (const p of team.players) {
                    await client.query(
                        `INSERT INTO public.roster_players (id, team_id, name, role, photo_url, stats, details)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO UPDATE SET
             team_id = EXCLUDED.team_id, name = EXCLUDED.name, role = EXCLUDED.role,
             photo_url = EXCLUDED.photo_url, stats = EXCLUDED.stats, details = EXCLUDED.details`,
                        [p.id, team.id, p.name, p.role, p.photoUrl, JSON.stringify(p.stats), JSON.stringify(p.playerDetails)]
                    );
                }
            }

            // 4. Tournaments
            for (const t of org.tournaments) {
                await client.query(
                    `INSERT INTO public.tournaments (id, org_id, name, format, status, config)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET
           org_id = EXCLUDED.org_id, name = EXCLUDED.name, format = EXCLUDED.format,
           status = EXCLUDED.status, config = EXCLUDED.config`,
                    [t.id, org.id, t.name, t.format, t.status, JSON.stringify({ pointsConfig: t.pointsConfig, overs: t.overs })]
                );

                // Tournament Teams junction
                if (t.teamIds) {
                    for (const teamId of t.teamIds) {
                        await client.query(
                            `INSERT INTO public.tournament_teams (tournament_id, team_id)
               VALUES ($1, $2)
               ON CONFLICT (tournament_id, team_id) DO NOTHING`,
                            [t.id, teamId]
                        );
                    }
                }
            }

            // 5. Fixtures (linked to tournaments or standalone)
            for (const f of org.fixtures) {
                await client.query(
                    `INSERT INTO public.fixtures (id, tournament_id, team_a_id, team_b_id, date, venue, status, result, winner_id, scores, saved_state, details)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO UPDATE SET
           tournament_id = EXCLUDED.tournament_id, team_a_id = EXCLUDED.team_a_id, team_b_id = EXCLUDED.team_b_id,
           date = EXCLUDED.date, venue = EXCLUDED.venue, status = EXCLUDED.status,
           result = EXCLUDED.result, winner_id = EXCLUDED.winner_id, scores = EXCLUDED.scores,
           saved_state = EXCLUDED.saved_state, details = EXCLUDED.details`,
                    [f.id, f.tournamentId, f.teamAId, f.teamBId, f.date, f.venue, f.status, f.result, f.winnerId,
                    JSON.stringify({ teamAScore: f.teamAScore, teamBScore: f.teamBScore }),
                    JSON.stringify(f.savedState),
                    JSON.stringify({ umpires: f.umpires, tossWinnerId: f.tossWinnerId, tossDecision: f.tossDecision })]
                );
            }
        }

        // 6. Standalone Matches
        for (const f of (standaloneMatches || [])) {
            await client.query(
                `INSERT INTO public.fixtures (id, tournament_id, team_a_id, team_b_id, date, venue, status, result, winner_id, scores, saved_state, details)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO UPDATE SET
           tournament_id = EXCLUDED.tournament_id, team_a_id = EXCLUDED.team_a_id, team_b_id = EXCLUDED.team_b_id,
           date = EXCLUDED.date, venue = EXCLUDED.venue, status = EXCLUDED.status,
           result = EXCLUDED.result, winner_id = EXCLUDED.winner_id, scores = EXCLUDED.scores,
           saved_state = EXCLUDED.saved_state, details = EXCLUDED.details`,
                [f.id, null, f.teamAId, f.teamBId, f.date, f.venue, f.status, f.result, f.winnerId,
                JSON.stringify({ teamAScore: f.teamAScore, teamBScore: f.teamBScore }),
                JSON.stringify(f.savedState),
                JSON.stringify({ umpires: f.umpires, tossWinnerId: f.tossWinnerId, tossDecision: f.tossDecision })]
            );
        }

        // 7. Media Posts
        for (const p of mediaPosts) {
            await client.query(
                `INSERT INTO public.media_posts (id, type, title, caption, author_name, content_url, likes, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
         type = EXCLUDED.type, title = EXCLUDED.title, caption = EXCLUDED.caption,
         author_name = EXCLUDED.author_name, content_url = EXCLUDED.content_url,
         likes = EXCLUDED.likes, timestamp = EXCLUDED.timestamp`,
                [p.id, p.type, p.title, p.caption, p.authorName, p.contentUrl, 0, new Date(p.timestamp)]
            );
        }

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(e);
        res.status(500).json({ error: (e as Error).message });
    } finally {
        client.release();
    }
});

router.get('/sync/pull', async (req, res) => {
    try {
        const orgsRes = await query('SELECT * FROM public.organizations');
        const teamsRes = await query('SELECT * FROM public.teams');
        const playersRes = await query('SELECT * FROM public.roster_players');
        const tournamentsRes = await query('SELECT * FROM public.tournaments');
        const fixturesRes = await query('SELECT * FROM public.fixtures');
        const mediaRes = await query('SELECT * FROM public.media_posts');
        const orgTeamLinksRes = await query('SELECT * FROM public.organization_teams');
        const tournamentTeamLinksRes = await query('SELECT * FROM public.tournament_teams');
        const affiliationsRes = await query('SELECT * FROM public.organization_affiliations');
        const issuesRes = await query('SELECT * FROM public.game_issues');
        const matchReportsRes = await query('SELECT * FROM public.match_reports');
        const umpireReportsRes = await query('SELECT * FROM public.umpire_reports');

        const teams = teamsRes.rows.map(t => ({
            ...t,
            players: playersRes.rows.filter(p => p.team_id === t.id).map(p => ({
                id: p.id,
                userId: p.user_id,
                name: p.name,
                role: p.role,
                photoUrl: p.photo_url,
                stats: p.stats || {},
                playerDetails: p.details || {}
            }))
        }));

        const mappedOrgs = orgsRes.rows.map(o => {
            const linkedTeamIds = orgTeamLinksRes.rows
                .filter(link => link.organization_id === o.id)
                .map(link => link.team_id);

            const orgTeams = teams.filter(t => linkedTeamIds.includes(t.id));
            const orgTournaments = tournamentsRes.rows.filter(t => t.org_id === o.id).map(t => {
                const trnTeamIds = tournamentTeamLinksRes.rows
                    .filter(link => link.tournament_id === t.id)
                    .map(link => link.team_id);

                return {
                    id: t.id,
                    name: t.name,
                    format: t.format,
                    status: t.status,
                    teamIds: trnTeamIds,
                    ...t.config
                };
            });

            const orgFixtures = fixturesRes.rows
                .filter(f => f.tournament_id && orgTournaments.some(t => t.id === f.tournament_id))
                .map(f => ({
                    ...f,
                    teamAScore: f.scores?.teamAScore,
                    teamBScore: f.scores?.teamBScore,
                    ...f.details
                }));

            return {
                id: o.id,
                name: o.name,
                type: o.type,
                createdBy: o.created_by,
                country: o.country,
                description: o.details?.description,
                address: o.details?.address,
                logoUrl: o.logo_url,
                isPublic: o.is_public,
                members: o.details?.members || [],
                applications: o.details?.applications || [],
                sponsors: o.details?.sponsors || [],
                sponsorSettings: o.details?.sponsorSettings,
                tournaments: orgTournaments,
                memberTeams: orgTeams,
                fixtures: orgFixtures,
                parentOrgIds: affiliationsRes.rows.filter(a => a.child_org_id === o.id && a.status === 'APPROVED').map(a => a.parent_org_id),
                childOrgIds: affiliationsRes.rows.filter(a => a.parent_org_id === o.id && a.status === 'APPROVED').map(a => a.child_org_id)
            };
        });

        res.json({
            orgs: mappedOrgs,
            allTeams: teams,
            standaloneMatches: fixturesRes.rows.filter(f => !f.tournament_id).map(f => ({
                ...f,
                teamAScore: f.scores?.teamAScore,
                teamBScore: f.scores?.teamBScore,
                ...f.details
            })),
            mediaPosts: mediaRes.rows.map(p => ({
                ...p,
                timestamp: new Date(p.timestamp).getTime()
            })),
            issues: issuesRes.rows,
            matchReports: matchReportsRes.rows,
            umpireReports: umpireReportsRes.rows
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: (e as Error).message });
    }
});

export default router;
