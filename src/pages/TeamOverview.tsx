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
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-8">
        {/* Back Button Skeleton */}
        <Skeleton className="h-8 w-32 rounded-xl" />
        
        {/* Overview Card Skeleton */}
        <Skeleton className="h-[200px] rounded-[24px]" />
        
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24 rounded-[20px]" />
          ))}
        </div>

        {/* Team Members Skeleton */}
        <Skeleton className="h-80 rounded-[24px]" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center border border-border bg-card rounded-[24px] shadow-sm flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4 text-2xl">
            🔍
          </div>
          <h2 className="text-xl font-bold text-foreground">Team Not Found</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            This team doesn't exist, has been deleted, or you don't have permissions to view it.
          </p>
          <Button 
            variant="secondary" 
            className="mt-6 h-11 px-5 rounded-xl gap-2 font-medium hover:scale-[1.02] active:scale-[0.98] transition-all"
            onClick={() => navigate("/teams")}
          >
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
    { 
      label: "Members", 
      value: team.memberCount, 
      icon: Users, 
      bgColor: "bg-blue-500/10", 
      textColor: "text-blue-500 dark:text-blue-400" 
    },
    { 
      label: "Open Leads", 
      value: metrics?.openLeads ?? 0, 
      icon: Target, 
      bgColor: "bg-purple-500/10", 
      textColor: "text-purple-500 dark:text-purple-400" 
    },
    { 
      label: "Open Deals", 
      value: metrics?.openDeals ?? 0, 
      icon: Briefcase, 
      bgColor: "bg-orange-500/10", 
      textColor: "text-orange-500 dark:text-orange-400" 
    },
    { 
      label: "Revenue", 
      value: `$${((metrics?.totalRevenue ?? 0) || 0).toLocaleString()}`, 
      icon: DollarSign, 
      bgColor: "bg-emerald-500/10", 
      textColor: "text-emerald-500 dark:text-emerald-400" 
    },
    { 
      label: "Pending Tasks", 
      value: metrics?.pendingTasks ?? 0, 
      icon: CheckSquare, 
      bgColor: "bg-pink-500/10", 
      textColor: "text-pink-500 dark:text-pink-400" 
    },
    { 
      label: "Total Leads", 
      value: metrics?.totalLeads ?? 0, 
      icon: Target, 
      bgColor: "bg-purple-500/10", 
      textColor: "text-purple-500 dark:text-purple-400" 
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-8">
      {/* Header / Breadcrumbs */}
      <div className="flex items-center">
        <button
          onClick={() => navigate("/teams")}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all duration-200 group hover:scale-[1.02] active:scale-[0.98] border border-transparent hover:border-border/40"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Back to Teams
        </button>
      </div>

      {/* Overview Card */}
      <Card className="relative overflow-hidden border border-border bg-card rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all duration-300">
        {/* Glow Line matching team color */}
        <div 
          className="absolute top-0 left-0 w-full h-[6px]" 
          style={{ backgroundColor: team.color || "#6366f1" }} 
        />
        
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5 flex-1 min-w-0">
            {/* Team Avatar (72px) */}
            <div
              className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 shadow-sm"
              style={{ backgroundColor: team.color || "#6366f1" }}
            >
              {team.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Team Name */}
                <h1 
                  className="text-[28px] font-bold text-foreground leading-tight tracking-tight" 
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {team.name}
                </h1>
                
                <div className="flex gap-2 items-center flex-wrap">
                  {team.archived && (
                    <Badge variant="warning" className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold border-none bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      Archived
                    </Badge>
                  )}
                  {team.department && (
                    <Badge variant="primary" className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold border-none bg-primary/10 text-primary dark:text-primary-400">
                      {team.department}
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Description */}
              {team.description && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-3xl">
                  {team.description}
                </p>
              )}
            </div>
          </div>

          {/* Action Button */}
          {permissions.canManageTeams && (
            <Button
              variant="secondary"
              onClick={() => navigate(`/teams/${id}/settings`)}
              className="h-10 px-4 rounded-xl text-sm font-semibold border border-border bg-transparent hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              Settings
            </Button>
          )}
        </div>

        {/* Metadata Chips */}
        <div className="flex flex-wrap items-center gap-2.5 mt-6 pt-6 border-t border-border">
          {team.owner && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/30 text-xs font-medium text-muted-foreground hover:bg-muted/70 transition-colors duration-200 cursor-default">
              <UserCircle className="w-3.5 h-3.5 text-muted-foreground/75" />
              <span>Created by <strong className="text-foreground/70 font-semibold">{team.owner.name}</strong></span>
            </div>
          )}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/30 text-xs font-medium text-muted-foreground hover:bg-muted/70 transition-colors duration-200 cursor-default">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground/75" />
            <span>Created <strong className="text-foreground/70 font-semibold">{dateStr}</strong></span>
          </div>
          {team.teamLead && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/30 text-xs font-medium text-muted-foreground hover:bg-muted/70 transition-colors duration-200 cursor-default">
              <Activity className="w-3.5 h-3.5 text-muted-foreground/75" />
              <span>Lead: <strong className="text-foreground/70 font-semibold">{team.teamLead.name}</strong></span>
            </div>
          )}
        </div>
      </Card>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 hover:-translate-y-[2px] hover:shadow-md dark:hover:shadow-none transition-all duration-200 border border-border bg-card rounded-[20px] group cursor-pointer"
            >
              {/* Icon Container */}
              <div className={`w-10 h-10 sm:w-12 sm:h-12 ${stat.bgColor} ${stat.textColor} rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105`}>
                <Icon className="w-5 h-5 transition-transform duration-300" />
              </div>
              <div className="min-w-0 flex-1 w-full">
                {/* Label */}
                <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </p>
                {/* Value */}
                <p className="text-lg sm:text-2xl font-bold text-foreground mt-0.5 sm:mt-1 truncate">
                  {stat.value}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Team Members List */}
      <Card className="p-6 border border-border bg-card rounded-[24px] shadow-sm">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            Team Members ({team.memberCount})
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/teams/${id}/members`)}
            className="rounded-xl text-xs font-semibold hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            View All
          </Button>
        </div>

        {/* Members Rows */}
        <div className="space-y-3">
          {team.members?.slice(0, 5).map((member: any) => {
            const isActive = member.isActive;
            const statusText = isActive ? "Active" : "Inactive";
            
            // Premium status badges
            const badgeClass = isActive
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20";
            
            return (
              <div
                key={member._id}
                className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/30 hover:border-primary/20 transition-all duration-200 group cursor-default"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Member Avatar */}
                  <Avatar 
                    name={member.name} 
                    size="sm" 
                    className="w-10 h-10 rounded-full border border-border/50 transition-transform duration-200 group-hover:scale-105" 
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-150">
                      {member.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {member.department && (
                        <span className="inline-flex items-center text-xs text-muted-foreground font-normal">
                          {member.department}
                        </span>
                      )}
                      {member.department && member.role && (
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      )}
                      {member.role && (
                        <span className="inline-flex items-center text-xs text-muted-foreground font-normal">
                          {member.role}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Status Badge (26px height) */}
                <div className="shrink-0 flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 h-[26px] text-xs font-semibold rounded-full ${badgeClass}`}>
                    {statusText}
                  </span>
                </div>
              </div>
            );
          })}
          
          {/* Over-limit hint */}
          {(team.members?.length ?? 0) > 5 && (
            <p 
              className="text-xs text-muted-foreground text-center pt-2 cursor-pointer hover:text-foreground transition-colors font-medium"
              onClick={() => navigate(`/teams/${id}/members`)}
            >
              +{(team.members?.length ?? 0) - 5} more members
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
