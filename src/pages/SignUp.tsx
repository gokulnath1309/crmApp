import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSignUp } from "@clerk/clerk-react";
import { useNavigate, Link } from "react-router-dom";
import {
  Zap,
  TrendingUp,
  Users,
  Brain,
  Mail,
  Check,
  ChevronRight,
  Lock,
  Star,
  BarChart3,
  ArrowUpRight,
  UserPlus,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";

export type AuthError = { type: 'generic'; message?: string } | null;

function ErrorAlert({ error }: { error: AuthError }) {
  if (!error) return null;

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

const features = [
  { icon: Zap, title: "AI Lead Scoring", description: "Prioritize leads with machine learning models trained on your closed deals." },
  { icon: TrendingUp, title: "Pipeline Tracking", description: "Visualize every stage of your sales pipeline with real-time updates." },
  { icon: Users, title: "Team Collaboration", description: "Share notes, assign tasks, and close deals together seamlessly." },
  { icon: Brain, title: "AI Insights", description: "Get smart recommendations on next actions and forecast accuracy." },
];

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

function OTPInput({ value, onChange, onKeyDown, inputIndex, inputRefs, isFilled }: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  inputIndex: number;
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  isFilled: boolean;
}) {
  return (
    <input
      ref={(el) => { inputRefs.current[inputIndex] = el; }}
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={value}
      onChange={(e) => {
        const v = e.target.value.replace(/[^0-9]/g, "");
        onChange(v);
      }}
      onKeyDown={onKeyDown}
      className={`w-[48px] h-[48px] rounded-xl border-2 text-center text-[20px] font-bold text-gray-900 outline-none transition-all duration-150
        ${isFilled
          ? "border-indigo-500 bg-indigo-50/50 shadow-[0_0_0_3px_rgba(79,70,229,0.15)]"
          : "border-gray-200 bg-white hover:border-gray-300 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)]"
        }`}
    />
  );
}

function AuthForm() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<AuthError>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendCode = useCallback(async () => {
    if (!isLoaded || !signUp) return;
    if (!email || !password) return;
    if (password !== confirmPassword) {
      setError({ type: 'generic', message: "Passwords do not match." });
      return;
    }
    if (password.length < 8) {
      setError({ type: 'generic', message: "Password must be at least 8 characters." });
      return;
    }
    setEmailLoading(true);
    setError(null);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });
      setStep("otp");
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      console.error("[Sign Up Error]", err);
      // Log the full technical error but show a user-friendly generic error
      setError({ type: 'generic', message: "We couldn't complete your request right now. Please try again in a few moments." });
    } finally {
      setEmailLoading(false);
    }
  }, [email, password, confirmPassword, isLoaded, signUp]);

  const handleVerifyOtp = useCallback(async () => {
    const code = otp.join("");
    if (code.length !== 6 || !isLoaded || !signUp || !setActive) return;
    setLoading(true);
    setError(null);
    try {
      const verifyResult = await signUp.attemptEmailAddressVerification({ code });
      if (verifyResult.status === "complete") {
        await setActive({ session: verifyResult.createdSessionId });
        navigate("/dashboard", { replace: true });
      } else {
        setError({ type: 'generic', message: "Verification was not completed. Please try again." });
      }
    } catch (err: any) {
      console.error("[OTP Verification Error]", err);
      setError({ type: 'generic', message: "Invalid code. Please try again." });
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }, [otp, isLoaded, signUp, setActive, navigate]);

  const handleOtpChange = useCallback((index: number, value: string) => {
    setOtp((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleOtpKeyDown = useCallback((index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && otp.every(Boolean)) {
      handleVerifyOtp();
    }
  }, [otp, handleVerifyOtp]);

  useEffect(() => {
    if (step === "otp" && otp.every(Boolean)) {
      handleVerifyOtp();
    }
  }, [otp, step, handleVerifyOtp]);

  const handleGoogleSignUp = useCallback(async () => {
    if (!signUp || googleLoading) return;
    setGoogleLoading(true);
    setError(null);
    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err: any) {
      console.error("[Google Sign Up Error]", err);
      setError({ type: 'generic', message: "We couldn't complete your request right now. Please try again in a few moments." });
      setGoogleLoading(false);
    }
  }, [signUp, googleLoading]);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
      className="w-full max-w-[400px] mx-auto"
    >
      <div className="w-full">
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center mb-3 border border-indigo-200/50">
            <UserPlus className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-[24px] font-extrabold text-gray-900 tracking-tight">Create account</h2>
          <p className="text-[14px] text-gray-500 mt-1">Get started with your CRM Pro account</p>
        </div>

        <AnimatePresence mode="wait">
          {step === "email" ? (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 bg-white text-[14px] text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.12)]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Work email</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full h-12 pl-11 pr-4 rounded-xl border-2 border-gray-200 bg-white text-[14px] text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.12)]"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full h-12 pl-4 pr-11 rounded-xl border-2 border-gray-200 bg-white text-[14px] text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.12)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Confirm password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full h-14 pl-4 pr-12 rounded-2xl border-2 border-gray-200 bg-white text-[15px] text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.12)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((p) => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <ErrorAlert error={error} />

              <button
                onClick={handleSendCode}
                disabled={!isValidEmail || !password || !confirmPassword || emailLoading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-[15px] shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              >
                {emailLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Continue <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="relative bg-gray-50 rounded-xl border border-gray-200 h-12 flex items-center px-4">
                <div className="flex items-center gap-3 w-full">
                  <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-[14px] text-gray-700 font-medium truncate">{email}</span>
                  <div className="ml-auto w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block text-center">Enter verification code</label>
                <div className="flex items-center justify-center gap-2.5">
                  {otp.map((digit, i) => (
                    <OTPInput
                      key={i}
                      value={digit}
                      inputIndex={i}
                      inputRefs={inputRefs}
                      isFilled={digit !== ""}
                      onChange={(v) => handleOtpChange(i, v)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    />
                  ))}
                </div>
              </div>

              <ErrorAlert error={error} />

              <button
                onClick={handleVerifyOtp}
                disabled={!otp.every(Boolean) || loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-[15px] shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Create account <ChevronRight className="w-5 h-5" /></>
                )}
              </button>

              <button
                onClick={() => { setStep("email"); setError(null); }}
                className="w-full text-center text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Use another email
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignUp}
          disabled={googleLoading}
          className="w-full h-11 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-[13px] transition-all duration-200 hover:shadow-lg hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-3"
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

        <p className="text-center text-[13px] text-gray-500 mt-4">
          Already have an account?{" "}
          <Link to="/signin" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
            Sign in
          </Link>
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
  );
}

export function SignUpPage() {
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
              Start Your<br/>CRM Journey<br/>Today
            </h1>
            <p className="text-indigo-100 text-[17px] leading-relaxed max-w-[300px]">
              Join thousands of teams already using CRM Pro to manage leads, track deals, and grow revenue.
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
