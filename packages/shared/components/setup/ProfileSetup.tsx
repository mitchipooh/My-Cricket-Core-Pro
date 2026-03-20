
import React, { useState, useEffect } from 'react';
import { UserProfile } from '@shared/types';
import { fetchUserData } from '@shared/services/centralZoneService.ts';
import { generateId } from '@shared/utils/idGenerator';
import { useAuth } from '../../hooks/useAuth';

declare global {
  interface Window {
    google?: any;
    wpApiSettings?: {
      root: string;
      nonce: string;
      site_url: string;
      current_user_id: number;
      plugin_url?: string;
      google_client_id?: string;
    };
  }
}

interface ProfileSetupProps {
  onComplete: (profile: UserProfile) => void;
  onCancel?: () => void;
  existingProfile?: UserProfile;
  initialMode?: 'CREATE' | 'LOGIN' | 'RECOVER';
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete, onCancel, initialMode = 'CREATE', existingProfile }) => {
  const [setupMode, setSetupMode] = useState<'CREATE' | 'LOGIN' | 'RECOVER'>(initialMode);
  const [name, setName] = useState(existingProfile?.name || '');
  const [handle, setHandle] = useState(existingProfile?.handle || '');
  const [email, setEmail] = useState(existingProfile?.email || '');
  const [password, setPassword] = useState(existingProfile?.password || '');
  const [role, setRole] = useState<UserProfile['role']>(existingProfile?.role || 'Administrator');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const googleClientId = window.wpApiSettings?.google_client_id;
  // SWITCHED TO JPG
  const logoSrc = window.wpApiSettings?.plugin_url
    ? `${window.wpApiSettings.plugin_url}logo.jpg`
    : 'logo.jpg';

  // Scorer/Coach/Player specific states...
  const [hourlyRate, setHourlyRate] = useState(existingProfile?.scorerDetails?.hourlyRate?.toString() || '');
  const [experience, setExperience] = useState(existingProfile?.scorerDetails?.experienceYears?.toString() || existingProfile?.coachDetails?.experienceYears?.toString() || '');
  const [bio, setBio] = useState(existingProfile?.scorerDetails?.bio || '');
  const [coachLevel, setCoachLevel] = useState(existingProfile?.coachDetails?.level || 'Level 1');
  const [specialty, setSpecialty] = useState<any>(existingProfile?.coachDetails?.specialty || 'General');
  const [battingStyle, setBattingStyle] = useState<any>(existingProfile?.playerDetails?.battingStyle || 'Right-hand');
  const [bowlingStyle, setBowlingStyle] = useState(existingProfile?.playerDetails?.bowlingStyle || 'Right-arm Medium');
  const [playerRole, setPlayerRole] = useState<any>(existingProfile?.playerDetails?.primaryRole || 'Batsman');
  const [isHireable, setIsHireable] = useState(existingProfile?.playerDetails?.isHireable || existingProfile?.scorerDetails?.isHireable || false);

  // New Personalized Fields
  const [nickname, setNickname] = useState(existingProfile?.playerDetails?.nickname || '');
  const [age, setAge] = useState(existingProfile?.playerDetails?.age || '');
  const [jerseyNumber, setJerseyNumber] = useState(existingProfile?.playerDetails?.jerseyNumber?.toString() || '');
  const [favPlayer, setFavPlayer] = useState(existingProfile?.playerDetails?.favoritePlayer || '');
  const [favMoment, setFavMoment] = useState(existingProfile?.playerDetails?.favoriteWorldCupMoment || '');
  const [favGround, setFavGround] = useState(existingProfile?.playerDetails?.favoriteGround || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (setupMode === 'LOGIN') {
      handleLogin();
    } else if (setupMode === 'RECOVER') {
      handleRecover();
    } else {
      handleCreate();
    }
  };

  const handleRecover = async () => {
    if (!handle) {
      setError('Please enter your User Handle to reset.');
      return;
    }
    setIsProcessing(true);
    // Simulate recovery (In real app, this sends email. Here we just mock success for UX)
    setTimeout(() => {
      setIsProcessing(false);
      setSuccessMsg(`Recovery request sent for ${handle}. Please contact your Org Admin.`);
    }, 1500);
  };

  const handleLogin = async () => {
    if (!handle || !password) {
      setError('Please enter your handle and password');
      return;
    }

    // Developer Backdoor
    if (handle.toLowerCase() === 'trinity' && password === '123#') {
      const devProfile: UserProfile = {
        id: 'dev-dennis-trinity',
        name: 'Dennis',
        handle: 'Trinity',
        role: 'Administrator', // Start as Admin, can switch later
        createdAt: Date.now(),
        password: '123#'
      };
      onComplete(devProfile);
      return;
    }

    setIsProcessing(true);
    const sanitizedHandle = handle.startsWith('@') ? handle : `@${handle}`;

    try {
      const searchId = sanitizedHandle.replace('@', '').toLowerCase();
      const cloudData = await fetchUserData(searchId);

      if (cloudData && cloudData.profile) {
        if (cloudData.profile.password === password) {
          onComplete(cloudData.profile);
        } else {
          setError('Incorrect password for this handle.');
        }
      } else {
        setError('Account not found. Ensure you are using the correct handle.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreate = () => {
    if (!name || !handle || !password) {
      setError('All fields are required.');
      return;
    }

    const sanitizedHandle = handle.startsWith('@') ? handle : `@${handle}`;

    createProfile({
      id: sanitizedHandle.replace('@', '').toLowerCase(),
      name,
      handle: sanitizedHandle,
      password,
      role,
      email
    });
  };

  const createProfile = (baseData: Partial<UserProfile>) => {
    const newProfile: UserProfile = {
      id: baseData.id || generateId('user'),
      name: baseData.name || 'Anonymous',
      handle: baseData.handle || '@anon',
      password: baseData.password,
      role: role,
      email: baseData.email,
      googleId: baseData.googleId,
      avatarUrl: baseData.avatarUrl,
      createdAt: Date.now(),
      scorerDetails: role === 'Scorer' ? {
        isHireable: true,
        hourlyRate: Number(hourlyRate) || 20,
        experienceYears: Number(experience) || 0,
        bio: bio || 'Professional Scorer available for league matches.'
      } : undefined,
      coachDetails: role === 'Coach' ? {
        level: coachLevel,
        specialty: specialty,
        experienceYears: Number(experience) || 0
      } : undefined,
      playerDetails: (role === 'Player' || role === 'Captain') ? {
        battingStyle,
        bowlingStyle,
        primaryRole: playerRole,
        lookingForClub: true,
        isHireable: isHireable,
        // Personalized
        nickname,
        age,
        favoritePlayer: favPlayer,
        favoriteWorldCupMoment: favMoment,
        favoriteGround: favGround,
        jerseyNumber: Number(jerseyNumber) || undefined
      } : undefined
    };
    onComplete(newProfile);
  };

  useEffect(() => {
    if (!googleClientId || setupMode !== 'CREATE') return;
    // ... Google Auth logic (same as before) ...
  }, [googleClientId, setupMode]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-md w-full bg-slate-800 rounded-[32px] p-10 border border-slate-700 shadow-2xl relative z-10 animate-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex flex-col items-center mb-8 relative">
          {onCancel && (
            <button
              onClick={onCancel}
              className="absolute left-0 top-0 text-slate-400 hover:text-white transition-colors text-xl font-black"
              title="Go Back"
            >
              ←
            </button>
          )}
          <img src={logoSrc} alt="Cricket Core" className="w-32 h-32 object-contain mb-4 drop-shadow-2xl" />
          <h1 className="text-3xl font-black text-white text-center">Cricket-Core 2026</h1>
          <p className="text-slate-400 text-center mt-2">
            {setupMode === 'CREATE' ? 'Join the global network' : setupMode === 'RECOVER' ? 'Recover Account' : 'Resume your career'}
          </p>
        </div>

        <div className="bg-slate-900/50 p-1 rounded-2xl flex mb-8 border border-white/5">
          <button
            onClick={() => { setSetupMode('CREATE'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${setupMode === 'CREATE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Create
          </button>
          <button
            onClick={() => { setSetupMode('LOGIN'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${setupMode === 'LOGIN' || setupMode === 'RECOVER' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Login
          </button>
        </div>

        <div className="grid gap-4 mb-8">
          <button
            onClick={() => useAuth().signInWithGoogle()}
            className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-slate-100 transition-all shadow-xl"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {import.meta.env.DEV && (
            <button
              onClick={() => {
                const devProfile: UserProfile = {
                  id: 'dev-dennis-trinity',
                  name: 'Dennis (Admin Bypass)',
                  handle: '@CZTTCB',
                  role: 'Administrator',
                  createdAt: Date.now(),
                  password: 'CZ passWORD'
                };
                onComplete(devProfile);
              }}
              className="w-full bg-slate-900 border border-slate-700 text-emerald-400 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all"
            >
              Development Login (Admin)
            </button>
          )}
        </div>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-slate-800 px-3 text-slate-500 font-bold tracking-widest">Or Use Credentials</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-bold text-center animate-in shake">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs font-bold text-center animate-in zoom-in">
              {successMsg}
            </div>
          )}

          {setupMode === 'CREATE' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dennis"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">System Handle</label>
            <div className="relative">
              <span className="absolute left-5 top-4 text-slate-500 font-bold">@</span>
              <input
                type="text"
                required
                value={handle.replace('@', '')}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="Trinity"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-10 pr-5 py-4 text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              />
            </div>
          </div>

          {setupMode === 'CREATE' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              />
            </div>
          )}

          {setupMode !== 'RECOVER' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Secure Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 pr-12 text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {setupMode === 'LOGIN' && (
            <div className="flex items-center gap-3 px-1">
              <input
                type="checkbox"
                id="keepSignedIn"
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                defaultChecked
              />
              <label htmlFor="keepSignedIn" className="text-xs font-bold text-slate-400 select-none cursor-pointer">Keep me signed in</label>
            </div>
          )}

          {setupMode === 'LOGIN' && (
            <div className="text-right">
              <button type="button" onClick={() => { setSetupMode('RECOVER'); setError(''); }} className="text-[10px] font-bold text-slate-400 hover:text-indigo-400 transition-colors">
                Forgot Password?
              </button>
            </div>
          )}
          <div className="space-y-3 mt-4">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-white text-slate-900 font-black py-5 rounded-2xl transition-all shadow-xl hover:bg-slate-200 active:scale-95 uppercase tracking-[0.2em] text-xs disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : setupMode === 'LOGIN' ? 'Login' : setupMode === 'RECOVER' ? 'Reset Password' : 'Create Account'}
            </button>

            {(onCancel || setupMode === 'RECOVER') && (
              <button
                type="button"
                onClick={() => {
                  if (setupMode === 'RECOVER') setSetupMode('LOGIN');
                  else if (onCancel) onCancel();
                }}
                className="w-full bg-transparent text-slate-500 font-bold py-3 rounded-2xl hover:text-white hover:bg-slate-800 transition-all uppercase tracking-widest text-[10px]"
              >
                {setupMode === 'RECOVER' ? 'Back to Login' : 'Cancel'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

