import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

// Pages
import ReportDetails from './pages/ReportDetails';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage/LandingPage';
import FeaturesPage from './pages/LandingPage/FeaturesPage';
import AboutPage from './pages/LandingPage/AboutPage';
import DeveloperPage from './pages/LandingPage/DeveloperPage';

// Components
import MapView from './components/map/MapView';
import Sidebar from './components/layout/Sidebar';
import ReportsPanel from './components/reports/ReportsPanel';
import ChatPanel from './components/chat/ChatPanel';
import ProfilePanel from './components/profile/ProfilePanel';
import OfflineBanner from './components/common/OfflineBanner';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';

// Hooks
import { useAuthStore } from './stores/authStore';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useReportStore } from './stores/reportStore';

// Report Details Overlay Component
function ReportDetailsOverlay() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const handleClose = () => {
    // Navigate back to app view, not landing page
    navigate('/app');
  };
  
  return (
    <div 
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={handleClose}
    >
      <div className="min-h-screen flex items-start justify-center py-4 px-4 md:py-8">
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <ReportDetails isOverlay onClose={handleClose} />
        </div>
      </div>
    </div>
  );
}

function App() {
  const { initialize, isLoading } = useAuthStore();
  const { fetchReports, subscribeToUpdates } = useReportStore();
  const isOnline = useOnlineStatus();
  const appRef = useRef(null);
  const location = useLocation();
  const [activePage, setActivePage] = useState(null);

  useEffect(() => {
    initialize();
    fetchReports();
    
    // Subscribe to realtime updates
    const subscription = subscribeToUpdates();
    
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [initialize]);

  useEffect(() => {
    // GSAP entrance animation
    if (appRef.current && !isLoading) {
      gsap.fromTo(
        appRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, [isLoading]);

  const handlePageChange = (page) => {
    setActivePage(page);
  };

  const handleClosePanel = () => {
    setActivePage(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Patrol...</p>
        </div>
      </div>
    );
  }

  // Check if mobile or PWA mode
  const isMobile = window.innerWidth < 768;
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                window.navigator.standalone === true;

  // On mobile/PWA, skip landing pages and go directly to app
  if (!isMobile && !isPWA) {
    // Landing pages - only on desktop
    if (location.pathname === '/landing' || location.pathname === '/') {
      return <LandingPage />;
    }

    if (location.pathname === '/features') {
      return <FeaturesPage />;
    }

    if (location.pathname === '/about') {
      return <AboutPage />;
    }

    if (location.pathname === '/developer') {
      return <DeveloperPage />;
    }
  }

  if (location.pathname === '/login') {
    return <Login />;
  }

  // Main App (Dashboard with map)
  return (
    <div ref={appRef} className="h-screen w-screen overflow-hidden relative">
      {/* Offline Banner */}
      {!isOnline && <OfflineBanner />}

      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Main Map View - Always visible */}
      <div className="absolute inset-0 z-0">
        <MapView />
      </div>

      {/* Logo/Branding - Desktop - Clickable to Landing Page */}
      <div className="absolute top-4 left-4 md:left-16 z-[50] hidden md:block">
        <a href="/" className="text-xl font-bold text-primary-700 tracking-wide hover:text-primary-800 transition-colors cursor-pointer" style={{fontFamily: "'Cinzel', serif"}}>Patrol</a>
      </div>

      {/* Mobile Logo/Branding - Top Left */}
      <div className="absolute top-3 left-3 z-[50] md:hidden">
        <div className="glass-brand rounded-xl py-2 px-3.5 shadow-lg">
          <span className="text-sm font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent tracking-wide" style={{fontFamily: "'Cinzel', serif"}}>Patrol</span>
        </div>
      </div>

      {/* Priority Legend - Hover Icon (Desktop) */}
      <div className="absolute bottom-6 left-4 md:left-16 z-[50] hidden md:block">
        <div className="priority-help-container group">
          <button className="priority-help-btn">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <div className="priority-tooltip">
            <p className="font-semibold text-gray-800 mb-3 text-sm tracking-wide">Priority Levels</p>
            <div className="space-y-2.5">
              <div className="flex items-center space-x-3">
                <span className="w-3 h-3 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-sm"></span>
                <span className="text-gray-600 text-sm font-medium">Low</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-sm"></span>
                <span className="text-gray-600 text-sm font-medium">Medium</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-sm"></span>
                <span className="text-gray-600 text-sm font-medium">High</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-3 h-3 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-sm"></span>
                <span className="text-gray-600 text-sm font-medium">Urgent</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar activePage={activePage} onPageChange={handlePageChange} />
      </div>

      {/* Mobile Bottom Navigation - Modern Design */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] mobile-nav-glass safe-area-bottom">
        <div className="flex items-center justify-around h-full">
          <button
            onClick={() => handlePageChange(activePage === 'reports' ? null : 'reports')}
            className={`mobile-nav-item ${
              activePage === 'reports' ? 'active' : ''
            }`}
          >
            <div className="mobile-nav-icon">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="mobile-nav-label">Reports</span>
          </button>
          
          <button
            onClick={() => handlePageChange(activePage === 'chat' ? null : 'chat')}
            className={`mobile-nav-item ${
              activePage === 'chat' ? 'active' : ''
            }`}
          >
            <div className="mobile-nav-icon">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="mobile-nav-label">Chat</span>
          </button>
          
          <button
            onClick={() => handlePageChange(activePage === 'profile' ? null : 'profile')}
            className={`mobile-nav-item ${
              activePage === 'profile' ? 'active' : ''
            }`}
          >
            <div className="mobile-nav-icon">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="mobile-nav-label">Profile</span>
          </button>
        </div>
      </div>

      {/* Slide Panels */}
      <ReportsPanel isOpen={activePage === 'reports'} onClose={handleClosePanel} />
      <ChatPanel isOpen={activePage === 'chat'} onClose={handleClosePanel} />
      <ProfilePanel isOpen={activePage === 'profile'} onClose={handleClosePanel} />

      {/* Routes for detail pages */}
      <Routes>
        <Route path="/" element={null} />
        <Route path="/landing" element={null} />
        <Route path="/features" element={null} />
        <Route path="/about" element={null} />
        <Route path="/report/:id" element={<ReportDetailsOverlay />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={null} />
      </Routes>
    </div>
  );
}

export default App;
