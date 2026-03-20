import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const TABLES = [
    'organizations',
    'teams',
    'roster_players',
    'tournaments',
    'fixtures',
    'media_posts',
    'user_profiles',
    'app_state'
];

interface DevDatabaseConsoleProps {
    onClose: () => void;
}

export const DevDatabaseConsole: React.FC<DevDatabaseConsoleProps> = ({ onClose }) => {
    const [activeTable, setActiveTable] = useState('organizations');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [editJson, setEditJson] = useState('');

    useEffect(() => {
        fetchData();
    }, [activeTable]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        const { data: rows, error } = await supabase.from(activeTable).select('*').limit(100);
        if (error) {
            setError(error.message);
            setData([]);
        } else {
            setData(rows || []);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this row? This cannot be undone.')) return;
        const { error } = await supabase.from(activeTable).delete().eq('id', id);
        if (error) {
            alert('Delete failed: ' + error.message);
        } else {
            setData(data.filter(d => d.id !== id));
        }
    };

    const handleSave = async () => {
        try {
            const parsed = JSON.parse(editJson);
            const { error } = await supabase.from(activeTable).upsert(parsed);
            if (error) throw error;

            // Update local state
            setData(data.map(d => d.id === parsed.id ? parsed : d));
            setEditingItem(null);
            alert('Saved successfully!');
        } catch (e: any) {
            alert('Save failed: ' + e.message);
        }
    };

    const filteredData = data.filter(row =>
        JSON.stringify(row).toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col text-white animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center font-black">db</div>
                    <h2 className="font-bold text-lg tracking-tight">Developer Database Console</h2>
                </div>
                <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold uppercase tracking-widest transition-all">
                    Close Console
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col gap-2 overflow-y-auto">
                    <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 px-2">Tables</div>
                    {TABLES.map(table => (
                        <button
                            key={table}
                            onClick={() => setActiveTable(table)}
                            className={`px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wide transition-all ${activeTable === table ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            {table.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-slate-800 flex items-center gap-4 bg-slate-900/50">
                        <div className="relative flex-1 max-w-xl">
                            <span className="absolute left-3 top-2.5 text-slate-500">🔍</span>
                            <input
                                type="text"
                                placeholder="Search data..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                        <div className="text-xs text-slate-400 font-bold uppercase">
                            {filteredData.length} records found
                        </div>
                        <button onClick={fetchData} className="ml-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold uppercase tracking-widest">
                            Refresh
                        </button>
                    </div>

                    {/* Table Area */}
                    <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-slate-500 animate-pulse">Loading {activeTable}...</div>
                        ) : error ? (
                            <div className="bg-red-900/20 text-red-500 p-4 rounded-xl border border-red-900/50 text-center">{error}</div>
                        ) : (
                            <div className="grid gap-2">
                                {filteredData.map(row => (
                                    <div key={row.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl hover:border-slate-600 transition-colors group flex items-start gap-4">
                                        <div className="flex-1 min-w-0 font-mono text-xs text-slate-300 break-all">
                                            {/* Preview essential fields nicely */}
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-1.5 py-0.5 bg-slate-800 text-slate-500 rounded text-[9px] font-bold">{row.id}</span>
                                                {row.name && <span className="font-bold text-white text-sm">{row.name}</span>}
                                                {row.handle && <span className="text-indigo-400 font-bold">@{row.handle}</span>}
                                                {row.role && <span className="text-emerald-500 text-[10px] uppercase font-bold">{row.role}</span>}
                                            </div>
                                            <div className="opacity-60 line-clamp-1">{JSON.stringify(row)}</div>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { setEditingItem(row); setEditJson(JSON.stringify(row, null, 2)); }}
                                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-[10px] font-black uppercase tracking-widest text-white"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(row.id)}
                                                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-[10px] font-black uppercase tracking-widest text-white"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {filteredData.length === 0 && (
                                    <div className="text-center py-20 text-slate-500 text-sm">No records found.</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {editingItem && (
                <div className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center p-6 backdrop-blur-sm">
                    <div className="bg-slate-900 w-full max-w-4xl h-[80vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-white">Edit Record</h3>
                            <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <div className="flex-1 p-4 overflow-hidden">
                            <textarea
                                value={editJson}
                                onChange={e => setEditJson(e.target.value)}
                                className="w-full h-full bg-slate-950 text-emerald-400 font-mono text-sm p-4 rounded-xl border border-slate-800 focus:border-indigo-500 focus:outline-none resize-none custom-scrollbar"
                                spellCheck={false}
                            />
                        </div>
                        <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 rounded-b-2xl">
                            <button onClick={() => setEditingItem(null)} className="px-6 py-3 text-slate-400 font-bold hover:text-white uppercase text-xs tracking-widest">Cancel</button>
                            <button onClick={handleSave} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
