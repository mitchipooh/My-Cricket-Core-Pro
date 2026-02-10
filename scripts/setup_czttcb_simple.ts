import { createClient } from '@supabase/supabase-js';
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

async function setupCZTTCB() {
    console.log('🌱 Setting up Central Zonal Council TTCB...');

    const orgId = 'org-czttcb';
    let credentialsOutput = `# Central Zonal Council TTCB Credentials\n\n`;
    credentialsOutput += `## Main Administrator\n\n`;
    credentialsOutput += `| Handle | Password | Role |\n`;
    credentialsOutput += `|--------|----------|------|\n`;

    // 1. Main Admin
    const mainAdminId = 'user-czttcb-admin';
    const mainAdminHandle = '@CZTTCB';
    const mainAdminPassword = 'CZ passWORD';

    credentialsOutput += `| ${mainAdminHandle} | ${mainAdminPassword} | Administrator |\n\n`;

    // 2. Prepare data arrays
    const teams: any[] = [];
    const allPlayers: any[] = [];
    const profiles: any[] = [];
    const orgMembers: any[] = [];

    // Add main admin profile
    profiles.push({
        id: mainAdminId,
        name: 'Central Zonal Council Admin',
        handle: mainAdminHandle,
        role: 'Administrator',
        password: mainAdminPassword,
        created_at: new Date().toISOString()
    });

    // Add main admin to org members
    orgMembers.push({
        userId: mainAdminId,
        name: 'Central Zonal Council Admin',
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

    // 3. Create teams, players, and team admins
    CLUB_NAMES.forEach((clubName) => {
        const teamSlug = clubName.replace(/\s+/g, '').toLowerCase();
        const teamId = `team-czttcb-${teamSlug}`;

        // Team
        teams.push({
            id: teamId,
            org_id: orgId,
            name: clubName,
            location: 'Central Trinidad'
        });

        // 11 Players
        for (let i = 1; i <= 11; i++) {
            allPlayers.push({
                id: `p-${teamSlug}-${i}`,
                team_id: teamId,
                name: `Player ${i}`,
                role: i <= 3 ? "Batsman" : i <= 7 ? "All-rounder" : "Bowler",
                stats: {
                    matches: 0, runs: 0, wickets: 0, catches: 0, stumpings: 0, runOuts: 0,
                    ballsFaced: 0, ballsBowled: 0, runsConceded: 0, maidens: 0,
                    highestScore: 0, bestBowling: '-', fours: 0, sixes: 0, hundreds: 0,
                    fifties: 0, ducks: 0, threeWickets: 0, fiveWickets: 0
                },
                details: {}
            });
        }

        // Team Admin
        const teamAdminHandle = `@team_${teamSlug}`;
        const teamAdminPassword = `team_${teamSlug}_2026`;
        const teamAdminId = `user-admin-${teamSlug}`;

        profiles.push({
            id: teamAdminId,
            name: `${clubName} Team Admin`,
            handle: teamAdminHandle,
            role: 'Administrator',
            password: teamAdminPassword,
            created_at: new Date().toISOString()
        });

        credentialsOutput += `| ${clubName} | ${teamAdminHandle} | ${teamAdminPassword} |\n`;

        orgMembers.push({
            userId: teamAdminId,
            name: `${clubName} Team Admin`,
            handle: teamAdminHandle,
            role: 'Administrator',
            addedAt: Date.now(),
            managedTeamId: teamId,
            permissions: {
                canEditOrg: false,
                canManageMembers: false,
                canEditSquad: true,
                canSubmitReport: true
            }
        });
    });

    console.log('📊 Summary:');
    console.log(`   - Teams: ${teams.length}`);
    console.log(`   - Players: ${allPlayers.length}`);
    console.log(`   - Profiles: ${profiles.length}`);
    console.log(`   - Org Members: ${orgMembers.length}`);

    // 4. Insert into database
    console.log('\n🚀 Inserting into Supabase...');

    // Step 1: Create organization if it doesn't exist
    const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', orgId)
        .single();

    if (!existingOrg) {
        console.log('Creating organization...');
        const { error } = await supabase.from('organizations').insert({
            id: orgId,
            name: 'Central Zonal Council TTCB',
            type: 'GOVERNING_BODY',
            members: []
        });
        if (error) {
            console.error('❌ Org creation failed:', error);
            return;
        }
        console.log('✅ Organization created');
    } else {
        console.log('✅ Organization exists');
    }

    // Step 2: Insert teams
    const { error: teamsError } = await supabase.from('teams').upsert(teams);
    if (teamsError) {
        console.error('❌ Teams failed:', teamsError);
        return;
    }
    console.log('✅ Teams inserted');

    // Step 3: Insert players
    const { error: playersError } = await supabase.from('roster_players').upsert(allPlayers);
    if (playersError) {
        console.error('❌ Players failed:', playersError);
        return;
    }
    console.log('✅ Players inserted');

    // Step 4: Insert profiles
    const { error: profilesError } = await supabase.from('user_profiles').upsert(profiles);
    if (profilesError) {
        console.error('❌ Profiles failed:', profilesError);
        return;
    }
    console.log('✅ Profiles inserted');

    // Step 5: Update org members
    const { data: org } = await supabase.from('organizations').select('members').eq('id', orgId).single();
    const existingMembers = org?.members || [];
    const membersMap = new Map();
    existingMembers.forEach((m: any) => membersMap.set(m.userId, m));
    orgMembers.forEach(m => membersMap.set(m.userId, m));

    const { error: updateError } = await supabase
        .from('organizations')
        .update({ members: Array.from(membersMap.values()) })
        .eq('id', orgId);

    if (updateError) {
        console.error('❌ Org update failed:', updateError);
        return;
    }
    console.log('✅ Organization members updated');

    // 5. Write credentials
    fs.writeFileSync('CZTTCB_CREDENTIALS.md', credentialsOutput);
    console.log('\n📝 Credentials saved to CZTTCB_CREDENTIALS.md');

    console.log('\n🎉 Setup Complete!');
    console.log('\nLogin with: @CZTTCB / CZ passWORD');
}

setupCZTTCB();
