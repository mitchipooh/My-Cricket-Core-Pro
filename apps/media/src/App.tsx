import React, { useState } from 'react';
import { MediaCenter } from '@shared/components/media/MediaCenter';
import { StatsAnalytics } from '@shared/components/analytics/StatsAnalytics';
import { GlobalDashboard } from '@shared/components/dashboard/GlobalDashboard';
import { DataProvider, useData } from '@shared/contexts/DataProvider';
import { AuthGuard } from '@shared/components/auth/AuthGuard';
import { useAuth } from '@shared/hooks/useAuth';
import './index.css';

const MediaAppContent: React.FC = () => {
    const { orgs, standaloneMatches, profile } = useData();
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
                            <div className="w-px h-6 bg-gray-200"></div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-black">{profile?.name?.charAt(0)}</div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{profile?.role}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {activeTab === 'hub' && <GlobalDashboard 
                    profile={profile!} 
                    organizations={orgs} 
                    fixtures={standaloneMatches} 
                    topBatsmen={[]} 
                    topBowlers={[]} 
                    onStartMatch={() => {}} 
                    onViewMatch={() => {}} 
                    onViewTeam={() => {}} 
                />}
                {activeTab === 'media' && <MediaCenter />}
                {activeTab === 'stats' && <StatsAnalytics />}
            </main>
        </div>
    );
};

const App: React.FC = () => (
    <DataProvider>
        <AuthGuard requireAuth>
            <MediaAppContent />
        </AuthGuard>
    </DataProvider>
);

export default App;
