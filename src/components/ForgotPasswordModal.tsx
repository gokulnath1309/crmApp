import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Mail, ArrowLeft, CheckCircle, Send, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export default function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const { toast } = useToast();
  const requestPasswordReset = useAction(api.passwordReset.requestPasswordReset);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSend = async () => {
    if (!isValidEmail) return;
    setLoading(true);
    setError("");
    try {
      const result = await requestPasswordReset({ email });
      if (result.success) {
        setSent(true);
        toast("success", "Password reset link has been sent to your email.");
      } else {
        setError(result.message || "Failed to send reset link.");
      }
    } catch (err: any) {
      console.error("[ForgotPassword] Action invocation error:", err);
      setError("Password reset service is temporarily unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

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
          {/* Step 1: Email entry */}
          {!sent && (
            <motion.div
              key="form"
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
                  Enter your email and we'll send a password reset link to your inbox.
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
                      onKeyDown={(e) => e.key === "Enter" && isValidEmail && !loading && handleSend()}
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
                  onClick={handleSend}
                  disabled={!isValidEmail || loading}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-[16px] shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Send className="w-4 h-4" /> Send Reset Link</>
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

          {/* Step 2: Sent confirmation */}
          {sent && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
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

              <h2 className="text-[22px] font-extrabold text-gray-900 tracking-tight mb-2">Check your inbox</h2>
              <p className="text-[14px] text-gray-500 mb-1 max-w-[300px]">
                Password reset link has been sent to your email:
              </p>
              <p className="text-[14px] font-bold text-indigo-600 mb-5 break-all">{email}</p>
              <p className="text-[13px] text-gray-400 mb-6 max-w-[290px]">
                Click the link in the email to choose a new password. You can close this modal now.
              </p>

              <button
                onClick={onClose}
                className="w-full h-13 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-[16px] shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 mb-4"
              >
                Close Window
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
