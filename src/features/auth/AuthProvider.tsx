import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { User, WorkspaceInfo } from "@/types";

const AuthBootContext = createContext<{ isConvexAuthLoading: boolean } | null>(null);

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsVerification: boolean;
  hasMemberships: boolean;
  workspaces: WorkspaceInfo[];
  activeWorkspace: WorkspaceInfo | null;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  refetchUser: () => void;
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

  const isAuthenticated = clerkLoaded && userLoaded && !!isSignedIn && !!clerkUser;
  const needsVerification = isAuthenticated && clerkUser
    ? clerkUser.primaryEmailAddress?.verification?.status !== "verified"
    : false;

  const { isLoading: isConvexAuthLoading, isAuthenticated: isConvexAuthenticated } = useConvexAuth();

  const dbUser = useQuery(api.users.getCurrentUser, {});
  const hasMembershipsResult = useQuery(api.workspaceMembers.hasMemberships, {});
  const workspacesResult = useQuery(api.workspaceMembers.listWorkspaces, {});
  const switchWorkspaceMut = useMutation(api.workspaceMembers.switchWorkspace);
  const syncUserMutation = useMutation(api.users.syncUser);

  const hasMemberships = hasMembershipsResult === true;

  const workspaces = useMemo(() => (workspacesResult ?? []) as WorkspaceInfo[], [workspacesResult]);

  const activeWorkspace = useMemo(() => {
    const workspaceId = dbUser?.activeWorkspaceId || dbUser?.workspaceId;
    if (!workspaceId || workspaces.length === 0) return null;
    return workspaces.find((w) => w.workspaceId === workspaceId) ?? workspaces[0];
  }, [dbUser, workspaces]);

  useEffect(() => {
    if (isConvexAuthenticated && dbUser === null) {
      syncUserMutation()
        .then((result) => {
          console.log("[AUTH] syncUser completed, user:", result?._id);
        })
        .catch((err) => {
          console.error("[AUTH] Error syncing user with Convex:", err);
        });
    }
  }, [isConvexAuthenticated, dbUser, syncUserMutation]);

  useEffect(() => {
    if (isConvexAuthenticated && dbUser && !dbUser.clerkId) {
      syncUserMutation()
        .then((result) => {
          console.log("[AUTH] syncUser backfill completed, clerkId:", result?.clerkId);
        })
        .catch((err) => {
          console.error("[AUTH] Error backfilling clerkId:", err);
        });
    }
  }, [isConvexAuthenticated, dbUser, syncUserMutation]);

  const isMembershipsLoading = isSignedIn && (hasMembershipsResult === undefined || workspacesResult === undefined);
  const isLoading = !clerkLoaded || !userLoaded || isConvexAuthLoading || (isSignedIn && (dbUser === undefined || dbUser === null)) || isMembershipsLoading;

  const { getToken } = useClerkAuth();
  useEffect(() => {
    if (isSignedIn && getToken) {
      getToken({ template: "convex" })
        .then((token) => {
          console.log("[AuthProvider Debug] Clerk JWT token for convex template:", token ? "SUCCESS (exists)" : "NULL (template missing or unconfigured)");
        })
        .catch((err) => {
          console.error("[AuthProvider Debug] Error getting Clerk JWT token:", err);
        });
    }
  }, [isSignedIn, getToken]);

  const user = useMemo(() => {
    if (!isAuthenticated || !clerkUser) return null;
    return {
      _id: dbUser?._id || clerkUser.id,
      clerkId: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
      name: dbUser?.name || [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "User",
      role: dbUser?.role || "employee",
      managerId: dbUser?.managerId,
      department: dbUser?.department,
      jobFunction: dbUser?.jobFunction,
      permissions: dbUser?.permissions || [],
      isActive: dbUser?.isActive ?? true,
      lastLogin: dbUser?.lastLogin,
      avatarUrl: dbUser?.avatarUrl || clerkUser.imageUrl,
      createdAt: dbUser?.createdAt || (clerkUser.createdAt ? new Date(clerkUser.createdAt).getTime() : Date.now()),
      updatedAt: dbUser?.updatedAt || (clerkUser.updatedAt ? new Date(clerkUser.updatedAt).getTime() : Date.now()),
      emailVerified: clerkUser.primaryEmailAddress?.verification?.status === "verified",
      coverImage: dbUser?.coverImage,
      workspaceName: dbUser?.workspaceName || dbUser?.company,
      location: dbUser?.location,
      timezone: dbUser?.timezone,
      bio: dbUser?.bio,
      jobTitle: dbUser?.jobTitle,
      phone: dbUser?.phone,
      workspaceId: dbUser?.workspaceId || dbUser?.workspaceId,
      activeWorkspaceId: dbUser?.activeWorkspaceId || dbUser?.activeWorkspaceId,
      membershipId: dbUser?.membershipId,
      isOwner: dbUser?.isOwner,
    };
  }, [isAuthenticated, clerkUser, dbUser]);

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

  console.log("[AuthProvider] Clerk + Convex auth state:", {
    clerkLoaded,
    userLoaded,
    isSignedIn,
    isLoading,
    isAuthenticated,
    userEmail: user?.email,
    needsVerification,
    isConvexAuthLoading,
    isConvexAuthenticated,
    dbUserState: dbUser === undefined ? "loading" : dbUser === null ? "null" : "loaded",
  });

  const switchWorkspace = useCallback(async (workspaceId: string) => {
    await switchWorkspaceMut({ workspaceId });
    window.location.reload();
  }, [switchWorkspaceMut]);

  const refetchUser = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <AuthBootContext.Provider value={useMemo(() => ({ isConvexAuthLoading: isLoading }), [isLoading])}>
      <AuthContext.Provider
        value={{
          user,
          token: null,
          isLoading,
          isAuthenticated,
          needsVerification,
          hasMemberships,
          workspaces,
          activeWorkspace,
          switchWorkspace,
          refetchUser,
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
