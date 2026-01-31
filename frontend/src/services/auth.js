import { supabase } from './supabase';

/**
 * Authentication Service
 * Handles user authentication with Supabase Auth
 */

// Sign in with Google OAuth
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/app`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;
  return data;
};

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Get current session
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

// Get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Profile cache for faster loading
const profileCache = new Map();
const PROFILE_CACHE_TTL = 60000; // 60 seconds

// Get user profile with caching
export const getUserProfile = async (userId, skipCache = false) => {
  // Check cache first
  if (!skipCache && profileCache.has(userId)) {
    const cached = profileCache.get(userId);
    if (Date.now() - cached.timestamp < PROFILE_CACHE_TTL) {
      return cached.data;
    }
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile:', error);
      // Return cached data if available on error
      if (profileCache.has(userId)) {
        return profileCache.get(userId).data;
      }
      return null;
    }
    
    // Cache the result
    profileCache.set(userId, { data, timestamp: Date.now() });
    return data;
  } catch (err) {
    console.error('getUserProfile error:', err);
    // Return cached data if available on error
    if (profileCache.has(userId)) {
      return profileCache.get(userId).data;
    }
    return null;
  }
};

// Clear profile cache
export const clearProfileCache = (userId) => {
  if (userId) {
    profileCache.delete(userId);
  } else {
    profileCache.clear();
  }
};

// Update user profile
export const updateUserProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
};
