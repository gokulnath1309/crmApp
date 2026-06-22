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
} from "lucide-react";

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
      className={`w-[56px] h-[56px] rounded-2xl border-2 text-center text-[22px] font-bold text-gray-900 outline-none transition-all duration-150
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
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendCode = useCallback(async () => {
    if (!isLoaded || !signUp) return;
    if (!email || !password) return;
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setEmailLoading(true);
    setError("");
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });
      setStep("otp");
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err?.longMessage || err?.message || "Something went wrong. Try again.");
    } finally {
      setEmailLoading(false);
    }
  }, [email, password, confirmPassword, isLoaded, signUp]);

  const handleVerifyOtp = useCallback(async () => {
    const code = otp.join("");
    if (code.length !== 6 || !isLoaded || !signUp || !setActive) return;
    setLoading(true);
    setError("");
    try {
      const verifyResult = await signUp.attemptEmailAddressVerification({ code });
      if (verifyResult.status === "complete") {
        await setActive({ session: verifyResult.createdSessionId });
        navigate("/dashboard", { replace: true });
      } else {
        setError("Verification was not completed. Please try again.");
      }
    } catch (err: any) {
      setError(err?.longMessage || err?.message || "Invalid code. Try again.");
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
    setError("");
    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err: any) {
      setError(err?.longMessage || err?.message || "Google sign-up failed. Try again.");
      setGoogleLoading(false);
    }
  }, [signUp, googleLoading]);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
      className="w-full max-w-[460px] mx-auto"
    >
      <div className="bg-white/85 backdrop-blur-xl rounded-[32px] shadow-2xl shadow-indigo-500/5 border border-white/50 p-12">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center mb-5 border border-indigo-200/50">
            <UserPlus className="w-7 h-7 text-indigo-600" />
          </div>
          <h2 className="text-[28px] font-extrabold text-gray-900 tracking-tight">Create account</h2>
          <p className="text-[15px] text-gray-500 mt-1.5">Get started with your CRM Pro account</p>
        </div>

        <AnimatePresence mode="wait">
          {step === "email" ? (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full h-14 px-4 rounded-2xl border-2 border-gray-200 bg-white text-[15px] text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.12)]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Work email</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-gray-200 bg-white text-[15px] text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.12)]"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full h-14 pl-4 pr-12 rounded-2xl border-2 border-gray-200 bg-white text-[15px] text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.12)]"
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
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Confirm password</label>
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

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 text-center">{error}</motion.p>
              )}

              <button
                onClick={handleSendCode}
                disabled={!isValidEmail || !password || !confirmPassword || emailLoading}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-[17px] shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg disabled:hover:translate-y-0 flex items-center justify-center gap-2"
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
              className="space-y-5"
            >
              <div className="relative bg-gray-50 rounded-2xl border border-gray-200 h-14 flex items-center px-4">
                <div className="flex items-center gap-3 w-full">
                  <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-[15px] text-gray-700 font-medium truncate">{email}</span>
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

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 text-center">{error}</motion.p>
              )}

              <button
                onClick={handleVerifyOtp}
                disabled={!otp.every(Boolean) || loading}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-[17px] shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Create account <ChevronRight className="w-5 h-5" /></>
                )}
              </button>

              <button
                onClick={() => { setStep("email"); setError(""); }}
                className="w-full text-center text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Use another email
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white/85 backdrop-blur-xl px-4 text-[12px] font-semibold text-gray-400 uppercase tracking-widest">or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignUp}
          disabled={googleLoading}
          className="w-full h-12 rounded-2xl border border-gray-200 bg-white text-gray-700 font-semibold text-[14px] transition-all duration-200 hover:shadow-lg hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-3"
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

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{" "}
          <Link to="/signin" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
            Sign in
          </Link>
        </p>

        <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Lock className="w-3.5 h-3.5" />
            <span>Secured by Clerk</span>
          </div>
          <div className="text-[11px] font-semibold bg-amber-50 text-amber-700 px-3 py-1 rounded-full">Development mode</div>
        </div>
      </div>
    </motion.div>
  );
}

export function SignUpPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8faff_100%)] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-indigo-400/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] bg-purple-400/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-300/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-blue-400/5 rounded-full blur-[80px]" />
      </div>

      <div className="flex min-h-screen">
        <div className="hidden lg:flex lg:w-[60%] xl:w-[60%] relative">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#eef4ff_0%,#f8fbff_100%)] rounded-r-[48px]" />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-300/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-40 right-20 w-96 h-96 bg-indigo-200/10 rounded-full blur-[100px]" />
          </div>

          <div className="relative flex flex-col w-full px-16 py-16" style={{ gap: "clamp(28px, 3vw, 40px)" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-200">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-extrabold text-gray-900 tracking-tight ml-1">CRM Pro</span>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
                className="font-['Inter'] text-[72px] font-extrabold leading-[1] tracking-[-0.03em] text-gray-900 max-w-[700px]"
              >
                Start Your<br />
                <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  CRM Journey
                </span>
                <br />
                Today
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
                className="text-[22px] text-gray-500 max-w-[650px] leading-[1.7] mt-5"
              >
                Join thousands of teams already using CRM Pro to manage leads, track deals, and grow revenue.
              </motion.p>

              <div className="grid grid-cols-2 gap-5 mt-10">
                {features.map((f, i) => (
                  <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} index={i} />
                ))}
              </div>
            </div>

            <div className="flex-shrink-0">
              <DashboardPreview />
            </div>

            <div className="flex-shrink-0 pb-4">
              <TrustPill />
            </div>
          </div>
        </div>

        <div className="flex-1 lg:w-[40%] xl:w-[40%] flex items-center justify-center relative px-6 lg:px-10 py-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(79,70,229,0.04),transparent_70%)] pointer-events-none" />
          <div className="w-full flex items-center justify-center">
            <AuthForm />
          </div>
        </div>
      </div>
    </div>
  );
}
