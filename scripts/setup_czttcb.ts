import { createClient } from '@supabase/supabase-js';
import { Organization, Team, Player, UserProfile, OrgMember } from '../types';
import fs from 'fs';
import path from 'path';

// --- ENV SETUP ---
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = envContent.split('\n').reduce((acc, line) => {
    const [key, val] = line.split('=');
    if (key && val) acc[key.trim()] = val.trim();
    return acc;
}, {} as any);

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CLUB_NAMES = [
    "Balmain United", "Brickfield Sports", "Orangefield Sports", "Caparo Sports",
    "Centric Academy", "Countryside", "Couva Sports", "Agostini Sports",
    "Esmeralda Sports", "Ragoonanan Road Sports", "Exchange 2", "Felicity Sports",
    "Friendship Hall Sports", "Koreans Sports", "Lange Park Sports", "Line and Length",
    "Madras Divergent Academy", "Mc Bean Sports", "Petersfield Sports", "Preysal Valley Boys",
    "Renoun Sports", "Sital Felicity Youngsters", "Supersonic Sports", "Waterloo Sports"
];

function generatePlayer(teamName: string, index: number): Player {
    return {
        id: `p-${teamName.replace(/\s+/g, '-').toLowerCase()}-${index}`,
        name: `Player ${index}`,
        role: index <= 3 ? "Batsman" : index <= 7 ? "All-rounder" : "Bowler",
        stats: {
            matches: 0, runs: 0, wickets: 0, catches: 0, stumpings: 0, runOuts: 0,
            ballsFaced: 0, ballsBowled: 0, runsConceded: 0, maidens: 0,
            highestScore: 0, bestBowling: '-', fours: 0, sixes: 0, hundreds: 0,
            fifties: 0, ducks: 0, threeWickets: 0, fiveWickets: 0
        }
    };
}

async function setupCZTTCB() {
    console.log('🌱 Setting up Central Zonal Council TTCB...');

    const orgId = 'org-czttcb';
    let credentialsOutput = `# Central Zonal Council TTCB Credentials\n\n`;
    credentialsOutput += `## Main Administrator\n\n`;
    credentialsOutput += `| Handle | Password | Role |\n`;
    credentialsOutput += `|--------|----------|------|\n`;

    // 1. Create Main Admin Profile
    const mainAdminId = 'user-czttcb-admin';
    const mainAdminHandle = '@CZTTCB';
    const mainAdminPassword = 'CZ passWORD';

    const mainAdminProfile: UserProfile = {
        id: mainAdminId,
        name: 'Central Zonal Council Admin',
        handle: mainAdminHandle,
        role: 'Administrator',
        password: mainAdminPassword,
        createdAt: Date.now()
    };

    credentialsOutput += `| ${mainAdminHandle} | ${mainAdminPassword} | Administrator |\n\n`;

    // 2. Create Teams and Team Admins
    const teams: any[] = [];
    const allPlayers: any[] = [];
    const profiles: UserProfile[] = [mainAdminProfile];
    const orgMembers: OrgMember[] = [];

    // Add main admin to org members
    orgMembers.push({
        userId: mainAdminId,
        name: mainAdminProfile.name,
        handle: mainAdminHandle,
        role: 'Administrator',
        addedAt: Date.now(),
        permissions: {
            canEditOrg: true,
            canManageMembers: true,
            canEditSquad: true,
            canSubmitReport: true
        }
    });

    credentialsOutput += `## Team Administrators\n\n`;
    credentialsOutput += `| Team | Handle | Password |\n`;
    credentialsOutput += `|------|--------|----------|\n`;

    CLUB_NAMES.forEach((clubName, index) => {
        const teamSlug = clubName.replace(/\s+/g, '').toLowerCase();
        const teamId = `team-czttcb-${teamSlug}`;

        // Create Team
        teams.push({
            id: teamId,
            org_id: orgId,
            name: clubName,
            location: 'Central Trinidad'
        });

        // Create 11 Players
        for (let i = 1; i <= 11; i++) {
            const player = generatePlayer(clubName, i);
            allPlayers.push({
                id: player.id,
                team_id: teamId,
                name: player.name,
                role: player.role,
                stats: player.stats,
                details: player.playerDetails || {}
            });
        }

        // Create Team Admin
        const teamAdminHandle = `@team_${teamSlug}`;
        const teamAdminPassword = `team_${teamSlug}_2026`;
        const teamAdminId = `user-admin-${teamSlug}`;

        profiles.push({
            id: teamAdminId,
            name: `${clubName} Team Admin`,
            handle: teamAdminHandle,
            role: 'Administrator',
            password: teamAdminPassword,
            createdAt: Date.now()
        });

        credentialsOutput += `| ${clubName} | ${teamAdminHandle} | ${teamAdminPassword} |\n`;

        // Add team admin to org members with managedTeamId
        orgMembers.push({
            userId: teamAdminId,
            name: `${clubName} Team Admin`,
            handle: teamAdminHandle,
            role: 'Administrator',
            addedAt: Date.now(),
            managedTeamId: teamId, // Scope to specific team
            permissions: {
                canEditOrg: false,
                canManageMembers: false,
                canEditSquad: true,
                canSubmitReport: true
            }
        });
    });

    console.log('📊 Data Summary:');
    console.log(`   - Teams: ${teams.length}`);
    console.log(`   - Players: ${allPlayers.length}`);
    console.log(`   - Profiles: ${profiles.length}`);
    console.log(`   - Org Members: ${orgMembers.length}`);

    // 3. Insert into Supabase
    console.log('\n🚀 Inserting data into Supabase...');

    // FIRST: Ensure organization exists (create minimal org if needed)
    const { data: existingOrg, error: fetchError } = await supabase
        .from('organizations')
        .select('id, members')
        .eq('id', orgId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ Fetch org error:', fetchError);
        return;
    }

    if (!existingOrg) {
        // Create minimal organization
        console.log('Creating new organization...');
        const { error: createOrgError } = await supabase
            .from('organizations')
            .insert({
                id: orgId,
                name: 'Central Zonal Council TTCB',
                type: 'GOVERNING_BODY',
                members: []
            });

        if (createOrgError) {
            console.error('❌ Organization creation failed:', createOrgError);
            return;
        }
        console.log('✅ Organization created');
    } else {
        console.log('✅ Organization already exists');
    }

    // THEN: Insert teams (now that org exists)
    const { error: teamsError } = await supabase.from('teams').upsert(teams);
    if (teamsError) {
        console.error('❌ Teams insert failed:', teamsError);
        return;
    }
    console.log('✅ Teams inserted');

    // Insert players
    const { error: playersError } = await supabase.from('roster_players').upsert(allPlayers);
    if (playersError) {
        console.error('❌ Players insert failed:', playersError);
        return;
    }
    console.log('✅ Players inserted');

    // Insert profiles (using user_profiles table based on existing scripts)
    const profilesForDb = profiles.map(p => ({
        id: p.id,
        name: p.name,
        handle: p.handle,
        role: p.role,
        password: p.password,
        created_at: new Date().toISOString()
    }));

    const { error: profilesError } = await supabase.from('user_profiles').upsert(profilesForDb);
    if (profilesError) {
        console.error('❌ Profiles insert failed:', profilesError);
        return;
    }
    console.log('✅ Profiles inserted');

    // Update organization with members
    const { data: orgForUpdate } = await supabase
        .from('organizations')
        .select('members')
        .eq('id', orgId)
        .single();

    const existingMembers = orgForUpdate?.members || [];
    const newMembersMap = new Map();
    existingMembers.forEach((m: any) => newMembersMap.set(m.userId, m));
    orgMembers.forEach(m => newMembersMap.set(m.userId, m));

    const { error: updateOrgError } = await supabase
        .from('organizations')
        .update({ members: Array.from(newMembersMap.values()) })
        .eq('id', orgId);

    if (updateOrgError) {
        console.error('❌ Organization members update failed:', updateOrgError);
        return;
    }
    console.log('✅ Organization members updated');

    // 4. Write credentials file
    const credentialsPath = path.resolve(process.cwd(), 'CZTTCB_CREDENTIALS.md');
    fs.writeFileSync(credentialsPath, credentialsOutput);
    console.log(`\n📝 Credentials saved to: ${credentialsPath}`);

    console.log('\n🎉 Setup Complete!');
    console.log('\nNext steps:');
    console.log('1. Login with main admin: @CZTTCB / CZ passWORD');
    console.log('2. Team admins can login with their respective credentials');
    console.log('3. Each team admin will only see their assigned team in the Captain\'s Hub');
}

setupCZTTCB();
