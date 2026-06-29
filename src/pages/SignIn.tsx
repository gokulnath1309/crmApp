import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSignIn, useAuth, useClerk } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { setPendingAuthTransition } from "@/routes/AuthGate";
import {
  Shield, Mail, Star, BarChart3,
  Eye, EyeOff, Lock, ChevronRight
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";
import LoginWithOtpButton, { type AuthError } from "@/components/auth/LoginWithOtpButton";

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

  if (!error.message) return null;

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
          <p className="text-[13px] text-red-700/90 mt-1 leading-relaxed">
            {error.message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── AuthForm ──────────────────────────────────────────────────────────────────

function AuthForm() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn: clerkIsSignedIn } = useAuth();
  const clerk = useClerk();
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

  // Wait for Clerk session state to settle before rendering
  if (!isLoaded || clerkIsSignedIn === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Already signed in — never render the form or call signIn.create()
  if (clerkIsSignedIn) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">You are already signed in. Redirecting...</p>
        </div>
      </div>
    );
  }

  // ── Auth handlers ──

  const handleGoogleLogin = async () => {
    if (!signIn) return;
    // Let the early return guard in the render handle the redirect
    if (clerkIsSignedIn) return;
    setGoogleLoading(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/sso-callback`,
      });
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || "";
      if (msg.toLowerCase().includes("already signed in")) {
        try { await clerk.signOut(); } catch {}
        toast("success", "Existing session cleared. Try again.");
        setGoogleLoading(false);
        return;
      }
      toast("error", msg || "Google sign-in failed");
      setGoogleLoading(false);
    }
  };

  const handlePasswordSignIn = async () => {
    const startedAt = performance.now();
    const timeline: Record<string, unknown> = {};

    // ── Guard clauses ──────────────────────────────────────────────────────
    if (!signIn) { console.warn("[SignIn] ABORT: signIn not loaded"); return; }
    if (clerkIsSignedIn) { console.warn("[SignIn] ABORT: already signed in"); return; }

    setLoading(true);
    setError(null);

    console.group("===== AUTHENTICATION TIMELINE =====");
    console.log("[SignIn] Step 0 — User clicked Continue");

    // ── Step 1: Form validation ────────────────────────────────────────────
    const t1 = performance.now();
    console.log("[SignIn] Step 1 — Validating form (email:", email, ", pw length:", password.length, ")");
    timeline.formValidation = { email, passwordLength: password.length };

    if (!isValidEmail) {
      console.log("[SignIn] Step 1 FAILED — invalid email");
      setError({ type: 'generic', message: "Please enter a valid email address." });
      setLoading(false);
      console.groupEnd();
      return;
    }
    console.log("[SignIn] Step 1 OK — duration:", (performance.now() - t1).toFixed(1) + "ms");

    // ── Step 2: signIn.create() ────────────────────────────────────────────
    let result: Awaited<ReturnType<NonNullable<typeof signIn>['create']>>;
    const t2 = performance.now();
    console.log("[SignIn] Step 2 — Calling signIn.create({ identifier, password }) ...");
    try {
      result = await signIn.create({ identifier: email, password });
      console.log("[SignIn] Step 2 SUCCESS — duration:", (performance.now() - t2).toFixed(1) + "ms");
      console.log("  status:", result.status);
      console.log("  createdSessionId:", result.createdSessionId);
      if ('supportedFirstFactors' in result) console.log("  supportedFirstFactors:", result.supportedFirstFactors);
      timeline.signInCreate = { status: result.status, sessionId: result.createdSessionId };
    } catch (err: any) {
      console.group("❌ FAILURE — signIn.create() threw");
      console.error("  Full error:", err);
      console.error("  Status:", err?.status);
      console.error("  Message:", err?.message);
      console.error("  Errors:", JSON.stringify(err?.errors, null, 2));
      console.error("  Code:", err?.errors?.[0]?.code);
      console.error("  Short Message:", err?.errors?.[0]?.shortMessage);
      console.error("  Long Message:", err?.errors?.[0]?.longMessage);
      console.error("  Meta:", err?.meta);
      console.error("  Stack:", err?.stack);
      console.groupEnd();

      setPendingAuthTransition(false);
      const code = err?.errors?.[0]?.code;
      const msg = err?.errors?.[0]?.longMessage || err?.message || "";

      if (code === "session_exists" || msg.toLowerCase().includes("already signed in")) {
        try { await clerk.signOut(); } catch {}
        setError({ type: 'generic', message: "Existing session cleared. Please try signing in again." });
      } else if (code === "form_identifier_not_found") {
        setError({ type: 'not_found' });
      } else if (code === "form_password_incorrect") {
        setError({ type: 'generic', message: "The email or password you entered is incorrect." });
      } else if (err?.status === 401) {
        setError({ type: 'generic', message: "The email or password you entered is incorrect." });
      } else if (code === "verification_expired") {
        setError({ type: 'generic', message: "Your verification code has expired. Please request a new one." });
      } else if (code === "session_expired") {
        setError({ type: 'generic', message: "Your session has expired. Please sign in again." });
      } else {
        setError({ type: 'generic', message: msg || "Something unexpected happened while signing you in." });
      }
      setLoading(false);
      console.groupEnd();
      return;
    }

    // ── Step 2b: Check status ──────────────────────────────────────────────
    if (result.status !== "complete") {
      console.log("[SignIn] Step 2b — status !== complete (got:", result.status, ")");
      timeline.signInCreate = { ...timeline.signInCreate as object, parked: true };
      setError({ type: 'generic', message: "Additional verification required. Please try again." });
      setLoading(false);
      console.groupEnd();
      return;
    }
    console.log("[SignIn] Step 2b — status is 'complete', proceeding");

    // ── Step 3: Before setActive state snapshot ─────────────────────────────
    console.log("[SignIn] Step 3 — Pre-setActive Clerk SDK snapshot:");
    console.log("  clerk.session.id:", clerk.session?.id ?? "undefined");
    console.log("  clerk.user.id:", clerk.user?.id ?? "undefined");
    console.log("  clerk.client.activeSessionId:", clerk.client?.activeSessions?.[0]?.id ?? "undefined");
    console.log("  client sessions:", clerk.client?.sessions?.length ?? 0);
    console.log("  useAuth() isSignedIn (stale render capture):", clerkIsSignedIn);
    timeline.beforeSetActive = {
      sessionId: clerk.session?.id,
      userId: clerk.user?.id,
      activeSessionId: clerk.client?.activeSessions?.[0]?.id,
      clientSessionCount: clerk.client?.sessions?.length,
      reactIsSignedIn: clerkIsSignedIn,
    };

    // ── Step 4: setActive() ─────────────────────────────────────────────────
    setPendingAuthTransition(true);
    const t3 = performance.now();
    console.log("[SignIn] Step 4 — Calling setActive({ session:", result.createdSessionId, "}) ...");
    try {
      await setActive({ session: result.createdSessionId });
      console.log("[SignIn] Step 4 SUCCESS — duration:", (performance.now() - t3).toFixed(1) + "ms");
      timeline.setActive = { success: true, durationMs: performance.now() - t3 };
    } catch (err: any) {
      console.group("❌ FAILURE — setActive() threw");
      console.error("  Full error:", err);
      console.error("  Status:", err?.status);
      console.error("  Message:", err?.message);
      console.error("  Errors:", JSON.stringify(err?.errors, null, 2));
      console.error("  Stack:", err?.stack);
      console.groupEnd();

      setPendingAuthTransition(false);
      setError({ type: 'generic', message: "Failed to activate your session. Please try again." });
      setLoading(false);
      console.groupEnd();
      return;
    }

    // ── Step 5: Post-setActive state snapshot ──────────────────────────────
    console.log("[SignIn] Step 5 — Post-setActive Clerk SDK snapshot:");
    console.log("  clerk.session.id:", clerk.session?.id ?? "MISSING");
    console.log("  clerk.user.id:", clerk.user?.id ?? "MISSING");
    console.log("  clerk.client.activeSessionId:", clerk.client?.activeSessions?.[0]?.id ?? "MISSING");
    console.log("  clerk.client.lastActiveSessionId:", (clerk.client as any)?.lastActiveSessionId ?? "MISSING");
    console.log("  client sessions:", clerk.client?.sessions?.map(s => ({ id: s.id, status: s.status })));

    timeline.afterSetActive = {
      sessionId: clerk.session?.id,
      userId: clerk.user?.id,
      activeSessionId: clerk.client?.activeSessions?.[0]?.id,
      clientSessions: clerk.client?.sessions?.length,
    };

    // ── Step 6: State mismatch detection ───────────────────────────────────
    console.log("[SignIn] Step 6 — State mismatch detection:");
    const sdkSessionOk = !!clerk.session?.id;
    const sdkSessionMatches = clerk.session?.id === result.createdSessionId;
    const reactThinksSignedIn = clerkIsSignedIn; // stale render value — expected false
    console.log("  Clerk SDK has session.id:", sdkSessionOk);
    console.log("  SDK session matches createdSessionId:", sdkSessionMatches);
    console.log("  useAuth() isSignedIn (stale capture):", reactThinksSignedIn);

    if (sdkSessionOk && sdkSessionMatches && !reactThinksSignedIn) {
      console.warn("  → SDK session IS active but React has NOT re-rendered yet.");
      console.warn("    This is EXPECTED — React context updates asynchronously.");
      timeline.stateMismatch = {
        sdkSessionId: clerk.session?.id,
        expectedDuringTransition: true,
        note: "React context not yet updated — normal during setActive flow",
      };
    } else if (!sdkSessionOk) {
      console.error("  ⚠ CRITICAL: SDK session.id is MISSING after setActive()");
      timeline.stateMismatch = { critical: true, note: "No session in Clerk SDK" };
    }

    // ── Step 7: navigate() ─────────────────────────────────────────────────
    const t4 = performance.now();
    console.log("[SignIn] Step 7 — Calling navigate(\"/\", { replace: true }) ...");
    try {
      navigate("/", { replace: true });
      console.log("[SignIn] Step 7 OK — duration:", (performance.now() - t4).toFixed(1) + "ms");
      timeline.navigate = { target: "/", replace: true };
    } catch (err: any) {
      console.error("[SignIn] Step 7 FAILED — navigate threw:", err);
      setPendingAuthTransition(false);
      setError({ type: 'generic', message: "Navigation failed. Please try again." });
      setLoading(false);
      console.groupEnd();
      return;
    }

    // ── Done ───────────────────────────────────────────────────────────────
    const totalDuration = (performance.now() - startedAt).toFixed(1);
    console.log("[SignIn] ✅ Flow complete — total:", totalDuration + "ms");
    console.log("[SignIn] Timeline summary:", timeline);
    console.log("=========================================");
    console.groupEnd();

    toast("success", "Signed in successfully");
    // loading stays true until re-render; AuthGate will show spinner
  };

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
