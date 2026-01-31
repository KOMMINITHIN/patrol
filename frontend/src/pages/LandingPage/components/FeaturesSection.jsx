import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import '../styles/Features.css';

gsap.registerPlugin(ScrollTrigger);

const slides = [
    {
        title: "Report road hazards instantly with photo and location data.",
        image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=2070&auto=format&fit=crop",
    },
    {
        title: "Track issue status in real-time on our interactive map.",
        image: "https://images.unsplash.com/photo-1524813686514-a57563d77965?q=80&w=2669&auto=format&fit=crop",
    },
    {
        title: "Vote on community reports to prioritize critical issues.",
        image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop",
    },
    {
        title: "Connect directly with local authorities for faster resolution.",
        image: "https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=2574&auto=format&fit=crop",
    },
    {
        title: "Build your civic reputation by contributing to your community.",
        image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=2070&auto=format&fit=crop",
    },
    {
        title: "Anonymous reporting keeps you safe while making a difference.",
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
    },
];

export default function FeaturesSection() {
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
        
        gsap.set(images[0], { opacity: 1, scale: 1 });
        for(let i = 1; i < images.length; i++) {
            gsap.set(images[i], { opacity: 0, scale: 1.1 });
        }

        const indexItems = sliderIndicesRef.current.children;
        gsap.set(indexItems[0].querySelector('.sec2-index'), { opacity: 1 });
        gsap.set(indexItems[0].querySelector('.sec2-marker'), { scaleX: 1 });

        const animateNewSlide = (index) => {
            const newImage = images[index];
            
            gsap.fromTo(newImage, 
                { opacity: 0, scale: 1.1 },
                { opacity: 1, scale: 1, duration: 1, ease: "power2.out", overwrite: true }
            );

            for(let i = 0; i < images.length; i++) {
                if(i !== index) {
                    gsap.to(images[i], { opacity: 0, duration: 0.5, ease: "power2.out" });
                }
            }

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

            for(let i = 0; i < indexItems.length; i++) {
                const marker = indexItems[i].querySelector('.sec2-marker');
                const num = indexItems[i].querySelector('.sec2-index');
                
                if(i === index) {
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
        <section className="sec2-slider" ref={containerRef}>
            <div className="sec2-slider-images" ref={sliderImagesRef}>
                {slides.map((slide, i) => (
                    <img key={i} src={slide.image} alt={`Slide ${i+1}`} className="sec2-img" style={{zIndex: i}} />
                ))}
            </div>

            <div className="sec2-slider-title" ref={sliderTitleRef}>
                <h1>{slides[0].title}</h1>
            </div>

            <div className="sec2-slider-indicator">
                <div className="sec2-slider-indices" ref={sliderIndicesRef}>
                    {slides.map((_, i) => (
                         <div key={i} className="sec2-indicator-item">
                            <span className="sec2-marker"></span>
                            <span className="sec2-index">{(i+1).toString().padStart(2, '0')}</span>
                         </div>
                    ))}
                </div>
                <div className="sec2-slider-progress-bar">
                    <div className="sec2-slider-progress" ref={sliderProgressBarRef}></div>
                </div>
            </div>
        </section>
    );
}
