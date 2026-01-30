import { supabase } from './supabase';
import { getDeviceFingerprint } from './fingerprint';

/**
 * Votes Service
 * Handles voting functionality with device fingerprint tracking
 */

// Vote on a report
export const voteOnReport = async (reportId, userId = null) => {
  const deviceId = await getDeviceFingerprint();
  
  // Check if already voted
  const hasVoted = await checkIfVoted(reportId, deviceId);
  if (hasVoted) {
    throw new Error('You have already voted on this issue');
  }

  // Create vote
  const { data, error } = await supabase
    .from('votes')
    .insert({
      report_id: reportId,
      user_id: userId,
      device_id: deviceId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      throw new Error('You have already voted on this issue');
    }
    throw error;
  }

  // Increment vote count
  await supabase.rpc('increment_vote_count', { p_report_id: reportId });

  return data;
};

// Remove vote from a report
export const removeVote = async (reportId) => {
  const deviceId = await getDeviceFingerprint();

  const { error } = await supabase
    .from('votes')
    .delete()
    .eq('report_id', reportId)
    .eq('device_id', deviceId);

  if (error) throw error;

  // Decrement vote count
  await supabase.rpc('decrement_vote_count', { p_report_id: reportId });
};

// Check if current device has voted on a report
export const checkIfVoted = async (reportId, deviceId = null) => {
  try {
    if (!deviceId) {
      deviceId = await getDeviceFingerprint();
    }

    const { data, error } = await supabase
      .from('votes')
      .select('id')
      .eq('report_id', reportId)
      .eq('device_id', deviceId)
      .maybeSingle();

    if (error) {
      console.error('Error checking vote status:', error);
      return false;
    }
    return !!data;
  } catch (err) {
    console.error('checkIfVoted error:', err);
    return false;
  }
};

// Get vote count for a report
export const getVoteCount = async (reportId) => {
  const { count, error } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('report_id', reportId);

  if (error) throw error;
  return count;
};

// Get all votes for a user
export const getUserVotes = async (userId) => {
  const { data, error } = await supabase
    .from('votes')
    .select('report_id')
    .eq('user_id', userId);

  if (error) throw error;
  return data.map(v => v.report_id);
};

// Get device votes (for anonymous users)
export const getDeviceVotes = async () => {
  try {
    const deviceId = await getDeviceFingerprint();

    const { data, error } = await supabase
      .from('votes')
      .select('report_id')
      .eq('device_id', deviceId);

    if (error) {
      console.error('Error fetching device votes:', error);
      return [];
    }
    return data?.map(v => v.report_id) || [];
  } catch (err) {
    console.error('getDeviceVotes error:', err);
    return [];
  }
};

// Subscribe to vote changes for a report
export const subscribeToVotes = (reportId, callback) => {
  return supabase
    .channel(`votes-${reportId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'votes',
        filter: `report_id=eq.${reportId}`,
      },
      (payload) => callback(payload)
    )
    .subscribe();
};
