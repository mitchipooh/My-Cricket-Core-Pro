import React, { useState } from 'react';
import { Scorer } from './components/Scorer';
import { MatchSetup } from './components/MatchSetup';
import { DataProvider, useData } from './contexts/DataProvider';
import { MatchFixture } from '@shared/types';
import './index.css';

const ScorerAppContent: React.FC = () => {
    const { standaloneMatches, orgs } = useData();
    const [activeMatch, setActiveMatch] = useState<MatchFixture | null>(null);
    const [showSetup, setShowSetup] = useState(false);

    if (activeMatch) {
        return <Scorer match={activeMatch} onBack={() => setActiveMatch(null)} />;
    }

    if (showSetup) {
        return (
            <MatchSetup
                onComplete={(match) => {
                    setActiveMatch(match);
                    setShowSetup(false);
                }}
                onCancel={() => setShowSetup(false)}
            />
        );
    }

    const allFixtures = [...standaloneMatches, ...orgs.flatMap(o => o.fixtures)];

    return (
        <div className="p-4 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold mb-4">Cricket-Core Scorer</h1>
            <button
                onClick={() => setShowSetup(true)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg mb-6 font-semibold"
            >
                New Quick Match
            </button>

            <h2 className="text-lg font-semibold mb-2">Recent Matches</h2>
            <div className="space-y-3">
                {allFixtures.map(m => (
                    <div
                        key={m.id}
                        className="p-4 border rounded-lg bg-white shadow-sm flex justify-between items-center"
                        onClick={() => setActiveMatch(m)}
                    >
                        <div>
                            <div className="font-medium">{m.teamAName} vs {m.teamBName}</div>
                            <div className="text-sm text-gray-500">{m.date}</div>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded ${m.status === 'Live' ? 'bg-red-100 text-red-600' : 'bg-gray-100'}`}>
                            {m.status}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const App: React.FC = () => (
    <DataProvider>
        <ScorerAppContent />
    </DataProvider>
);

export default App;
