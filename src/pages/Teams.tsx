import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/features/auth/UserProvider";
import { getPermissions } from "@/lib/permissions";
import { TeamCard } from "@/components/teams/TeamCard";
import { CreateTeamModal } from "@/components/teams/CreateTeamModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { PageLayout } from "@/components/PageLayout";
import {
  Users, Plus, Search, Archive,
} from "lucide-react";

export function TeamsPage() {
  const { user } = useUser();
  const permissions = getPermissions(user);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setShowCreate(true);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete("new");
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);
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
      <div className="px-5 md:px-6 lg:px-8 py-5 md:py-6 lg:py-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-11 w-40 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const activeTeams = filteredTeams.filter((t: any) => !t.archived);
  const archivedTeams = filteredTeams.filter((t: any) => t.archived);

  return (
    <PageLayout
      title="Teams"
      subtitle="Organize employees into teams for collaboration and CRM ownership"
      actions={
        permissions.canCreateTeam ? (
          <Button onClick={() => setShowCreate(true)} className="h-11 px-5 py-2.5 gap-2 rounded-xl">
            <Plus className="w-4 h-4" />
            Create Team
          </Button>
        ) : undefined
      }
    >

      {/* Search + Filters */}
      <div className="mt-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams..."
            className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`inline-flex items-center gap-2.5 px-4 h-11 rounded-xl border text-sm font-medium transition-all ${
            showArchived
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:bg-accent"
          }`}
        >
          <Archive className="w-4 h-4" />
          Show Archived
        </button>
      </div>

      {/* Empty State */}
      {teamsData.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon={<Users className="w-10 h-10 text-primary" />}
            title="No Teams Yet"
            description="Create your first team to organize employees and assign CRM ownership."
            action={
              permissions.canCreateTeam ? (
                <Button onClick={() => setShowCreate(true)} className="h-11 px-5 py-2.5 gap-2 rounded-xl">
                  <Plus className="w-4 h-4" />
                  Create Team
                </Button>
              ) : undefined
            }
          />
        </div>
      )}

      {/* Active Teams */}
      {teamsData.length > 0 && (
        <div className="mt-8 space-y-10">
          {activeTeams.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Active Teams
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground leading-none">
                  {activeTeams.length} {activeTeams.length === 1 ? "Team" : "Teams"}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {activeTeams.map((team: any) => (
                  <TeamCard key={team._id} team={team} />
                ))}
              </div>
            </div>
          )}

          {archivedTeams.length > 0 && showArchived && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Archived Teams
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground leading-none">
                  {archivedTeams.length} {archivedTeams.length === 1 ? "Team" : "Teams"}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 opacity-70">
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
    </PageLayout>
  );
}
