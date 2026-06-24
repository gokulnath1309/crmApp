import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSignIn } from "@clerk/clerk-react";
import { useNavigate, Link } from "react-router-dom";
import {
  Zap, TrendingUp, Users, Brain, Shield, Mail, Star, BarChart3, ArrowUpRight, Menu,
  Eye, EyeOff, Lock, ChevronRight
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";
import LoginWithOtpButton, { type AuthError } from "@/components/auth/LoginWithOtpButton";

// ─── Static data ───────────────────────────────────────────────────────────────

const navLinks = [
  { label: "Features", href: "#" },
  { label: "Solutions", href: "#" },
  { label: "Pricing", href: "#" },
  { label: "Resources", href: "#" },
];

const features = [
  { icon: Zap, title: "AI Lead Scoring", description: "Prioritize leads with machine learning models trained on your closed deals." },
  { icon: TrendingUp, title: "Pipeline Tracking", description: "Visualize every stage of your sales pipeline with real-time updates." },
  { icon: Users, title: "Team Collaboration", description: "Share notes, assign tasks, and close deals together seamlessly." },
  { icon: Brain, title: "AI Insights", description: "Get smart recommendations on next actions and forecast accuracy." },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function FeatureCard({ icon: Icon, title, description, index }: { icon: typeof Zap; title: string; description: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 * index, ease: [0.25, 0.4, 0.25, 1] }}
      className="group bg-white rounded-[20px] border border-gray-200 p-5 cursor-default transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5"
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
        <Icon className="w-5 h-5 text-indigo-600" />
      </div>
      <h3 className="text-[17px] font-bold text-gray-900 mb-1.5">{title}</h3>
      <p className="text-[14px] text-gray-500 leading-relaxed">{description}</p>
    </motion.div>
  );
}

function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
      className="bg-white rounded-[28px] border border-indigo-50 shadow-[0_20px_60px_rgba(79,70,229,0.12)] p-6 w-full"
    >
      <div className="flex items-center gap-1.5 mb-5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <div className="flex-1 ml-2 h-2.5 bg-gray-100 rounded-md" />
      </div>
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          ["Total Leads", "1,284", "+12.5%", true],
          ["Revenue", "$485,200", "+8.3%", true],
          ["Contacts", "3,847", "+5.1%", true],
          ["Tasks Due", "24", "6 overdue", false],
        ].map(([label, value, change, isUp]) => (
          <div key={String(label)} className="bg-gray-50/80 rounded-2xl p-3.5 border border-gray-100">
            <div className="text-[11px] font-medium text-gray-400 mb-1">{label}</div>
            <div className="text-lg font-bold text-gray-900 tracking-tight">{value}</div>
            <div className={`flex items-center gap-0.5 text-[11px] font-semibold mt-0.5 ${isUp ? "text-emerald-600" : "text-red-500"}`}>
              <ArrowUpRight className={`w-3 h-3 ${!isUp ? "rotate-90" : ""}`} />
              {change}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue Pipeline</span>
          <span className="text-[11px] font-medium text-indigo-600">This Month</span>
        </div>
        <div className="flex items-end gap-1.5 h-[60px]">
          {[35, 52, 41, 68, 55, 82, 71, 88, 76, 94, 63, 78].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-[3px] transition-all duration-300 hover:opacity-80"
              style={{
                height: `${h}%`,
                background: i === 11
                  ? "linear-gradient(180deg, #4f46e5 0%, #6366f1 100%)"
                  : "linear-gradient(180deg, #c7d2fe 0%, #a5b4fc 100%)",
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function TrustPill() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
      className="inline-flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-lg shadow-gray-200/60 border border-gray-100"
    >
      <div className="flex -space-x-2.5">
        {["bg-indigo-400", "bg-violet-400", "bg-emerald-400", "bg-amber-400"].map((c, i) => (
          <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-white shadow-sm`} />
        ))}
        <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
          <span className="text-[9px] font-bold text-gray-500">+12K</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">Trusted by 12,000+ teams</p>
        <div className="flex items-center gap-1 mt-0.5">
          {Array(5).fill(0).map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
          ))}
          <span className="text-[11px] font-medium text-gray-400 ml-1">4.9/5</span>
        </div>
      </div>
    </motion.div>
  );
}

function NavBar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
      className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-100/50"
    >
      <div className="max-w-[1440px] mx-auto flex items-center justify-between h-16 px-8 lg:px-16">
        <div className="flex items-center gap-1.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-200">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-extrabold text-gray-900 tracking-tight ml-1">CRM Pro</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="text-[14px] font-medium text-gray-500 hover:text-gray-900 transition-colors">
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button className="hidden sm:inline-flex h-10 px-5 rounded-xl border-2 border-indigo-200 text-indigo-600 font-semibold text-[13px] transition-all duration-200 hover:bg-indigo-50 hover:border-indigo-300 hover:shadow-md">
            Request a Demo
          </button>
          <Menu className="w-5 h-5 text-gray-500 md:hidden" />
        </div>
      </div>
    </motion.nav>
  );
}

function ErrorAlert({ error, onTryAnother }: { error: AuthError, onTryAnother: () => void }) {
  if (!error) return null;

  if (error.type === 'not_found') {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0, marginTop: 0 }}
        animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
        className="bg-red-50/80 border border-red-200/60 rounded-xl p-4 overflow-hidden mb-4"
      >
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-red-900">Account Not Found</h4>
            <p className="text-[13px] text-red-700/90 mt-1 leading-relaxed">
              We couldn't find an account associated with this email address. Please check your email or create a new account.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={onTryAnother}
                className="text-[12px] font-semibold text-red-700 hover:text-red-800 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-md transition-colors"
              >
                Try Another Email
              </button>
              <Link
                to="/signup"
                className="text-[12px] font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-md transition-colors shadow-sm shadow-red-500/20"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, marginTop: 0 }}
      animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
      className="bg-red-50/80 border border-red-200/60 rounded-xl p-4 overflow-hidden mb-4"
    >
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-red-600" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-red-900">Something went wrong</h4>
          <p className="text-[13px] text-red-700/90 mt-1 leading-relaxed">
            {error.message || "We couldn't complete your request right now. Please try again in a few moments."}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── AuthForm ──────────────────────────────────────────────────────────────────

function AuthForm() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<AuthError>(null);

  // Forgot-password modal
  const [showForgotModal, setShowForgotModal] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmitPassword = isValidEmail && password.length > 0 && !loading;

  // ── Auth handlers ──

  const handleGoogleLogin = async () => {
    if (!signIn) return;
    setGoogleLoading(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/dashboard`,
      });
    } catch (err: any) {
      toast("error", err?.longMessage || err?.message || "Google sign-in failed");
      setGoogleLoading(false);
    }
  };

  const handlePasswordSignIn = async () => {
    if (!signIn) return;
    setLoading(true);
    setError(null);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === "complete") {
        if (setActive) {
          await setActive({ session: result.createdSessionId });
        }
        toast("success", "Signed in successfully");
        navigate("/dashboard", { replace: true });
      } else {
        setError({ type: 'generic', message: "Sign-in incomplete. Please try again." });
      }
    } catch (err: any) {
      console.error("[Auth Error]", err);
      const code = err?.errors?.[0]?.code;
      const msg = err?.errors?.[0]?.longMessage || err?.message || "";
      
      if (code === "form_identifier_not_found" || msg.toLowerCase().includes("no account found") || msg.toLowerCase().includes("couldn't find your account")) {
        setError({ type: 'not_found' });
      } else {
        setError({ type: 'generic', message: "We couldn't complete your request right now. Please try again in a few moments." });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showForgotModal && (
          <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
        className="w-full max-w-[400px] mx-auto"
      >
        <div className="w-full">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center mb-3 border border-indigo-200/50">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-[24px] font-extrabold text-gray-900 tracking-tight">Welcome back</h2>
            <p className="text-[14px] text-gray-500 mt-1">Sign in to your CRM Pro account</p>
          </div>

          <div className="space-y-3">
            {/* Email */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Work email</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Mail className="w-5 h-5" /></div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && canSubmitPassword && handlePasswordSignIn()}
                  placeholder="you@company.com"
                  className="w-full h-12 pl-11 pr-4 rounded-xl border-2 border-gray-200 bg-white text-[14px] placeholder:text-gray-400 outline-none transition-all focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.12)]"
                />
              </div>
              <ErrorAlert 
                error={error} 
                onTryAnother={() => { 
                  setEmail(""); 
                  setPassword(""); 
                  setError(null); 
                  document.querySelector<HTMLInputElement>('input[type="email"]')?.focus(); 
                }} 
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Lock className="w-5 h-5" /></div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && canSubmitPassword && handlePasswordSignIn()}
                  placeholder="Enter your password"
                  className="w-full h-12 pl-11 pr-11 rounded-xl border-2 border-gray-200 bg-white text-[14px] placeholder:text-gray-400 outline-none transition-all focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.12)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              onClick={handlePasswordSignIn}
              disabled={!canSubmitPassword}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-[15px] shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Continue <ChevronRight className="w-5 h-5" /></>}
            </button>

            {/* Forgot password link */}
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="w-full text-center text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">or continue with</span>
            </div>
          </div>

          {/* Google SSO */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full h-11 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-[13px] transition-all hover:shadow-lg hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </button>

          <LoginWithOtpButton email={email} onError={setError} />

          <p className="text-center text-[13px] text-gray-400 mt-4">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">Sign up</Link>
          </p>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <Lock className="w-3 h-3" />
              <span>Secured by Clerk</span>
            </div>
            <div className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Development mode</div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function SignInPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#eef4ff_0%,#e0e7ff_100%)] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Soft animated background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-[120px] mix-blend-multiply" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
        className="w-full max-w-[1000px] bg-white rounded-[32px] shadow-[0_40px_100px_-20px_rgba(79,70,229,0.25)] flex flex-col lg:flex-row overflow-hidden relative z-10 max-h-[calc(100vh-4rem)]"
      >
        {/* Left Side: Branding & Info */}
        <div className="hidden lg:flex lg:w-[45%] relative bg-indigo-600 flex-col justify-between p-12 text-white overflow-hidden">
          {/* Decorative background for left panel */}
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.1)_0%,transparent_100%)] pointer-events-none" />
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-16">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight">CRM Pro</span>
            </div>

            <h1 className="text-[40px] font-extrabold leading-[1.1] mb-6 tracking-tight">
              Customer<br/>Relationships,<br/>Simplified
            </h1>
            <p className="text-indigo-100 text-[17px] leading-relaxed max-w-[300px]">
              Streamline your pipeline, track every interaction, and close more deals with AI-powered CRM automation.
            </p>
          </div>

          <div className="relative z-10 mt-12 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex -space-x-3">
                {["bg-blue-400", "bg-purple-400", "bg-emerald-400"].map((c, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-indigo-600 shadow-sm`} />
                ))}
              </div>
              <div className="flex items-center gap-1">
                {Array(5).fill(0).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
            <p className="text-sm font-medium text-indigo-50">Trusted by over 12,000+ teams worldwide to close more deals.</p>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="w-full lg:w-[55%] bg-white flex items-center justify-center p-6 lg:p-8 overflow-y-auto">
          <div className="w-full max-w-[360px] mx-auto my-auto py-6">
            <AuthForm />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
