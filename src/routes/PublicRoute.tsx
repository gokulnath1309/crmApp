import { useRef, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { useWorkspace } from "@/features/auth/WorkspaceProvider";
import { Spinner } from "@/components/ui/Spinner";

let _sessionEverAuthenticated = false;

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded: isLoading, isAuthenticated } = useAuth();
  const { isWorkspaceLoading: isMembershipsLoading, hasMemberships } = useWorkspace();

  const everAuth = useRef(_sessionEverAuthenticated);
  if (isAuthenticated) {
    _sessionEverAuthenticated = true;
    everAuth.current = true;
  }
  const [forceRedirect, setForceRedirect] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setForceRedirect(false);
      return;
    }
    if (everAuth.current && !isAuthenticated) {
      const timer = setTimeout(() => {
        setForceRedirect(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  if (isLoading || forceRedirect) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (everAuth.current) {
      return (
        <div className="flex h-screen items-center justify-center bg-background">
          <Spinner size="lg" />
        </div>
      );
    }
    return <>{children}</>;
  }

  if (isMembershipsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (hasMemberships) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/onboarding" replace />;
}
