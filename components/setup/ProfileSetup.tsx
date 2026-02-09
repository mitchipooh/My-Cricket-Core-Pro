
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { fetchUserData } from '../../services/centralZoneService.ts';
import { generateId } from '../../utils/idGenerator';

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
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              />
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

