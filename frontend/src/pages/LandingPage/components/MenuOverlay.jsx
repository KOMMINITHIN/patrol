import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import './MenuOverlay.css';

const menuItems = [
  {
    id: 'app',
    label: 'Open App',
    path: '/app',
    image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&q=80'
  },
  {
    id: 'features',
    label: 'Features',
    path: '/features',
    image: 'https://images.unsplash.com/photo-1524813686514-a57563d77965?w=600&q=80'
  },
  {
    id: 'about',
    label: 'About',
    path: '/about',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&q=80'
  },
  {
    id: 'developer',
    label: 'Developer',
    path: '/developer',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80'
  }
];

const socialLinks = [
  { label: 'GitHub', url: 'https://github.com' },
  { label: 'LinkedIn', url: 'https://linkedin.com' },
  { label: 'Twitter', url: 'https://twitter.com' }
];

export default function MenuOverlay({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeImage, setActiveImage] = useState(menuItems[0].image);
  const overlayRef = useRef(null);
  const contentRef = useRef(null);
  const previewRef = useRef(null);
  const linksRef = useRef([]);

  useEffect(() => {
    if (isOpen) {
      // Open animation
      gsap.to(overlayRef.current, {
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
        duration: 1,
        ease: 'power4.inOut'
      });

      gsap.to(contentRef.current, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        opacity: 1,
        duration: 1,
        ease: 'power4.inOut'
      });

      gsap.to(linksRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        delay: 0.4,
        stagger: 0.1,
        ease: 'power3.out'
      });

      gsap.to('.menu-social-link', {
        y: 0,
        opacity: 1,
        duration: 0.6,
        delay: 0.6,
        stagger: 0.05,
        ease: 'power3.out'
      });
    } else {
      // Close animation
      gsap.to(linksRef.current, {
        y: 60,
        opacity: 0,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power2.in'
      });

      gsap.to('.menu-social-link', {
        y: 20,
        opacity: 0,
        duration: 0.3,
        stagger: 0.03,
        ease: 'power2.in'
      });

      gsap.to(contentRef.current, {
        x: -100,
        y: -50,
        rotation: -10,
        scale: 1.2,
        opacity: 0.3,
        duration: 0.8,
        delay: 0.2,
        ease: 'power4.inOut'
      });

      gsap.to(overlayRef.current, {
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
        duration: 0.8,
        delay: 0.3,
        ease: 'power4.inOut'
      });
    }
  }, [isOpen]);

  const handleLinkHover = (image) => {
    setActiveImage(image);
    if (previewRef.current) {
      gsap.to(previewRef.current.querySelector('img'), {
        scale: 1.05,
        duration: 0.5,
        ease: 'power2.out'
      });
    }
  };

  const handleLinkLeave = () => {
    if (previewRef.current) {
      gsap.to(previewRef.current.querySelector('img'), {
        scale: 1,
        duration: 0.5,
        ease: 'power2.out'
      });
    }
  };

  const handleNavClick = (path) => {
    onClose();
    setTimeout(() => {
      navigate(path);
    }, 800);
  };

  return (
    <div className="menu-overlay" ref={overlayRef}>
      <div className="menu-overlay-content" ref={contentRef}>
        <div className="menu-overlay-grid">
          {/* Preview Image */}
          <div className="menu-preview" ref={previewRef}>
            <img src={activeImage} alt="Preview" />
          </div>

          {/* Menu Links */}
          <div className="menu-links-section">
            <div className="menu-main-links">
              {menuItems.map((item, index) => (
                <div key={item.id} className="menu-link-wrapper">
                  <a
                    ref={el => linksRef.current[index] = el}
                    className={`menu-main-link ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.path)}
                    onMouseEnter={() => handleLinkHover(item.image)}
                    onMouseLeave={handleLinkLeave}
                  >
                    {item.label}
                  </a>
                </div>
              ))}
            </div>

            <div className="menu-socials">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="menu-social-link"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="menu-footer">
          <div className="menu-footer-left">
            <a onClick={() => handleNavClick('/login')}>Sign In</a>
          </div>
          <div className="menu-footer-right">
            <span>© 2026 Patrol</span>
          </div>
        </div>
      </div>
    </div>
  );
}
