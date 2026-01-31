import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ReactLenis } from "@studio-freight/react-lenis";
import { useNavigate } from "react-router-dom";
import GlassNav from "./components/GlassNav";
import './AboutPage.css';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: "10K+", label: "Reports Filed" },
  { value: "500+", label: "Issues Resolved" },
  { value: "50+", label: "Cities Active" },
  { value: "98%", label: "User Satisfaction" },
];

const team = [
  { name: "Community", role: "Reporting Issues" },
  { name: "Authorities", role: "Taking Action" },
  { name: "Technology", role: "Connecting Both" },
];

export default function AboutPage() {
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const navigate = useNavigate();

  useGSAP(() => {
    // Hero text animation
    gsap.from('.about-hero-title span', {
      y: 100,
      opacity: 0,
      duration: 1,
      stagger: 0.1,
      ease: "power3.out"
    });

    gsap.from('.about-hero-subtitle', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      delay: 0.5,
      ease: "power2.out"
    });

    // Stats animation on scroll
    gsap.from('.about-stat', {
      scrollTrigger: {
        trigger: '.about-stats',
        start: "top 80%",
        toggleActions: "play none none reverse"
      },
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: "power3.out"
    });

    // Mission section
    gsap.from('.about-mission-content', {
      scrollTrigger: {
        trigger: '.about-mission',
        start: "top 70%",
        toggleActions: "play none none reverse"
      },
      y: 60,
      opacity: 0,
      duration: 1,
      ease: "power3.out"
    });

    // Team cards
    gsap.from('.about-team-card', {
      scrollTrigger: {
        trigger: '.about-team',
        start: "top 70%",
        toggleActions: "play none none reverse"
      },
      y: 80,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: "power3.out"
    });

  }, { scope: containerRef });

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothTouch: true }}>
      <main className="about-page-main" ref={containerRef}>
        <GlassNav showLogo={false} />

        {/* Hero Section */}
        <section className="about-hero" ref={heroRef}>
          <div className="about-hero-bg"></div>
          <div className="about-hero-content">
            <h1 className="about-hero-title">
              <span>Building</span>
              <span>Safer</span>
              <span>Cities</span>
            </h1>
            <p className="about-hero-subtitle">
              Road Patrol empowers communities to identify, report, and resolve civic issues together.
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="about-stats">
          <div className="about-stats-grid">
            {stats.map((stat, i) => (
              <div key={i} className="about-stat">
                <span className="about-stat-value">{stat.value}</span>
                <span className="about-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Mission Section */}
        <section className="about-mission">
          <div className="about-mission-content">
            <h2>Our Mission</h2>
            <p>
              We believe that every citizen deserves safe roads and well-maintained public infrastructure.
              Road Patrol bridges the gap between communities and local authorities, making it easier
              than ever to report issues and track their resolution.
            </p>
            <p>
              Through real-time reporting, community voting, and transparent tracking, we're transforming
              how civic issues are handled — one pothole at a time.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="about-team">
          <h2>How It Works</h2>
          <div className="about-team-grid">
            {team.map((member, i) => (
              <div key={i} className="about-team-card">
                <div className="about-team-number">{(i + 1).toString().padStart(2, '0')}</div>
                <h3>{member.name}</h3>
                <p>{member.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="about-cta">
          <h2>Join the Movement</h2>
          <p>Start making a difference in your community today.</p>
          <button className="about-cta-btn" onClick={() => navigate('/login')}>
            Get Started
          </button>
        </section>
      </main>
    </ReactLenis>
  );
}
