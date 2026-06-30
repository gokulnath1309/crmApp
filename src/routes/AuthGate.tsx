import { useRef } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { useUser } from "@/features/auth/UserProvider";
import { useWorkspace } from "@/features/auth/WorkspaceProvider";
import { Spinner } from "@/components/ui/Spinner";

// Module-level flag set by SignUp.tsx before Clerk setActive() and cleared
// after.  During the Clerk session transition the auth state hasn't settled
// yet — isAuthenticated is still false and everAuthenticated is false because
// this is a brand-new session.  Without this flag AuthGate Phase 2 would
// redirect to /signin whenever Clerk's internal routerPush fires before the
// auth state propagates (the exact bug for zero-workspace users).
let _pendingAuthTransition = false;
let _pendingAuthTimeout: ReturnType<typeof setTimeout> | null = null;
export function setPendingAuthTransition(v: boolean) {
  _pendingAuthTransition = v;
  if (_pendingAuthTimeout !== null) {
    clearTimeout(_pendingAuthTimeout);
    _pendingAuthTimeout = null;
  }
  if (v) {
    _pendingAuthTimeout = setTimeout(() => {
      _pendingAuthTransition = false;
      _pendingAuthTimeout = null;
    }, 10_000);
  }
}

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
    path === "/features" ||
    path === "/resources" ||
    path === "/pricing" ||
    path === "/plan-selection" ||
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
    path.startsWith("/invite/")
  );
}

function logRedirect(from: string, to: string, reason: string, state: Record<string, unknown>) {
  console.log(`[AuthGate] REDIRECT: ${from} → ${to} (${reason})`, state);
}

export function AuthGate() {
  const { isLoaded, isAuthenticated } = useAuth();
  const { isUserLoading } = useUser();
  const { isWorkspaceLoading, hasMemberships } = useWorkspace();
  const location = useLocation();
  const path = location.pathname;

  const everAuthenticated = useRef(false);
  if (isAuthenticated) {
    everAuthenticated.current = true;
  }

  const authState = {
    isLoaded,
    isAuthenticated,
    isUserLoading,
    isWorkspaceLoading,
    hasMemberships,
    everAuthenticated: everAuthenticated.current,
    pendingAuthTransition: _pendingAuthTransition,
    pendingInviteToken: typeof window !== "undefined" ? sessionStorage.getItem("pending_invite_token") : null,
  };

  console.log("[AuthGate] path:", path, authState);

  // ── Phase 1: Wait for Clerk + Convex auth to resolve ──────────────────
  if (!isLoaded) {
    console.log("[AuthGate] Phase 1: spinner (waiting for Clerk+Convex)");
    return <FullScreenSpinner />;
  }

  // ── Phase 2: Not authenticated — only public routes allowed ────────────
  if (!isAuthenticated) {
    if (_pendingAuthTransition) {
      console.log("[AuthGate] Phase 2: spinner (pendingAuthTransition flag active)");
      return <FullScreenSpinner />;
    }
    if (isPublicPath(path) || isOnboardingPath(path)) {
      console.log("[AuthGate] Phase 2: render public/onboarding route:", path);
      return <Outlet />;
    }
    if (everAuthenticated.current) {
      logRedirect(path, "/", "everAuthenticated=true on non-public path", authState);
      return <Navigate to="/" replace />;
    }
    logRedirect(path, "/signin", "unauthenticated on non-public path", authState);
    return <Navigate to="/signin" replace />;
  }

  // ── Phase 3: Wait for backend user record to resolve ──────────────────
  if (isUserLoading) {
    console.log("[AuthGate] Phase 3: spinner (waiting for Convex user record)");
    return <FullScreenSpinner />;
  }

  // ── Phase 4: Wait for workspace memberships to load ────────────────────
  if (isWorkspaceLoading) {
    console.log("[AuthGate] Phase 4: spinner (waiting for workspace memberships)");
    return <FullScreenSpinner />;
  }

  // ── Phase 5: All state resolved — make routing decision ───────────────
  if (_pendingAuthTransition) {
    setPendingAuthTransition(false);
  }

  if (!hasMemberships) {
    const pendingToken = typeof window !== "undefined"
      ? sessionStorage.getItem("pending_invite_token")
      : null;
    if (pendingToken && !path.startsWith("/invite/")) {
      sessionStorage.removeItem("pending_invite_token");
      logRedirect(path, `/invite/${pendingToken}`, "pending_invite_token found, no workspace", authState);
      return <Navigate to={`/invite/${pendingToken}`} replace />;
    }

    if (isOnboardingPath(path)) {
      console.log("[AuthGate] Phase 5: render onboard path:", path);
      return <Outlet />;
    }
    logRedirect(path, "/onboarding", "authenticated, no workspace, no pending invite", authState);
    return <Navigate to="/onboarding" replace />;
  }

  // Authenticated, has workspace → redirect public routes to dashboard
  // Onboarding routes are allowed through so users can intentionally access them.
  if (
    !path.startsWith("/invite/") &&
    !path.startsWith("/sso-callback") &&
    isPublicPath(path)
  ) {
    logRedirect(path, "/dashboard", "authenticated, has workspace, on public path", authState);
    return <Navigate to="/dashboard" replace />;
  }

  console.log("[AuthGate] Phase 5: render app route:", path);
  return <Outlet />;
}
