
import React, { useState } from 'react';
import { MatchFixture, UmpireMatchReport } from '@shared/types';

interface UmpireReportFormProps {
    fixture: MatchFixture;
    umpireId: string;
    umpireName: string;
    organizationId: string;
    onSubmit: (report: UmpireMatchReport) => void;
    onCancel: () => void;
}

export const UmpireReportForm: React.FC<UmpireReportFormProps> = ({
    fixture,
    umpireId,
    umpireName,
    organizationId,
    onSubmit,
    onCancel
}) => {
    const parseScore = (scoreStr?: string) => {
        if (!scoreStr) return 0;
        const base = scoreStr.split('/')[0];
        return parseInt(base) || 0;
    };

    const parseWickets = (scoreStr?: string) => {
        if (!scoreStr) return 0;
        const parts = scoreStr.split('/');
        return parts.length > 1 ? parseInt(parts[1]) || 0 : 0;
    };

    const [form, setForm] = useState({
        pitchCondition: 3,
        groundCondition: 3,
        facilitiesRating: 3,
        teamASpirit: 5,
        teamBSpirit: 5,
        comments: '',
        winningTeam: 'draw' as 'teamA' | 'teamB' | 'draw' | 'tie' | 'no_result',
        teamAScore: parseScore(fixture.teamAScore),
        teamAWickets: parseWickets(fixture.teamAScore),
        teamAOvers: '0',
        teamBScore: parseScore(fixture.teamBScore),
        teamBWickets: parseWickets(fixture.teamBScore),
        teamBOvers: '0',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const report: UmpireMatchReport = {
            id: 'UR-' + Date.now(),
            matchId: fixture.id,
            fixtureId: fixture.id,
            submittedBy: umpireId,
            umpireName: umpireName,
            timestamp: Date.now(),
            status: 'PENDING',
            matchOutcome: {
                winningTeam: form.winningTeam,
                teamAScore: form.teamAScore,
                teamAWickets: form.teamAWickets,
                teamAOvers: form.teamAOvers,
                teamBScore: form.teamBScore,
                teamBWickets: form.teamBWickets,
                teamBOvers: form.teamBOvers,
            },
            facilityReport: {
                pitchCondition: form.pitchCondition,
                outfieldCondition: form.groundCondition,
                facilitiesRating: form.facilitiesRating,
                comments: form.comments
            },
            playerBehaviorRatings: {
                teamASpirit: form.teamASpirit,
                teamBSpirit: form.teamBSpirit,
                notes: form.comments
            },
            organizationId: organizationId,
            conductNotes: form.comments
        };
        onSubmit(report);
    };

    const RatingButton = ({ label, value, field, max = 5 }: { label: string, value: number, field: keyof typeof form, max?: number }) => (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                {Array.from({ length: max }, (_, i) => i + 1).map(v => (
                    <button
                        key={v}
                        type="button"
                        onClick={() => setForm({ ...form, [field]: v })}
                        className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${form[field] === v ? 'bg-white text-indigo-600 shadow-md transform scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {v}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                <div className="flex items-center gap-4 mb-2">
                    <span className="text-2xl">🏏</span>
                    <h3 className="text-lg font-black text-slate-900">{fixture.teamAName} vs {fixture.teamBName}</h3>
                </div>
                <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest px-10">Official Umpire Report</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-indigo-600 pl-3">Facility Report</h4>
                    <RatingButton label="Pitch (1-5)" value={form.pitchCondition} field="pitchCondition" />
                    <RatingButton label="Outfield (1-5)" value={form.groundCondition} field="groundCondition" />
                    <RatingButton label="Facilities (1-5)" value={form.facilitiesRating} field="facilitiesRating" />
                </div>
                <div className="space-y-6">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-emerald-500 pl-3">Spirit of Cricket</h4>
                    <RatingButton label={fixture.teamAName + " (1-5)"} value={form.teamASpirit} field="teamASpirit" />
                    <RatingButton label={fixture.teamBName + " (1-5)"} value={form.teamBSpirit} field="teamBSpirit" />
                </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-amber-500 pl-3">Match Outcome Override</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Winning Team</label>
                        <select
                            value={form.winningTeam}
                            onChange={(e) => setForm({ ...form, winningTeam: e.target.value as any })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none"
                        >
                            <option value="teamA">{fixture.teamAName}</option>
                            <option value="teamB">{fixture.teamBName}</option>
                            <option value="draw">Draw</option>
                            <option value="tie">Tie</option>
                            <option value="no_result">No Result</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Confidential Match Notes</label>
                <textarea
                    value={form.comments}
                    onChange={(e) => setForm({ ...form, comments: e.target.value })}
                    placeholder="Provide details on any incidents, player disciplinary issues, or exceptional conduct..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-2 ring-indigo-500/20 h-40 resize-none outline-none"
                    required
                />
            </div>

            <div className="flex gap-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.15em] shadow-xl shadow-indigo-100 hover:bg-indigo-500 transition-all"
                >
                    Verify & Submit Report
                </button>
            </div>
        </form>
    );
};
