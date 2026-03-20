import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialMode?: 'signin' | 'signup';
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess, initialMode = 'signin' }) => {
    const { signInWithGoogle, signInWithFacebook, signInWithEmail, signInWithHandle, signUpWithEmail } = useAuth();
    const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

    // Reset mode when modal opens
    React.useEffect(() => {
        if (isOpen) setMode(initialMode);
    }, [isOpen, initialMode]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleGoogleSignIn = async () => {
        setLoading(true);
        const { error } = await signInWithGoogle();
        if (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    const handleDevAdminLogin = async () => {
        setLoading(true);
        // Official Admin Credentials from CZTTCB_CREDENTIALS.md
        const result = await signInWithHandle('@CZTTCB', 'CZ passWORD'); 
        if (result.error) {
            setError('Dev Admin login failed. Make sure @CZTTCB exists in the database.');
            setLoading(false);
        } else {
            onSuccess();
            onClose();
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        let result;
        if (mode === 'signin') {
            // Check if input is a handle (starts with @)
            if (email.trim().startsWith('@')) {
                result = await signInWithHandle(email.trim(), password);
            } else {
                result = await signInWithEmail(email.trim(), password);
            }
        } else {
            result = await signUpWithEmail(email.trim(), password, name);
        }

        if (result.error) {
            setError(result.error.message);
            setLoading(false);
        } else {
            onSuccess();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-3xl max-w-md w-full p-8 relative border border-slate-700">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl"
                >
                    ×
                </button>

                <h2 className="text-2xl font-bold text-white mb-2">
                    {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-slate-400 text-sm mb-6">
                    {mode === 'signin'
                        ? 'Sign in to access your cricket stats and teams'
                        : 'Join the Cricket Core community'}
                </p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-xl mb-4 text-sm">
                        {error}
                    </div>
                )}

                {/* Social Login */}
                <div className="grid grid-cols-1 gap-3 mb-4">
                    <button
                        onClick={() => alert('Facebook Sign-In is coming soon!')}
                        disabled={loading}
                        className="w-full bg-[#1877F2] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-3 hover:bg-[#1864D9] transition-colors disabled:opacity-50"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Continue with Facebook
                    </button>

                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full bg-white text-slate-900 py-3 rounded-xl font-semibold flex items-center justify-center gap-3 hover:bg-slate-100 transition-colors disabled:opacity-50"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    {/* DEV BYPASS */}
                    {import.meta.env.DEV && (
                        <button
                            onClick={handleDevAdminLogin}
                            disabled={loading}
                            className="w-full bg-amber-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors uppercase tracking-wider mt-2 border border-amber-500/50"
                        >
                            Development Login (Admin)
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 h-px bg-slate-700"></div>
                    <span className="text-slate-500 text-xs">OR</span>
                    <div className="flex-1 h-px bg-slate-700"></div>
                </div>

                {/* Email/Password Form */}
                <form onSubmit={handleEmailAuth} className="space-y-4">
                    {mode === 'signup' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-800 text-white p-3 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none"
                                placeholder="Your name"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            {mode === 'signin' ? 'Email or Handle' : 'Email'}
                        </label>
                        <input
                            type={mode === 'signin' ? 'text' : 'email'}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-800 text-white p-3 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none"
                            placeholder={mode === 'signin' ? 'you@example.com or @handle' : 'you@example.com'}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-800 text-white p-3 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                        className="text-indigo-400 hover:text-indigo-300 text-sm"
                    >
                        {mode === 'signin'
                            ? "Don't have an account? Sign up"
                            : 'Already have an account? Sign in'}
                    </button>
                </div>
            </div>
        </div>
    );
};
