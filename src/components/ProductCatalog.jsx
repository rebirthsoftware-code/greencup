import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import productsData from '../data/products.json';
import './ProductCatalog.css';

gsap.registerPlugin(ScrollTrigger);

const ProductCatalog = () => {
  const sectionRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    
    // Total width to scroll horizontally minus the viewport width
    const totalScroll = container.scrollWidth - window.innerWidth;

    // Pin the section and translate the container horizontally
    const tween = gsap.to(container, {
      x: -totalScroll,
      ease: "none",
      scrollTrigger: {
        trigger: sectionRef.current,
        pin: true,
        scrub: 1, // Smooth scrubbing
        end: () => "+=" + totalScroll // Control scroll distance
      }
    });

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  const handleWhatsAppClick = (productName) => {
    const encodedMessage = encodeURIComponent(`Merhaba, ${productName} ürünü hakkında bilgi almak ve sipariş vermek istiyorum.`);
    window.open(`https://wa.me/905000000000?text=${encodedMessage}`, '_blank');
  };

  return (
    <section className="horizontal-section relative-z" id="products" ref={sectionRef}>
      <div className="horizontal-container" ref={scrollContainerRef}>
        
        {/* Intro Panel */}
        <div className="horizontal-panel intro-panel">
          <h2 className="display-text hover-target" data-hover="WILD">Organic<br/>Collections</h2>
          <p>Scroll down to explore horizontally.</p>
        </div>

        {/* Product Panels */}
        {productsData.map((product, index) => (
          <div className="horizontal-panel product-panel" key={product.id}>
            <div className="product-card glass" style={{ borderColor: product.color }}>
              <div 
                className="product-image-placeholder hover-target" 
                data-hover="DRAG"
                style={{ backgroundColor: product.color }}
              >
                <span>No.{index + 1}</span>
              </div>
              <div className="product-info">
                <span className="product-category" style={{ color: product.color }}>{product.category}</span>
                <h3 className="hover-target" data-hover="READ">{product.name}</h3>
                <p>{product.shortDescription}</p>
                
                <ul className="product-features">
                  {product.features.map((feature, idx) => (
                    <li key={idx}>
                      <span className="bullet" style={{ backgroundColor: product.color }}></span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button 
                  className="whatsapp-btn hover-target"
                  data-hover="BUY"
                  onClick={() => handleWhatsAppClick(product.name)}
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  Order via WhatsApp
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {/* Outro Panel */}
        <div className="horizontal-panel intro-panel">
          <h2 className="display-text text-gold hover-target">Future<br/>Ready.</h2>
        </div>
        
      </div>
    </section>
  );
};

export default ProductCatalog;
