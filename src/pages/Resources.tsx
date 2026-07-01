import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Building2, Zap } from "lucide-react";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { MarketingNavbar } from "../components/MarketingNavbar";
import styles from "./Resources.module.css";
import {
  heroData,
  whatIsData,
  whyCards,
  guideSteps,
  docSections,
  faqItems,
  bestPractices,
  resourceLibrary,
  finalCtaData,
} from "../components/resources/data";

function Hero() {
  const navigate = useNavigate();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
  };

  return (
    <motion.div
      className={styles.heroSection}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 className={styles.heroTitle} variants={itemVariants}>
        Everything You Need to Master{" "}
        <span className={styles.heroTitleHighlight}>CRMPro</span>
      </motion.h1>
      <motion.p className={styles.heroSubtitle} variants={itemVariants}>
        {heroData.subtitle}
      </motion.p>
      <motion.div className={styles.heroActions} variants={itemVariants}>
        <motion.button
          className={styles.btnPrimaryLarge}
          onClick={() => navigate("/signup")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {heroData.primaryCta}
        </motion.button>
        <motion.button
          className={styles.btnOutlineLarge}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {heroData.secondaryCta}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function WhatIsCRMPro() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.whatIsGrid}>
          <motion.div
            className={styles.whatIsContent}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className={styles.sectionTitle}>{whatIsData.title}</h2>
            <p className={styles.whatIsText}>{whatIsData.description}</p>
            <div className={styles.benefitsGrid}>
              {whatIsData.benefits.map((benefit, i) => (
                <motion.div
                  key={i}
                  className={styles.benefitItem}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <benefit.icon className={styles.benefitIcon} />
                  <span>{benefit.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div
            className={styles.whatIsVisual}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <Building2 className={styles.platformIcon} />
            <div className={styles.platformLabel}>
              <span className={styles.brandPro}>CRMPro</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {["Customers", "Projects", "Tasks", "Teams", "Employees"].map((label) => (
                <span
                  key={label}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 600,
                    background: "linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(59,130,246,0.1) 100%)",
                    color: "#8B5CF6",
                    border: "1px solid rgba(139,92,246,0.15)",
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function WhyCRMPro() {
  return (
    <section className={styles.section} style={{ background: "linear-gradient(to bottom, transparent, rgba(139,92,246,0.02), transparent)" }}>
      <div className={styles.container}>
        <motion.div
          className={styles.sectionHeading}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className={styles.sectionTitle}>Why CRMPro?</h2>
          <p className={styles.sectionDesc}>
            Everything you need to manage your business in one modern platform.
          </p>
        </motion.div>
        <div className={styles.whyGrid}>
          {whyCards.map((card, i) => (
            <motion.div
              key={i}
              className={styles.featureCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              whileHover={{ y: -6 }}
            >
              <div className={styles.cardIconContainer}>
                <card.icon size={22} />
              </div>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardDesc}>{card.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UsageGuide() {
  return (
    <section className={styles.guideSection}>
      <div className={styles.container}>
        <motion.div
          className={styles.sectionHeading}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className={styles.sectionTitle}>Complete Usage Guide</h2>
          <p className={styles.sectionDesc}>
            Follow these simple steps to get your business up and running on CRMPro.
          </p>
        </motion.div>
        <div className={styles.guideSteps}>
          {guideSteps.map((step, i) => (
            <motion.div
              key={i}
              className={styles.guideStep}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              whileHover={{ y: -4 }}
            >
              <div className={styles.stepNumber}>{i + 1}</div>
              <step.icon className={styles.guideIcon} />
              <h3 className={styles.guideStepTitle}>{step.title}</h3>
              <p className={styles.guideStepDesc}>{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DocCard({ section }: { section: typeof docSections[0] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className={styles.docCard}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
    >
      <div className={styles.docCardHeader} onClick={() => setIsOpen(!isOpen)}>
        <div className={styles.docCardIcon}>
          <section.icon size={20} />
        </div>
        <span className={styles.docCardTitle}>{section.title}</span>
        <ChevronDown className={`${styles.docChevron} ${isOpen ? styles.docChevronOpen : ""}`} />
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            className={styles.docCardBody}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className={styles.docItemList}>
              {section.items.map((item, i) => (
                <div key={i} className={styles.docItem}>
                  <div className={styles.docItemLabel}>
                    <div className={styles.docItemDot} />
                    {item.label}
                  </div>
                  <div className={styles.docItemDesc}>{item.description}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FeatureDocumentation() {
  return (
    <section className={styles.docSection}>
      <div className={styles.container}>
        <motion.div
          className={styles.sectionHeading}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className={styles.sectionTitle}>Feature Documentation</h2>
          <p className={styles.sectionDesc}>
            Detailed guides for every module in CRMPro. Click to expand.
          </p>
        </motion.div>
        <div className={styles.docGrid}>
          {docSections.map((section, i) => (
            <DocCard key={i} section={section} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  return (
    <section className={styles.faqSection} style={{ background: "linear-gradient(to bottom, transparent, rgba(139,92,246,0.02), transparent)" }}>
      <div className={styles.container}>
        <motion.div
          className={styles.sectionHeading}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          <p className={styles.sectionDesc}>
            Everything you need to know about CRMPro.
          </p>
        </motion.div>
        <div className={styles.faqList}>
          {faqItems.map((faq, i) => (
            <FaqItem key={i} faq={faq} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqItem({ faq, index }: { faq: typeof faqItems[0]; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className={styles.faqItem}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <div className={styles.faqQuestion} onClick={() => setIsOpen(!isOpen)}>
        <span className={styles.faqQuestionText}>{faq.question}</span>
        <ChevronDown className={`${styles.faqChevron} ${isOpen ? styles.faqChevronOpen : ""}`} />
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            className={styles.faqAnswer}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {faq.answer}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function BestPractices() {
  return (
    <section className={styles.bestPracticesSection}>
      <div className={styles.container}>
        <motion.div
          className={styles.sectionHeading}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className={styles.sectionTitle}>Best Practices</h2>
          <p className={styles.sectionDesc}>
            Tips to get the most out of CRMPro for your business.
          </p>
        </motion.div>
        <div className={styles.bestPracticesGrid}>
          {bestPractices.map((item, i) => (
            <motion.div
              key={i}
              className={styles.bestPracticeCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              whileHover={{ y: -4 }}
            >
              <div className={styles.bestPracticeIcon}>
                <item.icon size={20} />
              </div>
              <p className={styles.bestPracticeText}>{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ResourceLibrary() {
  return (
    <section className={styles.resourceSection}>
      <div className={styles.container}>
        <motion.div
          className={styles.sectionHeading}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className={styles.sectionTitle}>Resource Library</h2>
          <p className={styles.sectionDesc}>
            Everything you need to succeed with CRMPro.
          </p>
        </motion.div>
        <div className={styles.resourceGrid}>
          {resourceLibrary.map((resource, i) => (
            <motion.div
              key={i}
              className={styles.resourceCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              whileHover={{ y: -6 }}
            >
              <resource.icon className={styles.resourceIcon} />
              {resource.badge && <span className={styles.resourceBadge}>{resource.badge}</span>}
              <h3 className={styles.resourceCardTitle}>{resource.title}</h3>
              <p className={styles.resourceCardDesc}>{resource.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  const navigate = useNavigate();

  return (
    <section className={styles.ctaSection}>
      <div className={styles.container}>
        <motion.div
          className={styles.ctaCard}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2 className={styles.ctaTitle}>{finalCtaData.title}</h2>
          <p className={styles.ctaDesc}>{finalCtaData.subtitle}</p>
          <div className={styles.ctaActions}>
            <motion.button
              className={styles.btnPrimaryLarge}
              onClick={() => navigate("/signup")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {finalCtaData.primaryCta}
            </motion.button>
            <motion.button
              className={styles.btnOutlineLarge}
              onClick={() => navigate("/pricing")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {finalCtaData.secondaryCta}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  const navigate = useNavigate();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerBrand}>
        <Zap className="w-5 h-5 text-indigo-500 fill-indigo-500" />
        <span className="font-semibold text-slate-800 dark:text-slate-200">CRMPro &copy; 2026</span>
      </div>
      <div className={styles.footerLinks}>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate("/"); }}>Home</a>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate("/features"); }}>Features</a>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate("/pricing"); }}>Pricing</a>
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
      </div>
    </footer>
  );
}

export default function ResourcesPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={styles.pageWrapper}>
      <AnimatedBackground />
      <div className={styles.container}>
        <MarketingNavbar />
        <Hero />
      </div>
      <WhatIsCRMPro />
      <WhyCRMPro />
      <UsageGuide />
      <FeatureDocumentation />
      <FAQ />
      <BestPractices />
      <ResourceLibrary />
      <div className={styles.container}>
        <FinalCTA />
        <Footer />
      </div>
    </div>
  );
}
