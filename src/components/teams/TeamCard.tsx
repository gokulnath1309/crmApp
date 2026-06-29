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
      hover
      className="cursor-pointer group relative overflow-hidden"
      onClick={() => navigate(`/teams/${team._id}`)}
    >
      {team.archived && (
        <div className="absolute top-3 right-3">
          <Badge variant="warning" size="sm">
            <Archive className="w-3 h-3 mr-1 inline" />
            Archived
          </Badge>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
          style={{ backgroundColor: team.color || "#6366f1" }}
        >
          {team.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {team.name}
          </h3>
          {team.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
              {team.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
        </span>

        {team.teamLead && (
          <span className="flex items-center gap-1 truncate">
            <UserCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{team.teamLead.name}</span>
          </span>
        )}

        <span className="flex items-center gap-1 ml-auto">
          <Calendar className="w-3.5 h-3.5" />
          {dateStr}
        </span>
      </div>

      {team.department && (
        <div className="mt-3">
          <Badge variant="primary" size="sm">
            {team.department}
          </Badge>
        </div>
      )}
    </Card>
  );
}
