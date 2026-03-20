
import React, { useState, useMemo } from 'react';
import { MatchFixture, MediaPost, Comment, Team, InningsStats, Organization, UserProfile } from '../../types.ts';
import { FullMatchScorecard } from '../display/FullMatchScorecard.tsx';
import { CameraModal } from '../modals/CameraModal.tsx';
import { buildBattingCard } from '../../scorer/scorecard/buildBattingCard.ts';
import { buildBowlingCard } from '../../scorer/scorecard/buildBowlingCard.ts';

interface MediaFeedProps {
   fixtures: MatchFixture[];
   teams: Team[];
   mediaPosts: MediaPost[];
   onAddMediaPost: (post: MediaPost) => void;
   onDeletePost?: (postId: string) => void;
   selectedMatch: MatchFixture | null;
   onSelectMatch: (match: MatchFixture | null) => void;
   canPost?: boolean;
   isAdmin?: boolean;
   organizations?: Organization[];
   onUpdatePost?: (post: MediaPost) => void;
   currentUser?: UserProfile | null;
}

export const MediaFeed: React.FC<MediaFeedProps> = ({
   fixtures,
   teams,
   mediaPosts,
   onAddMediaPost,
   onDeletePost,
   selectedMatch,
   onSelectMatch,

   canPost = true,
   isAdmin = false,
   organizations = [],
   onUpdatePost,
   currentUser
}) => {
   const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
   const [commentInput, setCommentInput] = useState('');
   const [matchTab, setMatchTab] = useState<'MEDIA' | 'SCORECARD' | 'STATS'>('MEDIA');
   const [isCameraOpen, setIsCameraOpen] = useState(false);

   const liveGames = fixtures.filter(f => f.status === 'Live');

   // Filter out NEWS posts (they belong in NewsFeed), keep everything else (User posts, Live status)
   const displayPosts = useMemo(() => {
      return mediaPosts
         .filter(p => p.type !== 'NEWS')
         .sort((a, b) => b.timestamp - a.timestamp);
   }, [mediaPosts]);

   const handleLike = (postId: string, isDislike = false) => {
      if (!currentUser || !onUpdatePost) return;
      const post = mediaPosts.find(p => p.id === postId);
      if (!post) return;

      const currentLikes = Array.isArray(post.likes) ? post.likes : [];
      const currentDislikes = Array.isArray(post.dislikes) ? post.dislikes : [];

      let newLikes = [...currentLikes];
      let newDislikes = [...currentDislikes];

      if (isDislike) {
         if (newDislikes.includes(currentUser.id)) {
            newDislikes = newDislikes.filter(id => id !== currentUser.id);
         } else {
            newDislikes.push(currentUser.id);
            newLikes = newLikes.filter(id => id !== currentUser.id);
         }
      } else {
         if (newLikes.includes(currentUser.id)) {
            newLikes = newLikes.filter(id => id !== currentUser.id);
         } else {
            newLikes.push(currentUser.id);
            newDislikes = newDislikes.filter(id => id !== currentUser.id);
         }
      }

      onUpdatePost({ ...post, likes: newLikes, dislikes: newDislikes });
   };

   const handleReaction = (postId: string, emoji: string) => {
      if (!currentUser || !onUpdatePost) return;
      const post = mediaPosts.find(p => p.id === postId);
      if (!post) return;

      const reactions = post.reactions || {};
      const currentRes = reactions[emoji] || [];
      let nextRes = [...currentRes];

      if (nextRes.includes(currentUser.id)) {
         nextRes = nextRes.filter(id => id !== currentUser.id);
      } else {
         nextRes.push(currentUser.id);
      }

      const nextReactions = { ...reactions, [emoji]: nextRes };
      onUpdatePost({ ...post, reactions: nextReactions });
   };

   const handleShare = (post: MediaPost) => {
      if (navigator.share) {
         navigator.share({
            title: 'Cricket Core Moment',
            text: post.caption,
            url: window.location.href
         }).catch(console.error);
      } else {
         alert(`Shared "${post.caption}" to clipboard!`);
      }
   };

   const handlePostComment = (postId: string) => {
      if (!commentInput.trim() || !currentUser || !onUpdatePost) return;

      const post = mediaPosts.find(p => p.id === postId);
      if (!post) return;

      const newComment: Comment = {
         id: `c-${Date.now()}`,
         userId: currentUser.id,
         author: currentUser.name,
         text: commentInput.trim(),
         timestamp: Date.now()
      };

      onUpdatePost({ ...post, comments: [...post.comments, newComment] });
      setCommentInput('');
   };

   const handleMediaUpload = (dataUrl: string, type: 'IMAGE' | 'VIDEO') => {
      const newPost: MediaPost = {
         id: `post-${Date.now()}`,
         type: type,
         authorName: currentUser?.name || 'Fan Cam',
         authorAvatar: currentUser?.avatarUrl || '',
         userId: currentUser?.id,
         contentUrl: dataUrl,
         caption: selectedMatch ? `Spotted at ${selectedMatch.teamAName} vs ${selectedMatch.teamBName}` : 'Match Day Vibes 📸',
         timestamp: Date.now(),
         likes: [],
         dislikes: [],
         shares: 0,
         comments: [],
         matchId: selectedMatch?.id
      };
      onAddMediaPost(newPost);
   };

   const formatTimeAgo = (timestamp: number) => {
      const diff = Date.now() - timestamp;
      const mins = Math.floor(diff / 60000);
      const hrs = Math.floor(mins / 60);
      const days = Math.floor(hrs / 24);

      if (days > 0) return `${days}d ago`;
      if (hrs > 0) return `${hrs}h ago`;
      if (mins > 0) return `${mins}m ago`;
      return 'Just now';
   };

   const getOrgName = (matchId?: string) => {
      if (!matchId) return 'Central Zone';
      const org = organizations.find(o => o.fixtures.some(f => f.id === matchId));
      return org ? org.name : 'Central Zone';
   };

   /* =========================================
      MATCH DETAIL VIEW
      ========================================= */
   if (selectedMatch) {
      const matchPosts = displayPosts.filter(p => p.matchId === selectedMatch.id);
      const savedState = selectedMatch.savedState;
      const teamA = teams.find(t => t.id === selectedMatch.teamAId);
      const teamB = teams.find(t => t.id === selectedMatch.teamBId);

      const battingCardA: InningsStats | null = (savedState && teamA) ? buildBattingCard(savedState.history, teamA.players, 1, '', '') : null;
      const bowlingCardB = (savedState && teamB) ? buildBowlingCard(savedState.history, teamB.players, 1) : [];

      const topBatter = battingCardA ? [...battingCardA.rows].sort((a, b) => b.runs - a.runs)[0] : null;
      const topBowler = [...bowlingCardB].sort((a, b) => b.wickets - a.wickets)[0];

      return (
         <div className="animate-in slide-in-from-right h-full">
            <CameraModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onUpload={handleMediaUpload} />

            {/* Match Header */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white mb-8 shadow-2xl relative overflow-hidden shrink-0">
               <div className="absolute top-0 right-0 p-4">
                  <button onClick={() => onSelectMatch(null)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl backdrop-blur-md">✕</button>
               </div>
               <div className="flex flex-col items-center">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] bg-red-600 px-3 py-1 rounded-full mb-6 animate-pulse">Live Cloud Match</div>
                  <div className="flex items-center gap-8 w-full justify-center">
                     <div className="text-center">
                        <div className="text-xl md:text-2xl font-black">{selectedMatch.teamAName}</div>
                        <div className="text-3xl md:text-4xl font-black mt-2 text-indigo-400">{selectedMatch.teamAScore || '0/0'}</div>
                     </div>
                     <div className="text-xl font-black text-slate-600">VS</div>
                     <div className="text-center">
                        <div className="text-xl md:text-2xl font-black">{selectedMatch.teamBName}</div>
                        <div className="text-3xl md:text-4xl font-black mt-2 text-indigo-400">{selectedMatch.teamBScore || '0/0'}</div>
                     </div>
                  </div>
                  <div className="mt-6 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">{getOrgName(selectedMatch.id)} • {selectedMatch.venue} • {selectedMatch.format}</div>
               </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 justify-center sticky top-0 z-20">
               {(['MEDIA', 'SCORECARD', 'STATS'] as const).map(tab => (
                  <button
                     key={tab}
                     onClick={() => setMatchTab(tab)}
                     className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${matchTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                     {tab}
                  </button>
               ))}
            </div>

            {/* TAB CONTENT */}
            <div className="space-y-6 pb-20">
               {matchTab === 'MEDIA' && (
                  <>
                     <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-center md:text-left">
                           <h4 className="font-black text-indigo-900">Share Your Moments</h4>
                           <p className="text-xs text-indigo-600/80">Upload photos directly to the live feed.</p>
                        </div>
                        {canPost ? (
                           <button
                              onClick={() => setIsCameraOpen(true)}
                              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 shadow-lg shadow-indigo-200 transition-all"
                           >
                              + Post Now
                           </button>
                        ) : (
                           <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-white px-4 py-2 rounded-lg border border-indigo-100">
                              Posting Restricted
                           </div>
                        )}
                     </div>
                     {matchPosts.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 text-xs uppercase font-bold bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">No media yet. Be the first!</div>
                     ) : (
                        matchPosts.map(post => (
                           <div key={post.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in relative">
                              {onDeletePost && (isAdmin || (currentUser && post.userId === currentUser.id)) && (
                                 <button
                                    onClick={() => { if (confirm('Delete post?')) onDeletePost(post.id); }}
                                    className="absolute top-4 right-4 z-10 text-slate-300 hover:text-red-500 font-bold bg-white/80 rounded-full w-6 h-6 flex items-center justify-center"
                                 >
                                    ✕
                                 </button>
                              )}
                              <div className="p-4 flex items-center gap-3 border-b border-slate-50">
                                 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 overflow-hidden shrink-0">
                                    {post.authorAvatar ? <img src={post.authorAvatar} className="w-full h-full object-cover" /> : post.authorName.charAt(0)}
                                 </div>
                                 <div className="flex-1">
                                    <div className="text-xs font-black text-slate-900">{post.authorName}</div>
                                    <div className="text-[8px] font-bold text-slate-400 uppercase">{formatTimeAgo(post.timestamp)}</div>
                                 </div>
                              </div>
                              {post.contentUrl && post.type === 'IMAGE' && <img src={post.contentUrl} className="w-full h-auto max-h-[500px] object-contain bg-slate-50" />}
                              {post.contentUrl && post.type === 'VIDEO' && <video src={post.contentUrl} controls className="w-full max-h-[500px] bg-black" />}
                              <div className="p-4">
                                 <p className="text-sm text-slate-700 leading-relaxed">{post.caption}</p>
                                 <div className="flex flex-wrap gap-4 mt-4 items-center border-t border-slate-50 pt-4">
                                    <div className="flex gap-2">
                                       {['🔥', '👏', '🏏', '❤️'].map(emoji => {
                                          const count = post.reactions?.[emoji]?.length || 0;
                                          const isActive = post.reactions?.[emoji]?.includes(currentUser?.id || '');
                                          return (
                                             <button
                                                key={emoji}
                                                onClick={() => handleReaction(post.id, emoji)}
                                                className={`hover:scale-110 transition-transform px-2 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${isActive ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200' : 'bg-slate-50 text-slate-400'}`}
                                             >
                                                <span>{emoji}</span>
                                                {count > 0 && <span>{count}</span>}
                                             </button>
                                          );
                                       })}
                                    </div>
                                    <button onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)} className="ml-auto hover:text-indigo-600 transition-colors text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                       💬 {post.comments.length}
                                    </button>
                                 </div>
                              </div>
                           </div>
                        ))
                     )}
                  </>
               )}

               {matchTab === 'SCORECARD' && (
                  <div className="bg-slate-950 rounded-[2rem] overflow-hidden shadow-xl border border-slate-900">
                     {savedState && teamA && teamB ? (
                        <FullMatchScorecard matchState={savedState} teamA={teamA} teamB={teamB} />
                     ) : (
                        <div className="text-center py-20 text-slate-500 text-xs font-bold uppercase">No Match Data Available</div>
                     )}
                  </div>
               )}

               {matchTab === 'STATS' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-4">Top Batter</div>
                        {topBatter ? (
                           <>
                              <div className="text-3xl font-black text-slate-900 leading-tight">{topBatter.name}</div>
                              <div className="text-sm font-bold text-slate-500 mt-2">{topBatter.runs} runs from {topBatter.balls} balls</div>
                              <div className="mt-4 inline-block bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">SR {topBatter.strikeRate}</div>
                           </>
                        ) : <div className="text-slate-400 text-xs font-bold uppercase">No records found</div>}
                     </div>
                     <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-4">Top Bowler</div>
                        {topBowler ? (
                           <>
                              <div className="text-3xl font-black text-slate-900 leading-tight">{topBowler.name}</div>
                              <div className="text-sm font-bold text-slate-500 mt-2">{topBowler.wickets} wickets conceded {topBowler.runs}</div>
                              <div className="mt-4 inline-block bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">ECON {topBowler.economy}</div>
                           </>
                        ) : <div className="text-slate-400 text-xs font-bold uppercase">No records found</div>}
                     </div>
                  </div>
               )}
            </div>
         </div>
      );
   }

   /* =========================================
      MAIN FEED VIEW
      ========================================= */
   return (
      <div className="space-y-12 animate-in fade-in h-full">
         {/* 1. Live Games Carousel */}
         <section className="shrink-0">
            <div className="flex items-center justify-between mb-4 px-2">
               <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Live Instant Scores</h3>
               </div>
               <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Streaming</span>
               </div>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-2 -mx-2">
               {liveGames.length === 0 ? (
                  <div className="w-full bg-slate-100 rounded-2xl p-8 text-center border border-dashed border-slate-300">
                     <span className="text-3xl block mb-2">💤</span>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">All games concluded for today</p>
                  </div>
               ) : (
                  liveGames.map(game => (
                     <button
                        key={game.id}
                        onClick={() => onSelectMatch(game)}
                        className="w-full max-w-xs bg-slate-900 rounded-[2rem] p-4 md:p-6 text-white relative overflow-hidden shadow-xl shrink-0 text-left transition-all hover:scale-[1.02] active:scale-95 group border border-white/5"
                     >
                        <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest shadow-lg">Live</div>
                        <div className="space-y-4 relative z-10">
                           <div className="flex justify-between items-center">
                              <span className="text-xs font-black opacity-70 uppercase tracking-widest">{game.format}</span>
                              <span className="text-[9px] font-bold text-red-400 group-hover:text-white transition-colors">WATCH NOW →</span>
                           </div>
                           <div className="flex flex-col gap-2">
                              <div className="flex justify-between items-center gap-4">
                                 <span className="text-sm font-bold flex-1 break-words line-clamp-2">{game.teamAName}</span>
                                 <span className="text-2xl font-black text-indigo-400 shrink-0">{game.teamAScore || '0/0'}</span>
                              </div>
                              <div className="text-center">
                                 <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest leading-none">VS</span>
                              </div>
                              <div className="flex justify-between items-center gap-4">
                                 <span className="text-sm font-bold flex-1 break-words line-clamp-2 text-right">{game.teamBName}</span>
                                 <span className="text-2xl font-black text-indigo-400 shrink-0">{game.teamBScore || '0/0'}</span>
                              </div>
                           </div>
                           <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center mt-2 border-t border-white/10 pt-2">
                              {getOrgName(game.id)}
                           </div>
                        </div>
                     </button>
                  ))
               )}
            </div>
         </section>

         {/* 2. Global Social Feed */}
         <section className="max-w-2xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Recent Activity
               </h3>
               {canPost ? (
                  <button
                     onClick={() => setIsCameraOpen(true)}
                     className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 shadow-lg transition-all"
                  >
                     <span>📸</span> Post Moment
                  </button>
               ) : (
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                     Posting Restricted
                  </span>
               )}
            </div>

            {displayPosts.length === 0 && fixtures.filter(f => f.status === 'Live' || f.status === 'Scheduled').length === 0 ? (
               <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-200">
                  <div className="text-5xl mb-4">📡</div>
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Waiting for fan content...</p>
               </div>
            ) : (
               <div className="space-y-6">
                  {[
                     ...displayPosts.map(p => ({ ...p, feedType: 'POST' as const })),
                     ...fixtures.filter(f => f.status === 'Live' || f.status === 'Scheduled').map(f => ({ ...f, feedType: 'FIXTURE' as const }))
                  ]
                     .sort((a: any, b: any) => (b.timestamp || Date.now()) - (a.timestamp || Date.now()))
                     .map(item => {
                        if (item.feedType === 'FIXTURE') {
                           const fixture = item as any as MatchFixture;
                           return (
                              <div
                                 key={`feed-fix-${fixture.id}`}
                                 onClick={() => onSelectMatch(fixture)}
                                 className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 relative group p-6 cursor-pointer hover:border-indigo-300 transition-all"
                              >
                                 <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-2">
                                       <span className={`w-2 h-2 rounded-full ${fixture.status === 'Live' ? 'bg-red-500 animate-pulse' : 'bg-indigo-400'}`}></span>
                                       <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{fixture.status === 'Live' ? 'Match Live' : 'Upcoming Game'}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-widest">{fixture.format}</span>
                                 </div>

                                 <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between gap-6 px-4">
                                       <div className="flex-1">
                                          <h4 className="text-lg font-black text-slate-900 break-words">{fixture.teamAName}</h4>
                                          {fixture.status === 'Live' && <p className="text-3xl font-black text-indigo-600 mt-2">{fixture.teamAScore || '0/0'}</p>}
                                       </div>
                                       <div className="text-slate-200 font-black text-sm italic">VS</div>
                                       <div className="flex-1 text-right">
                                          <h4 className="text-lg font-black text-slate-900 break-words">{fixture.teamBName}</h4>
                                          {fixture.status === 'Live' && <p className="text-3xl font-black text-indigo-600 mt-2">{fixture.teamBScore || '0/0'}</p>}
                                       </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                                       <div>
                                          <p className="text-xs font-bold text-slate-600">{fixture.venue}</p>
                                          <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(fixture.date).toLocaleDateString()}</p>
                                       </div>
                                       <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Enter Match Center →</div>
                                    </div>
                                 </div>
                              </div>
                           );
                        }

                        const post = item as any as MediaPost;
                        return (
                           <div key={post.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 relative group">
                              {isAdmin && onDeletePost && (
                                 <button
                                    onClick={() => { if (confirm('Delete post?')) onDeletePost(post.id); }}
                                    className="absolute top-4 right-4 z-10 text-slate-300 hover:text-red-500 font-bold bg-white/80 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                 >
                                    ✕
                                 </button>
                              )}
                              {/* Post Header */}
                              <div className="p-5 flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 overflow-hidden border border-slate-100 shrink-0 shadow-sm">
                                    {post.authorAvatar ? <img src={post.authorAvatar} className="w-full h-full object-cover" /> : <span className="font-black text-slate-400">{post.authorName.charAt(0)}</span>}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                       <h4 className="text-sm font-black text-slate-900 truncate">{post.authorName}</h4>
                                       {post.matchId && <span className="text-[9px] text-slate-400">• {getOrgName(post.matchId)}</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                       <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                                          {formatTimeAgo(post.timestamp)}
                                       </p>
                                       {post.matchId && (
                                          <button
                                             onClick={() => {
                                                const match = fixtures.find(f => f.id === post.matchId);
                                                if (match) onSelectMatch(match);
                                             }}
                                             className="text-[8px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-black uppercase tracking-widest hover:bg-indigo-100"
                                          >
                                             View Game
                                          </button>
                                       )}
                                    </div>
                                 </div>
                              </div>

                              {/* Content Area */}
                              {post.type === 'IMAGE' && post.contentUrl && (
                                 <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center overflow-hidden border-y border-slate-50">
                                    <img src={post.contentUrl} className="w-full h-full object-contain" />
                                 </div>
                              )}
                              {post.type === 'VIDEO' && post.contentUrl && (
                                 <div className="aspect-video bg-black relative flex items-center justify-center">
                                    <video src={post.contentUrl} controls className="w-full h-full" />
                                 </div>
                              )}
                              {post.type === 'LIVE_STATUS' && (
                                 <div className="p-10 bg-gradient-to-br from-indigo-600 to-indigo-900 text-white text-center flex flex-col items-center justify-center min-h-[220px]">
                                    <span className="text-4xl mb-4">📢</span>
                                    <p className="text-xl font-black leading-tight tracking-tight">{post.caption}</p>
                                 </div>
                              )}

                              {/* Actions & Description */}
                              <div className="p-6">
                                 {post.type !== 'LIVE_STATUS' && (
                                    <p className="text-sm font-medium text-slate-600 mb-6 leading-relaxed">
                                       <span className="font-black text-slate-900 mr-1">{post.authorName}</span> {post.caption}
                                    </p>
                                 )}

                                 <div className="flex flex-wrap items-center gap-4 border-t border-slate-50 pt-5">
                                    <div className="flex gap-2">
                                       {['🔥', '👏', '🏏', '❤️'].map(emoji => {
                                          const count = post.reactions?.[emoji]?.length || 0;
                                          const isActive = post.reactions?.[emoji]?.includes(currentUser?.id || '');
                                          return (
                                             <button
                                                key={emoji}
                                                onClick={() => handleReaction(post.id, emoji)}
                                                className={`hover:scale-110 transition-transform px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 ${isActive ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200' : 'bg-slate-50 text-slate-400'}`}
                                             >
                                                <span>{emoji}</span>
                                                {count > 0 && <span>{count}</span>}
                                             </button>
                                          );
                                       })}
                                    </div>
                                    <button onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)} className={`flex items-center gap-2 group transition-all ${activeCommentPostId === post.id ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}>
                                       <span className="text-xl group-hover:scale-125 transition-transform">💬</span>
                                       <span className="text-[10px] font-black uppercase tracking-widest">{post.comments.length}</span>
                                    </button>
                                    <button onClick={() => handleShare(post)} className="flex items-center gap-2 group ml-auto transition-all text-slate-400 hover:text-indigo-600">
                                       <span className="text-xl group-hover:scale-125 transition-transform">🚀</span>
                                       <span className="text-[10px] font-black uppercase tracking-widest">Share</span>
                                    </button>
                                 </div>

                                 {/* Nested Comments */}
                                 {activeCommentPostId === post.id && (
                                    <div className="mt-5 p-4 bg-slate-50 rounded-2xl animate-in slide-in-from-top-2 border border-slate-100">
                                       <div className="space-y-4 mb-4 max-h-48 overflow-y-auto no-scrollbar">
                                          {post.comments.map(c => (
                                             <div key={c.id} className="flex flex-col gap-0.5">
                                                <span className="font-black text-slate-900 text-[10px] uppercase tracking-widest">{c.author}</span>
                                                <span className="text-slate-600 text-xs font-medium">{c.text}</span>
                                             </div>
                                          ))}
                                          {post.comments.length === 0 && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center py-4">No comments yet</p>}
                                       </div>
                                       <div className="flex gap-2">
                                          <input
                                             value={commentInput}
                                             onChange={e => setCommentInput(e.target.value)}
                                             onKeyDown={e => e.key === 'Enter' && handlePostComment(post.id)}
                                             placeholder="Join the discussion..."
                                             className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                                          />
                                          <button onClick={() => handlePostComment(post.id)} className="bg-slate-900 text-white px-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-colors">Post</button>
                                       </div>
                                    </div>
                                 )}
                              </div>
                           </div>
                        );
                     })}
               </div>
            )}
         </section>

         <CameraModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onUpload={handleMediaUpload} />
      </div>
   );
};
