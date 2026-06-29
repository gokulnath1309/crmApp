import React from "react";
import { motion } from "motion/react";
import styles from "../../pages/Features.module.css";

interface CategoryPillProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export function CategoryPill({ label, isActive, onClick }: CategoryPillProps) {
  return (
    <motion.button
      className={`${styles.pill} ${isActive ? styles.pillActive : ""}`}
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      layout
      aria-pressed={isActive}
    >
      {label}
    </motion.button>
  );
}
