import React, { useEffect, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { useUser } from "@/features/auth/UserProvider";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { getPermissions } from "@/lib/permissions";
import { ShieldAlert, ArrowLeft } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermission?: string;
}

export function RoleGuard({ children, allowedRoles, requiredPermission }: RoleGuardProps) {
  const { isAuthenticated } = useAuth();
  const { user, isUserLoading: isLoading } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();

  const everAuthenticated = useRef(false);
  if (isAuthenticated) {
    everAuthenticated.current = true;
  }

  const permissions = getPermissions(user);

  // Default to NOT allowed when user hasn't loaded yet.
  // The isLoading check below shows a spinner, but we must pre-set isAllowed
  // to false here so we never briefly render children for an unauthorized user.
  let isAllowed = !!user;

  if (user && allowedRoles) {
    isAllowed = isAllowed && allowedRoles.includes(user.role || "");
  }

  if (user && requiredPermission) {
    const key = requiredPermission as keyof typeof permissions;
    isAllowed = isAllowed && !!permissions[key];
  }

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAllowed) {
      toast("error", "Access Denied: You do not have permission to view this page.");
    }
  }, [isLoading, isAuthenticated, isAllowed, toast]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    if (everAuthenticated.current) {
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/signin" replace />;
  }

  // 403 Page on Access Denied
  if (!isAllowed) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 relative overflow-hidden bg-slate-950/40 rounded-3xl border border-slate-900">
        {/* Glow orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="z-10 text-center max-w-md p-6 space-y-5">
          <div className="inline-flex p-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 animate-bounce">
            <ShieldAlert className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">403</h1>
            <h2 className="text-xl font-bold text-slate-200">Access Denied</h2>
            <p className="text-sm text-slate-400">
              You do not have the required permissions to access this page. Please contact your company administrator.
            </p>
            {requiredPermission && (
              <span className="inline-block mt-2 text-xs font-mono bg-red-950/30 text-red-400 px-3 py-1.5 rounded-md border border-red-900/30">
                Required: {requiredPermission}
              </span>
            )}
          </div>
          <div className="pt-2">
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
