import { useState, useEffect, useCallback, useRef } from 'react';

interface AudioCommentarySettings {
    enabled: boolean;
    voiceIndex: number;
    speed: number;
    pitch: number;
    volume: number;
}

interface UseAudioCommentaryReturn {
    enabled: boolean;
    speaking: boolean;
    voices: SpeechSynthesisVoice[];
    settings: AudioCommentarySettings;
    speak: (text: string) => void;
    cancel: () => void;
    setEnabled: (enabled: boolean) => void;
    setVoice: (index: number) => void;
    setSpeed: (speed: number) => void;
    setPitch: (pitch: number) => void;
    setVolume: (volume: number) => void;
    isSupported: boolean;
}

const STORAGE_KEY = 'cricket-audio-commentary-settings';

const DEFAULT_SETTINGS: AudioCommentarySettings = {
    enabled: false,
    voiceIndex: 0,
    speed: 0.95,  // Slightly slower for clearer, more natural delivery
    pitch: 1.1,   // Slightly higher pitch for more energetic commentary
    volume: 1.0
};

/**
 * Finds the best quality voice from available voices
 * Prioritizes: English voices, natural/enhanced voices, male voices for sports commentary
 */
function findBestVoice(voices: SpeechSynthesisVoice[]): number {
    if (voices.length === 0) return 0;

    // Preferred voice names (in order of preference)
    const preferredNames = [
        'Google UK English Male',
        'Google US English Male',
        'Microsoft David',
        'Microsoft Mark',
        'Alex',
        'Daniel',
        'Google UK English Female',
        'Google US English Female',
        'Microsoft Zira',
        'Samantha'
    ];

    // Try to find a preferred voice
    for (const name of preferredNames) {
        const index = voices.findIndex(v => v.name.includes(name));
        if (index !== -1) return index;
    }

    // Fallback: find any English voice
    const englishIndex = voices.findIndex(v => v.lang.startsWith('en'));
    if (englishIndex !== -1) return englishIndex;

    // Last resort: use first voice
    return 0;
}

export const useAudioCommentary = (): UseAudioCommentaryReturn => {
    const [settings, setSettings] = useState<AudioCommentarySettings>(() => {
        if (typeof window === 'undefined') return DEFAULT_SETTINGS;
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    });

    const [speaking, setSpeaking] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const queueRef = useRef<string[]>([]);
    const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

    // Load available voices and auto-select best voice
    useEffect(() => {
        if (!isSupported) return;

        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);

            // Auto-select best voice on first load if using default
            if (availableVoices.length > 0 && settings.voiceIndex === 0) {
                const bestVoiceIndex = findBestVoice(availableVoices);
                if (bestVoiceIndex !== 0) {
                    setSettings(prev => ({ ...prev, voiceIndex: bestVoiceIndex }));
                }
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, [isSupported]);

    // Save settings to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        }
    }, [settings]);

    // Process speech queue
    const processQueue = useCallback(() => {
        if (!isSupported || queueRef.current.length === 0 || speaking) return;

        const text = queueRef.current.shift();
        if (!text) return;

        const utterance = new SpeechSynthesisUtterance(text);

        // Apply settings
        if (voices[settings.voiceIndex]) {
            utterance.voice = voices[settings.voiceIndex];
        }
        utterance.rate = settings.speed;
        utterance.pitch = settings.pitch;
        utterance.volume = settings.volume;

        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => {
            setSpeaking(false);
            // Process next item in queue
            setTimeout(() => processQueue(), 100);
        };
        utterance.onerror = () => {
            setSpeaking(false);
            setTimeout(() => processQueue(), 100);
        };

        window.speechSynthesis.speak(utterance);
    }, [isSupported, speaking, voices, settings]);

    // Speak function - adds to queue
    const speak = useCallback((text: string) => {
        if (!isSupported || !settings.enabled || !text.trim()) return;

        queueRef.current.push(text);
        processQueue();
    }, [isSupported, settings.enabled, processQueue]);

    // Cancel all speech
    const cancel = useCallback(() => {
        if (!isSupported) return;
        window.speechSynthesis.cancel();
        queueRef.current = [];
        setSpeaking(false);
    }, [isSupported]);

    // Setting updaters
    const setEnabled = useCallback((enabled: boolean) => {
        setSettings(prev => ({ ...prev, enabled }));
        if (!enabled) cancel();
    }, [cancel]);

    const setVoice = useCallback((voiceIndex: number) => {
        setSettings(prev => ({ ...prev, voiceIndex }));
    }, []);

    const setSpeed = useCallback((speed: number) => {
        setSettings(prev => ({ ...prev, speed }));
    }, []);

    const setPitch = useCallback((pitch: number) => {
        setSettings(prev => ({ ...prev, pitch }));
    }, []);

    const setVolume = useCallback((volume: number) => {
        setSettings(prev => ({ ...prev, volume }));
    }, []);

    return {
        enabled: settings.enabled,
        speaking,
        voices,
        settings,
        speak,
        cancel,
        setEnabled,
        setVoice,
        setSpeed,
        setPitch,
        setVolume,
        isSupported
    };
};
