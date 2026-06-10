import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './EcoFeatures.css';

gsap.registerPlugin(ScrollTrigger);

const EcoFeatures = () => {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);

  const features = [
    {
      title: "Plant-Based Packaging",
      desc: "Crafted for a circular economy that prioritizes resource reuse and minimizes waste.",
      index: "01"
    },
    {
      title: "Officially Compostable",
      desc: "Our advocacy for composting underscores its role as the optimal recycling method for food packaging.",
      index: "02"
    },
    {
      title: "Decreasing Emissions",
      desc: "We’ve established a plan to cut carbon emissions throughout our supply chain and operations.",
      index: "03"
    }
  ];

  useEffect(() => {
    // Elegant fade-up and stagger for the features
    const rows = gsap.utils.toArray('.feature-row');
    
    gsap.fromTo(titleRef.current,
      { y: 60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
        }
      }
    );

    rows.forEach((row, i) => {
      gsap.fromTo(row,
        { x: -50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          delay: i * 0.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
          }
        }
      );
    });
  }, []);

  return (
    <section className="features-section relative-z" ref={sectionRef}>
      <h2 className="features-main-title hover-target" data-hover="DISCOVER" ref={titleRef}>
        From Initial Idea<br/>To <span className="text-primary">Launch</span>.
      </h2>

      <div className="features-list">
        {features.map((item, i) => (
          <div className="feature-row hover-target" data-hover="ECO" key={i}>
            <div className="feature-index text-gold">{item.index}</div>
            <div className="feature-content">
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
            <div className="feature-line"></div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default EcoFeatures;
