import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useToast } from "@/components/ui/Toast";
import { Mail, Shield, UserCheck, Calendar, ArrowRight, Loader2, Sparkles, Building, Briefcase, Award } from "lucide-react";

export function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch invitation details
  const invitation = useQuery(api.users.getInvitationByToken, token ? { token } : "skip");
  const acceptInvitation = useMutation(api.users.acceptInvitation);

  // Store token in session storage if user needs to authenticate first
  useEffect(() => {
    if (token) {
      sessionStorage.setItem("pending_invite_token", token);
    }
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900/60 border border-red-500/20 rounded-2xl p-8 max-w-md text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Invalid Invite Link</h2>
          <p className="text-slate-400 text-sm">
            This invitation link is invalid or missing a token. Please request a new invite from your administrator.
          </p>
        </div>
      </div>
    );
  }

  // Loading State
  if (invitation === undefined) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Verifying invitation token...</p>
        </div>
      </div>
    );
  }

  // Invalid Token State
  if (invitation === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900/60 border border-red-500/20 rounded-2xl p-8 max-w-md text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Invitation Not Found</h2>
          <p className="text-slate-400 text-sm">
            This invitation does not exist. It may have been revoked or deleted. Please ask your administrator to send another invitation.
          </p>
        </div>
      </div>
    );
  }

  const isExpired = Date.now() > invitation.expiresAt;
  const isPending = invitation.status === "pending";

  const handleAccept = async () => {
    if (!isSignedIn) {
      toast("error", "Please sign in or register to accept this invitation.");
      return;
    }

    setIsSubmitting(true);
    try {
      await acceptInvitation({ token });
      toast("success", `Successfully joined ${invitation.companyName}!`);
      sessionStorage.removeItem("pending_invite_token");
      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err: any) {
      toast("error", err.message || "Failed to accept invitation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRedirect = (flow: "signin" | "signup") => {
    navigate(`/${flow}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Join the Company
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Accept your invitation to collaborate in the workspace.
          </p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-2xl p-6 sm:p-10 space-y-6">
          {/* Company Invitation Card Details */}
          <div className="text-center border-b border-slate-800/60 pb-6">
            <Building className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-white">{invitation.companyName}</h2>
            <p className="text-xs text-indigo-400 mt-1">Invited by {invitation.inviterName}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/50">
              <Briefcase className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</span>
                <span className="text-sm font-semibold text-slate-200 capitalize">{invitation.role.replace("_", " ")}</span>
              </div>
            </div>

            {invitation.department && (
              <div className="flex items-center gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/50">
                <Building className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</span>
                  <span className="text-sm font-semibold text-slate-200">{invitation.department}</span>
                </div>
              </div>
            )}

            {invitation.managerName && (
              <div className="flex items-center gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/50">
                <Award className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Manager</span>
                  <span className="text-sm font-semibold text-slate-200">{invitation.managerName}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/50">
              <Calendar className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Expires On</span>
                <span className="text-sm font-semibold text-slate-200">
                  {new Date(invitation.expiresAt).toLocaleDateString(undefined, {
                    dateStyle: "medium",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Render Action Buttons based on state */}
          {!isPending || isExpired ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl text-center font-medium">
              {isExpired
                ? "Invitation expired. Contact your administrator."
                : `This invitation has already been ${invitation.status}.`}
            </div>
          ) : !isLoaded ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : isSignedIn ? (
            <div className="pt-2">
              <button
                onClick={handleAccept}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-[0.99] cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Joining Workspace...
                  </>
                ) : (
                  <>
                    Accept Invitation & Join <UserCheck className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-slate-500 mt-3">
                Logged in as <span className="font-semibold text-slate-400">{clerkUser?.primaryEmailAddress?.emailAddress}</span>.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="text-center text-xs text-slate-500 mb-2">
                You need to sign in or register to accept this invitation and join the company.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleRedirect("signin")}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-all border border-slate-700 text-center cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleRedirect("signup")}
                  className="py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md text-center cursor-pointer"
                >
                  Register
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
