import React from 'react';
import { useRef,  useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ReactLenis } from "@studio-freight/react-lenis";
import './LandingPage.css';
import GlassNav from "./components/GlassNav";

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const heroRef = useRef(null);
  const heroContentRef = useRef(null);
  const heroImageWrapperRef = useRef(null);
  const heroMaskRef = useRef(null);
  const heroGridRef = useRef(null);
  const marker1Ref = useRef(null);
  const marker2Ref = useRef(null);

  useGSAP(() => {
    if (!heroRef.current || !heroContentRef.current || !heroImageWrapperRef.current) return;

    const hero = heroRef.current;
    const heroContent = heroContentRef.current;
    const heroImage = heroImageWrapperRef.current;
    const heroMask = heroMaskRef.current;
    const heroGrid = heroGridRef.current;
    const marker1 = marker1Ref.current;
    const marker2 = marker2Ref.current;
    
    // Force GPU acceleration
    gsap.set([heroContent, heroImage, heroMask, heroGrid, marker1, marker2], { force3D: true });

    // Calculate movement distances
    const viewportHeight = window.innerHeight;
    const contentHeight = heroContent.offsetHeight;
    const imageWrapperHeight = heroImage.offsetHeight;

    // Distance the content moves
    const contentMoveDistance = contentHeight - viewportHeight;
    const imageMoveDistance = imageWrapperHeight - viewportHeight;

    // Easing function
    const easeFn = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const smoothEase = (progress, start, end) => {
      if (progress < start) return 0;
      if (progress > end) return 1;
      const local = (progress - start) / (end - start);
      return easeFn(local);
    };

    ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: "+=3000",
      pin: true,
      pinSpacing: true,
      scrub: 0.5,
      onUpdate: (self) => {
        const progress = self.progress;

        // Update progress bar
        if (hero.style) {
            hero.style.setProperty("--progress", progress.toString());
        }

        // 1. Move Hero Content
        gsap.set(heroContent, {
          y: -progress * contentMoveDistance,
          overwrite: 'auto'
        });

        // 2. Control Hero Image Movement
        gsap.set(heroImage, {
            y: -progress * imageMoveDistance,
            overwrite: 'auto'
        });

        // 3. Visual Properties (Mask Scale, Saturation, Overlay Opacity)
        const transStart = 0.25;
        const transEnd = 0.35;
        const revStart = 0.65;
        const revEnd = 0.75;

        let visualState = 0;

        if (progress < transStart) {
            visualState = 0;
        } else if (progress < transEnd) {
            visualState = smoothEase(progress, transStart, transEnd);
        } else if (progress < revStart) {
            visualState = 1;
        } else if (progress < revEnd) {
            visualState = 1 - smoothEase(progress, revStart, revEnd);
        } else {
            visualState = 0;
        }

        // Apply visual properties
        const currentScale = 300 - (250 * visualState);
        const maskSizeValue = `${currentScale}%`;

        if (heroMask) {
            gsap.set(heroMask, { 
                maskSize: maskSizeValue, 
                webkitMaskSize: maskSizeValue,
                overwrite: 'auto'
            });
        }
        
        if (hero) {
            hero.style.setProperty("--hero-overlay-opacity", (visualState * 0.8).toString());
        }
        
        if (heroImage) {
             gsap.set(heroImage, { 
                filter: `saturate(${1 - visualState})`,
                overwrite: 'auto' 
            });
        }

        // 4. Grid Overlay Opacity
        let gridOpacity = 0;
        const gridInStart = 0.35;
        const gridInEnd = 0.4;
        const gridOutStart = 0.6;
        const gridOutEnd = 0.65;

        if (progress < gridInStart) gridOpacity = 0;
        else if (progress < gridInEnd) gridOpacity = smoothEase(progress, gridInStart, gridInEnd);
        else if (progress < gridOutStart) gridOpacity = 1;
        else if (progress < gridOutEnd) gridOpacity = 1 - smoothEase(progress, gridOutStart, gridOutEnd);
        else gridOpacity = 0;

        if (heroGrid) {
            gsap.set(heroGrid, { 
                opacity: gridOpacity,
                overwrite: 'auto'
            });
        }

        // 5. Markers
        let m1Op = 0;
        if (progress > 0.4 && progress < 0.6) {
             if (progress < 0.45) m1Op = smoothEase(progress, 0.4, 0.45);
             else if (progress > 0.55) m1Op = 1 - smoothEase(progress, 0.55, 0.6);
             else m1Op = 1;
        }
        if (marker1) {
            gsap.set(marker1, { 
                opacity: m1Op,
                overwrite: 'auto'
            });
        }

        let m2Op = 0;
        if (progress > 0.45 && progress < 0.6) {
             if (progress < 0.5) m2Op = smoothEase(progress, 0.45, 0.5);
             else if (progress > 0.55) m2Op = 1 - smoothEase(progress, 0.55, 0.6);
             else m2Op = 1;
        }
        if (marker2) {
            gsap.set(marker2, { 
                opacity: m2Op,
                overwrite: 'auto'
            });
        }
      }
    });

  }, { scope: heroRef });

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothTouch: true }}>
      <main className="landing-page-main">
        <GlassNav />
        
        <section className="hero" ref={heroRef}>
          <div className="hero-image-wrapper" ref={heroImageWrapperRef}>
            <img src="/hero.jpg" alt="Background" className="hero-img" />
          </div>

          <div className="hero-mask" ref={heroMaskRef}></div>

          <div className="hero-grid-overlay" ref={heroGridRef}>
            <img src="/grid.svg" alt="Grid" className="grid-img" />
          </div>

          <div className="marker marker-1" ref={marker1Ref}>
            <span className="marker-icon"></span>
            <p className="marker-label">POTHOLE</p>
          </div>

          <div className="marker marker-2" ref={marker2Ref}>
            <span className="marker-icon"></span>
            <p className="marker-label">DEBRIS</p>
          </div>

          <div className="hero-content" ref={heroContentRef}>

            <div className="hero-content-block hero-center">
              <div className="hero-content-copy">
                <h1>ROAD<br />PATROL</h1>
                <p className="hero-tagline">Report. Track. Resolve.</p>
              </div>
            </div>

            <div className="hero-content-block">
              <div className="hero-content-copy">
                <h2>Report Issues</h2>
                <p>Spot potholes, debris, and hazards in your community. Capture photos and locations instantly.</p>
              </div>
            </div>

            <div className="hero-content-block">
               <div className="hero-content-copy">
                <h2>Track Progress</h2>
                <p>Monitor issue status in real-time. See how your reports drive change in your neighborhood.</p>
              </div>
            </div>

            <div className="hero-content-block">
               <div className="hero-content-copy">
                <h2>Make Impact</h2>
                <p>Join thousands of citizens making cities safer. Your voice matters in civic improvement.</p>
              </div>
            </div>

          </div>
        </section>
      </main>
    </ReactLenis>
  );
}
