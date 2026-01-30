import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import toast from 'react-hot-toast';
import MapView from '../components/map/MapView';
import { createReport, getNearbyReports } from '../services/reports';
import { reverseGeocode, getCurrentLocation } from '../services/geolocation';
import { useAuthStore } from '../stores/authStore';
import { compressImage, extractExifGps } from '../utils/helpers';

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
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800', description: 'Minor issue, can wait' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800', description: 'Should be addressed' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800', description: 'Needs attention soon' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800', description: 'Safety risk, fix ASAP' },
];

const CreateReport = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const formRef = useRef(null);
  const fileInputRef = useRef(null);

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

  useEffect(() => {
    // GSAP entrance animation
    if (formRef.current) {
      gsap.fromTo(
        formRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, [step]);

  // Get user's location on mount
  useEffect(() => {
    const getLocation = async () => {
      try {
        const location = await getCurrentLocation();
        handleLocationSelect({ lat: location.lat, lng: location.lng });
      } catch (error) {
        console.log('Location error:', error.message);
      }
    };
    getLocation();
  }, []);

  const handleLocationSelect = async (location) => {
    setFormData((prev) => ({
      ...prev,
      latitude: location.lat,
      longitude: location.lng,
    }));

    // Reverse geocode to get address
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    try {
      // Compress image
      const compressedFile = await compressImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          photo: compressedFile,
          photoPreview: reader.result,
        }));
      };
      reader.readAsDataURL(compressedFile);

      // Try to extract EXIF GPS data
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
      } else if (formData.title.length > 100) {
        newErrors.title = 'Title must be less than 100 characters';
      }
      if (!formData.category) {
        newErrors.category = 'Category is required';
      }
      if (formData.description && formData.description.length > 500) {
        newErrors.description = 'Description must be less than 500 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkForDuplicates = async () => {
    if (!formData.latitude || !formData.longitude || !formData.category) {
      return false;
    }

    try {
      const nearby = await getNearbyReports(
        formData.latitude,
        formData.longitude,
        formData.category
      );

      if (nearby && nearby.length > 0) {
        setDuplicates(nearby);
        setShowDuplicateWarning(true);
        return true;
      }
    } catch (error) {
      console.error('Duplicate check error:', error);
    }

    return false;
  };

  const handleNext = async () => {
    if (!validateStep(step)) return;

    if (step === 2) {
      const hasDuplicates = await checkForDuplicates();
      if (hasDuplicates) return;
    }

    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
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
      navigate(`/report/${report.id}`);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueWithNew = () => {
    setShowDuplicateWarning(false);
    setStep(3);
  };

  const handleViewDuplicate = (reportId) => {
    navigate(`/report/${reportId}`);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Progress bar */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-gray-900">Report an Issue</h1>
            <span className="text-sm text-gray-500">Step {step} of 3</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Form content */}
      <div ref={formRef} className="max-w-2xl mx-auto px-4 py-6">
        {/* Step 1: Photo & Location */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                📸 Capture the Issue
              </h2>

              {/* Photo upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`photo-preview ${formData.photoPreview ? 'has-image' : ''} ${
                  errors.photo ? 'border-red-300' : ''
                }`}
              >
                {formData.photoPreview ? (
                  <img
                    src={formData.photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-gray-600 font-medium">Tap to take or upload photo</p>
                    <p className="text-sm text-gray-400 mt-1">Max 5MB, JPEG/PNG/WebP</p>
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
              {errors.photo && (
                <p className="text-red-500 text-sm mt-2">{errors.photo}</p>
              )}

              {formData.photoPreview && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full mt-3 btn-secondary text-sm"
                >
                  Change Photo
                </button>
              )}
            </div>

            {/* Location */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                📍 Select Location
              </h2>

              <div className={`h-64 rounded-xl overflow-hidden ${errors.location ? 'ring-2 ring-red-300' : ''}`}>
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
                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-green-800">Location confirmed</p>
                      <p className="text-sm text-green-600">{formData.address}</p>
                    </div>
                  </div>
                </div>
              )}
              {errors.location && (
                <p className="text-red-500 text-sm mt-2">{errors.location}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Title */}
            <div className="card p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief description of the issue"
                className={`input ${errors.title ? 'input-error' : ''}`}
                maxLength={100}
              />
              <div className="flex justify-between mt-1">
                {errors.title && (
                  <p className="text-red-500 text-sm">{errors.title}</p>
                )}
                <p className="text-sm text-gray-400 ml-auto">
                  {formData.title.length}/100
                </p>
              </div>
            </div>

            {/* Category */}
            <div className="card p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      formData.category === cat.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <p className="font-medium text-gray-900 mt-1">{cat.label}</p>
                    <p className="text-xs text-gray-500">{cat.description}</p>
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="text-red-500 text-sm mt-2">{errors.category}</p>
              )}
            </div>

            {/* Priority */}
            <div className="card p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Priority Level
              </label>
              <div className="grid grid-cols-2 gap-3">
                {priorities.map((pri) => (
                  <button
                    key={pri.value}
                    onClick={() => setFormData({ ...formData, priority: pri.value })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      formData.priority === pri.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className={`badge ${pri.color}`}>{pri.label}</span>
                    <p className="text-sm text-gray-500 mt-2">{pri.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="card p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Details (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide more details about the issue, safety concerns, impact on traffic, etc."
                rows={4}
                className={`input resize-none ${errors.description ? 'input-error' : ''}`}
                maxLength={500}
              />
              <div className="flex justify-between mt-1">
                {errors.description && (
                  <p className="text-red-500 text-sm">{errors.description}</p>
                )}
                <p className="text-sm text-gray-400 ml-auto">
                  {formData.description.length}/500
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="card overflow-hidden">
              {/* Photo preview */}
              <div className="relative h-48">
                <img
                  src={formData.photoPreview}
                  alt="Report preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className={`badge ${priorities.find(p => p.value === formData.priority)?.color}`}>
                    {formData.priority}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{formData.title}</h2>
                
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-2xl">
                    {categories.find(c => c.value === formData.category)?.icon}
                  </span>
                  <span className="text-gray-600">
                    {categories.find(c => c.value === formData.category)?.label}
                  </span>
                </div>

                {formData.description && (
                  <p className="text-gray-600 mb-4">{formData.description}</p>
                )}

                <div className="flex items-start space-x-2 text-sm text-gray-500">
                  <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{formData.address}</span>
                </div>
              </div>
            </div>

            {!isAuthenticated && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-blue-800">Submitting anonymously</p>
                    <p className="text-sm text-blue-600">Sign in to track your reports and earn reputation</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={step === 1 ? () => navigate('/') : handleBack}
            className="btn-secondary"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 3 ? (
            <button onClick={handleNext} className="btn-primary">
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? (
                <span className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting...</span>
                </span>
              ) : (
                'Submit Report'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Duplicate warning modal */}
      {showDuplicateWarning && (
        <div className="modal-overlay" onClick={() => setShowDuplicateWarning(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Similar Issue Found</h3>
                  <p className="text-sm text-gray-500">This issue may already be reported nearby</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {duplicates.slice(0, 3).map((dup) => (
                  <div
                    key={dup.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 line-clamp-1">{dup.title}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{Math.round(dup.distance)}m away</span>
                        <span>•</span>
                        <span>{dup.vote_count} votes</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewDuplicate(dup.id)}
                      className="text-primary-600 font-medium text-sm hover:underline"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleContinueWithNew}
                  className="flex-1 btn-secondary"
                >
                  Report Anyway
                </button>
                <button
                  onClick={() => setShowDuplicateWarning(false)}
                  className="flex-1 btn-primary"
                >
                  Upvote Existing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateReport;
