import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { useUser } from "@/features/auth/UserProvider";
import { useWorkspace } from "@/features/auth/WorkspaceProvider";
import { Spinner } from "@/components/ui/Spinner";

function FullScreenSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Spinner size="lg" />
    </div>
  );
}

function isPublicPath(path: string) {
  return (
    path === "/" ||
    path === "/signin" ||
    path === "/signup" ||
    path === "/verify-otp" ||
    path === "/reset-password" ||
    path.startsWith("/invite/") ||
    path.startsWith("/sso-callback")
  );
}

function isOnboardingPath(path: string) {
  return (
    path === "/onboarding" ||
    path === "/create-workspace" ||
    path.startsWith("/invite/")
  );
}

export function AuthGate() {
  const { isLoaded, isAuthenticated } = useAuth();
  const { isUserLoading } = useUser();
  const { isWorkspaceLoading, hasMemberships } = useWorkspace();
  const location = useLocation();
  const path = location.pathname;

  // ── Phase 1: Wait for Clerk + Convex auth to resolve ──────────────────
  if (!isLoaded) {
    return <FullScreenSpinner />;
  }

  // ── Phase 2: Not authenticated — only public routes allowed ────────────
  if (!isAuthenticated) {
    if (isPublicPath(path)) {
      return <Outlet />;
    }
    return <Navigate to="/signin" replace />;
  }

  // ── Phase 3: Wait for backend user record to resolve ──────────────────
  if (isUserLoading) {
    return <FullScreenSpinner />;
  }

  // ── Phase 4: Wait for workspace memberships to load ────────────────────
  if (isWorkspaceLoading) {
    return <FullScreenSpinner />;
  }

  // ── Phase 5: All state resolved — make routing decision ───────────────

  // Authenticated, no workspace → onboarding
  if (!hasMemberships) {
    if (isOnboardingPath(path)) {
      return <Outlet />;
    }
    return <Navigate to="/onboarding" replace />;
  }

  // Authenticated, has workspace → app routes only
  // Allow invite and sso-callback through; redirect public/onboarding pages.
  if (
    !path.startsWith("/invite/") &&
    !path.startsWith("/sso-callback") &&
    (isPublicPath(path) || isOnboardingPath(path))
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
