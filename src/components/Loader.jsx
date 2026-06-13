import React, { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import './Loader.css';

// Precompute decorative leaf configs once, outside render, so the component
// body stays pure (no Math.random during render).
const LEAF_CONFIGS = Array.from({ length: 18 }).map((_, i) => ({
  startX: Math.random() * 100,
  duration: 6 + Math.random() * 5,
  // Stagger early so the short-lived loader stays full of leaves.
  delay: (i % 6) * 0.25 + Math.random() * 0.6,
  scale: 0.45 + Math.random() * 0.85,
  sway: 8 + Math.random() * 14,
}));

// Floating leaves, matching the leafy aesthetic of the hamburger menu.
const LoaderLeaves = () => (
  <div className="loader-leaves">
    {LEAF_CONFIGS.map(({ startX, duration, delay, scale, sway }, i) => (
      <Motion.div
        key={i}
        className="loader-leaf"
        initial={{ x: `${startX}vw`, y: '-12vh', rotate: 0, opacity: 0 }}
        animate={{
          x: [`${startX}vw`, `${startX + sway}vw`, `${startX - sway}vw`, `${startX + sway}vw`, `${startX}vw`],
          y: ['-12vh', '112vh'],
          rotate: [0, 45, -45, 45, 0],
          opacity: [0, 0.8, 0.8, 0],
        }}
        transition={{
          y: { duration, ease: 'linear', repeat: Infinity, delay },
          x: { duration, ease: 'easeInOut', repeat: Infinity, delay },
          rotate: { duration, ease: 'easeInOut', repeat: Infinity, delay },
          opacity: { duration, ease: 'linear', repeat: Infinity, delay },
        }}
        style={{ scale }}
      >
        <img src="/leaf.png" alt="" />
      </Motion.div>
    ))}
  </div>
);

const Loader = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  // Smoothly drive the progress to 100% over a fixed, comfortable duration.
  // Time-based (not tied to window 'load') so it reliably dismisses even if a
  // slow resource like a web font is still pending.
  useEffect(() => {
    const start = Date.now();
    const DURATION = 2400;
    const id = setInterval(() => {
      const t = Math.min((Date.now() - start) / DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 2); // easeOutQuad
      setProgress(Math.round(eased * 100));
      if (t >= 1) clearInterval(id);
    }, 20);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (progress >= 100 && !done) {
      const t = setTimeout(() => {
        setDone(true);
        if (onComplete) onComplete();
      }, 650);
      return () => clearTimeout(t);
    }
  }, [progress, done, onComplete]);

  return (
    <AnimatePresence>
      {!done && (
        <Motion.div
          className="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
        >
          <LoaderLeaves />
          <Motion.div
            className="loader-inner"
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          >
            <img src="/logo-greencup.png" alt="GreenCup Promosyon" className="loader-logo" />
            <div className="loader-bar">
              <div className="loader-bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="loader-pct">{Math.round(progress)}%</span>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

export default Loader;
