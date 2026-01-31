import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import '../styles/About.css';
import { useNavigate } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

// Feature labels for Patrol
const featureData = [
    { label: "Report", top: 25, left: 15 },
    { label: "Track", top: 12.5, left: 50 },
    { label: "Vote", top: 22.5, left: 75 },
    { label: "Map", top: 30, left: 82.5 },
    { label: "Alert", top: 50, left: 20 },
    { label: "Resolve", top: 80, left: 20 },
    { label: "Connect", top: 75, left: 75 },
];

export default function AboutSection() {
    const containerRef = useRef(null);
    const navigate = useNavigate();

    useGSAP(() => {
        if (!containerRef.current) return;
        
        const container = containerRef.current;
        const features = gsap.utils.toArray('.sec1-feature');
        const featureBgs = gsap.utils.toArray('.sec1-feature-bg');
        
        // Initial setup
        features.forEach((feature, index) => {
            const pos = featureData[index];
            gsap.set(feature, {
                top: `${pos.top}%`,
                left: `${pos.left}%`
            });
        });

        // Get initial dimensions
        const featureStartDimensions = [];
        featureBgs.forEach((bg) => {
            featureStartDimensions.push({ 
                width: bg.offsetWidth || 120, 
                height: bg.offsetHeight || 48 
            });
        });
        
        const remInPixels = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const targetWidth = 3 * remInPixels;
        const targetHeight = 3 * remInPixels;
        
        const getSearchBarFinalWidth = () => window.innerWidth < 1000 ? 20 : 25;

        ScrollTrigger.create({
            trigger: container,
            start: "top top",
            end: `+=${window.innerHeight * 3}`,
            pin: true,
            pinSpacing: true,
            scrub: 1,
            onUpdate: (self) => {
                const progress = self.progress;
                
                const openingEnd = 1 / 3;
                const featuresEnd = 2 / 3;
                const morphEnd = 5 / 6;

                // 1. Move Spotlight Content Out
                if (progress <= openingEnd) {
                    const openingProgress = progress / openingEnd;
                    gsap.set('.sec1-spotlight-content:not(.sec1-header)', { 
                        y: -openingProgress * window.innerHeight 
                    });
                } else {
                    gsap.set('.sec1-spotlight-content:not(.sec1-header)', { 
                        y: -window.innerHeight 
                    });
                }

                // 2. Animate Features (Converge to center)
                if (progress >= openingEnd && progress <= featuresEnd) {
                    const featureProgress = (progress - openingEnd) / (featuresEnd - openingEnd);
                    
                    features.forEach((feature, index) => {
                        const original = featureData[index];
                        const currentTop = original.top + (50 - original.top) * featureProgress;
                        const currentLeft = original.left + (50 - original.left) * featureProgress;
                        
                        gsap.set(feature, {
                            top: `${currentTop}%`,
                            left: `${currentLeft}%`
                        });
                    });
                    
                    // Resize bubbles to circles
                    featureBgs.forEach((bg, index) => {
                        const startDim = featureStartDimensions[index];
                        const currentWidth = startDim.width + (targetWidth - startDim.width) * featureProgress;
                        const currentHeight = startDim.height + (targetHeight - startDim.height) * featureProgress;
                        const currentBorderRadius = 0.5 + (25 - 0.5) * featureProgress;
                        const currentBorderWidth = 0.125 + (0.35 - 0.125) * featureProgress;
                        
                        gsap.set(bg, {
                            width: `${currentWidth}px`,
                            height: `${currentHeight}px`,
                            borderRadius: `${currentBorderRadius}rem`,
                            borderWidth: `${currentBorderWidth}rem`
                        });
                    });
                }
                
                // 3. Fade feature text
                const textFadeEnd = openingEnd + 0.1 * (featuresEnd - openingEnd);
                if (progress >= openingEnd && progress <= textFadeEnd) {
                    const textProgress = (progress - openingEnd) / (textFadeEnd - openingEnd);
                    gsap.set('.sec1-feature-content', { opacity: 1 - textProgress });
                } else if (progress > textFadeEnd) {
                    gsap.set('.sec1-feature-content', { opacity: 0 });
                }

                // 4. Hide features, show search bar
                if (progress >= featuresEnd) {
                    gsap.set('.sec1-features-wrapper', { opacity: 0 });
                    gsap.set('.sec1-search-bar', { opacity: 1 });
                } else {
                    gsap.set('.sec1-features-wrapper', { opacity: 1 });
                    gsap.set('.sec1-search-bar', { opacity: 0 });
                }

                // 5. Morph search bar
                if (progress >= featuresEnd && progress <= morphEnd) {
                    const searchBarProgress = (progress - featuresEnd) / (morphEnd - featuresEnd);
                    const finalW = getSearchBarFinalWidth();
                    
                    const width = 3 + (finalW - 3) * searchBarProgress;
                    const height = 3 + (5 - 3) * searchBarProgress;
                    const translateY = -50 + (200 - (-50)) * searchBarProgress;
                    
                    gsap.set('.sec1-search-bar', {
                        width: `${width}rem`,
                        height: `${height}rem`,
                        transform: `translate(-50%, ${translateY}%)`
                    });
                    
                    gsap.set('.sec1-search-bar p', { opacity: 0 });
                    
                } else if (progress > morphEnd) {
                    const finalW = getSearchBarFinalWidth();
                    gsap.set('.sec1-search-bar', {
                        width: `${finalW}rem`,
                        height: '5rem',
                        transform: 'translate(-50%, 200%)'
                    });
                    
                    const finalHeaderProgress = (progress - morphEnd) / (1 - morphEnd);
                    gsap.set('.sec1-search-bar p', { opacity: finalHeaderProgress });
                    
                    gsap.set('.sec1-header-content', {
                        y: -50 + 50 * finalHeaderProgress,
                        opacity: finalHeaderProgress
                    });
                } else {
                    gsap.set('.sec1-search-bar p', { opacity: 0 });
                    gsap.set('.sec1-header-content', { y: -50, opacity: 0 });
                }
            }
        });

    }, { scope: containerRef });

    return (
        <section className="sec1-spotlight" ref={containerRef}>
            {/* Intro Text */}
            <div className="sec1-spotlight-content">
                <div className="sec1-spotlight-bg">
                    <img src="/mask.png" alt="" />
                </div>
                <h1>Building safer roads through community action</h1>
            </div>

            {/* Final Header */}
            <div className="sec1-spotlight-content sec1-header">
                <div className="sec1-header-content">
                    <h1>Ready to make<br/>your city better?</h1>
                    <p>Join thousands of citizens already making a difference in their communities.</p>
                </div>
            </div>

            {/* Features */}
            <div className="sec1-features-wrapper">
                {featureData.map((f, i) => (
                    <div className="sec1-feature" key={i}>
                        <div className="sec1-feature-bg"></div>
                        <div className="sec1-feature-content">
                            <p>{f.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search Bar / CTA */}
            <div className="sec1-search-bar" onClick={() => navigate('/login')}>
                <p>Start Reporting Now</p>
            </div>
        </section>
    );
}
