import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth, useOrganizationList } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";

interface WorkspaceCreatorProps {
  name: string;
  industry: string;
  employeeCount: number;
  onCreate: () => void;
  onError: (msg: string) => void;
}

export default function WorkspaceCreator({
  name,
  industry,
  employeeCount,
  onCreate,
  onError,
}: WorkspaceCreatorProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { createOrganization } = useOrganizationList();
  const syncClerkWorkspace = useMutation(api.workspaces.syncClerkWorkspace);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!isLoaded || !isSignedIn) {
        onError("Authentication is still loading. Please try again in a moment.");
        setIsRunning(false);
        return;
      }
      if (!createOrganization) {
        onError("Clerk organization support is not available.");
        setIsRunning(false);
        return;
      }

      try {
        const org = await createOrganization({ name: name.trim() });

        // Read selected plan from sessionStorage (set during plan selection before sign-up)
        const storedPlan = sessionStorage.getItem("selectedPlan");
        const storedCycle = sessionStorage.getItem("selectedBillingCycle");
        const plan = storedPlan || "basic";
        const billingCycle = storedCycle || "monthly";

        await syncClerkWorkspace({
          clerkOrgId: org.id,
          name: org.name,
          industry: industry || undefined,
          employeeCount,
          plan,
          billingCycle,
        });

        // Clear the stored plan after use
        sessionStorage.removeItem("selectedPlan");
        sessionStorage.removeItem("selectedBillingCycle");

        if (!cancelled) {
          onCreate();
        }
      } catch (err: any) {
        if (!cancelled) {
          onError(err.message || "Failed to create workspace");
        }
      } finally {
        if (!cancelled) {
          setIsRunning(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!isRunning) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-3 text-sm text-indigo-400">
      <Loader2 className="w-4 h-4 animate-spin" />
      Creating workspace...
    </div>
  );
}
