
import React, { useState } from 'react';
import { GameIssue, IssueType } from '../../types';

interface ProtestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (issue: GameIssue) => void;
    teamId: string;
    currentUserId: string;
    matchId?: string; // Optional context
}

export const ProtestModal: React.FC<ProtestModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    teamId,
    currentUserId,
    matchId
}) => {
    const [type, setType] = useState<IssueType>('GAME_ISSUE');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [evidenceUrl, setEvidenceUrl] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const issue: GameIssue = {
            id: `issue-${Date.now()}`,
            matchId,
            lodgedBy: currentUserId,
            teamId,
            type,
            title,
            description,
            status: 'OPEN',
            evidenceUrls: evidenceUrl ? [evidenceUrl] : [],
            timestamp: Date.now()
        };
        onSubmit(issue);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Lodge Report</h2>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Raise an issue or protest</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 font-black transition-colors">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
                    {/* TYPE SELECTION */}
                    <div className="flex bg-slate-100 p-1.5 rounded-xl">
                        {(['GAME_ISSUE', 'PROTEST', 'FEEDBACK'] as IssueType[]).map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setType(t)}
                                className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${type === t ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {t.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Subject / Title</label>
                        <input
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-300"
                            placeholder="Brief subject..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Detailed Description</label>
                        <textarea
                            required
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 rounded-xl px-4 py-3 font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-300 min-h-[120px] resize-none"
                            placeholder="Describe the issue, incident, or feedback in detail..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Upload Evidence (Optional)</label>
                        <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 bg-slate-50 hover:bg-white hover:border-indigo-200 transition-all text-center group">
                            {evidenceUrl ? (
                                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100 shadow-sm relative z-20">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <span className="text-2xl flex-shrink-0">
                                            {evidenceUrl.includes('pdf') || evidenceUrl.includes('doc') ? '📄' : '📷'}
                                        </span>
                                        <div className="text-left overflow-hidden">
                                            <p className="text-xs font-black text-slate-900 line-clamp-1">Evidence Attached</p>
                                            <p className="text-[9px] font-bold text-emerald-500 uppercase">Ready to submit</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEvidenceUrl(''); }}
                                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                        📎
                                    </div>
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Click to upload evidence</p>
                                    <p className="text-[9px] text-slate-300 mt-1 font-medium">Supports Photos, PDF, Word Docs</p>
                                    <input
                                        type="file"
                                        accept="image/*,.pdf,.doc,.docx"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                const url = URL.createObjectURL(e.target.files[0]);
                                                setEvidenceUrl(url);
                                            }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </form>

                <div className="p-8 border-t border-slate-100 bg-slate-50 rounded-b-[2rem]">
                    <button
                        onClick={handleSubmit}
                        className="w-full py-4 bg-indigo-600 text-white font-black uppercase text-xs tracking-[0.2em] rounded-xl shadow-xl hover:bg-indigo-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Submit Report
                    </button>
                </div>
            </div>
        </div>
    );
};
