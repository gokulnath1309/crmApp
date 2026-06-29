import { Check } from "lucide-react";
import { motion } from "motion/react";
import type { FeatureItem } from "./featuresData";
import styles from "../../pages/Features.module.css";

interface FeatureCardProps {
  feature: FeatureItem;
}

export function FeatureCard({ feature }: FeatureCardProps) {
  const Icon = feature.icon;

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  } as const;

  return (
    <motion.div
      className={styles.featureCard}
      variants={cardVariants}
      whileHover={{ y: -6 }}
      layout
    >
      <div className={styles.cardIconContainer}>
        <Icon className="w-6 h-6" />
      </div>
      
      <h3 className={styles.cardTitle}>{feature.title}</h3>
      <p className={styles.cardDesc}>{feature.description}</p>
      
      <div className={styles.cardBenefitsTitle}>Key Benefits</div>
      <ul className={styles.cardBenefitsList}>
        {feature.benefits.map((benefit, idx) => (
          <li key={idx} className={styles.cardBenefitItem}>
            <Check className={styles.benefitCheck} />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
