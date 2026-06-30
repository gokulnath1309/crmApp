import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Zap } from "lucide-react";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { FeatureHero } from "../components/features/FeatureHero";
import { FeatureGrid } from "../components/features/FeatureGrid";
import { FeatureShowcase } from "../components/features/FeatureShowcase";
import { Workflow } from "../components/features/Workflow";
import { Advantages } from "../components/features/Advantages";
import { Stats } from "../components/features/Stats";
import { WhyCRMPro } from "../components/features/WhyCRMPro";
import { CTA } from "../components/features/CTA";
import styles from "./Features.module.css";

export function FeaturesPage() {
  const navigate = useNavigate();

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={styles.pageWrapper}>
      {/* Background Orbs & Effects */}
      <AnimatedBackground />

      <div className={styles.container}>
        {/* Navigation Bar (Identical style to landing page) */}
        <motion.nav 
          className={styles.navbar}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.brand} onClick={() => navigate("/")}>
            <Zap className={styles.brandIcon} />
            <div className={styles.brandPro}>CRMPro</div>
          </div>

          <div className={styles.navLinks}>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate("/"); }}>
              Home
            </a>
            <a href="#" className={styles.navLinkActive} onClick={(e) => { e.preventDefault(); }}>
              Features
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate("/resources"); }}>
              Resources
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate("/pricing"); }}>
              Pricing
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate("/"); }}>
              Info
            </a>
          </div>

          <div className={styles.navActions}>
            <a 
              href="#" 
              className={styles.loginLink} 
              onClick={(e) => { e.preventDefault(); navigate("/signin"); }}
            >
              Log in
            </a>
            <button className={styles.btnPrimarySmall} onClick={() => navigate("/signup")}>
              Sign Up
            </button>
          </div>
        </motion.nav>

        {/* Hero Section */}
        <FeatureHero />

        {/* Interactive Feature Category Pills & Filter Grid */}
        <FeatureGrid />

        {/* 9 Deep Showcases */}
        <FeatureShowcase />

        {/* Operational Workflow Steps */}
        <Workflow />

        {/* Three Core Advantages */}
        <Advantages />

        {/* Scroll Activated Count Counters */}
        <Stats />

        {/* Traditional vs CRM Pro comparison table */}
        <WhyCRMPro />

        {/* Conversion CTA Glass Container */}
        <CTA />

        {/* Matching Simple Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerBrand}>
            <Zap className="w-5 h-5 text-indigo-500 fill-indigo-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">CRMPro &copy; 2026</span>
          </div>
          <div className={styles.footerLinks}>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate("/"); }}>Home</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate("/features"); }}>Features</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
export default FeaturesPage;
