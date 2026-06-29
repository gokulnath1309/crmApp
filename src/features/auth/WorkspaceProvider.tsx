import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "./AuthProvider";
import { useUser } from "./UserProvider";
import type { WorkspaceInfo } from "@/types";

interface WorkspaceContextValue {
  isWorkspaceLoading: boolean;
  hasMemberships: boolean;
  workspaces: WorkspaceInfo[];
  activeWorkspace: WorkspaceInfo | null;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  isWorkspaceLoading: false,
  hasMemberships: false,
  workspaces: [],
  activeWorkspace: null,
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { user, isUserLoading } = useUser();

  // Wait for UserProvider to finish loading before querying workspaces.
  // isUserLoading covers both "useQuery still loading" and "query returned
  // null because the Convex user record hasn't been created yet".  Without
  // this guard, listWorkspaces can fire before the Clerk JWT reaches Convex,
  // causing getUserIdentity() to return null and the query to return null.
  const queryArgs = isAuthenticated && !isUserLoading ? {} : "skip";
  const membershipsData = useQuery(
    api.workspaceMembers.listWorkspaces,
    queryArgs,
  );

  if (typeof window !== "undefined") {
    console.log("[WorkspaceProvider] isAuthenticated:", isAuthenticated, "isUserLoading:", isUserLoading, "queryArgs:", queryArgs, "membershipsData:", membershipsData);
  }

  const memberships = useMemo(() => {
    return membershipsData ?? [];
  }, [membershipsData]);

  // membershipsData is undefined while query is skipped or hasn't resolved;
  // null means the user record doesn't exist yet in Convex (race with ensureUserExists).
  // Both mean "not yet ready" — keep loading.
  const isWorkspaceLoading = isAuthenticated && user !== null && (membershipsData === undefined || membershipsData === null);

  const hasMemberships = memberships.length > 0;

  const activeWorkspace = useMemo(() => {
    const active = memberships.find((m) => m.isActive);
    return active ?? null;
  }, [memberships]);

  const value = useMemo(() => ({
    isWorkspaceLoading,
    hasMemberships,
    workspaces: memberships,
    activeWorkspace,
  }), [isWorkspaceLoading, hasMemberships, memberships, activeWorkspace]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return context;
}
