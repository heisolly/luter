import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Helper to get the correct domain for cookies
const getDomain = () => {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;
  if (hostname.includes('luter.app')) {
    return '.luter.app'; // Apex domain for production
  }
  if (hostname.includes('localhost')) {
    return ''; // Browsers ignore domain=localhost; returning empty string sets it natively
  }
  return hostname;
};

// Custom storage adapter using cookies for cross-subdomain SSO, with localStorage fallback
export const sharedCookieStorage = {
  getItem: (key) => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
    if (match) return decodeURIComponent(match[2]);
    // Fallback to localStorage if cookie was too large to save
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key, value) => {
    if (typeof document === 'undefined') return;
    const domain = getDomain();
    const domainString = domain ? `domain=${domain};` : '';
    const secureString = window.location.protocol === 'https:' ? 'Secure;' : '';
    
    // Store for 1 year
    const cookieStr = `${key}=${encodeURIComponent(value)}; ${domainString} path=/; max-age=31536000; SameSite=Lax; ${secureString}`;
    document.cookie = cookieStr;
    
    // Check if it was successfully saved (cookies have a ~4KB limit)
    // If the session object is too large, document.cookie silently fails.
    if (!document.cookie.includes(key) && typeof localStorage !== 'undefined') {
      console.warn(`Cookie ${key} failed to save (likely too large). Falling back to localStorage.`);
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key) => {
    if (typeof document === 'undefined') return;
    const domain = getDomain();
    const domainString = domain ? `domain=${domain};` : '';
    document.cookie = `${key}=; ${domainString} path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
};

// Create a single Supabase client instance with better error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public'
  },
  auth: {
    storage: sharedCookieStorage,
    storageKey: 'luter-shared-session',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',

    lock: false,
    debug: false
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  },
  // Add retry configuration for better reliability
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Export a singleton instance to prevent multiple clients
let supabaseInstance = null
export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = supabase
  }
  return supabaseInstance
}
