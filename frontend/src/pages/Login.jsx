import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useAuthStore } from '../stores/authStore';
import GlassNav from './LandingPage/components/GlassNav';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, signIn } = useAuthStore();
  
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const tl = gsap.timeline();

    if (contentRef.current) {
      tl.fromTo(
        contentRef.current,
        { opacity: 0, x: -40 },
        { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }
      );
    }

    if (imageRef.current) {
      tl.fromTo(
        imageRef.current,
        { opacity: 0, scale: 1.1 },
        { opacity: 1, scale: 1, duration: 1, ease: 'power2.out' },
        '-=0.6'
      );
    }
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  return (
    <div ref={containerRef} className="login-page">
      <GlassNav showLogo={false} />
      
      <div className="login-split">
        {/* Left Content Side */}
        <div className="login-content-side" ref={contentRef}>
          <div className="login-content-inner">
            {/* Logo */}
            <div className="login-brand">
              <div className="login-logo-icon">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <span>Road Patrol</span>
            </div>

            {/* Header */}
            <div className="login-header">
              <h1>Welcome<br />Back</h1>
              <p>Sign in to continue making your community safer.</p>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="login-btn-google"
            >
              {isLoading ? (
                <div className="login-spinner"></div>
              ) : (
                <>
                  <svg viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="login-divider">
              <span>or</span>
            </div>

            {/* Guest Button */}
            <button onClick={() => navigate('/app')} className="login-btn-guest">
              Continue as Guest
            </button>

            {/* Terms */}
            <p className="login-terms">
              By continuing, you agree to our{' '}
              <a href="#">Terms</a> and <a href="#">Privacy Policy</a>
            </p>
          </div>
        </div>

        {/* Right Image Side */}
        <div className="login-image-side" ref={imageRef}>
          <img 
            src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=2070&auto=format&fit=crop" 
            alt="Road"
          />
          <div className="login-image-overlay"></div>
          <div className="login-image-content">
            <h2>Report. Track.<br />Resolve.</h2>
            <p>Join thousands making cities safer</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
