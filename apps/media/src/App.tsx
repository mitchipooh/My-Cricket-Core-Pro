import React, { useState } from 'react';
import { MediaCenter } from './components/MediaCenter';
import { StatsAnalytics } from './components/StatsAnalytics';
import { GlobalDashboard } from './components/GlobalDashboard';
import { DataProvider, useData } from './contexts/DataProvider';
import './index.css';

const MediaAppContent: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'hub' | 'media' | 'stats'>('hub');

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-xl font-bold text-blue-600">Cricket-Core Hub</span>
                        </div>
                        <div className="flex space-x-8 items-center">
                            <button
                                onClick={() => setActiveTab('hub')}
                                className={`px-3 py-2 text-sm font-medium ${activeTab === 'hub' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Match Center
                            </button>
                            <button
                                onClick={() => setActiveTab('media')}
                                className={`px-3 py-2 text-sm font-medium ${activeTab === 'media' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Media Feed
                            </button>
                            <button
                                onClick={() => setActiveTab('stats')}
                                className={`px-3 py-2 text-sm font-medium ${activeTab === 'stats' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Statistics
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {activeTab === 'hub' && <GlobalDashboard />}
                {activeTab === 'media' && <MediaCenter />}
                {activeTab === 'stats' && <StatsAnalytics />}
            </main>
        </div>
    );
};

const App: React.FC = () => (
    <DataProvider>
        <MediaAppContent />
    </DataProvider>
);

export default App;
