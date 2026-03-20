
import { Organization, Team, MatchFixture, MediaPost, UserProfile, Player } from '../types';
import { generateId } from './idGenerator';

// --- HELPER TO GENERATE TIMES ---
const now = Date.now();
const hour = 3600000;
const day = 86400000;

// --- DEMO PLAYERS ---
const createDemoPlayer = (name: string, role: Player['role']): Player => ({
    id: generateId('p'),
    name,
    role,
    stats: {
        runs: Math.floor(Math.random() * 5000),
        wickets: Math.floor(Math.random() * 200),
        matches: Math.floor(Math.random() * 100),
        ballsFaced: 0, ballsBowled: 0, runsConceded: 0, catches: 0, runOuts: 0, stumpings: 0,
        fours: 0, sixes: 0, hundreds: 0, fifties: 0, ducks: 0, threeWickets: 0, fiveWickets: 0, maidens: 0
    },
    playerDetails: {
        battingStyle: 'Right-hand',
        bowlingStyle: 'Right-arm Medium',
        primaryRole: role as any,
        lookingForClub: false,
        isHireable: true
    }
});

const teamAPlayers = [
    createDemoPlayer('Virat Kohli', 'Batsman'),
    createDemoPlayer('Rohit Sharma', 'Batsman'),
    createDemoPlayer('KL Rahul', 'Wicket-keeper'),
    createDemoPlayer('Hardik Pandya', 'All-rounder'),
    createDemoPlayer('Jasprit Bumrah', 'Bowler'),
    createDemoPlayer('Mohammed Shami', 'Bowler'),
];

const teamBPlayers = [
    createDemoPlayer('Steve Smith', 'Batsman'),
    createDemoPlayer('David Warner', 'Batsman'),
    createDemoPlayer('Alex Carey', 'Wicket-keeper'),
    createDemoPlayer('Glenn Maxwell', 'All-rounder'),
    createDemoPlayer('Pat Cummins', 'Bowler'),
    createDemoPlayer('Mitchell Starc', 'Bowler'),
];

// --- DEMO TEAMS ---
export const DEMO_TEAMS: Team[] = [
    {
        id: 'team-india-demo',
        name: 'India Warriors',
        location: 'Mumbai, India',
        players: teamAPlayers,
        logoUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200&h=200&fit=crop'
    },
    {
        id: 'team-aus-demo',
        name: 'Australian Stars',
        location: 'Sydney, Australia',
        players: teamBPlayers,
        logoUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=200&h=200&fit=crop'
    }
];

// --- DEMO ORGANIZATIONS ---
export const DEMO_ORGS: Organization[] = [
    {
        id: 'org-icc-demo',
        name: 'International Cricket Council',
        type: 'GOVERNING_BODY',
        description: 'The global governing body for cricket.',
        logoUrl: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=200&h=200&fit=crop',
        isPublic: true,
        members: [],
        applications: [],
        tournaments: [],
        groups: [],
        memberTeams: DEMO_TEAMS,
        fixtures: [],
    },
    {
        id: 'org-ipl-demo',
        name: 'IPL Global League',
        type: 'GOVERNING_BODY',
        description: 'The premier T20 league for world-class talent.',
        logoUrl: 'https://images.unsplash.com/photo-1594470117722-da434a3eb3f9?w=200&h=200&fit=crop',
        isPublic: true,
        members: [],
        applications: [],
        tournaments: [],
        groups: [],
        memberTeams: DEMO_TEAMS,
        fixtures: [],
    }
];

// --- DEMO FIXTURES ---
export const DEMO_MATCHES: MatchFixture[] = [
    {
        id: 'match-live-demo',
        teamAId: 'team-india-demo',
        teamBId: 'team-aus-demo',
        teamAName: 'India Warriors',
        teamBName: 'Australian Stars',
        date: new Date(now).toISOString(),
        venue: 'Eden Gardens, Kolkata',
        status: 'Live',
        teamAScore: '185/4',
        teamBScore: '142/2',
        result: 'India Warriors leading by 43 runs',
        format: 'T20'
    },
    {
        id: 'match-comp-demo',
        teamAId: 'team-aus-demo',
        teamBId: 'team-india-demo',
        teamAName: 'Australian Stars',
        teamBName: 'India Warriors',
        date: new Date(now - day).toISOString(),
        venue: 'MCG, Melbourne',
        status: 'Completed',
        teamAScore: '312/8',
        teamBScore: '315/6',
        result: 'India Warriors won by 4 wickets',
        winnerId: 'team-india-demo',
        format: '50-over'
    }
];

// --- DEMO MEDIA POSTS ---
export const DEMO_POSTS: MediaPost[] = [
    {
        id: 'post-demo-1',
        type: 'NEWS',
        title: 'India Warriors Clinch Dramatic Series Win!',
        caption: 'A stunning performance by the middle order guided the Warriors to a historic 3-wicket victory in Melbourne.',
        authorName: 'Cricket Weekly',
        timestamp: now - (hour * 2),
        contentUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80',
        likes: ['user-1', 'user-2'],
        dislikes: [],
        shares: 15,
        comments: [],
        reactions: { '🔥': ['user-1', 'user-2', 'user-3'], '👏': ['user-4'] }
    },
    {
        id: 'post-demo-2',
        type: 'IMAGE',
        authorName: 'Dennis Trinity',
        caption: 'Match day at Eden Gardens is something special! 🏏🔥',
        timestamp: now - hour,
        contentUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80',
        likes: ['user-10'],
        dislikes: [],
        shares: 5,
        comments: [
            { id: 'c1', userId: 'user-5', author: 'Rahul', text: 'Best stadium in the world!', timestamp: now - (hour / 2) }
        ]
    }
];
