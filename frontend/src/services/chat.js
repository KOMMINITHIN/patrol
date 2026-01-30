import { supabase } from './supabase';

/**
 * Global Community Chat Service
 * Handles real-time global chat functionality with caching
 */

// Simple cache for messages
let messageCache = [];
let lastFetched = 0;
const CACHE_TTL = 10000; // 10 seconds

// Helper function to add timeout to promises
const withTimeout = (promise, ms = 5000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), ms)
    )
  ]);
};

// Get global chat messages with caching
export const getGlobalMessages = async (limit = 50, before = null, skipCache = false) => {
  // Return cached data if valid and not paginating
  if (!skipCache && !before && messageCache.length > 0 && (Date.now() - lastFetched) < CACHE_TTL) {
    return messageCache;
  }

  try {
    let query = supabase
      .from('global_chat')
      .select('id, user_id, username, content, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await withTimeout(query, 5000);
    if (error) {
      console.error('Chat fetch error:', error);
      return messageCache.length > 0 ? messageCache : [];
    }
    
    const messages = data?.reverse() || [];
    
    // Update cache if not paginating
    if (!before) {
      messageCache = messages;
      lastFetched = Date.now();
    }
    
    return messages;
  } catch (err) {
    console.error('Chat service error:', err);
    return messageCache.length > 0 ? messageCache : [];
  }
};

// Clear message cache (call when needed)
export const clearMessageCache = () => {
  messageCache = [];
  lastFetched = 0;
};

// Send a global chat message
export const sendGlobalMessage = async (userId, content, username = 'Anonymous') => {
  if (!content || content.trim().length === 0) {
    throw new Error('Message cannot be empty');
  }

  if (content.length > 500) {
    throw new Error('Message cannot exceed 500 characters');
  }

  const { data, error } = await supabase
    .from('global_chat')
    .insert({
      user_id: userId,
      content: content.trim(),
      username: username,
    })
    .select('id, user_id, username, content, created_at')
    .single();

  if (error) {
    console.error('Send message error:', error);
    throw error;
  }
  return data;
};

// Delete a chat message (own messages only)
export const deleteGlobalMessage = async (messageId, userId) => {
  const { error } = await supabase
    .from('global_chat')
    .delete()
    .eq('id', messageId)
    .eq('user_id', userId);

  if (error) throw error;
};

// Subscribe to global chat messages (realtime)
export const subscribeToGlobalChat = (callback) => {
  return supabase
    .channel('global-chat')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'global_chat',
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
};

// Get online users count (approximation based on recent activity)
export const getActiveUsersCount = async () => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { count, error } = await supabase
      .from('global_chat')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', fiveMinutesAgo);

    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
};

// Get total message count
export const getTotalMessageCount = async () => {
  try {
    const { count, error } = await supabase
      .from('global_chat')
      .select('*', { count: 'exact', head: true });

    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
};
