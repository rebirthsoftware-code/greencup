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
      title: "Bitki Bazlı Ambalaj",
      desc: "Kaynakların yeniden kullanımını önceliklendiren ve atığı en aza indiren döngüsel bir ekonomi için tasarlandı.",
      index: "01"
    },
    {
      title: "Resmi Olarak Kompostlanabilir",
      desc: "Kompostlamayı savunmamız, onun gıda ambalajları için en ideal geri dönüşüm yöntemi olduğunu vurgular.",
      index: "02"
    },
    {
      title: "Azalan Emisyonlar",
      desc: "Tedarik zincirimiz ve operasyonlarımız genelinde karbon emisyonlarını azaltmak için bir plan oluşturduk.",
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
      <h2 className="features-main-title hover-target" data-hover="KEŞFET" ref={titleRef}>
        İlk Fikirden<br/><span className="text-primary">Lansmana</span>.
      </h2>

      <div className="features-list">
        {features.map((item, i) => (
          <div className="feature-row hover-target" data-hover="EKO" key={i}>
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
