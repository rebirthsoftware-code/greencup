import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Navbar.css';

// The floating background leaves
const MenuLeaves = () => {
  const leaves = Array.from({ length: 15 });
  
  return (
    <div className="menu-leaves-container">
      {leaves.map((_, i) => {
        const startX = Math.random() * 100;
        const duration = 8 + Math.random() * 7;
        const delay = Math.random() * 5;
        const scale = 0.5 + Math.random() * 0.8;
        const swayAmount = 10 + Math.random() * 15;

        return (
          <motion.div
            key={`float-${i}`}
            className="menu-leaf"
            initial={{ x: `${startX}vw`, y: '-10vh', rotate: 0, opacity: 0 }}
            animate={{ 
              x: [`${startX}vw`, `${startX + swayAmount}vw`, `${startX - swayAmount}vw`, `${startX + swayAmount}vw`, `${startX}vw`], 
              y: ['-10vh', '110vh'], 
              rotate: [0, 45, -45, 45, 0],
              opacity: [0, 0.8, 0.8, 0]
            }}
            transition={{ 
              y: { duration: duration, ease: 'linear', repeat: Infinity, delay: delay },
              x: { duration: duration, ease: 'easeInOut', repeat: Infinity, delay: delay },
              rotate: { duration: duration, ease: 'easeInOut', repeat: Infinity, delay: delay },
              opacity: { duration: duration, ease: 'linear', repeat: Infinity, delay: delay }
            }}
            style={{ scale, position: 'absolute' }}
          >
            <img src="/leaf.png" alt="Yaprak" style={{ width: '40px', height: '40px', objectFit: 'contain', filter: 'drop-shadow(0px 10px 10px rgba(0,0,0,0.1))' }} />
          </motion.div>
        );
      })}
    </div>
  );
};

// Leaves kicked up by the moving menu
const SweepLeaves = () => {
  const leaves = Array.from({ length: 25 });
  
  return (
    <div className="sweep-leaves-container" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 105 }}>
      {leaves.map((_, i) => {
        // Start near the right edge of the screen where the menu slides in
        const startY = 10 + Math.random() * 80; // random height
        
        // Target points: blasted leftwards and slightly randomized vertical
        const endX = Math.random() * 40; // sweep them across to the left more aggressively
        const midY = startY + (Math.random() - 0.5) * 40; 
        const endY = midY + 40; // eventually fall down due to gravity
        const rotations = (Math.random() * 720) * (Math.random() > 0.5 ? 1 : -1); 

        return (
          <motion.div
            key={`sweep-${i}`}
            style={{ position: 'absolute', scale: Math.random() * 0.7 + 0.3, opacity: 0 }}
            initial={{ x: '100vw', y: `${startY}vh`, rotate: 0, opacity: 0 }}
            animate={{ 
              x: [`100vw`, `${endX}vw`, `${endX - 5}vw`], 
              y: [`${startY}vh`, `${midY}vh`, `${endY}vh`],
              rotate: [0, rotations * 0.7, rotations],
              opacity: [0, 1, 0] 
            }}
            transition={{ 
              duration: 2.5 + Math.random() * 1.5, 
              ease: [0.19, 1, 0.22, 1], // Very realistic blast out easing
              times: [0, 0.6, 1] // Keyframe timing
            }}
          >
            <img src="/leaf.png" alt="Yaprak" style={{ width: '40px', height: '40px', objectFit: 'contain', filter: 'drop-shadow(0px 10px 10px rgba(0,0,0,0.15))' }} />
          </motion.div>
        );
      })}
    </div>
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const menuVariants = {
    closed: {
      opacity: 0,
      x: '100%',
      transition: {
        duration: 0.5,
        ease: [0.76, 0, 0.24, 1],
      }
    },
    open: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: [0.76, 0, 0.24, 1],
      }
    }
  };

  const linkVariants = {
    closed: { y: 50, opacity: 0 },
    open: (i) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: 0.3 + (i * 0.1),
        duration: 0.5,
        ease: [0.76, 0, 0.24, 1],
      }
    })
  };

  const navLinks = [
    { title: 'Ana Sayfa', href: '#' },
    { title: 'Ürünler', href: '#products' },
    { title: 'Hakkımızda', href: '#about' },
    { title: 'İletişim', href: '#contact' },
  ];

  return (
    <>
      <nav className="navbar glass relative-z">
        <img src="/logo-greencup.png" alt="GreenCup Promosyon" className="navbar-logo" />
        <button className="hamburger-btn hover-target" data-hover="MENÜ" onClick={toggleMenu}>
          <div className={`burger ${isOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
          </div>
        </button>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* The burst of leaves swept by the sliding menu */}
            <SweepLeaves />
            
            <motion.div 
              className="fullscreen-menu relative-z"
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              {/* The beautiful floating leaves background */}
              <MenuLeaves />
              
              <div className="menu-inner relative-z">
                <ul className="menu-links">
                  {navLinks.map((link, i) => (
                    <motion.li 
                      key={link.title}
                      custom={i}
                      variants={linkVariants}
                      initial="closed"
                      animate="open"
                      exit="closed"
                    >
                      <a href={link.href} className="hover-target" data-hover="GİT" onClick={toggleMenu}>{link.title}</a>
                    </motion.li>
                  ))}
                </ul>
                <div className="menu-footer">
                  <p>Siparişler için iletişime geçin</p>
                  <a href="https://wa.me/905000000000" target="_blank" rel="noreferrer" className="whatsapp-link hover-target" data-hover="SOHBET">
                    WhatsApp Destek
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
