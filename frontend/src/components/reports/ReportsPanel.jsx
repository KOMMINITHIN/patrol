import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import toast from 'react-hot-toast';
import { useReportStore } from '../../stores/reportStore';
import { useAuthStore } from '../../stores/authStore';
import { createReport, getNearbyReports } from '../../services/reports';
import { reverseGeocode, getCurrentLocation } from '../../services/geolocation';
import { compressImage, extractExifGps, getCategoryIcon, getCategoryLabel, getPriorityColor, getStatusBadge, formatTimeAgo } from '../../utils/helpers';
import MapView from '../map/MapView';

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

const categories = [
  { value: 'pothole', label: 'Pothole', icon: '🕳️', description: 'Road surface damage' },
  { value: 'trash', label: 'Trash/Garbage', icon: '🗑️', description: 'Overflowing bins or litter' },
  { value: 'streetlight', label: 'Streetlight', icon: '💡', description: 'Broken or flickering lights' },
  { value: 'hazard', label: 'Safety Hazard', icon: '⚠️', description: 'Dangerous conditions' },
  { value: 'graffiti', label: 'Graffiti', icon: '🎨', description: 'Vandalism or tagging' },
  { value: 'road_damage', label: 'Road Damage', icon: '🚧', description: 'Cracks, sinkholes, etc.' },
  { value: 'other', label: 'Other', icon: '📍', description: 'Other civic issues' },
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800', description: 'Minor issue' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800', description: 'Should be addressed' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800', description: 'Needs attention soon' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800', description: 'Safety risk!' },
];

const ReportsPanel = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { reports, filters, setFilters, isLoading, loadVotedReports, fetchReports, subscribeToUpdates } = useReportStore();
  const { user, isAuthenticated } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'create'
  const [showFilters, setShowFilters] = useState(false);
  
  // Create report form state
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    latitude: null,
    longitude: null,
    address: '',
    photo: null,
    photoPreview: null,
  });
  const [errors, setErrors] = useState({});
  
  const panelRef = useRef(null);
  const fileInputRef = useRef(null);
  const subscriptionRef = useRef(null);

  // Animate panel
  useEffect(() => {
    if (panelRef.current && isOpen) {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, x: -50 },
        { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [isOpen]);

  // Load reports and subscribe to updates
  useEffect(() => {
    if (!isOpen) return;
    
    fetchReports();
    loadVotedReports();
    
    subscriptionRef.current = subscribeToUpdates();
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [isOpen]);

  // Get user location on mount
  useEffect(() => {
    const getLocation = async () => {
      try {
        const location = await getCurrentLocation();
        handleLocationSelect({ lat: location.lat, lng: location.lng });
      } catch (error) {
        console.log('Location error:', error.message);
      }
    };
    if (activeTab === 'create') {
      getLocation();
    }
  }, [activeTab]);

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value });
  };

  const handleLocationSelect = async (location) => {
    setFormData((prev) => ({
      ...prev,
      latitude: location.lat,
      longitude: location.lng,
    }));

    try {
      const result = await reverseGeocode(location.lat, location.lng);
      setFormData((prev) => ({
        ...prev,
        address: result.formattedAddress,
      }));
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    try {
      const compressedFile = await compressImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          photo: compressedFile,
          photoPreview: reader.result,
        }));
      };
      reader.readAsDataURL(compressedFile);

      const exifGps = await extractExifGps(file);
      if (exifGps) {
        toast.success('Location extracted from photo');
        handleLocationSelect(exifGps);
      }
    } catch (error) {
      console.error('Photo processing error:', error);
      toast.error('Error processing photo');
    }
  };

  const validateStep = (currentStep) => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.photo) {
        newErrors.photo = 'Photo is required';
      }
      if (!formData.latitude || !formData.longitude) {
        newErrors.location = 'Location is required';
      }
    }

    if (currentStep === 2) {
      if (!formData.title.trim()) {
        newErrors.title = 'Title is required';
      }
      if (!formData.category) {
        newErrors.category = 'Category is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    setIsSubmitting(true);
    try {
      const reportData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        priority: formData.priority,
        latitude: formData.latitude,
        longitude: formData.longitude,
        address: formData.address,
        created_by: user?.id || null,
      };

      const report = await createReport(reportData, formData.photo);
      
      toast.success('Report submitted successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        priority: 'medium',
        latitude: null,
        longitude: null,
        address: '',
        photo: null,
        photoPreview: null,
      });
      setStep(1);
      setActiveTab('feed');
      
      // Refresh reports
      fetchReports();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      priority: 'medium',
      latitude: null,
      longitude: null,
      address: '',
      photo: null,
      photoPreview: null,
    });
    setStep(1);
    setErrors({});
  };

  // Calculate stats
  const stats = {
    total: reports.length,
    open: reports.filter((r) => r.status === 'open').length,
    inProgress: reports.filter((r) => r.status === 'in_progress').length,
    urgent: reports.filter((r) => r.priority === 'urgent').length,
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={panelRef}
      className="slide-panel-left glass-panel h-full flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Community Reports</h2>
              <p className="text-xs text-gray-500">{stats.total} reports from SF community</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => { setActiveTab('feed'); resetForm(); }}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'feed'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 Feed
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'create'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ➕ Report Issue
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'feed' ? (
          <div className="p-4">
            {/* Stats */}
            <div className="flex items-center space-x-2 mb-4 overflow-x-auto pb-2">
              <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 rounded-full text-sm whitespace-nowrap">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span className="text-blue-700 font-medium">{stats.open} Open</span>
              </div>
              <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-yellow-50 rounded-full text-sm whitespace-nowrap">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span className="text-yellow-700 font-medium">{stats.inProgress} In Progress</span>
              </div>
              {stats.urgent > 0 && (
                <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 rounded-full text-sm whitespace-nowrap animate-pulse">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span className="text-red-700 font-medium">{stats.urgent} Urgent</span>
                </div>
              )}
            </div>

            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-full flex items-center justify-between px-4 py-2 rounded-xl border mb-4 transition-colors ${
                showFilters
                  ? 'bg-primary-50 border-primary-200 text-primary-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Filters</span>
              </div>
              <svg className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Filter panel */}
            {showFilters && (
              <div className="space-y-3 mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Priority</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    setFilters({ status: 'all', category: 'all', priority: 'all' });
                    fetchReports({ status: 'all', category: 'all', priority: 'all' });
                  }}
                  className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Reports List */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="report-card-mini animate-pulse">
                    <div className="flex space-x-3">
                      <div className="w-20 h-20 rounded-xl bg-gray-200"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-center">No reports found.<br />Be the first to report an issue!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => navigate(`/report/${report.id}`)}
                    className="report-card-mini cursor-pointer"
                  >
                    <div className="flex space-x-3">
                      {/* Thumbnail */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                        {report.photo_url ? (
                          <img
                            src={report.photo_url}
                            alt={report.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-2xl">📷</div>';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">📷</div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                            {report.title}
                          </h3>
                          <span className={`badge text-xs ${getStatusBadge(report.status)}`}>
                            {report.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`badge text-xs ${getPriorityColor(report.priority)}`}>
                            {report.priority}
                          </span>
                          <span className="text-xs text-gray-500">{getCategoryLabel(report.category)}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                              </svg>
                              <span>{report.vote_count}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>{report.view_count}</span>
                            </div>
                          </div>
                          <span>{formatTimeAgo(report.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Create Report Tab */
          <div className="p-4">
            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>Step {step} of 3</span>
                <span>{Math.round((step / 3) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>

            {/* Step 1: Photo & Location */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Photo Upload */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`photo-preview-compact ${formData.photoPreview ? 'has-image' : ''} ${errors.photo ? 'border-red-300' : ''}`}
                >
                  {formData.photoPreview ? (
                    <img src={formData.photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-gray-600 font-medium text-sm">Tap to capture photo</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                </div>
                {errors.photo && <p className="text-red-500 text-sm">{errors.photo}</p>}

                {/* Location Map */}
                <div className="bg-white rounded-xl p-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">📍 Select Location</p>
                  <div className={`h-40 rounded-xl overflow-hidden ${errors.location ? 'ring-2 ring-red-300' : ''}`}>
                    <MapView
                      selectionMode
                      onLocationSelect={handleLocationSelect}
                      initialLocation={
                        formData.latitude && formData.longitude
                          ? { lat: formData.latitude, lng: formData.longitude }
                          : null
                      }
                    />
                  </div>
                  {formData.address && (
                    <div className="mt-2 p-2 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-700">{formData.address}</p>
                    </div>
                  )}
                  {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Brief description"
                    className={`input text-sm ${errors.title ? 'input-error' : ''}`}
                    maxLength={100}
                  />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setFormData({ ...formData, category: cat.value })}
                        className={`p-2 rounded-xl border-2 text-left transition-all ${
                          formData.category === cat.value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-lg">{cat.icon}</span>
                        <p className="font-medium text-gray-900 text-xs mt-0.5">{cat.label}</p>
                      </button>
                    ))}
                  </div>
                  {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <div className="grid grid-cols-4 gap-2">
                    {priorities.map((pri) => (
                      <button
                        key={pri.value}
                        onClick={() => setFormData({ ...formData, priority: pri.value })}
                        className={`p-2 rounded-xl border-2 text-center transition-all ${
                          formData.priority === pri.value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className={`badge text-xs ${pri.color}`}>{pri.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Details (optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Additional details..."
                    rows={3}
                    className="input text-sm resize-none"
                    maxLength={500}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl overflow-hidden">
                  {formData.photoPreview && (
                    <div className="h-32 relative">
                      <img src={formData.photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2">
                        <span className={`badge text-xs ${priorities.find(p => p.value === formData.priority)?.color}`}>
                          {formData.priority}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 mb-1">{formData.title}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                      <span>{categories.find(c => c.value === formData.category)?.icon}</span>
                      <span>{categories.find(c => c.value === formData.category)?.label}</span>
                    </div>
                    {formData.description && (
                      <p className="text-sm text-gray-600 mb-2">{formData.description}</p>
                    )}
                    <p className="text-xs text-gray-400">{formData.address}</p>
                  </div>
                </div>

                {!isAuthenticated && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-sm text-blue-700">Submitting anonymously. Sign in to track your reports.</p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <button
                onClick={step === 1 ? () => setActiveTab('feed') : handleBack}
                className="btn-secondary text-sm py-2 px-4"
              >
                {step === 1 ? 'Cancel' : 'Back'}
              </button>

              {step < 3 ? (
                <button onClick={handleNext} className="btn-primary text-sm py-2 px-4">
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="btn-primary text-sm py-2 px-4"
                >
                  {isSubmitting ? (
                    <span className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </span>
                  ) : (
                    'Submit Report'
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPanel;
