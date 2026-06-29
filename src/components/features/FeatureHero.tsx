import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import styles from "../../pages/Features.module.css";

export function FeatureHero() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
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
    <motion.section
      className={styles.heroSection}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 className={styles.heroTitle} variants={itemVariants}>
        Powerful Features for <br />
        <span className={styles.heroTitleHighlight}>Modern Businesses</span>
      </motion.h1>

      <motion.p className={styles.heroSubtitle} variants={itemVariants}>
        CRM Pro brings together everything you need to manage customer relationships,
        streamline sales pipelines, delegate tasks, and drive revenue growth in one 
        cohesive, secure, and lightning-fast platform designed for scaling teams.
      </motion.p>

      <motion.div className={styles.heroActions} variants={itemVariants}>
        <motion.button
          className={styles.btnPrimaryLarge}
          onClick={() => navigate("/signup")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Get Started
        </motion.button>
        <motion.button
          className={styles.btnOutlineLarge}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Book Demo
        </motion.button>
      </motion.div>
    </motion.section>
  );
}
