import React, { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import styles from "../pages/LandingPage.module.css";

const Sparkle = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0Z" />
  </svg>
);

export function CursorGlow() {
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);
  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [x, y]);

  return (
    <motion.div
      className={styles.cursorGlow}
      style={{
        x: springX,
        y: springY,
      }}
    />
  );
}

export function AnimatedBackground() {
  return (
    <>
      <CursorGlow />
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="lightning-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>

      <div className={styles.heroBackground}>
        {/* Wavy lines SVG overlay */}
        <svg className={styles.wavyLines} viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <path d="M-100,500 C200,300 400,600 800,400 C1100,250 1300,500 1500,300" fill="none" stroke="url(#line-grad-1)" strokeWidth="1" />
          <path d="M-100,600 C300,400 500,700 900,450 C1200,250 1400,400 1500,200" fill="none" stroke="url(#line-grad-2)" strokeWidth="1" />
          <path d="M-100,700 C400,500 600,800 1000,500 C1300,300 1450,450 1500,250" fill="none" stroke="url(#line-grad-1)" strokeWidth="0.5" />
          <defs>
            <linearGradient id="line-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="line-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.15" />
            </linearGradient>
          </defs>
        </svg>

        {/* 3D Sphere Orbs */}
        <div className={styles.sphereLargePurple} />
        <div className={styles.sphereMediumBlue} />
        <div className={styles.sphereLargeTopRight} />
        <div className={styles.sphereSmallTopLeft} />
        
        {/* Small Elements */}
        <div className={styles.dotGridTL} />
        <div className={styles.dotGridBR} />
        
        <Sparkle className={`${styles.sparkle} ${styles.sparkle1}`} />
        <Sparkle className={`${styles.sparkle} ${styles.sparkle2}`} />
        
        <div className={`${styles.tinyCircle} ${styles.tc1}`} />
        <div className={`${styles.tinyCircle} ${styles.tc2}`} />
        <div className={`${styles.tinyCircle} ${styles.tc3}`} />
        <div className={`${styles.tinyCircle} ${styles.tc4}`} />
        <div className={`${styles.tinyCircle} ${styles.tc5}`} />
      </div>
    </>
  );
}
