import { createContext, useContext, useCallback, useMemo, type ReactNode } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
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
  const { isLoaded: clerkLoaded, isSignedIn, userId: clerkUserId, signOut: clerkSignOut } = useClerkAuth();
  const { isLoading: convexAuthLoading, isAuthenticated: convexAuthIsAuthenticated } = useConvexAuth();

  const isAuthenticated = !!isSignedIn;

  // Wait for both the WebSocket connection AND the Clerk JWT to arrive in Convex.
  // Without this, mutations/queries that call ctx.auth.getUserIdentity() may
  // see no identity and silently skip user creation.
  const convexReady = !convexAuthLoading && (!isAuthenticated || convexAuthIsAuthenticated);
  const isLoaded = clerkLoaded && convexReady;

  const signOut = useCallback(() => {
    clerkSignOut();
  }, [clerkSignOut]);

  const value = useMemo(() => ({
    isLoaded,
    isAuthenticated,
    userId: clerkUserId ?? null,
    signOut,
  }), [isLoaded, isAuthenticated, clerkUserId, signOut]);

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
