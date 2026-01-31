import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import '../styles/Footer.css';
import { useNavigate } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

export default function FooterSection() {
    const containerRef = useRef(null);
    const navigate = useNavigate();

    useGSAP(() => {
        const container = containerRef.current;
        if (!container) return;
        
        gsap.from('.footer-reveal', {
            scrollTrigger: {
                trigger: container,
                start: "top 80%",
                toggleActions: "play none none reverse"
            },
            y: 60,
            opacity: 0,
            duration: 1,
            stagger: 0.15,
            ease: "power3.out"
        });

    }, { scope: containerRef });

    return (
        <footer className="footer-section" ref={containerRef}>
            <div className="footer-content">
                {/* CTA */}
                <div className="footer-cta footer-reveal">
                    <h1>Make your city safer.</h1>
                    <p>Join Patrol and start reporting issues in your community today.</p>
                    <button className="cta-button" onClick={() => navigate('/login')}>
                        Get Started Free
                    </button>
                </div>

                {/* Links */}
                <div className="footer-links footer-reveal">
                    <div className="footer-col">
                        <h4>Platform</h4>
                        <a href="#">Report Issue</a>
                        <a href="#">Track Status</a>
                        <a href="#">Community Map</a>
                        <a href="#">Leaderboard</a>
                    </div>
                    <div className="footer-col">
                        <h4>Resources</h4>
                        <a href="#">How It Works</a>
                        <a href="#">FAQ</a>
                        <a href="#">API Docs</a>
                        <a href="#">Support</a>
                    </div>
                    <div className="footer-col">
                        <h4>Company</h4>
                        <a href="#">About Us</a>
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                        <a href="#">Contact</a>
                    </div>
                </div>

                {/* Bottom */}
                <div className="footer-bottom footer-reveal">
                    <div className="footer-logo">
                        <span className="logo-icon">🛣️</span>
                        <span className="logo-text">Patrol</span>
                    </div>
                    <p className="footer-copyright">© 2026 Patrol. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
