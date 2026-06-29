import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSignIn } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { setPendingAuthTransition } from "@/routes/AuthGate";
import { Mail, ArrowLeft, CheckCircle, Send, X, Lock, Eye, EyeOff, ShieldCheck, Check } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface ForgotPasswordModalProps {
  onClose: () => void;
}

interface OTPInputProps {
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  inputIndex: number;
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  isFilled: boolean;
}

function OTPInput({ value, onChange, onKeyDown, inputIndex, inputRefs, isFilled }: OTPInputProps) {
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
      className={`w-[48px] h-[48px] rounded-xl border-2 text-center text-[18px] font-bold text-gray-900 outline-none transition-all duration-150
        ${isFilled
          ? "border-indigo-500 bg-indigo-50/50 shadow-[0_0_0_3px_rgba(79,70,229,0.15)]"
          : "border-gray-200 bg-white hover:border-gray-300 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)]"
        }`}
    />
  );
}

export default function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const { toast } = useToast();
  const { signIn, setActive, isLoaded } = useSignIn();
  const navigate = useNavigate();

  const [step, setStep] = useState<"email" | "code" | "success">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendCode = async () => {
    if (!isLoaded || !signIn || !isValidEmail) return;
    setLoading(true);
    setError("");
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setStep("code");
      toast("success", "Password reset code sent to your email.");
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage || err?.message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = useCallback(async () => {
    if (!isLoaded || !signIn || !setActive) return;
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.join(""),
        password: newPassword,
      });

      if (result.status === "complete") {
        setStep("success");
        toast("success", "Password updated successfully.");
        setPendingAuthTransition(true);
        await setActive({ session: result.createdSessionId });
        navigate("/", { replace: true });
      } else {
        setError("Failed to complete password reset.");
      }
    } catch (err: any) {
      setPendingAuthTransition(false);
      setError(err?.errors?.[0]?.longMessage || err?.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [code, newPassword, confirmPassword, isLoaded, signIn, setActive, onClose, toast]);

  const handleOtpChange = useCallback((index: number, value: string) => {
    setCode((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleOtpKeyDown = useCallback((index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [code]);

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const canSubmitReset = code.every(Boolean) && newPassword.length >= 8 && confirmPassword.length >= 8 && passwordsMatch && !loading;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: [0.25, 0.4, 0.25, 1] }}
        className="relative w-full max-w-md bg-white rounded-[28px] shadow-2xl shadow-indigo-500/10 border border-gray-100 p-8 z-10"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <AnimatePresence mode="wait">
          {step === "email" && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col items-center text-center mb-7">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center mb-4 border border-indigo-200/50">
                  <Mail className="w-7 h-7 text-indigo-600" />
                </div>
                <h2 className="text-[22px] font-extrabold text-gray-900 tracking-tight">Reset your password</h2>
                <p className="text-[14px] text-gray-500 mt-1.5 max-w-[280px]">
                  Enter your email and we'll send a password reset code to your inbox.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Work email</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && isValidEmail && !loading && handleSendCode()}
                      placeholder="you@company.com"
                      autoFocus
                      className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-gray-200 bg-white text-[15px] placeholder:text-gray-400 outline-none transition-all focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.12)]"
                    />
                  </div>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-500 mt-2 leading-snug"
                    >
                      {error}
                    </motion.p>
                  )}
                </div>

                <button
                  onClick={handleSendCode}
                  disabled={!isValidEmail || loading}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-[16px] shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Send className="w-4 h-4" /> Send Reset Code</>
                  )}
                </button>

                <button
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors py-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </button>
              </div>
            </motion.div>
          )}

          {step === "code" && (
            <motion.div
              key="code"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
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
                <label className="text-sm font-semibold text-gray-700 mb-2.5 block text-center">Enter verification code</label>
                <div className="flex items-center justify-center gap-2">
                  {code.map((digit, i) => (
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

              {/* New Password */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">New password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                    placeholder="Min 8 characters"
                    className="w-full h-14 pl-12 pr-12 rounded-2xl border-2 border-gray-200 bg-white text-[15px] placeholder:text-gray-400 outline-none transition-all focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.12)]"
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

              {/* Confirm Password */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Confirm password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && canSubmitReset && handleVerifyAndReset()}
                    placeholder="Repeat password"
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
                  <p className={`text-xs font-medium mt-1.5 ${passwordsMatch ? "text-emerald-600" : "text-red-500"}`}>
                    {passwordsMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </p>
                )}
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-500 mt-2 leading-snug"
                >
                  {error}
                </motion.p>
              )}

              <button
                onClick={handleVerifyAndReset}
                disabled={!canSubmitReset}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-[16px] shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><ShieldCheck className="w-5 h-5" /> Reset Password</>
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

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center text-center py-2"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mb-5"
              >
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </motion.div>

              <h2 className="text-[22px] font-extrabold text-gray-900 tracking-tight mb-2">Password reset successful!</h2>
              <p className="text-[14px] text-gray-500 mb-1 max-w-[300px]">
                Your password has been successfully updated in Clerk.
              </p>
              <p className="text-[14px] font-semibold text-indigo-600 mt-2">Logging you in now...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
