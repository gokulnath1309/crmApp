import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";

import { useToast } from "@/components/ui/Toast";
import { Shield, Loader2, Sparkles, AlertCircle, ArrowRight, CheckCircle2, Mail, UserPlus } from "lucide-react";

type PageState = "loading" | "invalid" | "expired" | "already_accepted" | "needs_auth" | "accepting" | "redirecting" | "error";

export function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLoaded: clerkLoaded, isSignedIn } = useClerkAuth();

  const invitation = useQuery(api.users.getInvitationByToken, token ? { token } : "skip");
  const acceptInvitation = useAction(api.users.acceptInvitation);

  const [acceptingInProgress, setAcceptingInProgress] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const acceptStarted = useRef(false);
  const isMounted = useRef(true);
  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  // Store token in sessionStorage immediately on mount
  useEffect(() => {
    if (token) {
      sessionStorage.setItem("pending_invite_token", token);
    }
  }, [token]);

  // Derive page state
  const pageState = derivePageState({
    token,
    clerkLoaded,
    isSignedIn,
    invitation,
    acceptingInProgress,
    acceptError,
    accepted,
  });

  // Clear invalid/expired/consumed tokens to prevent redirect loops
  useEffect(() => {
    if (pageState === "invalid" || pageState === "expired" || pageState === "already_accepted" || accepted) {
      sessionStorage.removeItem("pending_invite_token");
    }
  }, [pageState, accepted]);

  // After acceptance, AuthGate will detect the new membership
  // and redirect to /dashboard automatically.

  // Auto-accept for authenticated users with valid invitation
  useEffect(() => {
    if (
      !clerkLoaded || !isSignedIn || !invitation || acceptingInProgress ||
      accepted || acceptStarted.current || acceptError
    ) return;

    const status = invitation.status;
    if (status !== "pending" && status !== "email_sent") return;

    acceptStarted.current = true;
    const performAcceptance = async () => {
      setAcceptingInProgress(true);
      try {
        await acceptInvitation({ token: token! });

        if (!isMounted.current) return;

        toast("success", `Successfully joined ${invitation.companyName}!`);
        sessionStorage.removeItem("pending_invite_token");
        setAccepted(true);
      } catch (err: any) {
        console.error("[AcceptInvitation]", err);
        if (isMounted.current) {
          setAcceptError(err.message || "Failed to accept invitation.");
          acceptStarted.current = false;
        }
      } finally {
        if (isMounted.current) {
          setAcceptingInProgress(false);
        }
      }
    };

    performAcceptance();
  }, [
    clerkLoaded, isSignedIn, invitation, token,
    acceptInvitation, navigate, toast,
    acceptingInProgress, accepted, acceptError,
  ]);

  const handleRetry = () => {
    setAcceptError(null);
    acceptStarted.current = false;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Workspace Invitation
          </h1>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-2xl p-6 sm:p-10 space-y-6">

          {/* ── Loading ── */}
          {pageState === "loading" && (
            <div className="text-center py-8 space-y-4">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
              <h3 className="text-lg font-semibold text-white">Validating invitation link...</h3>
              <p className="text-sm text-slate-400">Please wait while we verify your invitation.</p>
            </div>
          )}

          {/* ── Needs Auth ── */}
          {pageState === "needs_auth" && (
            <div className="text-center py-8 space-y-6">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto">
                <UserPlus className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Sign in to accept</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                You need to sign in or create an account to accept this workspace invitation.
                Your invitation will be preserved and applied automatically after sign in.
              </p>
              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={() => navigate("/signin")}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  Sign In <ArrowRight className="w-4 h-4" />
                </button>
                <Link
                  to="/signup"
                  className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-all border border-slate-700 text-center"
                >
                  Create an account
                </Link>
              </div>
            </div>
          )}

          {/* ── Invalid Token ── */}
          {pageState === "invalid" && (
            <div className="text-center py-8 space-y-4">
              <Shield className="w-12 h-12 text-red-500 mx-auto" />
              <h3 className="text-lg font-semibold text-white">Invalid Invitation</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                This invitation link is not valid. It may have been mistyped or the link is incorrect.
              </p>
              <div className="pt-4 space-y-3">
                <p className="text-xs text-slate-500">
                  Contact the workspace administrator and ask them to send a new invitation.
                </p>
                <button
                  onClick={() => navigate("/signin")}
                  className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-all border border-slate-700 cursor-pointer"
                >
                  Go to Sign In
                </button>
              </div>
            </div>
          )}

          {/* ── Expired Token ── */}
          {pageState === "expired" && (
            <div className="text-center py-8 space-y-4">
              <AlertCircle className="w-12 h-12 text-orange-500 mx-auto" />
              <h3 className="text-lg font-semibold text-white">Invitation Expired</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                This invitation has expired. Invitations are only valid for a limited time.
              </p>
              <div className="pt-4 space-y-3">
                <p className="text-xs text-slate-500">
                  Ask the workspace administrator to send a new invitation.
                </p>
                <button
                  onClick={() => navigate("/signin")}
                  className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-all border border-slate-700 cursor-pointer"
                >
                  Go to Sign In
                </button>
              </div>
            </div>
          )}

          {/* ── Already Accepted ── */}
          {pageState === "already_accepted" && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-semibold text-white">Already a Member</h3>
              <p className="text-sm text-slate-400">
                You are already a member of this workspace.
              </p>
              <div className="pt-4">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg active:scale-[0.99] cursor-pointer"
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Accepting ── */}
          {pageState === "accepting" && (
            <div className="text-center py-8 space-y-4">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
              <h3 className="text-lg font-semibold text-white">Joining Workspace</h3>
              <p className="text-sm text-slate-400">
                Accepting your invitation to join {invitation?.companyName || "the workspace"}...
              </p>
            </div>
          )}

          {/* ── Redirecting ── */}
          {pageState === "redirecting" && (
            <div className="text-center py-8 space-y-4">
              <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto" />
              <h3 className="text-lg font-semibold text-white">Success!</h3>
              <p className="text-sm text-slate-400">
                Setting active workspace and redirecting...
              </p>
            </div>
          )}

          {/* ── Error ── */}
          {pageState === "error" && (
            <div className="text-center py-8 space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <h3 className="text-lg font-semibold text-white">Acceptance Failed</h3>
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                {acceptError}
              </p>
              <div className="pt-4">
                <button
                  onClick={handleRetry}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg active:scale-[0.99] cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function derivePageState(params: {
  token: string | undefined;
  clerkLoaded: boolean;
  isSignedIn: boolean | null;
  invitation: any;
  acceptingInProgress: boolean;
  acceptError: string | null;
  accepted: boolean;
}): PageState {
  const { token, clerkLoaded, isSignedIn, invitation, acceptingInProgress, acceptError, accepted } = params;

  if (accepted) return "redirecting";
  if (acceptError) return "error";
  if (acceptingInProgress) return "accepting";

  if (!token) return "invalid";

  if (!clerkLoaded) return "loading";

  if (invitation === undefined) return "loading";

  if (invitation === null) return "invalid";

  const isExpired = Date.now() > invitation.expiresAt || invitation.status === "expired" || invitation.status === "revoked";
  const isAccepted = invitation.status === "accepted";

  if (isExpired) return "expired";
  if (isAccepted) return "already_accepted";

  if (!isSignedIn) return "needs_auth";

  return "accepting";
}
