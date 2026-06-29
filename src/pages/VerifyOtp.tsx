import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useSignIn } from "@clerk/clerk-react";
import { setPendingAuthTransition } from "@/routes/AuthGate";
import { motion } from "motion/react";
import { Mail, ArrowLeft, KeyRound, CheckCircle, BarChart3 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface OTPInputProps {
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  inputIndex: number;
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  isFilled: boolean;
  disabled: boolean;
}

function OTPInput({ value, onChange, onKeyDown, inputIndex, inputRefs, isFilled, disabled }: OTPInputProps) {
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
      disabled={disabled}
      className={`w-[48px] h-[48px] rounded-xl border-2 text-center text-[18px] font-bold text-gray-900 outline-none transition-all duration-150
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${isFilled
          ? "border-indigo-500 bg-indigo-50/50 shadow-[0_0_0_3px_rgba(79,70,229,0.15)]"
          : "border-gray-200 bg-white hover:border-gray-300 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)]"
        }`}
    />
  );
}

export function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, setActive, isLoaded } = useSignIn();

  const queryParams = new URLSearchParams(location.search);
  const email = (location.state?.email || queryParams.get("email") || "").trim();



  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(300); // 5 minutes expiration
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const verifyingRef = useRef(false);

  // Redirect back to signin if no email provided
  useEffect(() => {
    if (!email) {
      toast("error", "Access denied. Please start the login flow first.");
      navigate("/signin", { replace: true });
    }
  }, [email, navigate, toast]);

  // Expiration countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const handleVerify = useCallback(async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6 || !isLoaded || !signIn || !setActive || verifyingRef.current) return;

    verifyingRef.current = true;
    setLoadingText("Verifying OTP...");
    setError("");

    try {

      const result = await signIn.attemptFirstFactor({
        strategy: "email_code",
        code: otpCode,
      });

      if (result.status === "complete") {
        setPendingAuthTransition(true);
        await setActive({ session: result.createdSessionId });
        navigate("/", { replace: true });
        verifyingRef.current = false;
        toast("success", "Welcome back! Login successful.");
      } else {
        setError("Clerk session failed to complete.");
        verifyingRef.current = false;
      }
    } catch (err: any) {
      setPendingAuthTransition(false);
      console.error(err);
      const errMsg = err?.errors?.[0]?.longMessage || err?.message || "Invalid OTP or network error.";
      setError(errMsg);
      toast("error", errMsg);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      verifyingRef.current = false;
    } finally {
      setLoadingText("");
    }
  }, [otp, isLoaded, signIn, setActive, navigate, toast]);

  const handleResend = async () => {
    if (!signIn) return;
    setLoadingText("Resending OTP...");
    if (!email) return;
    try {
      const factor = signIn.supportedFirstFactors?.find((f: any) => f.strategy === "email_code" && f.safeIdentifier === email) as any;
      await signIn.prepareFirstFactor({ strategy: "email_code", emailAddressId: factor?.emailAddressId ?? "" });
      setCountdown(300);
      toast("success", "A new OTP has been sent to your email.");
      setOtp(["", "", "", "", "", ""]);
      verifyingRef.current = false;
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      const errMsg = err?.errors?.[0]?.longMessage || err?.message || "Failed to resend OTP.";
      setError(errMsg);
      toast("error", errMsg);
    } finally {
      setLoadingText("");
    }
  };

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
  }, [otp]);

  useEffect(() => {
    if (otp.every(Boolean)) {
      handleVerify();
    }
  }, [otp, handleVerify]);

  const isExpired = countdown <= 0;
  const isPending = !!loadingText;

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!email) return null;

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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
            className="bg-white/80 backdrop-blur-xl rounded-[28px] shadow-2xl shadow-indigo-500/8 border border-white/60 p-8 sm:p-10"
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center mb-5 border border-indigo-200/50">
                <KeyRound className="w-7 h-7 text-indigo-600" />
              </div>
              <h1 className="text-[26px] font-extrabold text-gray-900 tracking-tight">
                Enter Verification Code
              </h1>
              <p className="text-[14px] text-gray-500 mt-1.5 max-w-[280px]">
                Please enter the 6-digit code sent to your email.
              </p>
            </div>

            <div className="space-y-6">
              {/* Email display */}
              <div className="relative bg-gray-50 rounded-2xl border border-gray-200 h-14 flex items-center px-4">
                <div className="flex items-center gap-3 w-full">
                  <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-[15px] text-gray-700 font-medium truncate">{email}</span>
                  <div className="ml-auto w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </div>

              {/* OTP Digits */}
              <div>
                <div className="flex items-center justify-center gap-2">
                  {otp.map((digit, i) => (
                    <OTPInput
                      key={i}
                      value={digit}
                      inputIndex={i}
                      inputRefs={inputRefs}
                      isFilled={digit !== ""}
                      disabled={isPending || isExpired}
                      onChange={(value) => handleOtpChange(i, value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    />
                  ))}
                </div>
              </div>

              {/* Countdown / Expiration Timer */}
              <div className="text-center">
                {isExpired ? (
                  <p className="text-sm font-semibold text-red-500">OTP expired. Please request a new one.</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Code expires in: <span className="font-bold text-indigo-600">{formatTime(countdown)}</span>
                  </p>
                )}
              </div>

              {/* Error display */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 text-center">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={!otp.every(Boolean) || isPending || isExpired}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-[16px] shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loadingText ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{loadingText}</span>
                    </div>
                  ) : (
                    "Verify OTP"
                  )}
                </button>

                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isPending}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 transition-colors py-1.5"
                  >
                    Resend Code
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/signin")}
                    disabled={isPending}
                    className="text-sm font-semibold text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors flex items-center gap-1 py-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
