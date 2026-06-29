import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/features/auth/UserProvider";
import { getPermissions } from "@/lib/permissions";
import { TeamCard } from "@/components/teams/TeamCard";
import { CreateTeamModal } from "@/components/teams/CreateTeamModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Users, Plus, Search, Archive, SlidersHorizontal,
} from "lucide-react";

export function TeamsPage() {
  const { user } = useUser();
  const permissions = getPermissions(user);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const teamsData = useQuery(api.teams.list, { includeArchived: showArchived });

  const filteredTeams = useMemo(() => {
    if (!teamsData) return [];
    const q = search.toLowerCase().trim();
    if (!q) return teamsData;
    return teamsData.filter(
      (t: any) =>
        t.name.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.department?.toLowerCase().includes(q) ||
        t.teamLead?.name?.toLowerCase().includes(q)
    );
  }, [teamsData, search]);

  if (teamsData === undefined) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const activeTeams = filteredTeams.filter((t: any) => !t.archived);
  const archivedTeams = filteredTeams.filter((t: any) => t.archived);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Teams
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize employees into teams for collaboration and CRM ownership
          </p>
        </div>
        {permissions.canCreateTeam && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />
            Create Team
          </Button>
        )}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-outline-variant bg-surface-alt text-sm text-on-surface placeholder:text-outline/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
        </div>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`inline-flex items-center gap-2 px-4 h-10 rounded-xl border text-sm font-medium transition-all ${
            showArchived
              ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
              : "border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
          }`}
        >
          <Archive className="w-4 h-4" />
          Show Archived
        </button>
      </div>

      {/* Empty State */}
      {teamsData.length === 0 && (
        <EmptyState
          icon={<Users className="w-8 h-8 text-indigo-500" />}
          title="No Teams Yet"
          description="Create your first team to organize employees and assign CRM ownership."
          action={
            permissions.canCreateTeam ? (
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" />
                Create Team
              </Button>
            ) : undefined
          }
        />
      )}

      {/* Active Teams */}
      {teamsData.length > 0 && (
        <div className="space-y-6">
          {activeTeams.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Active Teams ({activeTeams.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeTeams.map((team: any) => (
                  <TeamCard key={team._id} team={team} />
                ))}
              </div>
            </div>
          )}

          {archivedTeams.length > 0 && showArchived && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Archived Teams ({archivedTeams.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 opacity-70">
                {archivedTeams.map((team: any) => (
                  <TeamCard key={team._id} team={team} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Team Modal */}
      <CreateTeamModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
