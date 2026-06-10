import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './FAQ.css';

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      q: "Are all your products 100% compostable?",
      a: "Yes, our entire catalog is designed from plant-based materials and is officially certified as compostable, ensuring we leave zero trace behind."
    },
    {
      q: "Do you offer custom branding on cups?",
      a: "Absolutely. We offer comprehensive support from your initial idea to launch, including custom eco-friendly ink printing for your brand."
    },
    {
      q: "How does the WhatsApp ordering process work?",
      a: "Simply browse our collection, click 'Order via WhatsApp' on the product you like, and you'll be connected directly to our sales team to finalize quantities and shipping."
    },
    {
      q: "Do you ship internationally?",
      a: "Currently, we focus on local and regional distribution to minimize our carbon footprint, but reach out to our team for specific volume requirements."
    }
  ];

  const handleToggle = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="faq-section relative-z">
      <div className="faq-container">
        <h2 className="faq-title hover-target" data-hover="ASK">Common <span className="text-primary">Questions</span></h2>
        
        <div className="faq-list">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className={`faq-item hover-target ${activeIndex === idx ? 'active' : ''}`}
              onClick={() => handleToggle(idx)}
              data-hover={activeIndex === idx ? "CLOSE" : "OPEN"}
            >
              <div className="faq-question">
                <h3>{faq.q}</h3>
                <span className="faq-icon">{activeIndex === idx ? '−' : '+'}</span>
              </div>
              
              <AnimatePresence>
                {activeIndex === idx && (
                  <motion.div 
                    className="faq-answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
                  >
                    <p>{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
