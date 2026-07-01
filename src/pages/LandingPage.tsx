import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Layout, Layers, MessageSquare, Code, Globe } from "lucide-react";
import styles from "./LandingPage.module.css";
import { MarketingNavbar } from "../components/MarketingNavbar";

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
      transition: { duration: 0.6, ease: "easeOut" as const },
    },
  };

  return (
    <div className={styles.pageWrapper}>
      <AnimatedBackground />

      <div className={styles.container}>
        <MarketingNavbar />

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
