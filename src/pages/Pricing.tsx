import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, X, Sparkles, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';

import { AnimatedBackground } from '../components/AnimatedBackground';
import { pricingPlans, comparisonData, pricingFaqs, pricingBottomCta, planOrder } from '../components/pricing/data';
import { useAuth } from '../features/auth/AuthProvider';
import { api } from '../../convex/_generated/api';

import styles from './Pricing.module.css';

const iconMap: Record<string, React.ReactNode> = {
  basic: <Sparkles className={styles.cardIcon} />,
  professional: <Sparkles className={styles.cardIcon} />,
  enterprise: <Sparkles className={styles.cardIcon} />,
};

function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className={styles.navbar}>
      <div className={styles.brand} onClick={() => navigate('/')}>
        <svg viewBox="0 0 24 24" className={styles.brandIcon}>
          <defs>
            <linearGradient id="lightning-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        <span>CRM<span className={styles.brandPro}>Pro</span></span>
      </div>
      <div className={styles.navLinks}>
        <a href="/features">Features</a>
        <a href="/resources">Resources</a>
        <a href="/pricing" className={styles.navLinkActive}>Pricing</a>
      </div>
      <div className={styles.navActions}>
        <a href="/signin" className={styles.loginLink}>Log in</a>
        <button className={styles.btnPrimarySmall} onClick={() => navigate('/signup')}>
          Start Free Trial
        </button>
      </div>
    </nav>
  );
}

function PlanCard({
  plan, index, annual, isAuthenticated, currentPlan, onSelectPlan,
}: {
  plan: typeof pricingPlans[number];
  index: number;
  annual: boolean;
  isAuthenticated: boolean;
  currentPlan: string | null;
  onSelectPlan: (planId: string) => void;
}) {
  const price = annual && plan.yearlyPrice > 0 ? plan.yearlyPrice : plan.monthlyPrice;
  const savings = plan.monthlyPrice > 0 ? Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100) : 0;
  const showYearlyPrice = annual && plan.monthlyPrice > 0;
  const isCurrent = isAuthenticated && currentPlan === plan.id;

  const planIdx = planOrder.indexOf(plan.id as typeof planOrder[number]);
  const currentIdx = planOrder.indexOf(currentPlan as typeof planOrder[number]);
  const isUpgrade = isAuthenticated && currentPlan && planIdx > currentIdx;
  const isDowngrade = isAuthenticated && currentPlan && planIdx < currentIdx;

  let buttonLabel = plan.cta;
  let buttonDisabled = false;
  if (isCurrent) {
    buttonLabel = 'Current Plan';
    buttonDisabled = true;
  } else if (isUpgrade) {
    buttonLabel = 'Upgrade';
  } else if (isDowngrade) {
    buttonLabel = 'Downgrade';
  } else if (!isAuthenticated && plan.id === 'basic') {
    buttonLabel = 'Get Started Free';
  } else if (!isAuthenticated && plan.id === 'professional') {
    buttonLabel = 'Get Started';
  } else if (!isAuthenticated && plan.id === 'enterprise') {
    buttonLabel = 'Contact Sales';
  }

  return (
    <motion.div
      className={`${styles.pricingCard} ${plan.featured ? styles.pricingCardFeatured : ''}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
    >
      {plan.badge && !isCurrent && (
        <div className={`${styles.cardBadge} ${plan.badgeVariant === 'popular' ? styles.badgePopular : styles.badgeEnterprise}`}>
          {plan.badge}
        </div>
      )}
      {isCurrent && (
        <div className={`${styles.cardBadge} ${styles.badgePopular}`}>
          Current Plan
        </div>
      )}
      <div style={{ paddingTop: plan.badge || isCurrent ? 28 : 0 }}>
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
          {plan.features.map((feat, i) => (
            <li key={i} className={styles.cardFeature}>
              <Check className={styles.cardFeatureCheck} />
              {feat}
            </li>
          ))}
        </ul>
        <button
          className={`${styles.cardCta} ${isCurrent ? styles.cardCtaOutline : plan.ctaVariant === 'primary' ? styles.cardCtaPrimary : styles.cardCtaOutline}`}
          disabled={buttonDisabled}
          onClick={() => onSelectPlan(plan.id)}
        >
          {buttonLabel}
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

function PricingHero() {
  return (
    <motion.div
      className={styles.heroSection}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h1 className={styles.heroTitle}>
        Simple,{' '}
        <span className={styles.heroTitleHighlight}>transparent</span>
        <br />
        pricing
      </h1>
      <p className={styles.heroSubtitle}>
        Start free, upgrade when you grow. No hidden fees, no surprise charges.
      </p>
    </motion.div>
  );
}

function PricingCards({ annual, isAuthenticated, currentPlan, onSelectPlan }: {
  annual: boolean;
  isAuthenticated: boolean;
  currentPlan: string | null;
  onSelectPlan: (planId: string) => void;
}) {
  return (
    <div className={styles.pricingGrid}>
      {pricingPlans.map((plan, i) => (
        <PlanCard key={plan.id} plan={plan} index={i} annual={annual} isAuthenticated={isAuthenticated} currentPlan={currentPlan} onSelectPlan={onSelectPlan} />
      ))}
    </div>
  );
}

function ComparisonTable() {
  const planIds = pricingPlans.map(p => p.id);
  return (
    <motion.div
      className={styles.comparisonSection}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className={styles.comparisonSectionTitle}>Compare plans in detail</h2>
      <p className={styles.comparisonSectionDesc}>
        Every plan includes a 14-day free trial. No credit card required.
      </p>
      <div className={styles.comparisonWrapper}>
        <table className={styles.comparisonTable}>
          <thead>
            <tr>
              <th>Feature</th>
              {pricingPlans.map(p => (
                <th key={p.id} className={styles.tdCenter}>{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonData.map((row, ri) => (
              <tr key={ri}>
                <td className={styles.comparisonFeature}>{row.feature}</td>
                {planIds.map(key => {
                  const val = row[key as keyof typeof row];
                  return (
                    <td key={key} className={styles.tdCenter}>
                      {val === true ? (
                        <Check className={styles.comparisonCheck} />
                      ) : val === false ? (
                        <X className={styles.comparisonCross} />
                      ) : (
                        <span className={styles.comparisonValue}>{String(val)}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function PricingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <motion.div
      className={styles.pricingFaqSection}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className={styles.pricingFaqTitle}>Pricing FAQ</h2>
      <div className={styles.pricingFaqGrid}>
        {pricingFaqs.map((item, i) => (
          <div
            key={i}
            className={styles.pricingFaqItem}
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <div className={styles.pricingFaqQuestion}>
              {item.question}
              {openIndex === i ? (
                <ChevronUp size={18} style={{ flexShrink: 0, color: 'var(--text-secondary)' }} />
              ) : (
                <ChevronDown size={18} style={{ flexShrink: 0, color: 'var(--text-secondary)' }} />
              )}
            </div>
            {openIndex === i && (
              <motion.div
                className={styles.pricingFaqAnswer}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {item.answer}
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function BottomCta({ isAuthenticated, onSelectPlan }: { isAuthenticated: boolean; onSelectPlan: (planId: string) => void }) {
  const navigate = useNavigate();

  return (
    <motion.div
      className={styles.bottomCta}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.bottomCtaCard}>
        <h2 className={styles.bottomCtaTitle}>{pricingBottomCta.title}</h2>
        <p className={styles.bottomCtaDesc}>{pricingBottomCta.subtitle}</p>
        <div className={styles.bottomCtaActions}>
          <button className={styles.btnPrimaryLarge} onClick={() => onSelectPlan('basic')}>
            {pricingBottomCta.primaryCta} <ArrowRight size={18} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 6 }} />
          </button>
          <button className={styles.btnOutlineLarge} onClick={() => isAuthenticated ? onSelectPlan('enterprise') : navigate('/contact')}>
            {pricingBottomCta.secondaryCta}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Footer() {
  return (
    <div className={styles.footer}>
      <div className={styles.footerBrand}>
        <svg viewBox="0 0 24 24" width="20" height="20" style={{ fill: 'url(#lightning-gradient)' }}>
          <defs>
            <linearGradient id="lightning-gradient-footer" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        <span>CRMPro</span>
      </div>
      <div className={styles.footerLinks}>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/contact">Contact</a>
      </div>
      <div>&copy; {new Date().getFullYear()} CRMPro. All rights reserved.</div>
    </div>
  );
}

export default function PricingPage() {
  const { isAuthenticated } = useAuth();
  const subscription = useQuery(api.subscriptions.getWorkspaceSubscription);
  const upgradePlan = useMutation(api.subscriptions.upgradePlan);
  const downgradePlan = useMutation(api.subscriptions.downgradePlan);
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);

  const currentPlan = isAuthenticated && subscription ? subscription.plan : null;

  const handleSelectPlan = async (planId: string) => {
    if (!isAuthenticated) {
      // New user: store selection and redirect to sign-up
      sessionStorage.setItem('selectedPlan', planId);
      sessionStorage.setItem('selectedBillingCycle', annual ? 'annual' : 'monthly');
      navigate('/signup');
      return;
    }

    // Authenticated user: upgrade or downgrade
    if (!currentPlan) return;

    const planIdx = planOrder.indexOf(planId as typeof planOrder[number]);
    const currentIdx = planOrder.indexOf(currentPlan as typeof planOrder[number]);

    try {
      if (planIdx > currentIdx) {
        await upgradePlan({ targetPlan: planId, billingCycle: annual ? 'annual' : 'monthly' });
      } else if (planIdx < currentIdx) {
        await downgradePlan({ targetPlan: planId });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update plan');
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <AnimatedBackground />
      <div className={styles.container}>
        <Navbar />
        <PricingHero />
        <BillingToggle annual={annual} setAnnual={setAnnual} />
        <PricingCards annual={annual} isAuthenticated={isAuthenticated} currentPlan={currentPlan} onSelectPlan={handleSelectPlan} />
        <ComparisonTable />
        <PricingFaq />
        <BottomCta isAuthenticated={isAuthenticated} onSelectPlan={handleSelectPlan} />
        <Footer />
      </div>
    </div>
  );
}
