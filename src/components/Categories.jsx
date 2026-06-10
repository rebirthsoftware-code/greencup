import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Categories.css';

gsap.registerPlugin(ScrollTrigger);

const Categories = () => {
  const sectionRef = useRef(null);

  const cats = [
    { name: "Single Wall Cups", subtitle: "For Hot & Cold" },
    { name: "Bio Containers", subtitle: "Leak-proof" },
    { name: "Plant Bowls", subtitle: "100% Fibre" },
    { name: "Cutlery & Straws", subtitle: "Compostable" }
  ];

  useEffect(() => {
    const boxes = gsap.utils.toArray('.bento-box');
    
    gsap.fromTo(boxes,
      { scale: 0.8, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
        }
      }
    );
  }, []);

  return (
    <section className="categories-section relative-z" ref={sectionRef}>
      <h2 className="categories-title hover-target" data-hover="BROWSE">Featured <span className="text-primary">Lines</span></h2>
      
      <div className="bento-grid">
        {cats.map((item, i) => (
          <div className={`bento-box bento-type-${i} glass hover-target`} data-hover="VIEW" key={i}>
            <div className="bento-content">
              <h3>{item.name}</h3>
              <p>{item.subtitle}</p>
            </div>
            <div className="bento-overlay"></div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Categories;
