import React, { useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSlider from './components/HeroSlider';
import EcoFeatures from './components/EcoFeatures';
import Categories from './components/Categories';
import ProductCatalog from './components/ProductCatalog';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import CustomCursor from './components/CustomCursor';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './App.css';

gsap.registerPlugin(ScrollTrigger);

function App() {
  useEffect(() => {
    // Initial page load animation
    const tl = gsap.timeline();
    
    tl.fromTo('body', 
      { opacity: 0 }, 
      { opacity: 1, duration: 1, ease: 'power2.inOut' }
    );

    // Initialize Lenis Smooth Scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
    };
  }, []);

  return (
    <div className="App">
      <CustomCursor />
      <Navbar />
      <main>
        <HeroSlider />
        <EcoFeatures />
        <Categories />
        <ProductCatalog />
        <Testimonials />
        <FAQ />
      </main>
      <footer className="footer relative-z">
        <div className="footer-content">
          <h2 className="hover-target" data-hover="GREEN">Green Cup</h2>
          <p>Sustainable packaging for a better tomorrow.</p>
          <div className="footer-links">
            <a href="#" className="hover-target">Privacy Policy</a>
            <a href="#" className="hover-target">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
