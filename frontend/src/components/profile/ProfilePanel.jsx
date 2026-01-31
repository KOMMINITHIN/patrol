import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { getMyReports, clearMyReportsCache } from '../../services/reports';
import { getCategoryIcon, getCategoryLabel, getStatusBadge, formatTimeAgo } from '../../utils/helpers';

const ProfilePanel = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, signIn, signOut, updateProfile } = useAuthStore();
  
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('reports');
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  
  const panelRef = useRef(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (panelRef.current && isOpen) {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, x: -50 },
        { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      hasLoadedRef.current = false;
      return;
    }
    
    if (isAuthenticated && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadReports();
      setDisplayName(profile?.display_name || '');
    } else if (!isAuthenticated) {
      setIsLoading(false);
    }
  }, [isOpen, isAuthenticated]);

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile]);

  const loadReports = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getMyReports(user.id);
      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      setLoadError('Could not load your reports');
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({ display_name: displayName.trim() });
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const stats = {
    total: reports.length,
    open: reports.filter((r) => r.status === 'open').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
    totalVotes: reports.reduce((sum, r) => sum + (r.vote_count || 0), 0),
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={panelRef}
      className="profile-panel-container flex flex-col"
    >
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Profile</h2>
              <p className="text-sm text-gray-500 mt-0.5">Account & Settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors mt-0.5"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="border-b border-gray-100 mb-4"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!isAuthenticated ? (
          /* Not logged in */
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome to Patrol</h3>
            <p className="text-gray-500 mb-6">Sign in to track your reports, earn reputation, and join the community.</p>
            <button
              onClick={signIn}
              className="btn-primary w-full"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Sign in with Google</span>
              </div>
            </button>
          </div>
        ) : (
          /* Logged in */
          <div className="p-4">
            {/* Profile Card */}
            <div className="bg-white rounded-xl p-4 mb-4">
              <div className="flex items-start space-x-3">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">
                      {profile?.display_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="input text-sm py-2"
                        placeholder="Display name"
                        maxLength={50}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          className="btn-primary text-xs py-1.5 px-3"
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setDisplayName(profile?.display_name || '');
                          }}
                          className="btn-secondary text-xs py-1.5 px-3"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-gray-900">
                          {profile?.display_name || 'User'}
                        </h3>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Member since {new Date(profile?.created_at).toLocaleDateString()}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="bg-white rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-primary-600">{stats.total}</p>
                <p className="text-xs text-gray-500">Reports</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-green-600">{stats.resolved}</p>
                <p className="text-xs text-gray-500">Resolved</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-blue-600">{stats.open}</p>
                <p className="text-xs text-gray-500">Open</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-gray-700">{stats.totalVotes}</p>
                <p className="text-xs text-gray-500">Votes</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'reports'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                My Reports
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'settings'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Settings
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'reports' ? (
              <div className="space-y-3">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="report-card-mini animate-pulse">
                        <div className="flex space-x-3">
                          <div className="w-16 h-16 rounded-lg bg-gray-200"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : loadError ? (
                  <div className="bg-white rounded-xl p-8 text-center">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500 text-sm mb-3">{loadError}</p>
                    <button 
                      onClick={loadReports}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="bg-white rounded-xl p-8 text-center">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 text-sm">No reports yet</p>
                    <p className="text-gray-400 text-xs mt-1">Your submitted reports will appear here</p>
                  </div>
                ) : (
                  reports.map((report) => (
                    <div
                      key={report.id}
                      onClick={() => navigate(`/report/${report.id}`)}
                      className="report-card-mini cursor-pointer"
                    >
                      <div className="flex space-x-3">
                        {report.photo_url ? (
                          <img
                            src={report.photo_url}
                            alt={report.title}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/64?text=📷';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">📷</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-medium text-gray-900 text-sm line-clamp-1">{report.title}</h4>
                            <span className={`badge text-xs ${getStatusBadge(report.status)}`}>
                              {report.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{getCategoryLabel(report.category)}</span>
                            <span>{formatTimeAgo(report.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Settings Tab */
              <div className="space-y-3">
                <div className="bg-white rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Account</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-gray-500">Email</span>
                      <span className="text-gray-900">{user?.email}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-gray-500">Account ID</span>
                      <span className="text-gray-900 font-mono text-xs">{user?.id?.slice(0, 8)}...</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Notifications</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Push Notifications</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-semibold text-sm hover:bg-red-100 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePanel;
