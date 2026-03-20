
import React, { useState } from 'react';
import { MatchReportSubmission, MatchFixture, PlayerWithContext } from '../../types';

interface ReportVerificationProps {
    submission: MatchReportSubmission;
    fixture: MatchFixture;
    onApprove: (reportId: string) => void;
    onReject: (reportId: string, feedback: string) => void;
    onBack: () => void;
}

export const ReportVerification: React.FC<ReportVerificationProps> = ({
    submission,
    fixture,
    onApprove,
    onReject,
    onBack
}) => {
    const [feedback, setFeedback] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-12 h-full overflow-y-auto custom-scrollbar animate-in fade-in duration-700">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <button onClick={onBack} className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-4 hover:text-indigo-500 transition-colors">
                        ← Pending Reports
                    </button>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">Review Match Result</h1>
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-1">Submitted: {new Date(submission.timestamp).toLocaleString()}</p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => setIsRejecting(true)}
                        className="px-8 py-4 bg-white text-red-500 border border-red-100 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-red-50 transition-all"
                    >
                        Reject Report
                    </button>
                    <button
                        onClick={() => onApprove(submission.id)}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-indigo-500 transition-all"
                    >
                        Verify & Update Stats
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pb-20">
                {/* LEFT: PHOTO VERIFICATION */}
                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-[3rem] p-4 shadow-2xl overflow-hidden aspect-[3/4] group relative">
                        {submission.scorecardPhotoUrl ? (
                            submission.scorecardPhotoUrl.includes('application/pdf') || submission.scorecardPhotoUrl.toLowerCase().endsWith('.pdf') ? (
                                <iframe src={submission.scorecardPhotoUrl} className="w-full h-full rounded-[2rem] bg-white" title="Scorecard PDF" />
                            ) : (
                                <img src={submission.scorecardPhotoUrl} className="w-full h-full object-contain rounded-[2rem] group-hover:scale-105 transition-transform duration-700 cursor-zoom-in" alt="Scorecard" />
                            )
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
                                <span className="text-6xl mb-4">📷</span>
                                <p className="font-black uppercase text-xs tracking-widest">No scorecard photo attached</p>
                            </div>
                        )}
                        <a
                            href={submission.scorecardPhotoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-6 right-6 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-lg font-bold text-xs uppercase hover:bg-white/20 transition-colors"
                        >
                            Open Original ↗
                        </a>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center italic">Scorecard verification document</p>
                </div>

                {/* RIGHT: DATA REVIEW */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100">
                        <h3 className="text-2xl font-black text-slate-900 mb-8 border-b-2 border-slate-50 pb-4">Match Summary</h3>
                        <div className="grid grid-cols-2 gap-10">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{fixture.teamAName}</p>
                                <p className="text-3xl font-black text-slate-900">{submission.teamAScore}/{submission.teamAWickets}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">Overs: {submission.teamAOvers}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{fixture.teamBName}</p>
                                <p className="text-3xl font-black text-slate-900">{submission.teamBScore}/{submission.teamBWickets}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">Overs: {submission.teamBOvers}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 overflow-hidden">
                        <h3 className="text-2xl font-black text-slate-900 mb-8 border-b-2 border-slate-50 pb-4">Player Contributions</h3>
                        <div className="max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                        <th className="pb-4">Player</th>
                                        <th className="pb-4 text-right">Runs</th>
                                        <th className="pb-4 text-right">Wkts</th>
                                        <th className="pb-4 text-right">Ovs</th>
                                        <th className="pb-4 text-right">Conc</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {submission.playerPerformances.map(p => (
                                        <tr key={p.playerId} className="group">
                                            <td className="py-4 font-black text-slate-700 text-sm">{p.playerName}</td>
                                            <td className="py-4 text-right font-black text-indigo-600">{p.runs}</td>
                                            <td className="py-4 text-right font-black text-emerald-600">{p.wickets}</td>
                                            <td className="py-4 text-right font-bold text-slate-500">{p.overs}</td>
                                            <td className="py-4 text-right font-bold text-slate-400">{p.runsConceded}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {isRejecting && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] p-12 shadow-2xl animate-in zoom-in duration-300">
                        <h3 className="text-3xl font-black text-slate-900 mb-4 italic">Rejection Feedback</h3>
                        <p className="text-slate-500 font-bold mb-8 leading-relaxed">Please let the captain know why this report is being rejected so they can fix and resubmit.</p>
                        <textarea
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                            placeholder="e.g. Scanned photo is blurry, or runs total does not match..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-500 h-40 resize-none mb-8"
                        />
                        <div className="flex gap-4">
                            <button onClick={() => setIsRejecting(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs tracking-widest">Nevermind</button>
                            <button
                                onClick={() => onReject(submission.id, feedback)}
                                disabled={!feedback}
                                className="flex-[2] py-4 bg-red-500 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl disabled:opacity-50"
                            >
                                Send Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
