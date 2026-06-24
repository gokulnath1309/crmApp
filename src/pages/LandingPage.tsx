import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Zap, Layout, Layers, MessageSquare, Code, Globe } from "lucide-react";
import styles from "./LandingPage.module.css";

const avatars = [
  "https://i.pravatar.cc/100?img=33",
  "https://i.pravatar.cc/100?img=47",
  "https://i.pravatar.cc/100?img=12",
  "https://i.pravatar.cc/100?img=32"
];

const integrationLogos = [
  { icon: Layout, label: "Figma" },
  { icon: Layers, label: "Framer" },
  { icon: MessageSquare, label: "Slack" },
  { icon: Code, label: "Github" },
  { icon: Globe, label: "Chrome" },
];

function Background3D() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  // Transforms to create parallax depth
  const x1 = useTransform(mouseXSpring, [-0.5, 0.5], [80, -80]);
  const y1 = useTransform(mouseYSpring, [-0.5, 0.5], [80, -80]);
  
  const x2 = useTransform(mouseXSpring, [-0.5, 0.5], [-120, 120]);
  const y2 = useTransform(mouseYSpring, [-0.5, 0.5], [-120, 120]);

  const rotate1 = useTransform(mouseXSpring, [-0.5, 0.5], [-20, 20]);
  const rotate2 = useTransform(mouseYSpring, [-0.5, 0.5], [20, -20]);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      const xPct = e.clientX / window.innerWidth - 0.5;
      const yPct = e.clientY / window.innerHeight - 0.5;
      x.set(xPct);
      y.set(yPct);
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [x, y]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" style={{ perspective: "1000px" }}>
       {/* Orbs */}
       <motion.div 
         className={styles.blobPurple} 
         style={{ x: x1, y: y1 }}
       />
       <motion.div 
         className={styles.blobBlue} 
         style={{ x: x2, y: y2 }}
       />

       {/* 3D Floating shapes */}
       <motion.div
         className={styles.floatingShape1}
         style={{ x: x1, y: y2, rotateX: rotate2, rotateY: rotate1 }}
       />
       <motion.div
         className={styles.floatingShape2}
         style={{ x: x2, y: y1, rotateX: rotate1, rotateY: rotate2 }}
       />
       <motion.div
         className={styles.floatingShape3}
         style={{ x: x1, y: y1, rotateX: rotate1, rotateY: rotate1, rotateZ: rotate2 }}
       />
    </div>
  );
}

import { AnimatedBackground } from "../components/AnimatedBackground";

export default function LandingPage() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <div className={styles.pageWrapper}>
      <AnimatedBackground />

      <div className={styles.container}>
        <motion.nav 
          className={styles.navbar}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.brand}>
            <Zap className={styles.brandIcon} />
            <div className={styles.brandPro}>CRMPro</div>
          </div>

          <div className={styles.navLinks}>
            <a href="#home">Home</a>
            <a href="#features">Features</a>
            <a href="#resources">Resources</a>
            <a href="#pricing">Pricing</a>
            <a href="#info">Info</a>
          </div>

          <div className={styles.navActions}>
            <a href="#login" className={styles.loginLink} onClick={(e) => { e.preventDefault(); navigate("/signin"); }}>
              Log in
            </a>
            <button className={styles.btnPrimarySmall} onClick={() => navigate("/signup")}>
              Sign Up
            </button>
          </div>
        </motion.nav>

        <motion.div 
          className={styles.heroSection}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 className={styles.heroTitle} variants={itemVariants}>
            Get a Grip on Your Business<br />Future with <span className={styles.brandPro}>CRMPro</span>
          </motion.h1>

          <motion.p className={styles.heroSubtitle} variants={itemVariants}>
            Discover software that's effective, not overbearing. Seamlessly connect your data, teams, and customers on one platform that grows with your business.
          </motion.p>

          <motion.div className={styles.heroActions} variants={itemVariants}>
            <button className={styles.btnPrimaryLarge} onClick={() => navigate("/signup")}>
              Get Started
            </button>
            <button className={styles.btnOutlineLarge}>
              Learn more
            </button>
          </motion.div>

          <motion.div className={styles.socialProof} variants={itemVariants}>
            <div className={styles.avatars}>
              {avatars.map((src, i) => (
                <div key={i} className={styles.avatar}>
                  <img src={src} alt="User Avatar" />
                </div>
              ))}
            </div>
            <div className={styles.ratingInfo}>
              <div className={styles.stars}>
                {[...Array(5)].map((_, i) => (
                  <svg key={i} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className={styles.ratingText}>Over 1K+ people have joined</span>
            </div>
          </motion.div>

          <motion.div className={styles.statsContainer} variants={itemVariants}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>180+</span>
              <span className={styles.statLabel}>companies use</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>190</span>
              <span className={styles.statLabel}>Country Available</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>2010</span>
              <span className={styles.statLabel}>Founded</span>
            </div>
          </motion.div>

          <motion.div className={styles.integrationsSection} variants={itemVariants}>
            <h3 className={styles.integrationsTitle}>Integrate with the tools you already use</h3>
            <p className={styles.integrationsSubtitle}>Get more done in a day by connecting CRMPro to all your favorite software.</p>
            
            <div className={styles.logosRow}>
              {integrationLogos.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className={styles.logoItem}>
                    <Icon />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
