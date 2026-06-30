import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useWorkspaceLimit() {
  const workspaceLimit = useQuery(api.subscriptions.getWorkspaceLimitStatus);

  return {
    atLimit: workspaceLimit?.atLimit === true,
    currentCount: workspaceLimit?.currentCount ?? 0,
    maxWorkspaces: workspaceLimit?.maxWorkspaces ?? 1,
    plan: workspaceLimit?.plan ?? "basic",
    remaining: workspaceLimit?.remaining ?? 1,
    isLoading: workspaceLimit === undefined,
  };
}
