import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "@/features/auth/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { BarChart2, Eye, EyeOff, CheckCircle, ArrowRight, Star, AlertCircle } from "lucide-react";

// ─── AUTH LEFT PANEL ILLUSTRATION ────────────────────────────────────────────
function MiniDashboard() {
  return (
    <div className="relative w-full max-w-[320px] mx-auto mt-8">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl">
        <div className="flex items-center gap-1.5 mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
          <div className="flex-1 ml-2 h-3.5 bg-white/10 rounded-md" />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            ["Total Leads", "1,284", "+12%", true],
            ["Active Deals", "$485K", "+8%", true],
            ["Contacts", "3,847", "+5%", true],
            ["Tasks Due", "24", "6 new", false]
          ].map(([l, v, c, up]) => (
            <div key={String(l)} className="bg-white/10 rounded-xl p-3 border border-white/10">
              <div className="text-white/50 text-[10px] mb-1">{l}</div>
              <div className="text-white font-bold text-sm">{v}</div>
              <div className={`text-[10px] font-medium ${up ? "text-emerald-400" : "text-orange-400"}`}>{c}</div>
            </div>
          ))}
        </div>
        <div className="bg-white/10 rounded-xl p-3 border border-white/10">
          <div className="text-white/50 text-[10px] mb-2">Revenue Pipeline</div>
          <div className="flex items-end gap-1 h-10">
            {[35, 52, 41, 68, 55, 82, 71, 88, 76, 94].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: i === 9 ? "rgba(165,180,252,0.9)" : "rgba(129,140,248,0.45)" }} />
            ))}
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          {["Sarah M. moved Acme Inc. → Negotiation", "James D. created TechCorp lead"].map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] text-white/60">
              <div className="w-4 h-4 rounded-full bg-indigo-400/50 flex-shrink-0" />
              {t}
            </div>
          ))}
        </div>
      </div>
      <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg tracking-wide">
        LIVE ●
      </div>
    </div>
  );
}

function AuthLeft({ headline, sub, features }: { headline: React.ReactNode; sub: string; features?: string[] }) {
  return (
    <div className="hidden lg:flex lg:w-[42%] bg-gradient-to-br from-indigo-950 via-indigo-800 to-violet-900 flex-col justify-between p-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-16 right-8 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <BarChart2 className="w-6 h-6 text-indigo-600" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>CRM Pro</span>
        </div>
        <h1 className="text-3xl font-bold text-white leading-snug mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{headline}</h1>
        <p className="text-indigo-200 text-sm leading-relaxed mb-8">{sub}</p>
        {features && (
          <div className="space-y-3">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-indigo-100 text-sm">{f}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="relative z-10"><MiniDashboard /></div>
      <div className="relative z-10 flex items-center gap-4 mt-8">
        <div className="flex -space-x-2">
          {["bg-blue-400", "bg-violet-400", "bg-emerald-400", "bg-orange-400"].map((c, i) => (
            <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-indigo-900`} />
          ))}
        </div>
        <div>
          <p className="text-white text-sm font-medium">Trusted by 12,000+ teams</p>
          <div className="flex items-center gap-1 mt-0.5">
            {Array(5).fill(0).map((_, i) => <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
            <span className="text-indigo-300 text-xs ml-1">4.9 / 5</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── GOOGLE ICON ──────────────────────────────────────────────────────────────
function GIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function passwordStrength(pw: string) {
  if (!pw) return { score: 0, label: "", color: "" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { score: 1, label: "Weak", color: "bg-red-500" },
    { score: 2, label: "Fair", color: "bg-orange-500" },
    { score: 3, label: "Good", color: "bg-yellow-500" },
    { score: 4, label: "Strong", color: "bg-emerald-500" },
    { score: 5, label: "Very Strong", color: "bg-emerald-600" },
  ];
  return map[Math.min(s, 5) - 1] ?? map[0];
}

export function SignUpPage() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = passwordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!agreed) {
      setError("Please accept the Terms of Service");
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name);
      toast("success", "Account created! Welcome to CRM Pro.");
      navigate("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const field = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 transition-all text-sm";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950">
      <AuthLeft
        headline={<>Start your <span className="text-indigo-300">14-day free</span> trial today</>}
        sub="Join 12,000+ sales teams who close more deals with CRM Pro. No credit card required."
        features={["Unlimited lead tracking & scoring", "Real-time pipeline analytics", "AI-powered deal insights", "Enterprise-grade security"]}
      />
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-[400px]">
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>CRM Pro</span>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-black/40 p-8 border border-slate-100 dark:border-slate-700/60">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Create your account</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-7">Get started in under 2 minutes</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Gokul Raj" required className={field} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required className={field} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required className={`${field} pr-10`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {Array(5).fill(0).map((_, i) => (
                        <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i < strength.score ? strength.color : "bg-slate-200 dark:bg-slate-600"}`} />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${strength.score <= 1 ? "text-red-500" : strength.score <= 2 ? "text-orange-500" : strength.score <= 3 ? "text-yellow-600" : "text-emerald-600"}`}>{strength.label} password</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat your password" required
                    className={`${field} pr-10 ${confirmPassword && confirmPassword !== password ? "border-red-400 dark:border-red-500 focus:ring-red-400/60" : ""}`}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Passwords do not match</p>}
                {confirmPassword && confirmPassword === password && <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Passwords match</p>}
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0" />
                <span className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  I agree to the <span className="text-indigo-600 dark:text-indigo-400 font-medium cursor-pointer hover:underline">Terms of Service</span> and <span className="text-indigo-600 dark:text-indigo-400 font-medium cursor-pointer hover:underline">Privacy Policy</span>
                </span>
              </label>

              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}

              <button disabled={loading || !agreed} type="submit" className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm shadow-md shadow-indigo-200 dark:shadow-indigo-900/30">
                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account…</> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700" /></div>
              <div className="relative flex justify-center"><span className="px-3 bg-white dark:bg-slate-800 text-slate-400 text-[11px] uppercase tracking-widest font-semibold">or</span></div>
            </div>
            <button className="w-full flex items-center justify-center gap-2.5 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 font-medium transition-all text-sm">
              <GIcon /> Continue with Google
            </button>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-5">
              Already have an account?{" "}
              <Link to="/signin" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Sign In</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
