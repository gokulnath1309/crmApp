import { useState } from 'react';
import { motion } from 'motion/react';
import { useToast } from '@/components/ui/Toast';
import { Check, Mail, Eye, EyeOff } from 'lucide-react';

interface ForgotPasswordFormProps {
  email: string;
  setEmail: (email: string) => void;
  onCancel: () => void;
  handleForgotPassword: (email: string) => Promise<void>;
  handleResetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
}

export default function ForgotPasswordForm({
  email,
  setEmail,
  onCancel,
  handleForgotPassword,
  handleResetPassword,
}: ForgotPasswordFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const sendResetCode = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await handleForgotPassword(email);
      setStep('reset');
    } catch (e: any) {
      toast('error', e?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!code || !newPassword) return;
    setLoading(true);
    try {
      await handleResetPassword(email, code, newPassword);
      toast('success', 'Password reset successful');
    } catch (e: any) {
      toast('error', e?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {step === 'email' && (
        <>
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
          <button
            onClick={sendResetCode}
            disabled={loading || !email}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-[17px] shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Send Reset Code <Check className="w-5 h-5 ml-2" /></>
            )}
          </button>
          <button type="button" onClick={onCancel} className="text-center text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
            Cancel
          </button>
        </>
      )}
      {step === 'reset' && (
        <>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Verification code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Enter code"
              className="w-full h-14 pl-4 pr-4 rounded-2xl border-2 border-gray-200 bg-white text-[15px] text-gray-900 placeholder:text-gray-400 outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">New password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full h-14 pl-4 pr-12 rounded-2xl border-2 border-gray-200 bg-white text-[15px] text-gray-900 placeholder:text-gray-400 outline-none"
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
            onClick={resetPassword}
            disabled={loading || !code || !newPassword}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-[17px] shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Reset Password <Check className="w-5 h-5 ml-2" /></>
            )}
          </button>
        </>
      )}
    </motion.div>
  );
}
