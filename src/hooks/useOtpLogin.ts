import { useState, useCallback } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useOtpLogin() {
  const requestOtpForLoginMutation = useMutation(api.auth.requestOtpForLogin);
  const verifyOtpAndGenerateClerkTokenAction = useAction(api.auth.verifyOtpAndGenerateClerkToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestOtp = useCallback(async (email: string) => {
    setLoading(true);
    setError("");
    try {
      const result = await requestOtpForLoginMutation({ email });
      return result;
    } catch (err: any) {
      setError(err?.message || "Failed to request OTP.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [requestOtpForLoginMutation]);

  const verifyOtpAndGetToken = useCallback(async (email: string, otp: string) => {
    setLoading(true);
    setError("");
    try {
      const result = await verifyOtpAndGenerateClerkTokenAction({ email, otp });
      return result.token;
    } catch (err: any) {
      setError(err?.message || "Failed to verify OTP.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [verifyOtpAndGenerateClerkTokenAction]);

  return {
    requestOtp,
    verifyOtpAndGetToken,
    loading,
    error,
  };
}
