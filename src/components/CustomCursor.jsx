import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const CustomCursor = () => {
  const cursorRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverText, setHoverText] = useState('');

  useEffect(() => {
    // Only run on desktop/devices with fine pointer
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const cursor = cursorRef.current;
    
    // Move cursor with GSAP for smoothness
    const moveCursor = (e) => {
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.1,
        ease: "power2.out"
      });
    };

    window.addEventListener('mousemove', moveCursor);

    // Add interactivity to specific classes ('hover-target') or inherently clickable elements
    const handleMouseOver = (e) => {
      const target = e.target.closest('a, button, .hover-target');
      if (target) {
        setIsHovering(true);
        // If element has a data-hover attribute, use it as text inside cursor
        const text = target.getAttribute('data-hover');
        if (text) setHoverText(text);
        else setHoverText('EXPLORE');
      }
    };

    const handleMouseOut = (e) => {
      const target = e.target.closest('a, button, .hover-target');
      if (target) {
        setIsHovering(false);
        setHoverText('');
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  // Hide entirely if on touch device
  if (typeof window !== 'undefined' && window.matchMedia("(pointer: coarse)").matches) {
    return null;
  }

  return (
    <div 
      ref={cursorRef} 
      className={`custom-cursor ${isHovering ? 'hovering' : ''}`}
    >
      <span className="custom-cursor-label">{hoverText}</span>
    </div>
  );
};

export default CustomCursor;
