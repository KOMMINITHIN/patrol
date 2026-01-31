import { useNavigate } from "react-router-dom";
import GlassNav from "./components/GlassNav";
import './AboutPage.css';

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <main className="about-page-main">
      <GlassNav showLogo={false} />

      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <span className="about-label">ABOUT PATROL</span>
          <h1 className="about-hero-title">
            Empowering Communities to Build Safer Cities
          </h1>
          <p className="about-hero-subtitle">
            Every day, millions of citizens encounter civic issues that affect their daily lives — 
            potholes that damage vehicles, broken streetlights that compromise safety, and overflowing 
            drains that cause flooding. Patrol was born from a simple belief: when communities and 
            authorities work together, real change happens.
          </p>
        </div>
      </section>

      {/* Quote Section */}
      <section className="about-quote-section">
        <blockquote className="about-quote">
          <span className="quote-mark">"</span>
          <p>The strength of a community lies in its ability to come together, identify problems, 
          and work collectively towards solutions. Technology is simply the bridge that connects 
          citizens to the change they wish to see.</p>
          <cite>— The Patrol Team</cite>
        </blockquote>
      </section>

      {/* Story Section */}
      <section className="about-story">
        <div className="about-story-grid">
          <div className="about-story-image">
            <img 
              src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop" 
              alt="City infrastructure" 
              loading="eager"
            />
          </div>
          <div className="about-story-content">
            <h2>Our Story</h2>
            <p>
              Patrol began as a college project with a vision to transform how civic issues are reported 
              and resolved in our communities. We witnessed firsthand the frustration of citizens who had 
              no effective way to communicate infrastructure problems to local authorities.
            </p>
            <p>
              Traditional methods — phone calls, written complaints, social media posts — often fell on 
              deaf ears or got lost in bureaucratic processes. We knew there had to be a better way. 
              A way that empowers every citizen to become an active participant in urban governance.
            </p>
            <p>
              Today, Patrol serves as a digital bridge between communities and local governments, 
              enabling real-time reporting, transparent tracking, and community-driven prioritization 
              of civic issues that matter most.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="about-mission-full">
        <div className="about-mission-header">
          <span className="about-label">OUR MISSION</span>
          <h2>Making Every Voice Count in Urban Development</h2>
        </div>
        <div className="about-mission-grid">
          <div className="about-mission-text">
            <p>
              We believe that the people who live in a city are its greatest asset. They walk the streets 
              daily, they know which roads are dangerous, which areas need better lighting, and which 
              infrastructure requires immediate attention. Our mission is to harness this collective 
              knowledge and transform it into actionable data for authorities.
            </p>
            <p>
              Through Patrol, we're not just building an app — we're fostering a culture of civic 
              participation. Every report filed is a step towards safer roads. Every vote cast on an 
              issue helps authorities understand community priorities. Every comment shared builds a 
              dialogue between citizens and their government.
            </p>
            <p>
              Our ultimate goal is to create cities where infrastructure problems are identified and 
              resolved quickly, where citizens feel heard and empowered, and where local authorities 
              have the tools they need to serve their communities effectively.
            </p>
          </div>
          <div className="about-mission-image">
            <img 
              src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=500&fit=crop" 
              alt="Community collaboration" 
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Quote 2 */}
      <section className="about-quote-section alt">
        <blockquote className="about-quote">
          <span className="quote-mark">"</span>
          <p>A pothole is not just a hole in the road — it's a missed opportunity for a community to 
          come together and demand better infrastructure for everyone.</p>
        </blockquote>
      </section>

      {/* Values Section */}
      <section className="about-values">
        <div className="about-values-header">
          <span className="about-label">OUR VALUES</span>
          <h2>The Principles That Guide Us</h2>
        </div>
        <div className="about-values-grid">
          <div className="about-value-card">
            <span className="value-number">01</span>
            <h3>Transparency</h3>
            <p>
              Every report, every status update, every resolution is visible to the community. 
              We believe in open governance where citizens can track the progress of their concerns 
              from submission to resolution.
            </p>
          </div>
          <div className="about-value-card">
            <span className="value-number">02</span>
            <h3>Accessibility</h3>
            <p>
              Technology should serve everyone. Patrol is designed to be simple, intuitive, and 
              accessible to all citizens regardless of their technical expertise. Report an issue 
              in just a few taps.
            </p>
          </div>
          <div className="about-value-card">
            <span className="value-number">03</span>
            <h3>Community First</h3>
            <p>
              The community's voice drives our priorities. Through our voting system, citizens 
              collectively decide which issues need urgent attention, ensuring resources are 
              allocated where they matter most.
            </p>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="about-impact">
        <div className="about-impact-image">
          <img 
            src="https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&h=500&fit=crop" 
            alt="People using mobile app" 
            loading="lazy"
          />
        </div>
        <div className="about-impact-content">
          <span className="about-label">OUR IMPACT</span>
          <h2>Real Change, One Report at a Time</h2>
          <p>
            Since our inception, we've facilitated thousands of civic reports, helped resolve 
            hundreds of infrastructure issues, and most importantly, given voice to citizens who 
            previously felt unheard. Each resolved pothole, each repaired streetlight, each cleared 
            drainage represents a small victory for community-driven governance.
          </p>
          <p>
            But numbers only tell part of the story. The real impact is in the grandmother who can 
            now walk safely on a repaired sidewalk, the commuter whose daily route no longer damages 
            their vehicle, and the neighborhood that finally has proper street lighting after years 
            of complaints.
          </p>
          <div className="about-impact-stats">
            <div className="impact-stat">
              <span className="stat-value">10K+</span>
              <span className="stat-label">Reports Filed</span>
            </div>
            <div className="impact-stat">
              <span className="stat-value">500+</span>
              <span className="stat-label">Issues Resolved</span>
            </div>
            <div className="impact-stat">
              <span className="stat-value">50+</span>
              <span className="stat-label">Cities Active</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <h2>Be Part of the Change</h2>
        <p>
          Join thousands of citizens who are actively making their cities better. 
          Download Patrol today and transform the way civic issues are reported and resolved 
          in your community.
        </p>
        <button className="about-cta-btn" onClick={() => navigate('/login')}>
          Get Started Now
        </button>
      </section>
    </main>
  );
}
