import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FEATURES, CATEGORIES } from "./featuresData";
import { CategoryPill } from "./CategoryPill";
import { FeatureCard } from "./FeatureCard";
import styles from "../../pages/Features.module.css";

export function FeatureGrid() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFeatures = useMemo(() => {
    return FEATURES.filter((feature) => {
      const matchesCategory =
        selectedCategory === "All" || feature.categories.includes(selectedCategory);
      
      const matchesSearch =
        feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.benefits.some((b) => b.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  return (
    <section className={styles.gridSection}>
      <div className={styles.filterContainer}>
        {/* Search Input */}
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search all features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search features"
          />
        </div>

        {/* Category Pills */}
        <div className={styles.pillsRow}>
          {CATEGORIES.map((category) => (
            <CategoryPill
              key={category}
              label={category}
              isActive={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
            />
          ))}
        </div>
      </div>

      {/* Grid */}
      <motion.div 
        className={styles.featureGrid}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        layout
      >
        <AnimatePresence mode="popLayout">
          {filteredFeatures.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredFeatures.length === 0 && (
        <motion.div 
          className="text-center py-12 text-slate-500 dark:text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          No features found matching "{searchQuery}" in category "{selectedCategory}"
        </motion.div>
      )}
    </section>
  );
}
