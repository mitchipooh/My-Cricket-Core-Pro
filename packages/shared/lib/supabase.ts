/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Access Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Warn if keys are missing (development safety)
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing. Check your .env file.');
}

// Create the Supabase Client
export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
);
