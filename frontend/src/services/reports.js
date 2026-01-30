import { supabase, getPublicUrl } from './supabase';
import { getDeviceFingerprint } from './fingerprint';

/**
 * Reports Service
 * Handles all report-related API calls
 */

// Helper to add timeout to promises
const withTimeout = (promise, ms = 8000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), ms)
    )
  ]);
};

// Create a new report
export const createReport = async (reportData, photoFile) => {
  try {
    const deviceId = await getDeviceFingerprint();
    
    // Upload photo first
    console.log('Uploading photo...');
    const photoUrl = await uploadReportPhoto(photoFile);
    console.log('Photo uploaded:', photoUrl);
    
    const insertData = {
      title: reportData.title,
      description: reportData.description || null,
      category: reportData.category,
      priority: reportData.priority || 'medium',
      latitude: reportData.latitude,
      longitude: reportData.longitude,
      address: reportData.address || null,
      photo_url: photoUrl,
      device_id: deviceId,
      created_by: reportData.created_by || null,
      status: 'open',
      vote_count: 0,
      view_count: 0,
    };
    
    console.log('Inserting report:', insertData);
    
    const { data, error } = await supabase
      .from('reports')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    
    console.log('Report created successfully:', data);
    return data;
  } catch (err) {
    console.error('Create report error:', err);
    throw err;
  }
};

// Cache for reports list
let reportsListCache = null;
let reportsListCacheTime = 0;
const REPORTS_LIST_CACHE_TTL = 10000; // 10 seconds

// Get all reports with filters and caching
export const getReports = async (filters = {}, skipCache = false) => {
  // Generate cache key from filters
  const cacheKey = JSON.stringify(filters);
  
  // Use cache if available and valid (only for default filters)
  if (!skipCache && reportsListCache && 
      Object.keys(filters).length === 0 && 
      (Date.now() - reportsListCacheTime) < REPORTS_LIST_CACHE_TTL) {
    return reportsListCache;
  }

  let query = supabase
    .from('reports')
    .select('id, title, description, category, priority, status, latitude, longitude, address, photo_url, vote_count, view_count, created_at, created_by')
    .order('created_at', { ascending: false })
    .limit(filters.limit || 100); // Increased default limit

  // Apply filters
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  
  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }
  
  if (filters.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority);
  }

  // Exclude resolved if specified
  if (filters.excludeResolved) {
    query = query.neq('status', 'resolved');
  }

  const { data, error } = await query;
  if (error) throw error;
  
  // Cache the result for default filters
  if (Object.keys(filters).length === 0) {
    reportsListCache = data;
    reportsListCacheTime = Date.now();
  }
  
  return data;
};

// Clear reports list cache
export const clearReportsListCache = () => {
  reportsListCache = null;
  reportsListCacheTime = 0;
};

// Get reports within map bounds
export const getReportsInBounds = async (bounds, filters = {}) => {
  const { data, error } = await supabase.rpc('get_reports_in_bounds', {
    min_lat: bounds.south,
    min_lng: bounds.west,
    max_lat: bounds.north,
    max_lng: bounds.east,
    p_status: filters.status || null,
    p_category: filters.category || null,
    p_limit: filters.limit || 500,
  });

  if (error) throw error;
  return data;
};

// Simple cache for report details
const reportCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

// Get single report by ID with caching
export const getReportById = async (id, skipCache = false) => {
  // Check cache first
  if (!skipCache && reportCache.has(id)) {
    const cached = reportCache.get(id);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      // Increment view count in background
      incrementViewCount(id).catch(console.error);
      return cached.data;
    }
    reportCache.delete(id);
  }

  try {
    // First, get the report data
    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .select('id, title, description, category, priority, status, latitude, longitude, address, photo_url, vote_count, view_count, created_at, created_by, resolution_photo_url')
      .eq('id', id)
      .single();

    if (reportError) {
      console.error('getReportById error:', reportError);
      throw reportError;
    }

    // If there's a created_by, fetch the profile separately
    let profiles = null;
    if (reportData.created_by) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, reputation_score')
        .eq('id', reportData.created_by)
        .single();
      
      profiles = profileData;
    }

    const result = { ...reportData, profiles };
    
    // Cache the result
    reportCache.set(id, { data: result, timestamp: Date.now() });
    
    // Increment view count (non-blocking)
    incrementViewCount(id).catch(console.error);
    
    return result;
  } catch (err) {
    console.error('getReportById failed:', err);
    throw err;
  }
};

// Clear cache for a specific report (call after updates)
export const clearReportCache = (id) => {
  if (id) {
    reportCache.delete(id);
  } else {
    reportCache.clear();
  }
};

// Get nearby reports for duplicate detection
export const getNearbyReports = async (lat, lng, category, radius = 50) => {
  const { data, error } = await supabase.rpc('nearby_reports', {
    lat,
    lng,
    radius_meters: radius,
    p_category: category,
    exclude_resolved: true,
  });

  if (error) throw error;
  return data;
};

// Update report status
export const updateReportStatus = async (reportId, status, photoFile = null, notes = null, userId) => {
  let photoUrl = null;
  
  // Upload resolution photo if provided
  if (photoFile && status === 'resolved') {
    photoUrl = await uploadReportPhoto(photoFile);
  }

  // Create status update record
  const { error: statusError } = await supabase
    .from('status_updates')
    .insert({
      report_id: reportId,
      new_status: status,
      photo_url: photoUrl,
      notes,
      updated_by: userId,
    });

  if (statusError) throw statusError;

  // Update the report
  const updates = {
    status,
    updated_at: new Date().toISOString(),
  };
  
  if (photoUrl) {
    updates.resolution_photo_url = photoUrl;
  }

  const { data, error } = await supabase
    .from('reports')
    .update(updates)
    .eq('id', reportId)
    .select()
    .single();

  if (error) throw error;
  
  // Clear cache for this report so next fetch gets fresh data
  clearReportCache(reportId);
  
  return data;
};

// Upload report photo to storage
export const uploadReportPhoto = async (file) => {
  const fileExt = file.name?.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${fileName}`; // Simplified path without subfolder

  console.log('Uploading to path:', filePath);
  
  const { data, error } = await supabase.storage
    .from('report-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true, // Allow overwrite
    });

  if (error) {
    console.error('Storage upload error:', error);
    throw error;
  }
  
  console.log('Upload successful:', data);
  
  const url = getPublicUrl('report-photos', filePath);
  console.log('Public URL:', url);
  return url;
};

// Increment view count
export const incrementViewCount = async (reportId) => {
  await supabase.rpc('increment_view_count', { p_report_id: reportId });
};

// Get report statistics
export const getReportStatistics = async () => {
  const { data, error } = await supabase.rpc('get_report_statistics');
  if (error) throw error;
  return data;
};

// Subscribe to reports changes (realtime)
export const subscribeToReports = (callback) => {
  return supabase
    .channel('reports-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reports' },
      (payload) => callback(payload)
    )
    .subscribe();
};

// Cache for user's reports
const myReportsCache = new Map();
const MY_REPORTS_CACHE_TTL = 30000; // 30 seconds

// Get reports created by current user with caching
export const getMyReports = async (userId, skipCache = false) => {
  if (!userId) return [];
  
  // Check cache first
  if (!skipCache && myReportsCache.has(userId)) {
    const cached = myReportsCache.get(userId);
    if (Date.now() - cached.timestamp < MY_REPORTS_CACHE_TTL) {
      return cached.data;
    }
    myReportsCache.delete(userId);
  }
  
  try {
    const query = supabase
      .from('reports')
      .select('id, title, description, category, priority, status, photo_url, vote_count, view_count, created_at')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data, error } = await withTimeout(query, 6000);

    if (error) {
      console.error('getMyReports error:', error);
      // Return cached data on error if available
      if (myReportsCache.has(userId)) {
        return myReportsCache.get(userId).data;
      }
      return [];
    }
    
    const reports = data || [];
    
    // Cache the result
    myReportsCache.set(userId, { data: reports, timestamp: Date.now() });
    
    return reports;
  } catch (err) {
    console.error('getMyReports error:', err);
    // Return cached data on timeout if available
    if (myReportsCache.has(userId)) {
      return myReportsCache.get(userId).data;
    }
    return [];
  }
};

// Clear my reports cache
export const clearMyReportsCache = (userId) => {
  if (userId) {
    myReportsCache.delete(userId);
  } else {
    myReportsCache.clear();
  }
};

// Delete a report
export const deleteReport = async (reportId) => {
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', reportId);

  if (error) throw error;
};
