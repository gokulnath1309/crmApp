import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "./AuthProvider";
import type { User } from "@/types";

interface UserContextValue {
  user: User | null;
  isUserLoading: boolean;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  isUserLoading: false,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isAuthenticated } = useAuth();
  const ensureUserExists = useMutation(api.users.ensureUserExists);
  const dbUser = useQuery(api.users.getCurrentUser, {});
  const [ensured, setEnsured] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isAuthenticated) {
      setEnsured(false);
      return;
    }

    let cancelled = false;
    ensureUserExists()
      .then(() => {
        if (!cancelled) setEnsured(true);
      })
      .catch((err) => {
        console.error("[UserProvider] ensureUserExists failed:", err);
        if (!cancelled) setEnsured(true);
      });

    return () => { cancelled = true; };
  }, [isLoaded, isAuthenticated, ensureUserExists]);

  const isUserLoading = isAuthenticated && (!ensured || dbUser === undefined);

  const user = useMemo((): User | null => {
    if (!isAuthenticated || !dbUser) return null;
    return {
      _id: dbUser._id,
      clerkId: dbUser.clerkId,
      email: dbUser.email ?? "",
      name: dbUser.name ?? "",
      role: dbUser.role ?? "employee",
      managerId: dbUser.managerId,
      department: dbUser.department,
      jobFunction: dbUser.jobFunction,
      permissions: dbUser.permissions ?? [],
      isActive: dbUser.isActive ?? true,
      lastLogin: dbUser.lastLogin,
      avatarUrl: dbUser.avatarUrl,
      createdAt: dbUser.createdAt ?? dbUser._creationTime,
      updatedAt: dbUser.updatedAt ?? dbUser._creationTime,
      emailVerified: dbUser.emailVerified ?? false,
      coverImage: dbUser.coverImage,
      company: dbUser.company,
      location: dbUser.location,
      timezone: dbUser.timezone,
      bio: dbUser.bio,
      jobTitle: dbUser.jobTitle,
      phone: dbUser.phone,
      workspaceId: dbUser.activeWorkspaceId,
      activeWorkspaceId: dbUser.activeWorkspaceId,
      membershipId: dbUser.membershipId,
      isOwner: dbUser.isOwner,
    };
  }, [isAuthenticated, dbUser]);

  const value = useMemo(() => ({ user, isUserLoading }), [user, isUserLoading]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
