import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

// Pages
import ReportDetails from './pages/ReportDetails';
import Login from './pages/Login';

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
  
  return (
    <div 
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={() => navigate('/')}
    >
      <div className="min-h-screen flex items-start justify-center py-4 px-4 md:py-8">
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <ReportDetails isOverlay onClose={() => navigate('/')} />
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
          <p className="text-gray-600 font-medium">Loading Road Patrol...</p>
        </div>
      </div>
    );
  }

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

      {/* Logo/Branding - Desktop */}
      <div className="absolute top-4 left-4 md:left-16 z-[50] hidden md:block">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-800" style={{ fontFamily: "'Cinzel', serif" }}>Road Patrol</span>
        </div>
      </div>

      {/* Mobile Logo/Branding - Top Left */}
      <div className="absolute top-3 left-3 z-[50] md:hidden">
        <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm rounded-full py-1.5 px-3 shadow-lg">
          <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-gray-800" style={{ fontFamily: "'Cinzel', serif" }}>Road Patrol</span>
        </div>
      </div>

      {/* Legend - Hidden on mobile */}
      <div className="absolute bottom-6 left-4 md:left-16 z-[50] hidden md:block">
        <div className="glass-legend rounded-xl p-3 text-xs">
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

      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar activePage={activePage} onPageChange={handlePageChange} />
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          <button
            onClick={() => handlePageChange(activePage === 'reports' ? null : 'reports')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${
              activePage === 'reports' ? 'text-primary-600 bg-primary-50' : 'text-gray-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs mt-1 font-medium">Reports</span>
          </button>
          
          <button
            onClick={() => handlePageChange(activePage === 'chat' ? null : 'chat')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${
              activePage === 'chat' ? 'text-primary-600 bg-primary-50' : 'text-gray-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs mt-1 font-medium">Chat</span>
          </button>
          
          <button
            onClick={() => handlePageChange(activePage === 'profile' ? null : 'profile')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${
              activePage === 'profile' ? 'text-primary-600 bg-primary-50' : 'text-gray-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1 font-medium">Profile</span>
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
        <Route path="/report/:id" element={<ReportDetailsOverlay />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  );
}

export default App;
