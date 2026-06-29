import React, { useEffect, useState, useRef } from "react";
import { motion, useInView } from "motion/react";
import styles from "../../pages/Features.module.css";

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  decimals?: boolean;
}

const STATS: StatItem[] = [
  { value: 10000, suffix: "+", label: "Customers Connected" },
  { value: 250000, suffix: "+", label: "Tasks Logged & Completed" },
  { value: 500, suffix: "+", label: "Businesses Served" },
  { value: 99.9, suffix: "%", label: "System Reliability", decimals: true }
];

function Counter({ item }: { item: StatItem }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;
    
    const duration = 1500; // 1.5 seconds
    const frameRate = 1000 / 60; // 60fps
    const totalFrames = Math.round(duration / frameRate);
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      // Ease out quad formula
      const easedProgress = progress * (2 - progress);
      const currentVal = easedProgress * item.value;

      if (frame >= totalFrames) {
        setCount(item.value);
        clearInterval(timer);
      } else {
        setCount(currentVal);
      }
    }, frameRate);

    return () => clearInterval(timer);
  }, [isInView, item.value]);

  const displayValue = item.decimals 
    ? count.toFixed(1) 
    : Math.floor(count).toLocaleString();

  return (
    <div ref={ref} className={styles.statCard}>
      <h3 className={styles.statNumber}>
        {displayValue}
        {item.suffix}
      </h3>
      <p className={styles.statLabel}>{item.label}</p>
    </div>
  );
}

export function Stats() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
  };

  return (
    <section className={styles.statsSection}>
      <div className={styles.container}>
        <motion.div 
          className={styles.statsGrid}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {STATS.map((item, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              <Counter item={item} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
