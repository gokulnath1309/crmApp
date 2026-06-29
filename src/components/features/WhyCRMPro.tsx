import React from "react";
import { Check, X } from "lucide-react";
import { motion } from "motion/react";
import styles from "../../pages/Features.module.css";

const COMPARISONS = [
  {
    feature: "User Interface",
    traditional: "Clunky lists, generic styling, and cluttered settings.",
    pro: "Premium glassmorphic layouts, smooth micro-interactions, and Outfit typography."
  },
  {
    feature: "Data Sync",
    traditional: "Manual page refreshes, slow loading states, and outdated data.",
    pro: "Instant reactive database updates powered by Convex subscriptions."
  },
  {
    feature: "Workspace Structure",
    traditional: "Siloed databases requiring separate billing and logins.",
    pro: "Unified multi-workspace hub with invite tokens and instant switcher."
  },
  {
    feature: "Authentication",
    traditional: "Basic cookies, weak password rules, and security gaps.",
    pro: "Industry-standard Clerk Authentication, secure signup, and OTP resets."
  },
  {
    feature: "Access Control",
    traditional: "All-or-nothing visibility, exposing secure business records.",
    pro: "Granular Manager and Employee role-based action permission gates."
  },
  {
    feature: "Workflows",
    traditional: "Disconnected emails and spreadsheet copy-pasting.",
    pro: "Automated step-by-step lifecycles connecting leads to analytics."
  }
];

export function WhyCRMPro() {
  return (
    <section className={styles.whySection}>
      <div className={styles.whyHeading}>
        <span className={styles.showcaseLabel}>The Comparison</span>
        <h2 className={styles.workflowTitle}>Traditional CRM vs CRM Pro</h2>
        <p className={styles.showcaseHeadingDesc}>
          See how CRM Pro delivers a modern, high-performance upgrade over legacy platforms.
        </p>
      </div>

      <motion.div 
        className={styles.comparisonWrapper}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <table className={styles.comparisonTable}>
          <thead>
            <tr>
              <th>Feature Capability</th>
              <th>Traditional CRM</th>
              <th>CRM Pro</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISONS.map((row, idx) => (
              <tr key={idx}>
                <td className={styles.comparisonFeature}>{row.feature}</td>
                <td>
                  <span className={styles.badgeTraditional}>
                    <X className="w-3.5 h-3.5" />
                    Legacy
                  </span>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{row.traditional}</p>
                </td>
                <td>
                  <span className={styles.badgePro}>
                    <Check className="w-3.5 h-3.5" />
                    Modern
                  </span>
                  <p className="mt-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold">{row.pro}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </section>
  );
}
