import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Eye, EyeOff, Lock, BarChart3, ShieldCheck,
  AlertTriangle, CheckCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type Step = "verifying" | "ready" | "success" | "expired" | "error";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const token = searchParams.get("token") || "";

  // Call the Convex query to validate the token (only query if token is not empty)
  const tokenValidation = useQuery(
    api.passwordReset.validateResetToken,
    token ? { token } : "skip"
  );
  const resetPasswordAction = useAction(api.passwordReset.resetPassword);

  const [step, setStep] = useState<Step>("verifying");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("[ResetPassword] Token from search params:", token ? "present" : "missing");
    if (!token) {
      console.warn("[ResetPassword] No token provided in URL search params.");
      setError("No reset token provided. Please request a new password reset link.");
      setStep("error");
      return;
    }

    if (tokenValidation === undefined) {
      setStep("verifying");
      return;
    }

    console.log("[ResetPassword] Token validation from backend query:", tokenValidation);

    if (tokenValidation.valid) {
      setStep("ready");
    } else {
      const reason = tokenValidation.reason;
      if (reason === "EXPIRED" || reason === "ALREADY_USED") {
        setStep("expired");
      } else {
        setStep("error");
      }
    }
  }, [tokenValidation, token]);

  const handleResetPassword = async () => {
    if (!token) {
      console.error("[ResetPassword] Submission blocked: token is empty.");
      setError("No reset token provided. Please request a new password reset link.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("[ResetPassword] Sending password reset request for token:", token);
      const result = await resetPasswordAction({
        token,
        password: newPassword,
      });
      console.log("[ResetPassword] Password reset action result:", result);

      if (result.success) {
        setStep("success");
        toast("success", "Password updated successfully.");
        setTimeout(() => navigate("/signin", { replace: true }), 2200);
      } else {
        console.warn("[ResetPassword] Password reset failed. Reason:", result.reason, "Message:", result.message);
        setError(result.message || "Password reset failed. Please try again.");
      }
    } catch (err: any) {
      console.error("[ResetPassword] Fatal error during password reset:", err);
      const msg = err?.message || "Password reset service is temporarily unavailable. Please try again later.";
      setError(msg);
      toast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const canSubmit = !!token && newPassword.length >= 8 && confirmPassword.length >= 8 && passwordsMatch && !loading;


  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f0f4ff_0%,#fafbff_50%,#f5f0ff_100%)] flex flex-col relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-indigo-400/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-32 w-[400px] h-[400px] bg-purple-400/8 rounded-full blur-[100px]" />
        <div className="absolute -bottom-20 right-1/3 w-[500px] h-[500px] bg-indigo-300/6 rounded-full blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center h-16 px-6 sm:px-8 border-b border-white/60 bg-white/50 backdrop-blur-xl flex-shrink-0">
        <Link to="/signin" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-200">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-extrabold text-gray-900 tracking-tight">CRM Pro</span>
        </Link>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">

            {/* ── Verifying token ── */}
            {step === "verifying" && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white/80 backdrop-blur-xl rounded-[28px] shadow-2xl border border-white/60 p-10 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center mx-auto mb-5">
                  <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying reset link…</h2>
                <p className="text-sm text-gray-500">Please wait while we verify your password reset link.</p>
              </motion.div>
            )}

            {/* ── Ready: new password form ── */}
            {step === "ready" && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
                className="bg-white/80 backdrop-blur-xl rounded-[28px] shadow-2xl shadow-indigo-500/8 border border-white/60 p-8 sm:p-10"
              >
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center mb-5 border border-indigo-200/50">
                    <ShieldCheck className="w-7 h-7 text-indigo-600" />
                  </div>
                  <h1 className="text-[26px] font-extrabold text-gray-900 tracking-tight">
                    Set new password
                  </h1>
                  <p className="text-[14px] text-gray-500 mt-1.5 max-w-[280px]">
                    Choose a strong password (min 8 chars, containing uppercase, lowercase, and numbers) for your CRM Pro account.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* New password */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      New password
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        autoFocus
                        onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                        placeholder="Enter new password (min 8 chars)"
                        className="w-full h-14 pl-12 pr-12 rounded-2xl border-2 border-gray-200 bg-white text-[15px] placeholder:text-gray-400 outline-none transition-all focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.12)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew((p) => !p)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Confirm password
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && canSubmit && handleResetPassword()}
                        placeholder="Repeat new password"
                        className={`w-full h-14 pl-12 pr-12 rounded-2xl border-2 bg-white text-[15px] placeholder:text-gray-400 outline-none transition-all ${
                          confirmPassword && !passwordsMatch
                            ? "border-red-400 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]"
                            : passwordsMatch
                            ? "border-emerald-400 focus:border-emerald-400 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]"
                            : "border-gray-200 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.12)]"
                        }`}
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
                    {confirmPassword && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-xs font-medium mt-1.5 ${passwordsMatch ? "text-emerald-600" : "text-red-500"}`}
                      >
                        {passwordsMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
                      </motion.p>
                    )}
                  </div>

                  {/* Error feedback */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3"
                    >
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {/* Submit */}
                  <button
                    onClick={handleResetPassword}
                    disabled={!canSubmit}
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-[17px] shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><ShieldCheck className="w-5 h-5" /> Reset Password</>
                    )}
                  </button>

                  <p className="text-center text-sm text-gray-400">
                    Remembered it?{" "}
                    <Link to="/signin" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
                      Sign in
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── Expired link ── */}
            {step === "expired" && (
              <motion.div
                key="expired"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white/80 backdrop-blur-xl rounded-[28px] shadow-2xl border border-white/60 p-10 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center mx-auto mb-5">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Link expired</h2>
                <p className="text-sm text-gray-500 mb-6 max-w-[280px] mx-auto">
                  This password reset link has expired. Request a new one.
                </p>
                <Link
                  to="/signin"
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-[15px] shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                >
                  Back to Sign In
                </Link>
              </motion.div>
            )}

            {/* ── Generic error (invalid token) ── */}
            {step === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white/80 backdrop-blur-xl rounded-[28px] shadow-2xl border border-white/60 p-10 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-100 flex items-center justify-center mx-auto mb-5">
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                <p className="text-sm text-gray-500 mb-6 max-w-[280px] mx-auto">
                  {error || "We couldn't verify your reset link. Please request a new one."}
                </p>
                <Link
                  to="/signin"
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-[15px] shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                >
                  Back to Sign In
                </Link>
              </motion.div>
            )}

            {/* ── Success ── */}
            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white/80 backdrop-blur-xl rounded-[28px] shadow-2xl shadow-emerald-500/8 border border-white/60 p-10 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 20, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-5"
                >
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </motion.div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Password updated!</h2>
                <p className="text-sm text-gray-500 mb-1">Your password has been updated successfully.</p>
                <p className="text-sm text-indigo-600 font-medium">Redirecting you to sign in…</p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
