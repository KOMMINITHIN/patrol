import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import MapView from '../components/map/MapView';
import { useReportStore } from '../stores/reportStore';
import { getCategoryLabel } from '../utils/helpers';

// Filter options
const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

const categoryOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'pothole', label: 'Pothole' },
  { value: 'trash', label: 'Trash/Garbage' },
  { value: 'streetlight', label: 'Streetlight' },
  { value: 'hazard', label: 'Safety Hazard' },
  { value: 'graffiti', label: 'Graffiti' },
  { value: 'road_damage', label: 'Road Damage' },
  { value: 'other', label: 'Other' },
];

const priorityOptions = [
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const Home = () => {
  const [showFilters, setShowFilters] = useState(false);
  const { reports, filters, setFilters, isLoading, loadVotedReports } = useReportStore();
  const filterPanelRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    loadVotedReports();
  }, []);

  useEffect(() => {
    // Animate stats on load
    if (statsRef.current) {
      gsap.fromTo(
        statsRef.current.children,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power2.out',
        }
      );
    }
  }, []);

  useEffect(() => {
    // Animate filter panel
    if (filterPanelRef.current) {
      if (showFilters) {
        gsap.fromTo(
          filterPanelRef.current,
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
        );
      }
    }
  }, [showFilters]);

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value });
  };

  // Calculate stats
  const stats = {
    total: reports.length,
    open: reports.filter((r) => r.status === 'open').length,
    inProgress: reports.filter((r) => r.status === 'in_progress').length,
    urgent: reports.filter((r) => r.priority === 'urgent').length,
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header with stats */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900">Patrol Map</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  showFilters
                    ? 'bg-primary-50 border-primary-200 text-primary-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>
          </div>

          {/* Stats bar */}
          <div ref={statsRef} className="flex items-center space-x-4 overflow-x-auto pb-2">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm whitespace-nowrap">
              <span className="text-gray-500">Total:</span>
              <span className="font-semibold text-gray-900">{stats.total}</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 rounded-full text-sm whitespace-nowrap">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span className="text-blue-700 font-medium">{stats.open} Open</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-yellow-50 rounded-full text-sm whitespace-nowrap">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span className="text-yellow-700 font-medium">{stats.inProgress} In Progress</span>
            </div>
            {stats.urgent > 0 && (
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-red-50 rounded-full text-sm whitespace-nowrap animate-pulse">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span className="text-red-700 font-medium">{stats.urgent} Urgent</span>
              </div>
            )}
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div ref={filterPanelRef} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t">
              {/* Status filter */}
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input text-sm"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Category filter */}
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="input text-sm"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Priority filter */}
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="input text-sm"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center">
              <div className="spinner mx-auto mb-3"></div>
              <p className="text-gray-600">Loading reports...</p>
            </div>
          </div>
        )}
        <MapView />
      </div>

      {/* Floating Action Button */}
      <Link to="/create" className="fab">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>

      {/* Legend */}
      <div className="absolute bottom-24 left-4 z-[1000]">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 text-xs">
          <p className="font-semibold text-gray-700 mb-2">Priority</p>
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="text-gray-600">Low</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="text-gray-600">Medium</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-orange-500"></span>
              <span className="text-gray-600">High</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-gray-600">Urgent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
