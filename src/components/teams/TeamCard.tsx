import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Users, UserCircle, Calendar, Archive } from "lucide-react";
import type { Team } from "@/types";

interface TeamCardProps {
  team: Team;
}

export function TeamCard({ team }: TeamCardProps) {
  const navigate = useNavigate();

  const dateStr = new Date(team.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card
      className="cursor-pointer group relative overflow-hidden bg-card p-[18px] md:p-5 lg:p-6 rounded-[20px] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30"
      onClick={() => navigate(`/teams/${team._id}`)}
    >
      {team.archived && (
        <div className="absolute top-4 right-4">
          <Badge variant="warning" size="sm">
            <Archive className="w-3 h-3 mr-1 inline" />
            Archived
          </Badge>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-sm"
          style={{ backgroundColor: team.color || "#6366f1" }}
        >
          {team.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <h3 className="text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors leading-snug">
            {team.name}
          </h3>
          {team.description && (
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed line-clamp-1">
              {team.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-[18px] flex items-center gap-5 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
        </span>

        {team.teamLead && (
          <span className="flex items-center gap-1.5 text-muted-foreground truncate">
            <UserCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{team.teamLead.name}</span>
          </span>
        )}

        <span className="flex items-center gap-1.5 text-muted-foreground ml-auto">
          <Calendar className="w-3.5 h-3.5" />
          {dateStr}
        </span>
      </div>

      {team.department && (
        <div className="mt-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
            {team.department}
          </span>
        </div>
      )}
    </Card>
  );
}
