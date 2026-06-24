import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { Spinner } from "@/components/ui/Spinner";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, hasMemberships } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  const isOnOnboarding = location.pathname === "/onboarding";

  if (hasMemberships && isOnOnboarding) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!hasMemberships && !isOnOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
