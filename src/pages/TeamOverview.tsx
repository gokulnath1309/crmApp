import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useUser } from "@/features/auth/UserProvider";
import { getPermissions } from "@/lib/permissions";
import {
  ArrowLeft, Users, Target, Briefcase, CheckSquare,
  DollarSign, Calendar, UserCircle, Activity,
} from "lucide-react";

export function TeamOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const permissions = getPermissions(user);

  const team = useQuery(api.teams.getById, { teamId: id as any });
  const metrics = useQuery(api.teams.getTeamMetrics, { teamId: id as any });

  if (team === undefined || metrics === undefined) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-6">
        <Card className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Team Not Found</h2>
          <p className="text-sm text-slate-500 mt-1">This team doesn't exist or you don't have access.</p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate("/teams")}>
            <ArrowLeft className="w-4 h-4" /> Back to Teams
          </Button>
        </Card>
      </div>
    );
  }

  const dateStr = new Date(team.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const stats = [
    { label: "Members", value: team.memberCount, icon: Users, color: "bg-indigo-500" },
    { label: "Open Leads", value: metrics?.openLeads ?? 0, icon: Target, color: "bg-violet-500" },
    { label: "Open Deals", value: metrics?.openDeals ?? 0, icon: Briefcase, color: "bg-emerald-500" },
    { label: "Revenue", value: `$${((metrics?.totalRevenue ?? 0) || 0).toLocaleString()}`, icon: DollarSign, color: "bg-amber-500" },
    { label: "Pending Tasks", value: metrics?.pendingTasks ?? 0, icon: CheckSquare, color: "bg-rose-500" },
    { label: "Total Leads", value: metrics?.totalLeads ?? 0, icon: Target, color: "bg-cyan-500" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/teams")}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Teams
      </button>

      {/* Hero */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: team.color || "#6366f1" }} />
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
            style={{ backgroundColor: team.color || "#6366f1" }}
          >
            {team.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {team.name}
              </h1>
              {team.archived && <Badge variant="warning">Archived</Badge>}
              {team.department && <Badge variant="primary">{team.department}</Badge>}
            </div>
            {team.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{team.description}</p>
            )}
          </div>
          {permissions.canManageTeams && (
            <Button variant="secondary" onClick={() => navigate(`/teams/${id}/settings`)}>
              Settings
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-outline-variant/50 text-xs text-slate-500">
          {team.owner && (
            <span className="flex items-center gap-1.5">
              <UserCircle className="w-3.5 h-3.5" />
              Created by {team.owner.name}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Created {dateStr}
          </span>
          {team.teamLead && (
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Lead: {team.teamLead.name}
            </span>
          )}
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Members Preview */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            Team Members ({team.memberCount})
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/teams/${id}/members`)}
          >
            View All
          </Button>
        </div>
        <div className="space-y-2">
          {team.members?.slice(0, 5).map((member: any) => (
            <div key={member._id} className="flex items-center gap-3 py-2">
              <Avatar name={member.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{member.name}</p>
                <p className="text-xs text-slate-500 truncate">{member.department || member.role}</p>
              </div>
              <Badge variant={member.isActive ? "success" : "default"} size="sm">
                {member.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          ))}
          {(team.members?.length ?? 0) > 5 && (
            <p className="text-xs text-slate-500 text-center pt-2">
              +{(team.members?.length ?? 0) - 5} more members
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
