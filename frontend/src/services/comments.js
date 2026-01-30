import { supabase } from './supabase';

/**
 * Comments Service
 * Handles real-time chat/comments for reports with caching
 */

// Simple cache for comments
const commentsCache = new Map();
const CACHE_TTL = 15000; // 15 seconds

// Get comments for a report with caching
export const getComments = async (reportId, skipCache = false) => {
  // Check cache first
  if (!skipCache && commentsCache.has(reportId)) {
    const cached = commentsCache.get(reportId);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    commentsCache.delete(reportId);
  }

  try {
    const { data, error } = await supabase
      .from('comments')
      .select('id, report_id, user_id, content, created_at')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;
    
    // Return comments with placeholder profile data
    const comments = (data || []).map(comment => ({
      ...comment,
      profiles: {
        id: comment.user_id,
        display_name: 'User',
        avatar_url: null
      }
    }));
    
    // Cache the result
    commentsCache.set(reportId, { data: comments, timestamp: Date.now() });
    
    return comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    // Return cached data if available
    if (commentsCache.has(reportId)) {
      return commentsCache.get(reportId).data;
    }
    return [];
  }
};

// Clear comments cache for a report
export const clearCommentsCache = (reportId) => {
  if (reportId) {
    commentsCache.delete(reportId);
  } else {
    commentsCache.clear();
  }
};

// Add a comment
export const addComment = async (reportId, userId, content) => {
  if (!content || content.trim().length === 0) {
    throw new Error('Comment cannot be empty');
  }

  if (content.length > 500) {
    throw new Error('Comment cannot exceed 500 characters');
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      report_id: reportId,
      user_id: userId,
      content: content.trim(),
    })
    .select('id, report_id, user_id, content, created_at')
    .single();

  if (error) throw error;
  
  // Return with placeholder profile data
  return {
    ...data,
    profiles: {
      id: userId,
      display_name: 'User',
      avatar_url: null
    }
  };
};

// Update a comment
export const updateComment = async (commentId, userId, content) => {
  if (!content || content.trim().length === 0) {
    throw new Error('Comment cannot be empty');
  }

  const { data, error } = await supabase
    .from('comments')
    .update({ content: content.trim() })
    .eq('id', commentId)
    .eq('user_id', userId)
    .select('id, report_id, user_id, content, created_at')
    .single();

  if (error) throw error;
  
  return {
    ...data,
    profiles: {
      id: userId,
      display_name: 'User',
      avatar_url: null
    }
  };
};

// Delete a comment
export const deleteComment = async (commentId, userId) => {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId);

  if (error) throw error;
};

// Subscribe to comments for a report (realtime)
export const subscribeToComments = (reportId, callback) => {
  return supabase
    .channel(`comments-${reportId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `report_id=eq.${reportId}`,
      },
      async (payload) => {
        // Handle new/updated comments with placeholder profile
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const comment = payload.new;
          callback({
            ...payload,
            new: {
              ...comment,
              profiles: {
                id: comment.user_id,
                display_name: 'User',
                avatar_url: null
              }
            }
          });
        } else {
          callback(payload);
        }
      }
    )
    .subscribe();
};
// Get comment count for a report
export const getCommentCount = async (reportId) => {
  const { count, error } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('report_id', reportId);

  if (error) throw error;
  return count;
};
