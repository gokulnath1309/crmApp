import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { MarketingNavbar } from "../components/MarketingNavbar";
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={styles.pageWrapper}>
      <AnimatedBackground />

      <div className={styles.container}>
        <MarketingNavbar />

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
