import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Zap, Star, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { pricingPlans, planLimits } from '../components/pricing/data';
import styles from './Pricing.module.css';

const iconMap: Record<string, React.ReactNode> = {
  basic: <Zap className={styles.cardIcon} />,
  professional: <Star className={styles.cardIcon} />,
  enterprise: <Building className={styles.cardIcon} />,
};

function PlanCard({
  plan,
  index,
  annual,
  onSelect,
}: {
  plan: typeof pricingPlans[number];
  index: number;
  annual: boolean;
  onSelect: (planId: string) => void;
}) {
  const price = annual && plan.yearlyPrice > 0 ? plan.yearlyPrice : plan.monthlyPrice;
  const savings = plan.monthlyPrice > 0 ? Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100) : 0;
  const showYearlyPrice = annual && plan.monthlyPrice > 0;
  const limits = planLimits[plan.id] ?? planLimits.basic;

  return (
    <motion.div
      className={`${styles.pricingCard} ${plan.featured ? styles.pricingCardFeatured : ''}`}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
    >
      {plan.badge && (
        <div className={`${styles.cardBadge} ${plan.badgeVariant === 'popular' ? styles.badgePopular : styles.badgeEnterprise}`}>
          {plan.badge}
        </div>
      )}
      <div style={{ paddingTop: plan.badge ? 28 : 0 }}>
        {iconMap[plan.id]}
        <h3 className={styles.planName}>{plan.name}</h3>
        <p className={styles.planDesc}>{plan.description}</p>
        {price > 0 ? (
          <>
            <div className={styles.priceRow}>
              <span className={styles.currency}>{plan.currency}</span>
              <span className={styles.price}>{price}</span>
              <span className={styles.pricePeriod}>/month</span>
            </div>
            {showYearlyPrice && (
              <div className={styles.yearlyPrice}>{plan.currency}{plan.yearlyPrice} billed annually</div>
            )}
            {showYearlyPrice && savings > 0 && (
              <div className={styles.yearlySavings}>Save {savings}%</div>
            )}
          </>
        ) : (
          <div className={styles.pricePlaceholder}>Let's talk</div>
        )}
        <ul className={styles.cardFeatures}>
          {plan.features.slice(0, 5).map((feat, i) => (
            <li key={i} className={styles.cardFeature}>
              <Check className={styles.cardFeatureCheck} />
              {feat}
            </li>
          ))}
        </ul>
        <div className={styles.cardFeature} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Up to {limits.maxUsers === 999999 ? 'unlimited' : limits.maxUsers} users
        </div>
        <button
          className={`${styles.cardCta} ${plan.ctaVariant === 'primary' ? styles.cardCtaPrimary : styles.cardCtaOutline}`}
          onClick={() => onSelect(plan.id)}
        >
          {plan.id === 'basic' ? 'Choose Basic' : plan.id === 'enterprise' ? 'Contact Sales' : 'Choose Professional'}
        </button>
      </div>
    </motion.div>
  );
}

function BillingToggle({ annual, setAnnual }: { annual: boolean; setAnnual: (v: boolean) => void }) {
  return (
    <div className={styles.toggleSection}>
      <span className={`${styles.toggleLabel} ${!annual ? styles.toggleLabelActive : ''}`}>
        Monthly
      </span>
      <div
        className={`${styles.toggleTrack} ${annual ? styles.toggleTrackActive : ''}`}
        onClick={() => setAnnual(!annual)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setAnnual(!annual); }}
      >
        <div className={`${styles.toggleThumb} ${annual ? styles.toggleThumbActive : ''}`} />
      </div>
      <span className={`${styles.toggleLabel} ${annual ? styles.toggleLabelActive : ''}`}>
        Annual
      </span>
      <span className={styles.saveBadge}>Save up to 20%</span>
    </div>
  );
}

export default function PlanSelection() {
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);

  const handleSelectPlan = (planId: string) => {
    sessionStorage.setItem('selectedPlan', planId);
    sessionStorage.setItem('selectedBillingCycle', annual ? 'annual' : 'monthly');
    navigate('/signup');
  };

  return (
    <div className={styles.pageWrapper}>
      <AnimatedBackground />
      <div className={styles.container}>
        <motion.div
          className={styles.heroSection}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className={styles.heroTitle}>
            Choose your <span className={styles.heroTitleHighlight}>plan</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Start free, upgrade when you grow. No hidden fees, no surprise charges.
          </p>
        </motion.div>

        <BillingToggle annual={annual} setAnnual={setAnnual} />

        <div className={styles.pricingGrid}>
          {pricingPlans.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} index={i} annual={annual} onSelect={handleSelectPlan} />
          ))}
        </div>

        <motion.div
          className={styles.bottomCta}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{ paddingBottom: 100 }}
        >
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
            Already have an account?{' '}
            <a
              href="/signin"
              onClick={(e) => { e.preventDefault(); navigate('/signin'); }}
              style={{ color: '#8B5CF6', fontWeight: 600, textDecoration: 'none' }}
            >
              Sign in
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
