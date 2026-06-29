import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import styles from "../../pages/Features.module.css";

export function CTA() {
  const navigate = useNavigate();

  return (
    <section className={styles.ctaSection}>
      <motion.div 
        className={styles.ctaCard}
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h2 className={styles.ctaTitle}>Ready to grow faster?</h2>
        <p className={styles.ctaDesc}>
          Empower your teams, delight your customers, and scale operations with the ultimate modern CRM platform.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <motion.button
            className={styles.btnPrimaryLarge}
            onClick={() => navigate("/signup")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Start Free
          </motion.button>
          <motion.button
            className={styles.btnOutlineLarge}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Contact Sales
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}
