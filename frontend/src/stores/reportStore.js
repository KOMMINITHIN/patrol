import { create } from 'zustand';
import { getReports, getReportsInBounds, subscribeToReports, clearReportCache, clearReportsListCache } from '../services/reports';
import { getDeviceVotes } from '../services/votes';

// Helper to add timeout to promises
const withTimeout = (promise, ms = 8000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), ms)
    )
  ]);
};

export const useReportStore = create((set, get) => ({
  reports: [],
  selectedReport: null,
  filters: {
    status: 'all',
    category: 'all',
    priority: 'all',
  },
  votedReports: [],
  isLoading: false,
  error: null,
  lastFetched: null,

  // Fetch all reports with caching and timeout
  fetchReports: async (filters = {}, forceRefresh = false) => {
    const now = Date.now();
    const lastFetched = get().lastFetched;
    const currentReports = get().reports;
    
    // Skip if we fetched within last 5 seconds (unless forced or filters changed)
    if (!forceRefresh && lastFetched && (now - lastFetched) < 5000 && Object.keys(filters).length === 0) {
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      const mergedFilters = { ...get().filters, ...filters, limit: 100 };
      const reports = await withTimeout(getReports(mergedFilters), 8000);
      set({ reports: reports || [], isLoading: false, lastFetched: now });
    } catch (error) {
      console.error('Error fetching reports:', error);
      // Keep existing reports on timeout/error
      set({ 
        error: error.message, 
        isLoading: false,
        reports: currentReports.length > 0 ? currentReports : []
      });
    }
  },

  // Fetch reports in map bounds
  fetchReportsInBounds: async (bounds) => {
    try {
      const filters = get().filters;
      const reports = await withTimeout(getReportsInBounds(bounds, {
        status: filters.status !== 'all' ? filters.status : null,
        category: filters.category !== 'all' ? filters.category : null,
      }), 8000);
      set({ reports: reports || [] });
    } catch (error) {
      console.error('Error fetching reports in bounds:', error);
    }
  },

  // Set filters and fetch immediately
  setFilters: (newFilters) => {
    const filters = { ...get().filters, ...newFilters };
    set({ filters, lastFetched: null }); // Reset cache when filters change
    get().fetchReports(filters);
  },

  // Reset filters
  resetFilters: () => {
    const defaultFilters = {
      status: 'all',
      category: 'all',
      priority: 'all',
    };
    set({ filters: defaultFilters });
    get().fetchReports(defaultFilters);
  },

  // Select a report
  selectReport: (report) => {
    set({ selectedReport: report });
  },

  // Clear selected report
  clearSelectedReport: () => {
    set({ selectedReport: null });
  },

  // Add new report to list
  addReport: (report) => {
    const reports = [report, ...get().reports];
    set({ reports });
  },

  // Update a report in list
  updateReport: (updatedReport) => {
    const reports = get().reports.map((r) =>
      r.id === updatedReport.id ? updatedReport : r
    );
    set({ reports });
    
    // Also update selected report if it's the same one
    if (get().selectedReport?.id === updatedReport.id) {
      set({ selectedReport: updatedReport });
    }
  },

  // Remove a report from list
  removeReport: (reportId) => {
    const reports = get().reports.filter((r) => r.id !== reportId);
    set({ reports });
    
    // Clear selected if it was the removed one
    if (get().selectedReport?.id === reportId) {
      set({ selectedReport: null });
    }
  },

  // Load voted reports for current device
  loadVotedReports: async () => {
    try {
      const votedReports = await getDeviceVotes();
      set({ votedReports });
    } catch (error) {
      console.error('Error loading voted reports:', error);
    }
  },

  // Add to voted reports
  addVotedReport: (reportId) => {
    const votedReports = [...get().votedReports, reportId];
    set({ votedReports });
  },

  // Remove from voted reports
  removeVotedReport: (reportId) => {
    const votedReports = get().votedReports.filter((id) => id !== reportId);
    set({ votedReports });
  },

  // Check if report is voted
  isReportVoted: (reportId) => {
    return get().votedReports.includes(reportId);
  },

  // Subscribe to realtime updates
  subscribeToUpdates: () => {
    return subscribeToReports((payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      if (eventType === 'INSERT') {
        // Clear list cache so new report shows up
        clearReportsListCache();
        get().addReport(newRecord);
      } else if (eventType === 'UPDATE') {
        // Clear cache for this report so we get fresh data
        clearReportCache(newRecord.id);
        clearReportsListCache();
        get().updateReport(newRecord);
      } else if (eventType === 'DELETE') {
        clearReportCache(oldRecord.id);
        clearReportsListCache();
        get().removeReport(oldRecord.id);
      }
    });
  },
}));
