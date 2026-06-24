import { useState } from "react";
import { useSignIn } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/Toast";
import { KeyRound } from "lucide-react";

export type AuthError = { type: 'not_found' | 'generic'; message?: string } | null;

interface LoginWithOtpButtonProps {
  email: string;
  onError: (err: AuthError) => void;
}

export default function LoginWithOtpButton({ email, onError }: LoginWithOtpButtonProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useSignIn();
  const [loading, setLoading] = useState(false);

  const handleContinueWithOtp = async () => {
    if (!signIn) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      onError({ type: 'generic', message: "Email is required." });
      return;
    }

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
    if (!isValidEmail) {
      onError({ type: 'generic', message: "Please enter a valid email address." });
      return;
    }

    setLoading(true);
    onError(null);

    try {
      await signIn.create({
        identifier: trimmedEmail,
        strategy: "email_code",
      });
      toast("success", "OTP sent successfully. Check your email.");
      navigate("/verify-otp", { state: { email: trimmedEmail } });
    } catch (err: any) {
      const code = err?.errors?.[0]?.code;
      const errMsg = err?.errors?.[0]?.longMessage || err?.message || "";
      if (code === "form_identifier_not_found" || errMsg.toLowerCase().includes("couldn't find your account") || errMsg.toLowerCase().includes("no account found")) {
        onError({ type: 'not_found' });
      } else {
        onError({ type: 'generic', message: "We couldn't complete your request right now. Please try again in a few moments." });
        console.error("[OTP Login Error]", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white/85 backdrop-blur-xl px-4 text-[12px] font-semibold text-gray-400 uppercase tracking-widest">
            or
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleContinueWithOtp}
        disabled={loading}
        className="w-full h-12 rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 text-indigo-700 font-bold text-[14px] transition-all hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
        ) : (
          <>
            <KeyRound className="w-4 h-4" />
            Continue with OTP
          </>
        )}
      </button>
    </>
  );
}
