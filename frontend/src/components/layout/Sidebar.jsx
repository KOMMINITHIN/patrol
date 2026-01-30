import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';

// Icons
const ReportsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ChatIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const ProfileIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const Sidebar = ({ activePage, onPageChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHoverZone, setIsHoverZone] = useState(false);
  const sidebarRef = useRef(null);
  const hoverZoneRef = useRef(null);
  const timeoutRef = useRef(null);

  const menuItems = [
    { id: 'reports', icon: ReportsIcon, label: 'Reports', tooltip: 'Community Reports' },
    { id: 'chat', icon: ChatIcon, label: 'Chat', tooltip: 'Global Chat' },
    { id: 'profile', icon: ProfileIcon, label: 'Profile', tooltip: 'My Account' },
  ];

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsExpanded(true);
    
    if (sidebarRef.current) {
      gsap.to(sidebarRef.current, {
        x: 0,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
      
      if (sidebarRef.current) {
        gsap.to(sidebarRef.current, {
          x: -60,
          duration: 0.3,
          ease: 'power2.in',
        });
      }
    }, 200);
  };

  const handlePageClick = (pageId) => {
    if (activePage === pageId) {
      onPageChange(null); // Toggle off if clicking same page
    } else {
      onPageChange(pageId);
    }
  };

  return (
    <>
      {/* Invisible hover zone on the left edge */}
      <div
        ref={hoverZoneRef}
        className="fixed left-0 top-0 bottom-0 w-4 z-[100]"
        onMouseEnter={handleMouseEnter}
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-[99] transform -translate-x-[60px]"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="sidebar-glass rounded-r-2xl p-2 flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handlePageClick(item.id)}
                className={`sidebar-item group relative ${isActive ? 'active' : ''}`}
                title={item.tooltip}
              >
                <div className={`sidebar-icon ${isActive ? 'text-white' : 'text-gray-600'}`}>
                  <Icon />
                </div>
                
                {/* Tooltip */}
                <div className="sidebar-tooltip">
                  {item.tooltip}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
