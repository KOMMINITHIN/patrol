import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import './GlassNav.css';

export default function GlassNav({ showLogo = true }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavVisible, setIsNavVisible] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const navRef = useRef(null);
  const hoverZoneRef = useRef(null);

  // Animate nav visibility
  useEffect(() => {
    if (navRef.current) {
      gsap.to(navRef.current, {
        x: isNavVisible ? 0 : -70,
        opacity: isNavVisible ? 1 : 0,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  }, [isNavVisible]);

  const handleNavEnter = () => {
    setIsNavVisible(true);
  };

  const handleNavLeave = () => {
    setIsNavVisible(false);
    setHoveredItem(null);
  };

  const handleNavClick = (path) => {
    navigate(path);
    setIsNavVisible(false);
  };

  const isActive = (path) => {
    return location.pathname === path || 
           (path === '/' && location.pathname === '/landing');
  };

  return (
    <>
      {/* Hover Zone - invisible area on left edge */}
      <div 
        ref={hoverZoneRef}
        className="nav-hover-zone"
        onMouseEnter={handleNavEnter}
      />



      {/* Hidden Side Nav - appears on hover */}
      <div 
        className="glass-nav" 
        ref={navRef}
        onMouseEnter={handleNavEnter}
        onMouseLeave={handleNavLeave}
      >
        <div className="glass-nav-container">
          <div 
            className={`glass-nav-item ${isActive('/') ? 'active' : ''}`}
            onClick={() => handleNavClick('/')}
            onMouseEnter={() => setHoveredItem('home')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div className="glass-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className={`glass-nav-label ${hoveredItem === 'home' ? 'visible' : ''}`}>Home</span>
          </div>

          <div 
            className={`glass-nav-item ${isActive('/app') ? 'active' : ''}`}
            onClick={() => handleNavClick('/app')}
            onMouseEnter={() => setHoveredItem('app')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div className="glass-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <span className={`glass-nav-label ${hoveredItem === 'app' ? 'visible' : ''}`}>Open App</span>
          </div>

          <div 
            className={`glass-nav-item ${isActive('/features') ? 'active' : ''}`}
            onClick={() => handleNavClick('/features')}
            onMouseEnter={() => setHoveredItem('features')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div className="glass-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <span className={`glass-nav-label ${hoveredItem === 'features' ? 'visible' : ''}`}>Features</span>
          </div>

          <div 
            className={`glass-nav-item ${isActive('/about') ? 'active' : ''}`}
            onClick={() => handleNavClick('/about')}
            onMouseEnter={() => setHoveredItem('about')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div className="glass-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <span className={`glass-nav-label ${hoveredItem === 'about' ? 'visible' : ''}`}>About</span>
          </div>

          <div 
            className={`glass-nav-item ${isActive('/developer') ? 'active' : ''}`}
            onClick={() => handleNavClick('/developer')}
            onMouseEnter={() => setHoveredItem('developer')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div className="glass-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <span className={`glass-nav-label ${hoveredItem === 'developer' ? 'visible' : ''}`}>Developer</span>
          </div>

          <div 
            className={`glass-nav-item ${isActive('/login') ? 'active' : ''}`}
            onClick={() => handleNavClick('/login')}
            onMouseEnter={() => setHoveredItem('login')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div className="glass-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>
            <span className={`glass-nav-label ${hoveredItem === 'login' ? 'visible' : ''}`}>Login</span>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <div 
          className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}
          onClick={() => handleNavClick('/')}
        >
          <div className="mobile-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="mobile-nav-label">Home</span>
        </div>

        <div 
          className={`mobile-nav-item ${isActive('/features') ? 'active' : ''}`}
          onClick={() => handleNavClick('/features')}
        >
          <div className="mobile-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <span className="mobile-nav-label">Features</span>
        </div>

        <div 
          className={`mobile-nav-item ${isActive('/app') ? 'active' : ''}`}
          onClick={() => handleNavClick('/app')}
        >
          <div className="mobile-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <span className="mobile-nav-label">App</span>
        </div>

        <div 
          className={`mobile-nav-item ${isActive('/about') ? 'active' : ''}`}
          onClick={() => handleNavClick('/about')}
        >
          <div className="mobile-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <span className="mobile-nav-label">About</span>
        </div>

        <div 
          className={`mobile-nav-item ${isActive('/login') ? 'active' : ''}`}
          onClick={() => handleNavClick('/login')}
        >
          <div className="mobile-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>
          <span className="mobile-nav-label">Login</span>
        </div>
      </nav>
    </>
  );
}
