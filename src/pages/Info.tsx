import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { 
  Zap, 
  Check, 
  Mail, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  Code2, 
  Lightbulb, 
  ArrowRight, 
  Sparkles, 
  Cpu, 
  UserCheck, 
  Users2, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  BarChart3, 
  ShieldAlert, 
  Building, 
  CreditCard, 
  PlusCircle, 
  Layers, 
  Moon, 
  Bell, 
  Search, 
  Smartphone, 
  Play,
  X,
  Target
} from "lucide-react";

import { AnimatedBackground } from "../components/AnimatedBackground";
import { MarketingNavbar } from "../components/MarketingNavbar";
import styles from "./Info.module.css";

// Custom Inline SVG Brand Icons for GitHub and LinkedIn (since brand icons are not exported in this version of lucide-react)
const Github = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Linkedin = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

// Formatted tool badges with specific inline SVGs or representative icons
const AI_TOOLS = [
  { name: "OpenCode", icon: Code2, color: "#3B82F6" },
  { name: "Antigravity", icon: Cpu, color: "#8B5CF6" },
  { name: "ChatGPT", icon: Sparkles, color: "#10B981" },
  { name: "Claude", icon: Lightbulb, color: "#F97316" },
  { name: "Gemini", icon: Zap, color: "#6366F1" },
  { name: "GitHub Copilot", icon: Layers, color: "#000000" },
  { name: "Cursor", icon: Search, color: "#14B8A6" },
  { name: "Continue.dev", icon: Play, color: "#EC4899" }
];

export function InfoPage() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const },
    },
  };

  return (
    <div className={styles.pageWrapper}>
      <AnimatedBackground />

      <div className={styles.container}>
        <MarketingNavbar />

        {/* 1. HERO SECTION */}
        <section className={styles.section} style={{ paddingTop: "20px" }}>
          <motion.div 
            className={styles.heroGrid}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Left Column */}
            <motion.div className={styles.heroLeft} variants={itemVariants}>
              <span className={styles.heroTag}>About CRMPro</span>
              <h1 className={styles.heroTitle}>
                CRMPro – Built to Simplify <span className={styles.heroTitleGradient}>Relationships, Drive Growth</span>
              </h1>
              <p className={styles.heroSubtitle}>
                Built to simplify customer relationship management for businesses of every size.
              </p>
              <div className={styles.heroDescription}>
                <p>
                  CRMPro is a modern Customer Relationship Management platform built to help businesses organize leads, contacts, companies, deals, employees, teams, tasks, calendars, reports, and customer relationships from one centralized workspace.
                </p>
                <p>
                  It is designed to be intuitive for startups, flexible for growing businesses, and scalable for larger organizations.
                </p>
              </div>
              <div className={styles.heroActions}>
                <button className={styles.btnPrimary} onClick={() => navigate("/features")}>
                  Explore Features <ArrowRight className="w-4 h-4" />
                </button>
                <button className={styles.btnOutline} onClick={() => navigate("/resources")}>
                  View Resources
                </button>
              </div>
            </motion.div>

            {/* Right Column (Polished Mockup Dashboard) */}
            <motion.div className={styles.heroRight} variants={itemVariants}>
              <div className={styles.mockupContainer}>
                {/* Embedded Dashboard UI Mockup */}
                <div className={styles.dashboardWindow}>
                  {/* Sidebar */}
                  <div className={styles.sidebarMock}>
                    <div className={styles.sidebarHeader}>
                      <Zap className="w-3.5 h-3.5" />
                      <span>CRMPro</span>
                    </div>
                    <div className={`${styles.sidebarItem} ${styles.sidebarItemActive}`}>
                      <BarChart3 className="w-3 h-3" />
                      <span>Dashboard</span>
                    </div>
                    <div className={styles.sidebarItem}>
                      <Users2 className="w-3 h-3" />
                      <span>Leads</span>
                    </div>
                    <div className={styles.sidebarItem}>
                      <UserCheck className="w-3 h-3" />
                      <span>Contacts</span>
                    </div>
                    <div className={styles.sidebarItem}>
                      <Building className="w-3 h-3" />
                      <span>Companies</span>
                    </div>
                    <div className={styles.sidebarItem}>
                      <TrendingUp className="w-3 h-3" />
                      <span>Deals</span>
                    </div>
                    <div className={styles.sidebarItem}>
                      <CheckSquare className="w-3 h-3" />
                      <span>Tasks</span>
                    </div>
                    <div className={styles.sidebarItem}>
                      <CalendarIcon className="w-3 h-3" />
                      <span>Calendar</span>
                    </div>
                    <div className={styles.sidebarItem}>
                      <BarChart3 className="w-3 h-3" />
                      <span>Reports</span>
                    </div>
                    <div className={styles.sidebarItem}>
                      <Cpu className="w-3 h-3" />
                      <span>Settings</span>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className={styles.mainMock}>
                    {/* Header */}
                    <div className={styles.mockHeader}>
                      <div className={styles.searchBarMock}>Search anything...</div>
                      <div className={styles.headerActionsMock}>
                        <button className={styles.mockBtnCreate}>+ Create</button>
                        <Bell className="w-3.5 h-3.5 text-slate-400" />
                        <div className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold" style={{ fontSize: "8px" }}>G</div>
                      </div>
                    </div>

                    {/* Stats Widget */}
                    <div className={styles.statsMockGrid}>
                      <div className={styles.statCardMock}>
                        <div className={styles.statLabelMock}>Total Pipeline</div>
                        <div className={styles.statValMock}>₹12,45,000</div>
                        <div className={`${styles.statSubMock} ${styles.trendUp}`}>↑ 18.5%</div>
                      </div>
                      <div className={styles.statCardMock}>
                        <div className={styles.statLabelMock}>Won Revenue</div>
                        <div className={styles.statValMock}>₹4,25,000</div>
                        <div className={`${styles.statSubMock} ${styles.trendUp}`}>↑ 24.1%</div>
                      </div>
                      <div className={styles.statCardMock}>
                        <div className={styles.statLabelMock}>Open Deals</div>
                        <div className={styles.statValMock}>128</div>
                        <div className={`${styles.statSubMock} ${styles.trendUp}`}>↑ 12.4%</div>
                      </div>
                      <div className={styles.statCardMock}>
                        <div className={styles.statLabelMock}>Win Rate</div>
                        <div className={styles.statValMock}>68%</div>
                        <div className={`${styles.statSubMock} ${styles.trendUp}`}>↑ 8.7%</div>
                      </div>
                    </div>

                    {/* Pipelines */}
                    <div className={styles.pipelineBoardMock}>
                      <div className={styles.pipelineBoardHeader}>
                        <span>Deals Pipeline</span>
                        <span className="text-indigo-500 hover:underline cursor-pointer" style={{ fontSize: "8px" }}>View All</span>
                      </div>
                      <div className={styles.pipelineColumns}>
                        {/* Prospecting */}
                        <div className={styles.pipelineColMock}>
                          <div className={styles.colHeaderMock}>Prospecting (2)</div>
                          <div className={styles.dealCardMock}>
                            <div className={styles.dealTitleMock}>TechNova</div>
                            <div className={styles.dealAmtMock}>₹45,000</div>
                          </div>
                          <div className={styles.dealCardMock}>
                            <div className={styles.dealTitleMock}>Acme Corp</div>
                            <div className={styles.dealAmtMock}>₹64,000</div>
                          </div>
                        </div>
                        {/* Qualification */}
                        <div className={styles.pipelineColMock}>
                          <div className={styles.colHeaderMock}>Qualification (2)</div>
                          <div className={styles.dealCardMock}>
                            <div className={styles.dealTitleMock}>InnovateLab</div>
                            <div className={styles.dealAmtMock}>₹78,000</div>
                          </div>
                          <div className={styles.dealCardMock}>
                            <div className={styles.dealTitleMock}>BrightWave</div>
                            <div className={styles.dealAmtMock}>₹55,000</div>
                          </div>
                        </div>
                        {/* Proposal */}
                        <div className={styles.pipelineColMock}>
                          <div className={styles.colHeaderMock}>Proposal (2)</div>
                          <div className={styles.dealCardMock}>
                            <div className={styles.dealTitleMock}>CloudSync</div>
                            <div className={styles.dealAmtMock}>₹60,000</div>
                          </div>
                          <div className={styles.dealCardMock}>
                            <div className={styles.dealTitleMock}>NextGen</div>
                            <div className={styles.dealAmtMock}>₹50,000</div>
                          </div>
                        </div>
                        {/* Negotiation */}
                        <div className={styles.pipelineColMock}>
                          <div className={styles.colHeaderMock}>Negotiation (2)</div>
                          <div className={styles.dealCardMock}>
                            <div className={styles.dealTitleMock}>DataBridge</div>
                            <div className={styles.dealAmtMock}>₹45,000</div>
                          </div>
                          <div className={styles.dealCardMock}>
                            <div className={styles.dealTitleMock}>WebCraft</div>
                            <div className={styles.dealAmtMock}>₹35,000</div>
                          </div>
                        </div>
                        {/* Closed Won */}
                        <div className={styles.pipelineColMock}>
                          <div className={styles.colHeaderMock}>Won (2)</div>
                          <div className={styles.dealCardMock}>
                            <div className={styles.dealTitleMock}>QuantumLeap</div>
                            <div className={styles.dealAmtMock}>₹90,000</div>
                          </div>
                          <div className={styles.dealCardMock}>
                            <div className={styles.dealTitleMock}>Mindful</div>
                            <div className={styles.dealAmtMock}>₹70,000</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Widgets */}
                <div className={`${styles.floatingWidget} ${styles.widget1}`}>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200" style={{ fontSize: "10px" }}>Deal Closed</div>
                    <div className="text-slate-400" style={{ fontSize: "8px" }}>2 minutes ago</div>
                  </div>
                </div>

                <div className={`${styles.floatingWidget} ${styles.widget2}`}>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200" style={{ fontSize: "10px" }}>Pipeline Up</div>
                    <div className="text-emerald-500 font-semibold" style={{ fontSize: "8px" }}>+12% Today</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* 2. WHY CRMPRO EXISTS */}
        <section className={styles.section}>
          <div className={styles.whyContainer}>
            <motion.div 
              className={`${styles.glassCard} ${styles.whyCard}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className={styles.whyGrid}>
                {/* Left content */}
                <div className={styles.whyText}>
                  <h2 className={styles.whyTitle}>Why I Built CRMPro</h2>
                  <div className={styles.whyContent}>
                    <p>
                      During my professional experience in SEO and Digital Marketing, I worked with multiple CRM systems to manage leads, customer communication, sales pipelines, reporting, and business operations.
                    </p>
                    <p>
                      While these platforms offered useful functionality, many of them shared common problems:
                    </p>
                    <div className={styles.whyList}>
                      <div className={styles.whyListItem}>
                        <X className={styles.whyListIcon} /> Too expensive for startups
                      </div>
                      <div className={styles.whyListItem}>
                        <X className={styles.whyListIcon} /> Too complex for everyday users
                      </div>
                      <div className={styles.whyListItem}>
                        <X className={styles.whyListIcon} /> Filled with unnecessary bloat
                      </div>
                      <div className={styles.whyListItem}>
                        <X className={styles.whyListIcon} /> Difficult to customize
                      </div>
                      <div className={styles.whyListItem}>
                        <X className={styles.whyListIcon} /> Poor user experience
                      </div>
                      <div className={styles.whyListItem}>
                        <X className={styles.whyListIcon} /> Required hours to learn
                      </div>
                    </div>
                    <p>
                      I wanted to create a CRM that combines simplicity, flexibility, and modern design without sacrificing powerful business functionality.
                    </p>
                    <p>
                      CRMPro was built to help businesses spend less time managing software and more time building customer relationships.
                    </p>
                  </div>
                </div>

                {/* Right illustration */}
                <div className={styles.whyIllustration}>
                  <svg className="w-56 h-56 text-indigo-500" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" className="opacity-25" />
                    <circle cx="100" cy="100" r="60" stroke="url(#circleGrad)" strokeWidth="4" />
                    <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="2" className="opacity-50" />
                    <circle cx="100" cy="100" r="15" fill="url(#circleGrad)" />
                    
                    {/* Arrow hitting bullseye */}
                    <line x1="160" y1="40" x2="105" y2="95" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
                    <polygon points="102,98 102,88 112,98" fill="#3B82F6" />
                    <path d="M165,35 L175,25 M158,42 L168,32" stroke="#8B5CF6" strokeWidth="3" />

                    <defs>
                      <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#3B82F6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Decorative chart overlays */}
                  <div className="absolute top-4 right-4 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 shadow-lg flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-500" />
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Target Hit</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 3. MEET THE DEVELOPER */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Behind the Code</span>
            <h2 className={styles.sectionTitle}>Meet the Developer</h2>
            <p className={styles.sectionSubtitle}>
              The engineer behind CRMPro's design, architecture, and deployment.
            </p>
          </div>

          <motion.div 
            className={`${styles.glassCard} ${styles.devCard}`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.devGrid}>
              <div className={styles.devImageWrapper}>
                <div className={styles.devImageGlow} />
                <img 
                  src="/developer-avatar.jpg" 
                  alt="Gokulnath P" 
                  className={styles.devImage} 
                />
              </div>

              <div className={styles.devInfo}>
                <h3 className={styles.devName}>Gokulnath P</h3>
                <div className={styles.devTitle}>MERN Stack Developer</div>
                
                <div className={styles.devMeta}>
                  <div className={styles.devMetaItem}>
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    <span>India</span>
                  </div>
                  <div className={styles.devMetaItem}>
                    <Mail className="w-4 h-4 text-indigo-500" />
                    <span>gokulnath13092001@gmail.com</span>
                  </div>
                  <div className={styles.devMetaItem}>
                    <Briefcase className="w-4 h-4 text-indigo-500" />
                    <span>3+ Years Experience</span>
                  </div>
                </div>

                <div className={styles.devAbout}>
                  <p>
                    I am an aspiring MERN Stack Developer with a Master's degree in Computer Science and over three years of professional experience in SEO and Digital Marketing.
                  </p>
                  <p>
                    My experience in digital marketing gave me a deep understanding of how businesses generate leads, manage customer relationships, optimize sales funnels, and improve operational efficiency.
                  </p>
                  <p>
                    That practical business knowledge inspired me to transition into software development, where I could build tools that solve real business problems. CRMPro represents my journey from digital marketing to full-stack software engineering and showcases my passion for building practical, scalable, and user-friendly business applications.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 4. PROFESSIONAL HIGHLIGHTS */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Key Credentials</span>
            <h2 className={styles.sectionTitle}>Professional Highlights</h2>
            <p className={styles.sectionSubtitle}>
              Blending formal education, domain expertise, and engineering skills.
            </p>
          </div>

          <div className={styles.highlightsGrid}>
            {[
              { val: "Master's Degree", label: "Computer Science", icon: GraduationCap },
              { val: "3+ Years", label: "SEO & Digital Marketing", icon: Briefcase },
              { val: "MERN Stack", label: "Full Stack Development", icon: Code2 },
              { val: "Production Ready", label: "CRM Application Built", icon: Zap },
              { val: "Always Learning", label: "Improving Skillsets Daily", icon: Lightbulb },
              { val: "Business First", label: "Operational Problem Solver", icon: Target }
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div 
                  key={idx}
                  className={`${styles.glassCard} ${styles.highlightCard}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <div className={styles.highlightIconContainer}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className={styles.highlightVal}>{card.val}</div>
                  <div className={styles.highlightLabel}>{card.label}</div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* 5. MY JOURNEY TIMELINE */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>The Road Here</span>
            <h2 className={styles.sectionTitle}>My Journey Timeline</h2>
            <p className={styles.sectionSubtitle}>
              How a background in marketing paved the way for building high-end software.
            </p>
          </div>

          <div className={styles.timelineContainer}>
            <div className={styles.timelineLine} />

            {[
              { title: "Master's Degree", desc: "Graduated with a Master's degree in Computer Science, laying the theoretical foundation for software design and algorithm development." },
              { title: "SEO & Digital Marketing Career", desc: "Worked professionally for 3+ years optimizing sales funnels, generating leads, and streamlining campaigns." },
              { title: "Worked with Multiple CRM Platforms", desc: "Gained direct, daily experience using administrative interfaces on various industry CRMs." },
              { title: "Identified Common Business Challenges", desc: "Recognized the critical need for a streamlined, functional CRM tailored for growing companies without unnecessary overhead." },
              { title: "Started Learning MERN Stack Development", desc: "Dived deep into Web Development, learning JavaScript, Node.js, and modern single-page architectures." },
              { title: "Joined AccioJobs MERN + GenAI Program", desc: "Accelerated development skills through structured training in full-stack engineering, databases, and generative AI tool integration." },
              { title: "Designed CRMPro", desc: "Mapped database schemas, user roles, security rules, and wireframed a high-fidelity workspace." },
              { title: "Building Production-Ready Business Software", desc: "Refining, auditing, and scaling CRMPro with full email triggers, calendar integrations, and real-time dashboard analytics." }
            ].map((milestone, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <div 
                  key={idx} 
                  className={`${styles.timelineItem} ${isEven ? styles.timelineItemLeft : styles.timelineItemRight}`}
                >
                  <div className={styles.timelineNode} />
                  <div className={styles.timelineContentWrapper}>
                    <motion.div 
                      className={`${styles.glassCard} ${styles.timelineCard}`}
                      initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                    >
                      <h3 className={styles.timelineCardTitle}>{milestone.title}</h3>
                      <p className={styles.timelineCardDesc}>{milestone.desc}</p>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. TECHNOLOGIES USED */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>The Stack</span>
            <h2 className={styles.sectionTitle}>Technologies Used</h2>
            <p className={styles.sectionSubtitle}>
              A robust, modern full-stack architecture integrated with secure authentication and enterprise-grade tooling.
            </p>
          </div>

          <div className={styles.techCategoryGrid}>
            {[
              { name: "Frontend", icon: Code2, items: ["React", "TypeScript", "Tailwind CSS", "Vite", "React Router"] },
              { name: "Backend", icon: Cpu, items: ["Node.js", "Express.js", "REST APIs", "Convex Functions"] },
              { name: "Database", icon: Building, items: ["Convex Database", "Real-time Queries"] },
              { name: "Authentication", icon: ShieldAlert, items: ["Clerk", "JWT Tokens"] },
              { name: "Validation", icon: UserCheck, items: ["Zod", "Schema Guard"] },
              { name: "Charts", icon: BarChart3, items: ["Chart.js", "Recharts"] },
              { name: "Deployment", icon: Layers, items: ["Vercel", "Convex Cloud"] },
              { name: "Developer Tools", icon: Zap, items: ["Git", "GitHub", "VS Code", "Postman", "npm"] }
            ].map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <motion.div 
                  key={idx}
                  className={`${styles.glassCard} ${styles.techCard}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                >
                  <div className={styles.techCardHeader}>
                    <Icon className={`w-4 h-4 ${styles.techCardIcon}`} />
                    <span>{cat.name}</span>
                  </div>
                  <div className={styles.techBadges}>
                    {cat.items.map((tech, tIdx) => (
                      <span key={tIdx} className={styles.techBadge}>{tech}</span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* 7. AI ASSISTED DEVELOPMENT */}
        <section className={styles.section}>
          <div className={styles.aiContainer}>
            <motion.div 
              className={`${styles.glassCard} ${styles.aiCard}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className={styles.aiGrid}>
                {/* Left Side */}
                <div className={styles.aiLeft}>
                  <h2 className={styles.whyTitle}>AI-Assisted Development</h2>
                  <div className={styles.aiContent}>
                    <p>
                      CRMPro was developed using modern AI-assisted software engineering practices to improve productivity, accelerate development, debug complex issues, and rapidly prototype features.
                    </p>
                    <p>
                      During development, I used several AI-powered developer tools to streamline coding workflows, improve code quality, and speed up implementation.
                    </p>
                    <p>
                      However, the application's architecture, product vision, business workflows, feature planning, UI/UX decisions, database design, and overall implementation were designed, reviewed, customized, and integrated by me.
                    </p>
                    <div className={styles.aiNote}>
                      <strong>Note:</strong> AI tools accelerated development, but CRMPro's business logic, workflows, architecture, and user experience are the result of my own design and engineering decisions.
                    </div>
                  </div>
                </div>

                {/* Right Side */}
                <div className={styles.aiRight}>
                  <div className={styles.aiBadgesGrid}>
                    {AI_TOOLS.map((tool, idx) => {
                      const Icon = tool.icon;
                      return (
                        <div key={idx} className={styles.aiBadge}>
                          <Icon className="w-6 h-6" style={{ color: tool.color }} />
                          <span>{tool.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 8. CORE CRM FEATURES */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>System Scope</span>
            <h2 className={styles.sectionTitle}>Core CRM Features</h2>
            <p className={styles.sectionSubtitle}>
              An extensive breakdown of active components configured for CRM operations.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {[
              { name: "Lead Management", icon: Users2 },
              { name: "Contact Management", icon: UserCheck },
              { name: "Company Management", icon: Building },
              { name: "Deal Pipeline", icon: TrendingUp },
              { name: "Employee Management", icon: Briefcase },
              { name: "Team Management", icon: Users2 },
              { name: "Task Management", icon: CheckSquare },
              { name: "Calendar", icon: CalendarIcon },
              { name: "Sales Pipeline", icon: TrendingUp },
              { name: "Reports & Analytics", icon: BarChart3 },
              { name: "Role-Based Access", icon: ShieldAlert },
              { name: "Workspace Management", icon: Layers },
              { name: "Subscription Management", icon: CreditCard },
              { name: "Custom CRM Fields", icon: PlusCircle },
              { name: "Responsive Design", icon: Smartphone },
              { name: "Dark Mode", icon: Moon },
              { name: "Notification Center", icon: Bell },
              { name: "Advanced Search", icon: Search }
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <motion.div 
                  key={idx}
                  className={`${styles.glassCard} ${styles.featureItemCard}`}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                >
                  <div className={styles.featureIconBox}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={styles.featureItemText}>{feat.name}</span>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* 9. FUTURE ROADMAP */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>What's Next</span>
            <h2 className={styles.sectionTitle}>Future Roadmap</h2>
            <p className={styles.sectionSubtitle}>
              Our vision for upcoming features, intelligence layers, and integrations.
            </p>
          </div>

          <div className={styles.roadmapGrid}>
            {/* Short Term */}
            <motion.div 
              className={`${styles.glassCard} ${styles.roadmapCard}`}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className={styles.roadmapCardTitle}>
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <span>Immediate Horizon (Q3 - Q4)</span>
              </h3>
              <div className={styles.roadmapList}>
                {[
                  "AI Sales Assistant – Contextual analysis of leads.",
                  "Workflow Automation – Auto-trigger tasks on deal shifts.",
                  "Email Integration – Directly sync customer conversations.",
                  "WhatsApp Integration – Send alerts and deal statuses.",
                  "Advanced Reports – Customizable filter outputs.",
                  "Custom Dashboards – Drag-and-drop metrics widgets.",
                  "Third-party Integrations – Slack, Figma, and Google Workspace."
                ].map((item, idx) => (
                  <div key={idx} className={styles.roadmapListItem}>
                    <Check className={`${styles.roadmapListCheck} w-4 h-4 text-emerald-500 mt-1 flex-shrink-0`} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Long Term */}
            <motion.div 
              className={`${styles.glassCard} ${styles.roadmapCard}`}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className={styles.roadmapCardTitle}>
                <Cpu className="w-5 h-5 text-indigo-500" />
                <span>Next Generation Vision</span>
              </h3>
              <div className={styles.roadmapList}>
                {[
                  "API Access – Developer endpoints for secure CRUD actions.",
                  "Mobile App – Dedicated iOS and Android interfaces.",
                  "Predictive Analytics – Machine-learning pipeline forecasts.",
                  "Smart Recommendations – Suggestions on contact outreach.",
                  "Voice Notes – Audio logs transcribed into CRM activity streams.",
                  "Document Management – Contracts, templates, and storage.",
                  "Customer Portal – Interactive external collaboration dashboards."
                ].map((item, idx) => (
                  <div key={idx} className={styles.roadmapListItem}>
                    <Zap className="w-4 h-4 text-indigo-500 mt-1 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* 10. VISION */}
        <section className={styles.section}>
          <motion.div 
            className={`${styles.glassCard} ${styles.visionCard}`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className={styles.whyTitle}>My Vision</h2>
            <div className={styles.visionContent}>
              <p>
                CRMPro is more than just another CRM. My goal is to create software that helps businesses simplify operations, strengthen customer relationships, and improve team productivity.
              </p>
              <p style={{ marginTop: "16px" }}>
                As CRMPro evolves, I plan to introduce intelligent automation, AI-powered insights, customizable workflows, enterprise-grade collaboration, and advanced analytics while keeping the product simple, intuitive, and accessible for businesses of every size.
              </p>
            </div>
          </motion.div>
        </section>

        {/* 11. CONTACT SECTION */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Communication</span>
            <h2 className={styles.sectionTitle}>Let's Connect</h2>
            <p className={styles.sectionSubtitle}>
              Have questions, collaboration ideas, or custom feature requests? Reach out!
            </p>
          </div>

          <div className={styles.contactGrid}>
            <a 
              href="https://github.com/gokulnath1309" 
              target="_blank" 
              rel="noreferrer" 
              className={`${styles.glassCard} ${styles.contactCard}`}
            >
              <Github className={styles.contactIcon} />
              <div className={styles.contactLabel}>GitHub</div>
              <div className={styles.contactVal}>gokulnath1309</div>
            </a>

            <a 
              href="https://www.linkedin.com/in/gokulnath-p-683a38245/" 
              target="_blank" 
              rel="noreferrer" 
              className={`${styles.glassCard} ${styles.contactCard}`}
            >
              <Linkedin className={styles.contactIcon} />
              <div className={styles.contactLabel}>LinkedIn</div>
              <div className={styles.contactVal}>Gokulnath P</div>
            </a>

            <a 
              href="mailto:gokulnath13092001@gmail.com" 
              className={`${styles.glassCard} ${styles.contactCard}`}
            >
              <Mail className={styles.contactIcon} />
              <div className={styles.contactLabel}>Email</div>
              <div className={styles.contactVal}>gokulnath13092001@gmail.com</div>
            </a>

            <div className={`${styles.glassCard} ${styles.contactCard}`}>
              <MapPin className={styles.contactIcon} style={{ color: "#3B82F6" }} />
              <div className={styles.contactLabel}>Location</div>
              <div className={styles.contactVal}>India</div>
            </div>
          </div>
        </section>

        {/* 12. FOOTER QUOTE */}
        <section className={styles.quoteContainer}>
          <div className={styles.quoteBlock}>
            "Great software isn't built by adding more features. It's built by solving the right problems."
          </div>
          <div className={styles.quoteAuthor}>— Gokulnath P</div>
        </section>

        {/* FOOTER */}
        <footer className={styles.footer}>
          <div className={styles.footerBrand}>
            <Zap className="w-5 h-5 text-indigo-500 fill-indigo-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">CRMPro &copy; 2026</span>
          </div>
          <div className={styles.footerLinks}>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate("/"); }}>Home</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate("/features"); }}>Features</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate("/pricing"); }}>Pricing</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate("/info"); }}>Info</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default InfoPage;
