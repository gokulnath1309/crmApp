import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";
import type { User } from "@/types";

const AuthBootContext = createContext<{ isConvexAuthLoading: boolean } | null>(null);

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsVerification: boolean;
  signIn: (email: string, password: string) => Promise<{ requiresOtp: boolean; email: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ requiresOtp: boolean; email: string }>;
  signOut: () => void;
  verifyOtp: (email: string, code: string) => Promise<void>;
  sendOtpEmail: (email: string, flow: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded: clerkLoaded, isSignedIn, signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();

  const isLoading = !clerkLoaded || !userLoaded;
  const isAuthenticated = clerkLoaded && userLoaded && !!isSignedIn && !!clerkUser;
  const needsVerification = isAuthenticated && clerkUser
    ? clerkUser.primaryEmailAddress?.verification?.status !== "verified"
    : false;

  const user: User | null = isAuthenticated && clerkUser
    ? {
        _id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
        name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "User",
        role: "member",
        avatarUrl: clerkUser.imageUrl,
        createdAt: clerkUser.createdAt ? new Date(clerkUser.createdAt).getTime() : Date.now(),
        updatedAt: clerkUser.updatedAt ? new Date(clerkUser.updatedAt).getTime() : Date.now(),
        emailVerified: clerkUser.primaryEmailAddress?.verification?.status === "verified",
      }
    : null;

  const signIn = useCallback(async () => {
    throw new Error("Use Clerk's SignIn component instead");
  }, []);

  const signUp = useCallback(async () => {
    throw new Error("Use Clerk's SignUp component instead");
  }, []);

  const verifyOtp = useCallback(async () => {
    throw new Error("Clerk handles email verification");
  }, []);

  const sendOtpEmail = useCallback(async () => {
    throw new Error("Clerk handles email verification");
  }, []);

  const signOut = useCallback(() => {
    clerkSignOut();
  }, [clerkSignOut]);

  console.log("[AuthProvider] Clerk auth state:", {
    clerkLoaded,
    userLoaded,
    isSignedIn,
    isLoading,
    isAuthenticated,
    userEmail: user?.email,
    needsVerification,
  });

  return (
    <AuthBootContext.Provider value={useMemo(() => ({ isConvexAuthLoading: isLoading }), [isLoading])}>
      <AuthContext.Provider
        value={{
          user,
          token: null,
          isLoading,
          isAuthenticated,
          needsVerification,
          signIn,
          signUp,
          signOut,
          verifyOtp,
          sendOtpEmail,
        }}
      >
        {children}
      </AuthContext.Provider>
    </AuthBootContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function useAuthBootState() {
  const context = useContext(AuthBootContext);
  if (!context) {
    throw new Error("useAuthBootState must be used within AuthProvider");
  }
  return context;
}
