import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { AddMembersModal } from "@/components/teams/AddMembersModal";
import { Dropdown, DropdownItem, DropdownDivider } from "@/components/ui/Dropdown";
import { useUser } from "@/features/auth/UserProvider";
import { getPermissions } from "@/lib/permissions";
import {
  ArrowLeft, Users, MoreHorizontal, UserX, ExternalLink, UserPlus,
} from "lucide-react";

export function TeamMembersPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUser();
  const permissions = getPermissions(user);

  const [showAdd, setShowAdd] = useState(false);

  const team = useQuery(api.teams.getById, { teamId: id as any });
  const removeMember = useMutation(api.teams.removeMember);

  if (team === undefined) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-6">
        <Card className="text-center py-12">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Team Not Found</h2>
        </Card>
      </div>
    );
  }

  const userIsTeamLead = team.teamLeadId === user?._id;
  const userIsTeamOwner = team.createdBy === user?._id;
  const canManage = permissions.canManageTeams || userIsTeamLead || userIsTeamOwner;

  const handleRemove = async (employeeId: string, name: string) => {
    if (!confirm(`Remove ${name} from ${team.name}?`)) return;
    try {
      await removeMember({ teamId: id as any, employeeId: employeeId as any });
      toast("success", `${name} removed from ${team.name}`);
    } catch (err: any) {
      toast("error", err.message || "Failed to remove member");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(`/teams/${id}`)}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {team.name}
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Team Members
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {team.memberCount} {team.memberCount === 1 ? "member" : "members"} in {team.name}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowAdd(true)}>
            <UserPlus className="w-4 h-4" />
            Add Members
          </Button>
        )}
      </div>

      {/* Members Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/50 bg-surface-container-low">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Member</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {team.members?.map((member: any) => (
                <tr key={member._id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={member.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {member.name}
                          {team.teamLeadId === member._id && (
                            <Badge variant="primary" size="sm" className="ml-2">Lead</Badge>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">{member.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{member.department || "-"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={member.isActive ? "success" : "default"} size="sm">
                      {member.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canManage && team.teamLeadId !== member._id && (
                      <Dropdown
                        trigger={
                          <button className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer">
                            <MoreHorizontal className="w-4 h-4 text-slate-400" />
                          </button>
                        }
                        align="right"
                      >
                        <DropdownItem
                          icon={<ExternalLink className="w-4 h-4" />}
                          onClick={() => navigate(`/employees`)}
                        >
                          View Profile
                        </DropdownItem>
                        <DropdownDivider />
                        <DropdownItem
                          variant="danger"
                          icon={<UserX className="w-4 h-4" />}
                          onClick={() => handleRemove(member._id, member.name)}
                        >
                          Remove from Team
                        </DropdownItem>
                      </Dropdown>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(team.members?.length ?? 0) === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">
            <Users className="w-8 h-8 mx-auto mb-3 text-slate-300" />
            No members in this team yet
          </div>
        )}
      </Card>

      <AddMembersModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        teamId={id!}
        teamName={team.name}
      />
    </div>
  );
}
