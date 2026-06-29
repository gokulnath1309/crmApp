import { Link2, ShieldAlert, Cpu } from "lucide-react";
import { motion } from "motion/react";
import styles from "../../pages/Features.module.css";

const ADVANTAGES = [
  {
    icon: Link2,
    title: "Everything Connected",
    desc: "Bid farewell to data silos. Connect leads, tasks, contacts, and performance logs in one unified, real-time sync database powered by Convex reactive architecture."
  },
  {
    icon: ShieldAlert,
    title: "Role-Based Security",
    desc: "Enforce strict organizational boundaries. Secure invitations, pre-assigned team roles, and token validation lock down sensitive business accounts."
  },
  {
    icon: Cpu,
    title: "Built To Scale",
    desc: "Engineered for high performance. Multi-workspace databases, Clerk organization structures, and instant indexing support expansion without performance decay."
  }
];

export function Advantages() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15
      }
    }
  } as const;

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  } as const;

  return (
    <section className={styles.advantagesSection}>
      <div className={styles.advantagesHeading}>
        <span className={styles.showcaseLabel}>The Advantages</span>
        <h2 className={styles.workflowTitle}>Why Modern Businesses Choose CRM Pro</h2>
      </div>

      <motion.div 
        className={styles.advantagesGrid}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {ADVANTAGES.map((adv, idx) => {
          const Icon = adv.icon;
          return (
            <motion.div 
              key={idx} 
              className={styles.advantageCard}
              variants={cardVariants}
            >
              <Icon className={styles.advIcon} />
              <h3 className={styles.advTitle}>{adv.title}</h3>
              <p className={styles.advDesc}>{adv.desc}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
