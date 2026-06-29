import { 
  UserPlus, 
  ClipboardList, 
  FileText, 
  Award, 
  TrendingUp, 
  UserCheck 
} from "lucide-react";
import { motion } from "motion/react";
import styles from "../../pages/Features.module.css";

const STEPS = [
  {
    icon: UserPlus,
    title: "Lead Created",
    desc: "Inbound or Manual log"
  },
  {
    icon: UserCheck,
    title: "Assigned",
    desc: "Distributed to sales agent"
  },
  {
    icon: ClipboardList,
    title: "Task Created",
    desc: "Assigned outreach tasks"
  },
  {
    icon: FileText,
    title: "Activity Logged",
    desc: "Meetings, emails, calls logged"
  },
  {
    icon: Award,
    title: "Deal Won",
    desc: "Proposal accepted & closed"
  },
  {
    icon: TrendingUp,
    title: "Analytics Updated",
    desc: "Live charts & metrics sync"
  }
];

export function Workflow() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15
      }
    }
  } as const;

  const stepVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  } as const;

  const lineVariants = {
    hidden: { width: "0%" },
    visible: { 
      width: "100%", 
      transition: { duration: 1.5, ease: "easeInOut", delay: 0.2 } 
    }
  } as const;

  return (
    <section className={styles.workflowSection}>
      <div className={styles.workflowHeading}>
        <span className={styles.showcaseLabel}>Operational Workflow</span>
        <h2 className={styles.workflowTitle}>Connected From Start to Success</h2>
        <p className={styles.workflowDesc}>
          Watch how data flows seamlessly through CRM Pro, aligning your sales, operations, and leadership instantly.
        </p>
      </div>

      <div className="relative max-w-5xl mx-auto py-8">
        {/* Connection Line Behind Icons */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-100 dark:bg-slate-800 -translate-y-1/2 hidden md:block z-0">
          <motion.div 
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
            variants={lineVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          />
        </div>

        <motion.div 
          className={styles.workflowSteps}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div 
                key={idx} 
                className={styles.workflowStep}
                variants={stepVariants}
              >
                <div className={styles.workflowIconOuter}>
                  <Icon className={styles.workflowIcon} />
                </div>
                <h3 className={styles.workflowStepLabel}>{step.title}</h3>
                <p className={styles.workflowStepSub}>{step.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
