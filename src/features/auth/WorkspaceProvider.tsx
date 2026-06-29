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
  const { user } = useUser();

  const membershipsData = useQuery(api.workspaceMembers.listWorkspaces, {});

  const memberships = useMemo(() => {
    return membershipsData ?? [];
  }, [membershipsData]);

  // membershipsData is undefined while query runs initially;
  // null means the query returned before Convex auth identity was available (race).
  // Both mean "not yet ready" — wait for a real result.
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
