import React, { useState } from 'react';
import { AdminCenter } from './components/AdminCenter';
import { OrganizationView } from './components/OrganizationView';
import { DataProvider, useData } from './contexts/DataProvider';
import './index.css';

const AdminAppContent: React.FC = () => {
    const { orgs, profile } = useData();
    const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

    if (activeOrgId) {
        const org = orgs.find(o => o.id === activeOrgId);
        if (org) {
            return <OrganizationView org={org} onBack={() => setActiveOrgId(null)} />;
        }
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Project Command Center</h1>
                <div className="text-right">
                    <div className="font-semibold">{profile?.name || 'Admin'}</div>
                    <div className="text-sm text-gray-500">{profile?.role}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4 text-blue-700">Managed Organizations</h2>
                    <div className="space-y-3">
                        {orgs.map(org => (
                            <button
                                key={org.id}
                                onClick={() => setActiveOrgId(org.id)}
                                className="w-full text-left p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-100 flex justify-between items-center"
                            >
                                <div>
                                    <div className="font-bold text-blue-900">{org.name}</div>
                                    <div className="text-sm text-blue-700">{org.type} • {org.memberTeams.length} Teams</div>
                                </div>
                                <span className="text-blue-400">→</span>
                            </button>
                        ))}
                    </div>
                </div>

                <AdminCenter />
            </div>
        </div>
    );
};

const App: React.FC = () => (
    <DataProvider>
        <AdminAppContent />
    </DataProvider>
);

export default App;
