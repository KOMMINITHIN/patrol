import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ReactLenis } from "@studio-freight/react-lenis";
import GlassNav from "./components/GlassNav";
import './DeveloperPage.css';

// Team members data
const teamMembers = [
  {
    name: "Nithin Kommi",
    role: "Full Stack Developer",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop",
  },
  {
    name: "Likhith V",
    role: "Full Stack Developer",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop",
  },
];

const techStack = [
  { name: "React", desc: "UI Framework" },
  { name: "Supabase", desc: "Backend & Auth" },
  { name: "Leaflet", desc: "Interactive Maps" },
  { name: "GSAP", desc: "Animations" },
];

export default function DeveloperPage() {
  const containerRef = useRef(null);
  const previewRef = useRef(null);
  const [activeImage, setActiveImage] = useState(teamMembers[0].image);

  useGSAP(() => {
    // Initial animations
    gsap.from('.dev-team-link', {
      y: 60,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      delay: 0.3,
      ease: "power3.out"
    });

    gsap.from('.dev-preview-img img', {
      scale: 1.2,
      opacity: 0,
      duration: 1,
      delay: 0.5,
      ease: "power2.out"
    });

    gsap.from('.dev-section-label', {
      y: 20,
      opacity: 0,
      duration: 0.6,
      delay: 0.2,
      ease: "power2.out"
    });

  }, { scope: containerRef });

  const handleMemberHover = (image) => {
    if (image === activeImage) return;
    
    const preview = previewRef.current;
    if (!preview) return;

    // Create new image
    const newImg = document.createElement('img');
    newImg.src = image;
    newImg.style.opacity = '0';
    newImg.style.transform = 'scale(1.15) rotate(3deg)';
    preview.appendChild(newImg);

    // Animate new image in
    gsap.to(newImg, {
      opacity: 1,
      scale: 1,
      rotation: 0,
      duration: 0.6,
      ease: "power2.out"
    });

    // Clean up old images after animation
    setTimeout(() => {
      const images = preview.querySelectorAll('img');
      if (images.length > 2) {
        images[0].remove();
      }
    }, 700);

    setActiveImage(image);
  };

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothTouch: true }}>
      <main className="dev-page-main" ref={containerRef}>
        <GlassNav showLogo={false} />

        {/* Team Section - ExoApe Style */}
        <section className="dev-team-section">
          <div className="dev-team-content">
            <div className="dev-team-left">
              <div className="dev-preview-img" ref={previewRef}>
                <img src={activeImage} alt="Team member" />
              </div>
            </div>
            
            <div className="dev-team-right">
              <span className="dev-section-label">THE TEAM</span>
              <div className="dev-team-links">
                {teamMembers.map((member, i) => (
                  <div 
                    key={i} 
                    className="dev-team-link"
                    onMouseEnter={() => handleMemberHover(member.image)}
                  >
                    <a href="#">{member.name}</a>
                    <span className="dev-team-role">{member.role}</span>
                  </div>
                ))}
              </div>
              
              <div className="dev-tech-list">
                <span className="dev-section-label">BUILT WITH</span>
                <div className="dev-tech-items">
                  {techStack.map((tech, i) => (
                    <span key={i} className="dev-tech-item">{tech.name}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="dev-footer">
            <div className="dev-footer-left">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="dev-github-link"
              >
                View Source Code
              </a>
            </div>
            <div className="dev-footer-right">
              <a href="mailto:hello@patrol.app">Contact</a>
              <a href="#">Documentation</a>
            </div>
          </div>
        </section>
      </main>
    </ReactLenis>
  );
}
