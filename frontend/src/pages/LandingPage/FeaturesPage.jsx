import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ReactLenis } from "@studio-freight/react-lenis";
import GlassNav from "./components/GlassNav";
import './FeaturesPage.css';

gsap.registerPlugin(ScrollTrigger);

const slides = [
  {
    title: "Report road hazards instantly with photo, location, and detailed descriptions.",
    image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=2070&auto=format&fit=crop",
  },
  {
    title: "Track issue status in real-time on our interactive community map.",
    image: "https://images.unsplash.com/photo-1524813686514-a57563d77965?q=80&w=2669&auto=format&fit=crop",
  },
  {
    title: "Vote on community reports to prioritize the most critical issues.",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop",
  },
  {
    title: "Connect directly with local authorities for faster resolution times.",
    image: "https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=2574&auto=format&fit=crop",
  },
  {
    title: "Build your civic reputation by actively contributing to your community.",
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=2070&auto=format&fit=crop",
  },
  {
    title: "Anonymous reporting keeps you safe while making a real difference.",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
  },
];

export default function FeaturesPage() {
  const containerRef = useRef(null);
  const sliderImagesRef = useRef(null);
  const sliderTitleRef = useRef(null);
  const sliderIndicesRef = useRef(null);
  const sliderProgressBarRef = useRef(null);
  const activeSlideRef = useRef(0);

  useGSAP(() => {
    if (!containerRef.current || !sliderImagesRef.current) return;

    const pinDistance = window.innerHeight * slides.length;
    const images = sliderImagesRef.current.children;

    // Initial setup
    gsap.set(images[0], { opacity: 1, scale: 1 });
    for (let i = 1; i < images.length; i++) {
      gsap.set(images[i], { opacity: 0, scale: 1.1 });
    }

    const indexItems = sliderIndicesRef.current.children;
    gsap.set(indexItems[0].querySelector('.feat-index'), { opacity: 1 });
    gsap.set(indexItems[0].querySelector('.feat-marker'), { scaleX: 1 });

    const animateNewSlide = (index) => {
      const newImage = images[index];

      gsap.fromTo(newImage,
        { opacity: 0, scale: 1.1 },
        { opacity: 1, scale: 1, duration: 1, ease: "power2.out", overwrite: true }
      );

      for (let i = 0; i < images.length; i++) {
        if (i !== index) {
          gsap.to(images[i], { opacity: 0, duration: 0.5, ease: "power2.out" });
        }
      }

      // Animate title
      const titleEl = sliderTitleRef.current.querySelector('h1');
      gsap.to(titleEl, {
        y: -20,
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          titleEl.innerText = slides[index].title;
          gsap.fromTo(titleEl,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
          );
        }
      });

      // Animate indicators
      for (let i = 0; i < indexItems.length; i++) {
        const marker = indexItems[i].querySelector('.feat-marker');
        const num = indexItems[i].querySelector('.feat-index');

        if (i === index) {
          gsap.to(num, { opacity: 1, duration: 0.3 });
          gsap.to(marker, { scaleX: 1, duration: 0.3 });
        } else {
          gsap.to(num, { opacity: 0.35, duration: 0.3 });
          gsap.to(marker, { scaleX: 0, duration: 0.3 });
        }
      }
    };

    ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: `+=${pinDistance}`,
      scrub: 1,
      pin: true,
      pinSpacing: true,
      onUpdate: (self) => {
        if (sliderProgressBarRef.current) {
          gsap.set(sliderProgressBarRef.current, { scaleY: self.progress });
        }

        const currentSlide = Math.min(
          Math.floor(self.progress * slides.length),
          slides.length - 1
        );

        if (activeSlideRef.current !== currentSlide) {
          activeSlideRef.current = currentSlide;
          animateNewSlide(currentSlide);
        }
      }
    });

  }, { scope: containerRef });

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothTouch: true }}>
      <main className="features-page-main">
        <GlassNav showLogo={false} />

        {/* Intro Section */}
        <section className="feat-intro">
          <h1>Powerful Features<br />Built for Communities</h1>
          <p>Scroll to explore how Road Patrol empowers citizens to improve their neighborhoods.</p>
        </section>

        {/* Slider Section */}
        <section className="feat-slider" ref={containerRef}>
          <div className="feat-slider-images" ref={sliderImagesRef}>
            {slides.map((slide, i) => (
              <img key={i} src={slide.image} alt={`Feature ${i + 1}`} style={{ zIndex: i }} />
            ))}
          </div>

          <div className="feat-slider-title" ref={sliderTitleRef}>
            <h1>{slides[0].title}</h1>
          </div>

          <div className="feat-slider-indicator">
            <div className="feat-slider-indices" ref={sliderIndicesRef}>
              {slides.map((_, i) => (
                <div key={i} className="feat-indicator-item">
                  <span className="feat-marker"></span>
                  <span className="feat-index">{(i + 1).toString().padStart(2, '0')}</span>
                </div>
              ))}
            </div>
            <div className="feat-slider-progress-bar">
              <div className="feat-slider-progress" ref={sliderProgressBarRef}></div>
            </div>
          </div>
        </section>

        {/* Outro Section */}
        <section className="feat-outro">
          <h1>Ready to make<br />your city better?</h1>
          <a href="/login" className="feat-cta-btn">Get Started</a>
        </section>
      </main>
    </ReactLenis>
  );
}
