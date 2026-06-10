import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Testimonials.css';

gsap.registerPlugin(ScrollTrigger);

const Testimonials = () => {
  const wrapperRef = useRef(null);

  const reviews = [
    {
      text: "Switching to Eco folioz for our café’s paper products was one of the best decisions we made. The bio disposable cups are not only visually appealing but also sturdy. The competitive pricing allows us to maintain our sustainability commitment without breaking the bank.",
      author: "Sarah M",
      role: "Café Owner"
    },
    {
      text: "Eco folioz has truly revolutionized our restaurant’s sustainability game! The bio disposable paper products, including cups, plates, and cutlery, are not only eco-friendly but also of top-notch quality. Our customers love the Earth-conscious touch.",
      author: "Ahmet S",
      role: "Restaurant Owner"
    },
    {
      text: "The bio disposable paper products they offer are a game-changer. The variety allows me to match the theme of any event, and the eco-friendly aspect aligns perfectly with our clients’ values. Highly recommended!",
      author: "Mert Y",
      role: "Event Planner"
    }
  ];

  useEffect(() => {
    const cards = gsap.utils.toArray('.review-card');
    
    gsap.fromTo(cards,
      { y: 100, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: 'top 75%',
        }
      }
    );
  }, []);

  return (
    <section className="testimonials-section relative-z" ref={wrapperRef}>
      <div className="testimonials-header">
        <h2 className="hover-target" data-hover="LOVE">Client <span className="text-secondary">Stories</span></h2>
      </div>

      <div className="testimonials-grid">
        {reviews.map((rev, index) => (
          <div className="review-card glass hover-target" data-hover="READ" key={index}>
            <div className="quote-icon">“</div>
            <p className="review-text">{rev.text}</p>
            <div className="review-author">
              <h4>{rev.author}</h4>
              <span>{rev.role}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
