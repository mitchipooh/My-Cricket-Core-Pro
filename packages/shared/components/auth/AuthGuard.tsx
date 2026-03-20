import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoginModal } from './LoginModal';

interface AuthGuardProps {
    children: React.ReactNode;
    requireAuth?: boolean;
    fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireAuth = false, fallback }) => {
    const { user, loading, signInWithGoogle } = useAuth();
    const [showLogin, setShowLogin] = React.useState(false);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (requireAuth && !user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl max-w-sm w-full">
                    <div className="text-5xl mb-6">🔒</div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Login Required</h2>
                    <p className="text-slate-500 text-sm mb-8 font-medium">Please sign in to access professional scoring tools and sync your data.</p>
                    
                    <button 
                        onClick={() => signInWithGoogle()}
                        className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-4 hover:bg-slate-50 transition-all shadow-xl shadow-slate-100 border border-slate-100 mb-3 active:scale-95 group"
                    >
                        <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google
                    </button>

                    <button 
                        onClick={() => setShowLogin(true)}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
                    >
                        Other Options
                    </button>

                    {fallback && <div className="mt-6">{fallback}</div>}
                </div>

                <LoginModal 
                    isOpen={showLogin}
                    onClose={() => setShowLogin(false)}
                    onSuccess={() => setShowLogin(false)}
                />
            </div>
        );
    }

    return (
        <>
            {children}
            <LoginModal 
                isOpen={showLogin}
                onClose={() => setShowLogin(false)}
                onSuccess={() => setShowLogin(false)}
            />
        </>
    );
};
