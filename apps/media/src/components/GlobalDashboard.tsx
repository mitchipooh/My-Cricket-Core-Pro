
import React, { useState } from 'react';
import { Organization, UserProfile, MatchFixture, PlayerWithContext } from '../../types.ts';
import { OrgCard } from '../admin/OrgCard.tsx';
import { Can } from '../common/Can.tsx';
import { ApplicationModal } from '../modals/ApplicationModal.tsx';

interface GlobalDashboardProps {
  organizations: Organization[];
  profile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onSelectOrg: (id: string) => void;
  onRequestDeleteOrg: (org: Organization) => void;
  onRequestCreateOrg: () => void;
  onViewOrg?: (orgId: string) => void;
  onRequestQuickMatch: () => void;
  onRequestTransferMarket?: () => void; // NEW
  onOpenMediaStudio: () => void;
  fixtures: MatchFixture[];
  topBatsmen: PlayerWithContext[];
  topBowlers: PlayerWithContext[];
  onStartMatch: (match: MatchFixture) => void;
  onViewMatch: (match: MatchFixture) => void;
  onViewTeam: (teamId: string) => void;
  currentUserId?: string;
  onApplyForOrg?: (orgId: string) => void;
  onUpgradeProfile?: () => void;
  following?: { teams: string[], players: string[], orgs: string[] };
  onToggleFollow?: (type: 'TEAM' | 'PLAYER' | 'ORG', id: string) => void;
  onRequestCaptainHub?: () => void;
  onRequestMatchReports?: () => void;
  showCaptainHub?: boolean;
  onOpenCaptainHub?: () => void;
  onCreateUser?: (user: UserProfile, password: string) => Promise<{ success: boolean; userId?: string; error?: { message: string } }>;
  globalUsers?: UserProfile[]; // NEW
  onRemoveFixture?: (fixtureId: string) => void; // NEW
}



export const GlobalDashboard: React.FC<GlobalDashboardProps> = ({
  organizations, profile, onUpdateProfile, onSelectOrg, onRequestDeleteOrg, onRequestCreateOrg,
  onRequestQuickMatch, onOpenMediaStudio, fixtures, topBatsmen, topBowlers,
  onStartMatch, onViewMatch, onViewTeam, currentUserId, onApplyForOrg, onUpgradeProfile,
  following, onToggleFollow, onRequestCaptainHub, showCaptainHub, onRequestMatchReports, onOpenCaptainHub,
  onViewOrg, onCreateUser, onRequestTransferMarket, globalUsers = [], // NEW
  onRemoveFixture // NEW
}) => {

  const [showApplicationModal, setShowApplicationModal] = useState(false);

  // Safety check
  if (!profile) return <div className="p-10 text-center font-bold text-slate-400">Loading Profile...</div>;

  // Access Logic
  const myOrgs = organizations.filter(org => org.members.some(m => m.userId === currentUserId));
  // Filter discovery to only show PUBLIC organizations (or ones user is already in)
  const discoverOrgs = organizations.filter(org => org.isPublic !== false && !org.members.some(m => m.userId === currentUserId));

  // Match Official Resume Feature
  // NEW: Filter fixtures to only show matches from user's organizations (Command Center scoping)
  const myOrgIds = myOrgs.map(org => org.id);
  const myOrgFixtures = fixtures.filter(fixture => {
    // Check if fixture belongs to any of user's organizations
    const hostOrg = organizations.find(org => org.fixtures.some(f => f.id === fixture.id));
    if (!hostOrg) return false; // Don't show standalone matches in Command Center
    return myOrgIds.includes(hostOrg.id);
  });
  const liveMatches = myOrgFixtures.filter(f => f.status === 'Live');



  const isAdminOrScorer = profile.role === 'Administrator' || profile.role === 'Scorer';
  const isUmpire = profile.role === 'Umpire';
  const isScorer = profile.role === 'Scorer';
  const isFan = profile.role === 'Fan';
  const isPlayer = profile.role === 'Player';
  const isGuest = profile.role === 'Guest';



  // Helper to check if user can claim a specific match
  const canClaimMatch = (match: MatchFixture) => {
    if (!isAdminOrScorer && !isUmpire) return false;
    if (match.status === 'Completed') return false;

    const hostOrg = organizations.find(org => org.fixtures.some(fx => fx.id === match.id));
    if (!hostOrg) return true;

    const isMember = hostOrg.members.some(m => m.userId === currentUserId);
    return isMember;
  };



  const handleApplyClick = (orgId: string) => {
    if (isGuest && onUpgradeProfile) {
      alert("Please create a profile to apply to organizations.");
      onUpgradeProfile();
    } else if (onApplyForOrg) {
      onApplyForOrg(orgId);
    }
  };

  return (
    <div className="animate-in fade-in duration-700 pb-20">
      <ApplicationModal
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        organizations={organizations.filter(org => org.isPublic !== false)}
        onApply={handleApplyClick}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter">
            {isFan || isGuest ? 'Fun Hub' : 'Command Center'}
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">
            {isFan || isGuest ? 'Fan Zone & Live Games' : isPlayer ? 'Player Hub' : 'Global Operations'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Can role={profile.role} perform="fixture:generate">
            <button onClick={onRequestQuickMatch} className="flex-1 md:flex-none bg-emerald-500 text-white px-3 md:px-5 py-2.5 md:py-3 rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-400 hover:scale-105 transition-all flex items-center justify-center gap-2 whitespace-nowrap">
              <span>⚡</span> Quick Match
            </button>
          </Can>
          {(isFan || isPlayer || isGuest) && onUpgradeProfile && (
            <button onClick={onUpgradeProfile} className="flex-1 md:flex-none bg-indigo-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-500 hover:scale-105 transition-all whitespace-nowrap">
              {isGuest ? 'Create Profile' : 'Upgrade Profile'}
            </button>
          )}
          <button onClick={onOpenMediaStudio} className="flex-1 md:flex-none bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-widest shadow-xl shadow-pink-200 hover:shadow-pink-300 hover:scale-105 transition-all flex items-center justify-center gap-2 whitespace-nowrap">
            <span>🔴</span> Media Studio
          </button>
          {showCaptainHub && onOpenCaptainHub && (
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button onClick={onOpenCaptainHub} className="flex-1 md:flex-none bg-indigo-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-500 hover:scale-105 transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                <span>🎖️</span> Captain's Hub
              </button>
              <button onClick={onRequestMatchReports} className="flex-1 md:flex-none bg-slate-900 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 hover:scale-105 transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                <span>📋</span> Reports
              </button>
            </div>
          )}
          <Can role={profile.role} perform="org:create">
            <button onClick={onRequestTransferMarket} className="flex-1 md:flex-none bg-white text-indigo-600 border border-slate-200 hover:bg-slate-50 px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-widest transition-all shadow-xl whitespace-nowrap">Recruit Talent 🏃‍♂️</button>
            <button onClick={onRequestCreateOrg} className="flex-1 md:flex-none bg-slate-900 text-white hover:bg-slate-800 px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-widest transition-all shadow-xl whitespace-nowrap">+ New Org</button>
          </Can>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6">
        <div className="space-y-6 md:space-y-8">

          {/* MATCH OFFICIAL RESUME SECTION */}
          {(isUmpire || isScorer) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-[2rem] p-8 shadow-sm">
              <h3 className="text-xl font-black text-yellow-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Active Assignments
              </h3>
              {liveMatches.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {liveMatches.map(m => (
                    <div key={m.id} className="bg-white p-4 rounded-2xl border border-yellow-100 flex items-center justify-between">
                      <div>
                        <div className="font-black text-sm text-slate-900">{m.teamAName} vs {m.teamBName}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">{m.venue}</div>
                      </div>
                      <button
                        onClick={() => onStartMatch(m)}
                        className="bg-yellow-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-yellow-600 transition-all"
                      >
                        Resume
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-yellow-700/60 text-xs font-bold uppercase tracking-widest">No live matches to officiate currently.</p>
              )}
            </div>
          )}

          {/* MATCH DAY HIGHLIGHTS - NEW Prominent Section */}
          {(liveMatches.length > 0 || myOrgFixtures.some(f => f.status === 'Scheduled')) && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Match Day
                </h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full border border-slate-200">Live & Upcoming</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myOrgFixtures
                  .filter(f => f.status === 'Live' || f.status === 'Scheduled')
                  .sort((a, b) => {
                    // 1. Status Priority (Live > Scheduled)
                    if (a.status === 'Live' && b.status !== 'Live') return -1;
                    if (a.status !== 'Live' && b.status === 'Live') return 1;

                    // 2. User Affiliation Priority
                    const aIsMyOrg = organizations.some(o => o.fixtures.some(fx => fx.id === a.id) && o.members.some(m => m.userId === currentUserId));
                    const bIsMyOrg = organizations.some(o => o.fixtures.some(fx => fx.id === b.id) && o.members.some(m => m.userId === currentUserId));
                    if (aIsMyOrg && !bIsMyOrg) return -1;
                    if (!aIsMyOrg && bIsMyOrg) return 1;

                    // 3. Date Priority (Soonest first)
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                  })
                  .slice(0, 10)
                  .map(f => {
                    const isClaimable = canClaimMatch(f);
                    const isAdmin = profile.role === 'Administrator';
                    const isMyOrg = organizations.some(o => o.fixtures.some(fx => fx.id === f.id) && o.members.some(m => m.userId === currentUserId));
                    const hostOrg = organizations.find(o => o.fixtures.some(fx => fx.id === f.id));
                    return (
                      <div
                        key={f.id}
                        className={`p-4 rounded-3xl border transition-all hover:bg-slate-50 group flex items-center justify-between gap-4 ${f.status === 'Live' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
                          }`}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0" onClick={() => onViewMatch(f)}>
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${f.status === 'Live' ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-indigo-50 text-indigo-500'}`}>
                            {f.status === 'Live' ? '●' : '📅'}
                          </div>
                          <div className="truncate flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm truncate">{f.teamAName} vs {f.teamBName}</span>
                              <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${f.status === 'Live' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                {f.status === 'Live' ? 'Live' : 'Upcoming'}
                              </span>
                              {!isMyOrg && hostOrg && (
                                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600 border border-indigo-200">
                                  Global: {hostOrg.name}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{f.venue} • {new Date(f.date).toLocaleDateString()}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isClaimable && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onStartMatch(f); }}
                              className="bg-indigo-600 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg"
                            >
                              {f.status === 'Live' ? 'Resume' : 'Claim'}
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); onViewMatch(f); }}
                            className="bg-slate-100 text-slate-900 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
                          >
                            Stats
                          </button>
                          {isAdmin && onRemoveFixture && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Delete this fixture permanently?')) onRemoveFixture(f.id);
                              }}
                              className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* MY ORGANIZATIONS */}
          {!isFan && !isGuest && (
            <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> My Organizations</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {myOrgs.length > 0 ? (
                  myOrgs.map(org => (
                    <OrgCard
                      key={org.id}
                      org={org}
                      userRole={profile.role}
                      onOpen={onSelectOrg}
                      onDeleteRequest={onRequestDeleteOrg}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">You are not a member of any organization.</p>
                  </div>
                )}
                <Can role={profile.role} perform="org:create">
                  <button onClick={onRequestCreateOrg} className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 hover:bg-slate-50 hover:border-indigo-300 transition-all text-slate-400 hover:text-indigo-600 gap-2 group aspect-[4/3] md:aspect-auto">
                    <span className="text-3xl md:text-4xl font-thin group-hover:scale-110 transition-transform">+</span>
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-center">New Org</span>
                  </button>
                </Can>
              </div>
            </div>
          )}

          {/* DISCOVER ORGANIZATIONS */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-300"></span> {isPlayer ? 'Find Clubs' : 'Discover'}</h3>
              {!isFan && !isGuest && (
                <button onClick={() => setShowApplicationModal(true)} className="text-indigo-600 font-bold text-xs uppercase tracking-widest hover:underline">Find More</button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {discoverOrgs.slice(0, 6).map(org => {
                const isFollowing = following?.orgs.includes(org.id);

                return (
                  <div key={org.id} className="bg-white border border-slate-200 p-4 rounded-2xl opacity-85 hover:opacity-100 transition-all relative overflow-hidden group flex flex-col h-full">
                    <button onClick={() => onViewOrg && onViewOrg(org.id)} className="text-left w-full hover:underline group-hover:text-indigo-600 transition-colors mb-2">
                      <h4 className="font-black text-sm md:text-base text-slate-900 line-clamp-1">{org.name}</h4>
                    </button>
                    <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                      <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${org.type === 'GOVERNING_BODY' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {org.type === 'GOVERNING_BODY' ? 'Org' : 'Club'}
                      </span>
                      <span className="text-[9px] text-slate-500 truncate">{org.country || 'Global'}</span>
                    </div>

                    <div className="mt-auto">
                      {isFan || isGuest ? (
                        <button
                          onClick={() => onToggleFollow && onToggleFollow('ORG', org.id)}
                          className={`w-full py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isFollowing ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-200'}`}
                        >
                          {isFollowing ? 'Following' : 'Follow'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApplyClick(org.id)}
                          className="w-full py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          {isPlayer && org.type === 'CLUB' ? 'Join' : 'Apply'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR - GLOBAL MATCHES & STATS */}
        <div className="space-y-8">


          <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-xl shadow-slate-100">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Global Leaders</h3>
            <div className="space-y-6">
              <div>
                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3">Orange Cap</div>
                {topBatsmen.slice(0, 3).map((p, i) => (
                  <div key={p.id} className="flex justify-between items-center text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">{p.name}</span>
                      <button onClick={() => onViewTeam(p.teamId)} className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1 rounded hover:bg-slate-200">{p.teamName}</button>
                    </div>
                    <span className="font-black text-slate-900">{p.stats.runs}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-3">Purple Cap</div>
                {topBowlers.slice(0, 3).map((p, i) => (
                  <div key={p.id} className="flex justify-between items-center text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">{p.name}</span>
                      <button onClick={() => onViewTeam(p.teamId)} className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1 rounded hover:bg-slate-200">{p.teamName}</button>
                    </div>
                    <span className="font-black text-slate-900">{p.stats.wickets}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

