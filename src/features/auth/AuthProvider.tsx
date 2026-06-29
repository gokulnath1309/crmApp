import { createContext, useContext, useCallback, useMemo, type ReactNode } from "react";
import { useAuth as useClerkAuth, useClerk } from "@clerk/clerk-react";
import { useConvexAuth } from "convex/react";

interface AuthContextValue {
  isLoaded: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  isLoaded: false,
  isAuthenticated: false,
  userId: null,
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded: clerkLoaded, userId: clerkUserId, signOut: clerkSignOut } = useClerkAuth();
  const clerk = useClerk();
  const { isLoading: convexAuthLoading, isAuthenticated: convexAuthIsAuthenticated } = useConvexAuth();

  // Clerk's React context doesn't always update after programmatic setActive()
  // in v5 (pending tasks).  Check the raw Clerk SDK as a reliable fallback.
  const clerkHasSession = !!clerk.session;
  const isAuthenticated = clerkHasSession;

  const resolvedUserId = clerkUserId ?? clerk.user?.id ?? null;

  // Wait for both the WebSocket connection AND the Clerk JWT to arrive in Convex.
  // Without this, mutations/queries that call ctx.auth.getUserIdentity() may
  // see no identity and silently skip user creation.
  const convexReady = !convexAuthLoading && (!isAuthenticated || convexAuthIsAuthenticated);
  const isLoaded = clerkLoaded && convexReady;

  if (typeof window !== "undefined") {
    console.log("[AuthProvider] clerkLoaded:", clerkLoaded, "convexAuthLoading:", convexAuthLoading, "convexAuthIsAuthenticated:", convexAuthIsAuthenticated, "convexReady:", convexReady, "isLoaded:", isLoaded, "isAuthenticated:", isAuthenticated, "clerkUserId:", clerkUserId, "clerk.user.id:", clerk.user?.id, "clerk.session.id:", clerk.session?.id);
  }

  const signOut = useCallback(() => {
    clerkSignOut();
  }, [clerkSignOut]);

  const value = useMemo(() => ({
    isLoaded,
    isAuthenticated,
    userId: resolvedUserId,
    signOut,
  }), [isLoaded, isAuthenticated, resolvedUserId, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthBootState() {
  return useContext(AuthContext);
}
