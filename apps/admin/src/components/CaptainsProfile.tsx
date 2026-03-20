
import React, { useState, useMemo, useEffect } from 'react';
import { Player, Team, MatchFixture, PlayerMatchPerformance, MatchReportSubmission, UserProfile, GameIssue } from '../../types';
import { MatchReportForm } from './MatchReportForm.tsx';
import { ProtestModal } from './ProtestModal.tsx';
import { SquadSelectorModal } from './SquadSelectorModal';
import { StatsAnalytics } from '../analytics/StatsAnalytics';

interface CaptainsProfileProps {
    team: Team;
    fixtures: MatchFixture[];
    allPlayers: Player[];
    onBack: () => void;
    onSubmitReport: (report: MatchReportSubmission) => void;
    onLodgeProtest: (issue: GameIssue) => void;
    currentUser: UserProfile;
    issues?: GameIssue[];
    onUpdateFixtureSquad: (fixtureId: string, squadIds: string[]) => void;
}

export const CaptainsProfile: React.FC<CaptainsProfileProps> = ({
    team,
    fixtures,
    allPlayers,
    onBack,
    onSubmitReport,
    onLodgeProtest,
    currentUser,
    issues = [],
    onUpdateFixtureSquad
}) => {
    console.log('🏏 CaptainsProfile RENDERED', { team, fixturesCount: fixtures.length });

    const [view, setView] = useState<'OVERVIEW' | 'REPORT_FORM' | 'INSIGHTS' | 'REPORTS'>('OVERVIEW');
    const [selectedFixture, setSelectedFixture] = useState<MatchFixture | null>(null);
    const [selectedFixtureForSquad, setSelectedFixtureForSquad] = useState<string | null>(null);
    const [isProtestModalOpen, setIsProtestModalOpen] = useState(false);

    // Best 11 Logic: Simple heuristic based on aggregate stats
    const best11 = useMemo(() => {
        const players = [...team.players];
        // Sort by weighted score: (runs + wickets * 25) / matches
        return players
            .sort((a, b) => {
                const scoreA = (a.stats.runs + (a.stats.wickets * 25)) / (a.stats.matches || 1);
                const scoreB = (b.stats.runs + (b.stats.wickets * 25)) / (b.stats.matches || 1);
                return scoreB - scoreA;
            })
            .slice(0, 11);
    }, [team.players]);

    const pendingFixtures = useMemo(() => fixtures.filter(f =>
        f && // Check if fixture exists FIRST
        !f.reportSubmission &&
        (f.teamAId === team.id || f.teamBId === team.id) &&
        (f.status === 'Completed' || new Date(f.date).getTime() < Date.now())
    ), [fixtures, team.id]);

    // Notification Effect
    useEffect(() => {
        if (pendingFixtures.length > 0) {
            // Simulate sending a phone notification
            console.log('Push Notification Sent: Captain Report Required for', pendingFixtures.map(f => f.id));

            // Browser Notification API
            // Disabled to prevent Mobile Crashes: "Illegal constructor"
            if ('Notification' in window && Notification.permission === 'granted') {
                try {
                    // new Notification('Action Required', { body: `You have ${pendingFixtures.length} pending match reports.` });
                } catch (e) {
                    console.log('Notification API not supported');
                }
            }
        }
    }, [pendingFixtures.length]);
    const submittedReports = fixtures
        .filter(f => f && f.reportSubmission && (f.teamAId === team.id || f.teamBId === team.id))
        .map(f => f.reportSubmission!);

    console.log('🏏 CaptainsProfile STATE', { view, pendingCount: pendingFixtures.length, submittedCount: submittedReports.length });

    return (
        <div className="max-w-6xl mx-auto p-6 md:p-12 min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
                <div>
                    <button onClick={onBack} className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-4 hover:text-indigo-500 transition-colors">
                        ← Back
                    </button>
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-2xl">
                            {team.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{team.name} Hub</h1>
                            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-1">
                                {currentUser.role === 'Coach' ? 'Coach' : 'Captain'}: {currentUser.name}
                                <button
                                    onClick={onBack}
                                    className="ml-4 text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-500 py-1 px-3 rounded-full transition-all"
                                >
                                    Back
                                </button>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-center">
                    <button
                        onClick={() => setIsProtestModalOpen(true)}
                        className="bg-red-50 text-red-500 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-100 transition-colors shadow-sm border border-red-100"
                    >
                        ⚠ Lodge Report
                    </button>

                    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner w-fit">
                        <button
                            onClick={() => setView('OVERVIEW')}
                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'OVERVIEW' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Squad
                        </button>
                        <button
                            onClick={() => setView('INSIGHTS')}
                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'INSIGHTS' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Insights
                        </button>
                        <button
                            onClick={() => setView('REPORTS')}
                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'REPORTS' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'} relative`}
                        >
                            Reports
                            {pendingFixtures.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {view === 'OVERVIEW' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100">
                            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                Current Squad
                                <span className="text-xs bg-indigo-50 text-indigo-500 px-3 py-1 rounded-full">{team.players.length} Players</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {team.players.map(player => (
                                    <div key={player.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-200 overflow-hidden">
                                                {player.photoUrl ? <img src={player.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-xs">PIC</div>}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase text-sm tracking-tight">{player.name}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{player.role}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-slate-900">{player.stats.runs}</p>
                                            <p className="text-[8px] font-black text-slate-400 uppercase">Runs</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl text-white">
                            <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                                Submissions
                                {pendingFixtures.length > 0 && <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>}
                            </h3>

                            {pendingFixtures.length === 0 ? (
                                <div className="text-center py-10 opacity-40">
                                    <p className="font-bold text-sm">All match results submitted.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingFixtures.map(fixture => (
                                        <div key={fixture.id} className="p-6 bg-white/10 rounded-[2rem] border border-white/5 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Post-Match Report</p>
                                                <p className="text-[10px] font-black text-white/40 uppercase">{fixture.date}</p>
                                            </div>
                                            <p className="font-black text-xl leading-none">{fixture.teamAName} vs {fixture.teamBName}</p>
                                            <button
                                                onClick={() => { setSelectedFixture(fixture); setView('REPORT_FORM'); }}
                                                className="w-full py-4 bg-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-500 transition-all"
                                            >
                                                Open Result Sheet
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100">
                            <h3 className="text-xl font-black text-slate-900 mb-6">History</h3>
                            <div className="space-y-4">
                                {submittedReports.length === 0 && <p className="text-slate-400 text-center py-8 font-bold text-xs uppercase tracking-widest">No reports yet</p>}
                                {submittedReports.slice(0, 3).map(report => (
                                    <div key={report.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div>
                                            <p className="font-black text-slate-900 text-[10px] uppercase tracking-tight">{fixtures.find(f => f.id === report.matchId)?.teamAName} v {fixtures.find(f => f.id === report.matchId)?.teamBName}</p>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-loose">
                                                {new Date(report.timestamp).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-[7px] font-black uppercase tracking-widest ${report.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600' :
                                            report.status === 'REJECTED' ? 'bg-red-50 text-red-600' :
                                                'bg-indigo-50 text-indigo-600'
                                            }`}>
                                            {report.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {view === 'REPORTS' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100">
                            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                Match Reports History
                                <span className="text-xs bg-indigo-50 text-indigo-500 px-3 py-1 rounded-full">{submittedReports.length} Submitted</span>
                            </h3>

                            <div className="space-y-4">
                                {submittedReports.length === 0 && (
                                    <div className="text-center py-20 flex flex-col items-center gap-4">
                                        <span className="text-4xl opacity-20">📭</span>
                                        <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No reports submitted yet</p>
                                    </div>
                                )}
                                {submittedReports.map(report => (
                                    <div key={report.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 flex items-center justify-between group hover:border-indigo-200 transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ${report.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-600' :
                                                report.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                                                    'bg-indigo-100 text-indigo-600'
                                                }`}>
                                                {report.status === 'VERIFIED' ? '✓' : report.status === 'REJECTED' ? '✕' : '?'}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-lg uppercase tracking-tight">
                                                    {fixtures.find(f => f.id === report.matchId)?.teamAName} vs {fixtures.find(f => f.id === report.matchId)?.teamBName}
                                                </p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                    Submitted: {new Date(report.timestamp).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${report.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-600' :
                                                report.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                                                    'bg-indigo-100 text-indigo-600'
                                                }`}>
                                                {report.status}
                                            </span>
                                            {report.adminFeedback && (
                                                <p className="text-[9px] font-bold text-red-500 max-w-[150px] text-right italic">"{report.adminFeedback}"</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ISSUES & PROTESTS SECTION */}
                        <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100">
                            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                Protests & Issues
                                <span className="text-xs bg-orange-50 text-orange-500 px-3 py-1 rounded-full">{issues.filter(i => i.teamId === team.id).length} Lodged</span>
                            </h3>

                            <div className="space-y-4">
                                {issues.filter(i => i.teamId === team.id).length === 0 && (
                                    <div className="text-center py-10 flex flex-col items-center gap-4">
                                        <span className="text-4xl opacity-20">⚖️</span>
                                        <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No active issues or protests</p>
                                    </div>
                                )}
                                {issues.filter(i => i.teamId === team.id).map(issue => (
                                    <div key={issue.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 space-y-4 hover:border-indigo-200 transition-all">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black ${issue.type === 'PROTEST' ? 'bg-red-100 text-red-500' : 'bg-orange-100 text-orange-500'}`}>
                                                    {issue.type === 'PROTEST' ? '!' : '⚠'}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 uppercase tracking-tight text-sm">{issue.title}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(issue.timestamp).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${issue.status === 'OPEN' ? 'bg-red-50 text-red-500' :
                                                issue.status === 'RESOLVED' || issue.status === 'DISMISSED' ? 'bg-emerald-50 text-emerald-600' :
                                                    'bg-indigo-50 text-indigo-500'
                                                }`}>
                                                {issue.status === 'RESOLVED' && issue.resolution === 'DISMISSED' ? 'DISMISSED' : issue.status}
                                            </span>
                                        </div>
                                        {issue.adminResponse && (
                                            <div className={`p-4 rounded-2xl border text-xs font-bold ${issue.resolution === 'UPHELD' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : issue.resolution === 'DISMISSED' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                                                <p className="uppercase text-[8px] opacity-50 mb-1">Admin Response:</p>
                                                "{issue.adminResponse}"
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl text-white">
                            <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                                Action Required
                                {pendingFixtures.length > 0 && <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>}
                            </h3>

                            {pendingFixtures.length === 0 ? (
                                <div className="text-center py-10 opacity-40">
                                    <p className="font-bold text-sm uppercase tracking-[0.2em] text-[10px]">All results submitted</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingFixtures.map(fixture => (
                                        <div key={fixture.id} className="p-6 bg-white/10 rounded-[2rem] border border-white/5 space-y-4">
                                            <p className="font-black text-xl leading-none">{fixture.teamAName} vs {fixture.teamBName}</p>
                                            <button
                                                onClick={() => { setSelectedFixture(fixture); setView('REPORT_FORM'); }}
                                                className="w-full py-3 bg-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-indigo-500 transition-all mb-2"
                                            >
                                                Submit Result
                                            </button>
                                            <button
                                                onClick={() => setSelectedFixtureForSquad(fixture.id)}
                                                className="w-full py-3 bg-slate-700 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-slate-600 transition-all"
                                            >
                                                Select Playing XI
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {view === 'INSIGHTS' && (
                <div className="space-y-10">
                    <div className="bg-white rounded-[3rem] p-8 shadow-xl border border-slate-100 overflow-hidden">
                        <div className="flex items-center justify-between mb-8 px-4">
                            <h3 className="text-2xl font-black text-slate-900 border-l-4 border-indigo-600 pl-4">Team Performance Analytics</h3>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Live Engine Active</span>
                            </div>
                        </div>
                        <StatsAnalytics
                            teams={[team]}
                            onBack={() => setView('OVERVIEW')}
                            hideHeader={true}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100">
                            <h3 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-4">
                                Best Playing 11
                                <span className="text-[10px] bg-slate-100 px-4 py-2 rounded-full font-black text-slate-400 uppercase tracking-[0.2em] border border-slate-200">AI Logic</span>
                            </h3>
                            <div className="space-y-3">
                                {best11.map((player, idx) => (
                                    <div key={player.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-black text-indigo-500 w-4">{idx + 1}</span>
                                            <div>
                                                <p className="font-black text-slate-900 text-sm uppercase">{player.name}</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{player.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="font-black text-indigo-600 text-xs">{((player.stats.runs + (player.stats.wickets * 25)) / (player.stats.matches || 1)).toFixed(1)}</p>
                                                <p className="text-[7px] font-black text-slate-400 uppercase">Impact</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-10">
                            <div className="bg-indigo-600 rounded-[3rem] p-12 text-white shadow-2xl flex flex-col justify-between">
                                <div>
                                    <h3 className="text-4xl font-black tracking-tighter mb-4 italic">Performance Summary</h3>
                                    <p className="text-indigo-100 font-bold opacity-80 leading-relaxed">Based on overall season statistics, your squad has a strong batting core. The AI suggests focusing on death bowling efficiency in upcoming practices.</p>
                                </div>
                                <div className="mt-12 grid grid-cols-3 gap-6">
                                    <div className="text-center">
                                        <p className="text-3xl font-black">{team.players.reduce((sum, p) => sum + p.stats.runs, 0)}</p>
                                        <p className="text-[8px] font-black uppercase text-indigo-200 tracking-widest">Runs</p>
                                    </div>
                                    <div className="text-center border-x border-indigo-400/30">
                                        <p className="text-3xl font-black">{team.players.reduce((sum, p) => sum + p.stats.wickets, 0)}</p>
                                        <p className="text-[8px] font-black uppercase text-indigo-200 tracking-widest">Wickets</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-black">{team.players.length}</p>
                                        <p className="text-[8px] font-black uppercase text-indigo-200 tracking-widest">Squad</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {view === 'REPORT_FORM' && selectedFixture && (
                <MatchReportForm
                    fixture={selectedFixture}
                    onCancel={() => setView('OVERVIEW')}
                    onSubmit={(report) => {
                        onSubmitReport(report);
                        setView('OVERVIEW');
                    }}
                    team={team}
                    currentUserId={currentUser.id}
                    allPlayers={allPlayers}
                />
            )}

            <SquadSelectorModal
                isOpen={!!selectedFixtureForSquad}
                onClose={() => setSelectedFixtureForSquad(null)}
                fixture={fixtures.find(f => f.id === selectedFixtureForSquad)! || fixtures[0]}
                team={team}
                onSave={onUpdateFixtureSquad}
            />

            {isProtestModalOpen && (
                <ProtestModal
                    isOpen={isProtestModalOpen}
                    onClose={() => setIsProtestModalOpen(false)}
                    onSubmit={(issue) => {
                        console.log('Issue lodged:', issue);
                        onLodgeProtest(issue);
                        setIsProtestModalOpen(false);
                        alert('Report Logged Successfully. Admin will review shortly.');
                    }}
                    teamId={team.id}
                    currentUserId={currentUser.id}
                />
            )}
        </div>
    );
};
