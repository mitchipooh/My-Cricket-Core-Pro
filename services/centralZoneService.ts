
import { Organization, Team, MatchFixture, MediaPost, UserProfile, GameIssue, MatchReportSubmission, UmpireMatchReport } from '../types';

import { supabase } from '../lib/supabase';

// --- GLOBAL LEAGUE DATA SYNC ---

// Helper: Map DB to App
const mapTeam = (t: any, allPlayers: any[]) => ({
  id: t.id,
  name: t.name,
  logoUrl: t.logo_url,
  location: t.location,
  players: allPlayers.filter(p => p.team_id === t.id).map(p => ({
    id: p.id,
    userId: p.user_id, // Expose linked User ID
    name: p.name,
    role: p.role,
    photoUrl: p.photo_url,
    stats: p.stats || {},
    playerDetails: p.details || {}
  }))
});

const mapFixture = (f: any, allTeams: any[] = []) => {
  const teamA = allTeams.find(t => t.id === f.team_a_id);
  const teamB = allTeams.find(t => t.id === f.team_b_id);

  return {
    id: f.id,
    tournamentId: f.tournament_id,
    teamAId: f.team_a_id,
    teamBId: f.team_b_id,
    teamAName: teamA?.name || 'Unknown Team',
    teamBName: teamB?.name || 'Unknown Team',
    date: f.date,
    venue: f.venue,
    status: f.status,
    result: f.result,
    winnerId: f.winner_id,
    isArchived: f.is_archived,
    teamAScore: f.scores?.teamAScore,
    teamBScore: f.scores?.teamBScore,
    savedState: f.saved_state,
    ...(f.details || {})
  };
};

export const pushGlobalSync = async (data: {
  orgs: Organization[],
  standaloneMatches: MatchFixture[],
  mediaPosts: MediaPost[],
  issues?: GameIssue[],
  matchReports?: MatchReportSubmission[],
  umpireReports?: UmpireMatchReport[]
}, userId?: string) => {
  // We need to deconstruct the nested app state into flat relational arrays
  const orgsPayload: any[] = [];
  const teamsPayload: any[] = [];
  const playersPayload: any[] = [];
  const tournamentsPayload: any[] = [];
  const fixturesPayload: any[] = [];
  const orgTeamLinks: any[] = [];
  const tournamentTeamLinks: any[] = [];
  const affiliationsPayload: any[] = [];

  data.orgs.forEach(org => {
    orgsPayload.push({
      id: org.id, name: org.name, type: org.type, country: org.country,
      logo_url: org.logoUrl, is_public: org.isPublic,
      created_by: org.createdBy,
      details: {
        description: org.description,
        address: org.address,
        allowMemberEditing: org.allowMemberEditing,
        members: org.members,
        applications: org.applications,
        sponsors: org.sponsors,
        sponsorSettings: org.sponsorSettings
      }
    });

    (org.parentOrgIds || []).forEach(parentId => {
      if (parentId && parentId !== org.id) {
        affiliationsPayload.push({
          parent_org_id: parentId,
          child_org_id: org.id,
          status: 'APPROVED'
        });
      }
    });

    org.memberTeams.forEach(team => {
      orgTeamLinks.push({
        organization_id: org.id,
        team_id: team.id
      });

      teamsPayload.push({
        id: team.id,
        name: team.name,
        logo_url: team.logoUrl,
        location: team.location
      });

      team.players.forEach(p => {
        playersPayload.push({
          id: p.id, team_id: team.id, name: p.name, role: p.role, photo_url: p.photoUrl,
          stats: p.stats, details: p.playerDetails
        });
      });
    });

    org.tournaments.forEach(t => {
      tournamentsPayload.push({
        id: t.id,
        org_id: org.id,
        name: t.name,
        format: t.format,
        status: t.status,
        config: { pointsConfig: t.pointsConfig, overs: t.overs }
      });

      (t.teamIds || []).forEach(teamId => {
        tournamentTeamLinks.push({
          tournament_id: t.id,
          team_id: teamId
        });
      });
    });

    org.fixtures.forEach(f => {
      fixturesPayload.push({
        id: f.id, tournament_id: f.tournamentId, team_a_id: f.teamAId, team_b_id: f.teamBId,
        date: f.date, venue: f.venue, status: f.status, result: f.result, winner_id: f.winnerId,
        scores: { teamAScore: f.teamAScore, teamBScore: f.teamBScore }, saved_state: f.savedState,
        is_archived: f.isArchived,
        details: { umpires: f.umpires, tossWinnerId: f.tossWinnerId, tossDecision: f.tossDecision }
      });
    });
  });

  // --- NEW: Standalone Matches Sync ---
  (data.standaloneMatches || []).forEach(f => {
    fixturesPayload.push({
      id: f.id, tournament_id: null, team_a_id: f.teamAId, team_b_id: f.teamBId,
      date: f.date, venue: f.venue, status: f.status, result: f.result, winner_id: f.winnerId,
      scores: { teamAScore: f.teamAScore, teamBScore: f.teamBScore }, saved_state: f.savedState,
      is_archived: f.isArchived,
      details: { umpires: f.umpires, tossWinnerId: f.tossWinnerId, tossDecision: f.tossDecision }
    });
  });

  const groupsPayload: any[] = [];
  const groupTeamLinks: any[] = [];

  data.orgs.forEach(org => {
    org.tournaments.forEach(t => {
      (t.groups || []).forEach(group => {
        groupsPayload.push({
          id: group.id,
          tournament_id: t.id,
          name: group.name
        });

        group.teams.forEach(team => {
          groupTeamLinks.push({
            group_id: group.id,
            team_id: team.id
          });
        });
      });
    });
  });

  console.log("DB_SYNC_DEBUG: Pushing Orgs with members:", orgsPayload.map(o => ({ id: o.id, name: o.name, memberCount: o.members?.length })));
  console.log("DB_SYNC_DEBUG: Pushing Teams:", teamsPayload.map(t => ({ id: t.id, name: t.name })));
  console.log("DB_SYNC_DEBUG: Pushing Org-Team Links:", orgTeamLinks.length, "links");
  console.log("DB_SYNC_DEBUG: Pushing Tournament-Team Links:", tournamentTeamLinks.length, "links");
  console.log("DB_SYNC_DEBUG: Pushing Groups:", groupsPayload.length, "groups");
  console.log("DB_SYNC_DEBUG: Pushing Group-Team Links:", groupTeamLinks.length, "assignments");
  console.log("DB_SYNC_DEBUG: Pushing Affiliations:", affiliationsPayload.length, "links");

  const { error: err1 } = await supabase.from('organizations').upsert(orgsPayload);
  const { error: err2 } = await supabase.from('tournaments').upsert(tournamentsPayload);
  const { error: err3 } = await supabase.from('teams').upsert(teamsPayload);
  const { error: err4 } = await supabase.from('roster_players').upsert(playersPayload);
  const { error: err5 } = await supabase.from('fixtures').upsert(fixturesPayload);
  const { error: err6 } = await supabase.from('media_posts').upsert(data.mediaPosts.map(p => ({
    id: p.id, type: p.type, title: p.title, caption: p.caption, author_name: p.authorName,
    content_url: p.contentUrl, likes: p.likes, timestamp: new Date(p.timestamp),
    comments: p.comments || [],
    reactions: p.reactions || {}
  })));

  const { error: err7 } = orgTeamLinks.length > 0
    ? await supabase.from('organization_teams').upsert(orgTeamLinks, {
      onConflict: 'organization_id,team_id',
      ignoreDuplicates: true
    })
    : { error: null };

  const { error: err8 } = tournamentTeamLinks.length > 0
    ? await supabase.from('tournament_teams').upsert(tournamentTeamLinks, {
      onConflict: 'tournament_id,team_id',
      ignoreDuplicates: true
    })
    : { error: null };

  const { error: err9 } = groupsPayload.length > 0
    ? await supabase.from('tournament_groups').upsert(groupsPayload, {
      onConflict: 'id',
      ignoreDuplicates: false
    })
    : { error: null };

  const { error: err10 } = groupTeamLinks.length > 0
    ? await supabase.from('group_teams').upsert(groupTeamLinks, {
      onConflict: 'group_id,team_id',
      ignoreDuplicates: true
    })
    : { error: null };

  const { error: err11 } = affiliationsPayload.length > 0
    ? await supabase.from('organization_affiliations').upsert(affiliationsPayload, {
      onConflict: 'parent_org_id,child_org_id',
      ignoreDuplicates: true
    })
    : { error: null };

  // --- NEW: Game Data Sync ---
  const { error: err12 } = (data.issues || []).length > 0
    ? await supabase.from('game_issues').upsert((data.issues || []).map(i => ({
      id: i.id, match_id: i.matchId, lodged_by: i.lodgedBy, team_id: i.teamId,
      type: i.type, title: i.title, description: i.description, status: i.status,
      evidence_urls: i.evidenceUrls, admin_comments: i.adminComments,
      resolution: i.resolution, admin_response: i.adminResponse,
      resolved_at: i.resolvedAt ? new Date(i.resolvedAt) : null,
      timestamp: new Date(i.timestamp)
    })))
    : { error: null };

  const { error: err13 } = (data.matchReports || []).length > 0
    ? await supabase.from('match_reports').upsert((data.matchReports || []).map(r => ({
      id: r.id, match_id: r.matchId, submitted_by: r.submittedBy, status: r.status,
      scorecard_photo_url: r.scorecardPhotoUrl, admin_feedback: r.adminFeedback,
      player_performances: r.playerPerformances, umpires: r.umpires,
      umpire_ratings: r.umpireRatings, facility_rating: r.facilityRating,
      spirit_rating: r.spiritRating, timestamp: new Date(r.timestamp),
      team_a_performance: { score: r.teamAScore, wickets: r.teamAWickets, overs: r.teamAOvers },
      team_b_performance: { score: r.teamBScore, wickets: r.teamBWickets, overs: r.teamBOvers }
    })))
    : { error: null };

  const { error: err14 } = (data.umpireReports || []).length > 0
    ? await supabase.from('umpire_reports').upsert((data.umpireReports || []).map(r => ({
      id: r.id, match_id: r.matchId, fixture_id: r.fixtureId, submitted_by: r.submittedBy,
      umpire_name: r.umpireName, status: r.status, match_outcome: r.matchOutcome,
      conduct_notes: r.conductNotes, rule_violations: r.ruleViolations,
      player_behavior_ratings: r.playerBehaviorRatings, facility_report: r.facilityReport,
      incident_reports: r.incidentReports, supporting_documents: r.supportingDocuments,
      organization_id: r.organizationId, reviewed_by: r.reviewedBy, review_notes: r.reviewNotes,
      timestamp: new Date(r.timestamp)
    })))
    : { error: null };

  if (err1 || err2 || err3 || err4 || err5 || err6 || err7 || err8 || err9 || err10 || err11 || err12 || err13 || err14) {
    console.error("Relational Sync Error Details:");
    if (err1) console.error("Organizations Error:", JSON.stringify(err1, null, 2));
    if (err2) console.error("Tournaments Error:", JSON.stringify(err2, null, 2));
    if (err3) console.error("Teams Error:", JSON.stringify(err3, null, 2));
    if (err4) console.error("Players Error:", JSON.stringify(err4, null, 2));
    if (err5) console.error("Fixtures Error:", JSON.stringify(err5, null, 2));
    if (err6) console.error("Media Error:", JSON.stringify(err6, null, 2));
    if (err12) console.error("Issues Error:", JSON.stringify(err12, null, 2));
    if (err13) console.error("Match Reports Error:", JSON.stringify(err13, null, 2));
    if (err14) console.error("Umpire Reports Error:", JSON.stringify(err14, null, 2));

    console.error("Summary:", { err1, err2, err3, err4, err5, err6, err7, err8, err9, err10, err11, err12, err13, err14 });
    return false;
  }
  console.log("DB_SYNC_DEBUG: Sync Successful (including groups & junction tables)");
  return true;
};

// DIRECT PERSISTENCE UTILS

export const requestAffiliation = async (targetOrgId: string, application: any): Promise<boolean> => {
  try {
    const { error } = await supabase.from('organization_affiliations').insert({
      parent_org_id: targetOrgId,
      child_org_id: application.applicantId,
      status: 'PENDING'
    });

    if (error) {
      console.error("Affiliation Request (Junction) Failed:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Affiliation Request Exception:", e);
    return false;
  }
};

export const claimPlayerProfile = async (playerId: string, userId: string, applicantName: string): Promise<{ success: boolean; message?: string }> => {
  try {
    // 1. Check if player is already claimed
    const { data: player } = await supabase.from('roster_players').select('user_id').eq('id', playerId).single();
    if (player?.user_id) return { success: false, message: 'This profile is already claimed by another user.' };

    // 2. Find the organization managing this player (via team)
    const { data: teamData } = await supabase.from('roster_players').select(`
            team_id,
            teams (
                organization_teams (
                    organization_id
                )
            )
        `).eq('id', playerId).single();

    const teamObj = Array.isArray(teamData?.teams) ? teamData.teams[0] : teamData?.teams;
    const orgId = teamObj?.organization_teams?.[0]?.organization_id;

    if (!orgId) {
      return { success: false, message: 'This player belongs to a team that is not part of any managed club.' };
    }

    // 3. Create a Proxy "Ghost" Organization to satisfy FK constraints
    const timestamp = Date.now();
    // ID format: claim-req-{timestamp}-{userId}
    const proxyOrgId = `claim-req-${timestamp}-${userId.substring(0, 5)}`;
    // Metadata packed into name: CLAIM_REQ:{userId}:{playerId}:{applicantName}
    const proxyOrgName = `CLAIM_REQ:${userId}:${playerId}:${applicantName}`;

    // Insert Proxy Org
    const { error: orgError } = await supabase.from('organizations').insert({
      id: proxyOrgId,
      name: proxyOrgName,
      type: 'CLUB',
      is_public: false,
      created_by: userId,
      country: 'Global',
      ground_location: 'Virtual',
      established_year: new Date().getFullYear(),
      member_teams: [],
      tournaments: [],
      groups: []
    });

    if (orgError) {
      console.error("Claim Failed: Proxy Org Creation Error", orgError);
      return { success: false, message: 'Failed to initialize claim request.' };
    }

    // 4. Create Affiliation Request using the Proxy Org ID
    const { error: affError } = await supabase.from('organization_affiliations').insert({
      parent_org_id: orgId,
      child_org_id: proxyOrgId,
      status: 'PENDING'
    });

    if (affError) {
      console.error("Claim Failed: Affiliation Insert Error", affError);
      // Attempt cleanup
      await supabase.from('organizations').delete().eq('id', proxyOrgId);
      return { success: false, message: 'Failed to send request due to a database error.' };
    }

    return { success: true };
  } catch (e) {
    console.error("Claim Error", e);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export const approvePlayerClaim = async (claimId: string, playerId: string, userId: string): Promise<boolean> => {
  // 1. Update Player Row
  const { error: pError } = await supabase.from('roster_players').update({ user_id: userId }).eq('id', playerId);
  if (pError) return false;

  // 2. Cleanup: Delete the Affiliation and the Ghost Org
  // claimId passed is the Ghost Org ID (because we map child_org_id -> applicantId -> appId in sync).

  // Delete Affiliation
  await supabase.from('organization_affiliations').delete().eq('child_org_id', claimId);
  // Delete Ghost Org
  await supabase.from('organizations').delete().eq('id', claimId);

  return true;
};

export const updateAffiliationStatus = async (parentOrgId: string, childOrgId: string, status: 'APPROVED' | 'REJECTED'): Promise<boolean> => {
  const { error } = await supabase
    .from('organization_affiliations')
    .update({ status })
    .match({ parent_org_id: parentOrgId, child_org_id: childOrgId });

  if (error) {
    console.error("Update Affiliation Status Failed:", error);
    return false;
  }
  return true;
};


export const fetchGlobalSync = async (userId?: string): Promise<{
  orgs: Organization[],
  allTeams: Team[],
  standaloneMatches: MatchFixture[],
  mediaPosts: MediaPost[],
  issues: GameIssue[],
  matchReports: MatchReportSubmission[],
  umpireReports: UmpireMatchReport[]
} | null> => {
  try {
    const [orgs, teams, players, tournaments, fixtures, media, orgTeamLinks, tournamentTeamLinks, groups, groupTeamLinks, orgAffiliations, dbIssues, dbMatchReports, dbUmpireReports] = await Promise.all([
      supabase.from('organizations').select('*'),
      supabase.from('teams').select('*'),
      supabase.from('roster_players').select('*'),
      supabase.from('tournaments').select('*'),
      supabase.from('fixtures').select('*'),
      supabase.from('media_posts').select('*'),
      supabase.from('organization_teams').select('*'),
      supabase.from('tournament_teams').select('*'),
      supabase.from('tournament_groups').select('*'),
      supabase.from('group_teams').select('*'),
      supabase.from('organization_affiliations').select('*'),
      supabase.from('game_issues').select('*'),
      supabase.from('match_reports').select('*'),
      supabase.from('umpire_reports').select('*')
    ]);

    if (orgs.error || teams.error || players.error) {
      console.error("Fetch failed with errors:", { orgsErr: orgs.error, teamsErr: teams.error, playersErr: players.error });
      throw new Error("Fetch failed");
    }

    console.log("DB_SYNC_DEBUG: Raw Data Counts:", {
      orgs: orgs.data?.length || 0,
      teams: teams.data?.length || 0,
      players: players.data?.length || 0,
      orgTeamLinks: orgTeamLinks.data?.length || 0,
      tournaments: tournaments.data?.length || 0,
      fixtures: fixtures.data?.length || 0
    });

    console.log("DB_SYNC_DEBUG: Raw Orgs IDs:", orgs.data?.map((o: any) => o.id));
    console.log("DB_SYNC_DEBUG: Raw Team IDs:", teams.data?.map((t: any) => t.id));
    console.log("DB_SYNC_DEBUG: Raw Org-Team Links:", orgTeamLinks.data);

    const mappedOrgs: Organization[] = orgs.data.map((o: any) => {
      const orgTournaments = tournaments.data?.filter((t: any) => t.org_id === o.id) || [];

      const linkedTeamIds = orgTeamLinks.data
        ?.filter((link: any) => link.organization_id === o.id)
        .map((link: any) => link.team_id) || [];

      const orgTeamsRaw = teams.data?.filter((t: any) => linkedTeamIds.includes(t.id)) || [];
      const orgTeams = orgTeamsRaw.map((t: any) => mapTeam(t, players.data || []));

      const orgTournamentIds = orgTournaments.map((t: any) => t.id);
      const orgFixtures = fixtures.data?.filter((f: any) => orgTournamentIds.includes(f.tournament_id)).map(f => mapFixture(f, teams.data || [])) || [];

      const mappedTournaments = orgTournaments.map((t: any) => {
        const tournamentTeamIds = tournamentTeamLinks.data
          ?.filter((link: any) => link.tournament_id === t.id)
          .map((link: any) => link.team_id) || [];

        const tournamentGroups = groups.data
          ?.filter((g: any) => g.tournament_id === t.id)
          .map((g: any) => {
            const groupTeamIds = groupTeamLinks.data
              ?.filter((link: any) => link.group_id === g.id)
              .map((link: any) => link.team_id) || [];

            const groupTeams = (teams.data || []).map((t: any) => mapTeam(t, players.data || [])).filter((team: any) => groupTeamIds.includes(team.id));

            return {
              id: g.id,
              name: g.name,
              teams: groupTeams
            };
          }) || [];

        return {
          id: t.id,
          name: t.name,
          format: t.format,
          status: t.status,
          teamIds: tournamentTeamIds,
          groups: tournamentGroups,
          orgId: t.org_id,
          ...t.config
        };
      });

      // MERGE USER APPLICATIONS + AFFILIATION REQUESTS
      const userApps = o.details?.applications || o.applications || [];
      const affiliationRequests = orgAffiliations.data
        ?.filter((a: any) => a.parent_org_id === o.id && a.status === 'PENDING')
        .map((a: any) => {

          const childId = a.child_org_id || '';
          const applicantOrg = orgs.data.find((sub: any) => sub.id === childId);

          // 1. PLAYER CLAIM (Ghost Org detection)
          if (applicantOrg && applicantOrg.name.startsWith('CLAIM_REQ:')) {
            const parts = applicantOrg.name.split(':');
            // Format: CLAIM_REQ:{userId}:{playerId}:{applicantName}
            const userId = parts[1];
            const playerId = parts[2];
            const realApplicantName = parts.slice(3).join(':');

            return {
              id: childId, // Use the Child Org ID (proxy ID) as the App ID for approval references
              type: 'PLAYER_CLAIM',
              applicantId: userId,
              applicantName: realApplicantName || 'Claim Request',
              targetPlayerId: playerId,
              status: a.status,
              timestamp: new Date(a.created_at || Date.now()).getTime()
            };
          }

          // 2. USER JOIN or CLUB INVITE
          if (childId.startsWith('join:') || childId.startsWith('invite:')) {
            const isInvite = childId.startsWith('invite:');
            const [, userId] = childId.split(':');
            return {
              id: `${isInvite ? 'inv' : 'join'}-${a.id}`,
              type: isInvite ? 'CLUB_INVITE' : 'USER_JOIN',
              applicantId: userId,
              applicantName: isInvite ? 'Invited Player' : 'New Member',
              status: a.status,
              timestamp: new Date(a.created_at || Date.now()).getTime()
            };
          }

          // 3. ORG AFFILIATION (Standard)
          return {
            id: `aff-req-${childId}`,
            type: 'ORG_AFFILIATE',
            applicantId: childId,
            applicantName: applicantOrg?.name || 'Unknown Org',
            applicantHandle: '',
            status: 'PENDING',
            timestamp: new Date(a.created_at || Date.now()).getTime()
          };
        }) || [];

      const mergedApplications = [...userApps, ...affiliationRequests];

      return {
        id: o.id,
        name: o.name,
        type: o.type as any,
        createdBy: o.created_by,
        country: o.country,
        description: o.details?.description,
        address: o.details?.address,
        logoUrl: o.logo_url,
        isPublic: o.is_public,
        allowUserContent: true,
        allowMemberEditing: o.details?.allowMemberEditing !== undefined ? o.details.allowMemberEditing : true,
        members: o.details?.members || o.members || [],
        applications: mergedApplications,
        sponsors: o.details?.sponsors || o.sponsors || [],
        sponsorSettings: o.details?.sponsorSettings || o.sponsorSettings,
        tournaments: mappedTournaments,
        groups: [],
        memberTeams: orgTeams,
        fixtures: orgFixtures,
        parentOrgIds: orgAffiliations.data
          ?.filter((a: any) => a.child_org_id === o.id && a.status === 'APPROVED')
          .map((a: any) => a.parent_org_id) || [],
        childOrgIds: orgAffiliations.data
          ?.filter((a: any) => a.parent_org_id === o.id && a.status === 'APPROVED')
          .map((a: any) => a.child_org_id) || []
      };
    });

    const mappedMedia = media.data?.map((p: any) => ({
      id: p.id, type: p.type, title: p.title, caption: p.caption, authorName: p.author_name,
      contentUrl: p.content_url, likes: p.likes, timestamp: new Date(p.timestamp).getTime(),
      comments: p.comments || [],
      reactions: p.reactions || {}
    })) || [];

    // Map ALL teams for global registry
    const allTeamsMapped: Team[] = teams.data?.map((t: any) => mapTeam(t, players.data || [])) || [];

    const mappedIssues: GameIssue[] = (dbIssues.data || []).map((i: any) => ({
      id: i.id, matchId: i.match_id, lodgedBy: i.lodged_by, teamId: i.team_id,
      type: i.type, title: i.title, description: i.description, status: i.status,
      evidenceUrls: i.evidence_urls, adminComments: i.admin_comments,
      resolution: i.resolution, adminResponse: i.admin_response,
      resolvedAt: i.resolved_at ? new Date(i.resolved_at).getTime() : undefined,
      timestamp: new Date(i.timestamp).getTime()
    }));

    const mappedMatchReports: MatchReportSubmission[] = (dbMatchReports.data || []).map((r: any) => ({
      id: r.id, matchId: r.match_id, submittedBy: r.submitted_by, status: r.status,
      scorecardPhotoUrl: r.scorecard_photo_url, adminFeedback: r.admin_feedback,
      playerPerformances: r.player_performances || [], umpires: r.umpires || [],
      umpireRatings: r.umpire_ratings || {}, facilityRating: r.facility_rating || {},
      spiritRating: r.spirit_rating || {}, timestamp: new Date(r.timestamp).getTime(),
      teamAScore: r.team_a_performance?.score || 0, teamAWickets: r.team_a_performance?.wickets || 0, teamAOvers: r.team_a_performance?.overs || '0',
      teamBScore: r.team_b_performance?.score || 0, teamBWickets: r.team_b_performance?.wickets || 0, teamBOvers: r.team_b_performance?.overs || '0'
    }));

    const mappedUmpireReports: UmpireMatchReport[] = (dbUmpireReports.data || []).map((r: any) => ({
      id: r.id, matchId: r.match_id, fixtureId: r.fixture_id, submittedBy: r.submitted_by,
      umpireName: r.umpire_name, status: r.status, matchOutcome: r.match_outcome,
      conductNotes: r.conduct_notes, ruleViolations: r.rule_violations || [],
      playerBehaviorRatings: r.player_behavior_ratings || {}, facilityReport: r.facility_report || {},
      incidentReports: r.incident_reports || [], supportingDocuments: r.supporting_documents || [],
      organizationId: r.organization_id, reviewedBy: r.reviewed_by, review_notes: r.review_notes,
      timestamp: new Date(r.timestamp).getTime()
    }));

    return {
      orgs: mappedOrgs,
      allTeams: allTeamsMapped,
      standaloneMatches: fixtures.data?.filter((f: any) => !f.tournament_id).map(f => mapFixture(f, teams.data || [])) || [],
      mediaPosts: mappedMedia as MediaPost[],
      issues: mappedIssues,
      matchReports: mappedMatchReports,
      umpireReports: mappedUmpireReports
    };

  } catch (error) {
    console.error("Relational Fetch Error:", error);
    return null;
  }
};

export const removeTeamFromOrg = async (orgId: string, teamId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('organization_teams')
    .delete()
    .match({ organization_id: orgId, team_id: teamId });

  if (error) {
    console.error("Failed to remove team from organization:", error);
    return false;
  }
  return true;
};

export const removeTeamFromTournament = async (tournamentId: string, teamId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('tournament_teams')
    .delete()
    .match({ tournament_id: tournamentId, team_id: teamId });

  if (error) {
    console.error("Failed to remove team from tournament:", error);
    return false;
  }
  return true;
};

export const deleteTeam = async (teamId: string): Promise<boolean> => {
  await supabase.from('organization_teams').delete().match({ team_id: teamId });
  await supabase.from('tournament_teams').delete().match({ team_id: teamId });
  await supabase.from('roster_players').delete().match({ team_id: teamId });
  const { error } = await supabase.from('teams').delete().match({ id: teamId });

  if (error) {
    console.error("Failed to delete team:", error);
    return false;
  }
  return true;
};

export const deleteTournament = async (tournamentId: string): Promise<boolean> => {
  await supabase.from('tournament_teams').delete().match({ tournament_id: tournamentId });
  await supabase.from('fixtures').delete().match({ tournament_id: tournamentId });
  const { error } = await supabase.from('tournaments').delete().match({ id: tournamentId });

  if (error) {
    console.error("Failed to delete tournament:", error);
    return false;
  }
  return true;
};

export const deleteMatchFixture = async (fixtureId: string): Promise<boolean> => {
  const { error } = await supabase.from('fixtures').delete().match({ id: fixtureId });

  if (error) {
    console.error("Failed to delete fixture:", error);
    return false;
  }
  return true;
};

export const deleteMediaPost = async (postId: string): Promise<boolean> => {
  const { error } = await supabase.from('media_posts').delete().match({ id: postId });

  if (error) {
    console.error("Failed to delete media post:", error);
    return false;
  }
  return true;
};

export type UserDataPayload = {
  profile?: UserProfile;
  settings?: { notifications: boolean; sound: boolean };
  following?: { teams: string[], players: string[], orgs: string[] };
};

export const pushUserData = async (userId: string, data: UserDataPayload) => {
  const { error: supabaseError } = await supabase
    .from('user_profiles')
    .upsert({
      id: userId,
      name: data.profile?.name,
      handle: data.profile?.handle,
      role: data.profile?.role,
      avatar_url: data.profile?.avatarUrl,
      password: data.profile?.password,
      player_details: data.profile?.playerDetails,
      scorer_details: data.profile?.scorerDetails,
      coach_details: data.profile?.coachDetails,
      settings: data.settings,
      following: data.following,
      updated_at: new Date()
    });

  if (supabaseError) {
    console.error("Supabase User Sync Error:", supabaseError);
  }
  return !supabaseError;
};

export const fetchUserData = async (userId: string): Promise<UserDataPayload | null> => {
  let { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!data || error) {
    const handleToTry = userId.startsWith('@') ? userId : `@${userId}`;
    // Use ilike for case-insensitive handle matching
    const { data: handleData, error: handleErr } = await supabase
      .from('user_profiles')
      .select('*')
      .ilike('handle', handleToTry)
      .single();

    if (handleData && !handleErr) {
      data = handleData;
      error = null;
    }
  }

  if (data && !error) {
    return {
      profile: {
        id: data.id,
        name: data.name,
        handle: data.handle,
        role: data.role,
        avatarUrl: data.avatar_url,
        password: data.password,
        playerDetails: data.player_details,
        scorerDetails: data.scorer_details,
        coachDetails: data.coach_details,
        createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now()
      } as UserProfile,
      settings: data.settings,
      following: data.following
    };
  }

  if (error && error.code !== 'PGRST116') {
    console.warn("Supabase User Fetch error:", error.message);
  }

  return null;
}

export const searchPlayersForMarket = async (role?: string): Promise<UserProfile[]> => {
  let query = supabase
    .from('user_profiles')
    .select('*')
    .eq('role', 'Player')
    .filter('player_details->lookingForClub', 'eq', true);

  if (role && role !== 'ALL') {
    query = query.filter('player_details->primaryRole', 'eq', role);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Market search failed:", error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    handle: row.handle,
    role: row.role,
    avatarUrl: row.avatar_url,
    playerDetails: row.player_details,
    scorerDetails: row.scorer_details,
    coachDetails: row.coach_details,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
  } as UserProfile));
};

export const updateFixture = async (fixtureId: string, updates: Partial<MatchFixture>) => {
  try {
    const { data: current } = await supabase.from('fixtures').select('details, scores').eq('id', fixtureId).single();

    const newDetails = { ...(current?.details || {}), ...updates };
    delete newDetails.savedState;
    delete newDetails.status;
    delete newDetails.result;
    delete newDetails.teamAScore;
    delete newDetails.teamBScore;

    const topLevelUpdates: any = {};
    if (updates.status) topLevelUpdates.status = updates.status;
    if (updates.result) topLevelUpdates.result = updates.result;
    if (updates.savedState) topLevelUpdates.saved_state = updates.savedState;

    if (updates.teamAScore !== undefined || updates.teamBScore !== undefined) {
      topLevelUpdates.scores = {
        teamAScore: updates.teamAScore ?? current?.scores?.teamAScore,
        teamBScore: updates.teamBScore ?? current?.scores?.teamBScore
      };
    }

    const { error } = await supabase
      .from('fixtures')
      .update({ ...topLevelUpdates, details: newDetails })
      .eq('id', fixtureId);

    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Update Fixture Failed:", e);
    return false;
  }
};
