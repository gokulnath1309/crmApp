import { useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ClerkProvider, AuthenticateWithRedirectCallback, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { UserProvider } from "@/features/auth/UserProvider";
import { WorkspaceProvider } from "@/features/auth/WorkspaceProvider";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { convex } from "@/lib/convex";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthGate } from "@/routes/AuthGate";
import { AppLayout } from "@/layouts/AppLayout";
import { SignInPage } from "@/pages/SignIn";
import { SignUpPage } from "@/pages/SignUp";
import { ResetPasswordPage } from "@/pages/ResetPassword";
import { VerifyOtpPage } from "@/pages/VerifyOtp";
import { DashboardPage } from "@/pages/Dashboard";
import { ProfilePage } from "@/pages/Profile";
import { LeadsPage } from "@/pages/Leads";
import { ContactsPage } from "@/pages/Contacts";
import { DealsPage } from "@/pages/Deals";
import { TasksPage } from "@/pages/Tasks";
import { NotificationsPage } from "@/pages/Notifications";
import { SettingsPage } from "@/pages/Settings";
import { EmployeesPage } from "@/pages/Employees";
import { ReportsPage } from "@/pages/Reports";
import { CompaniesPage } from "@/pages/Companies";
import { CalendarPage } from "@/pages/Calendar";
import { BillingPage } from "@/pages/Billing";
import { RoleGuard } from "@/routes/RoleGuard";
import CreateWorkspace from "@/pages/CreateWorkspace";
import OnboardingPage from "@/pages/OnboardingPage";
import { AcceptInvitationPage } from "@/pages/AcceptInvitation";
import LandingPage from "@/pages/LandingPage";
import { TeamsPage } from "@/pages/Teams";
import { TeamOverviewPage } from "@/pages/TeamOverview";
import { TeamMembersPage } from "@/pages/TeamMembers";
import { TeamSettingsPage } from "@/pages/TeamSettings";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env.local');
}

function ClerkWithRouter({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const routerPush = useCallback((to: string) => {
    navigate(to, { replace: false });
  }, [navigate]);

  const routerReplace = useCallback((to: string) => {
    navigate(to, { replace: true });
  }, [navigate]);

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      routerPush={routerPush}
      routerReplace={routerReplace}
    >
      {children}
    </ClerkProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthGate />}>
        <Route
          path="/sso-callback"
          element={<AuthenticateWithRedirectCallback afterSignInUrl="/" afterSignUpUrl="/" />}
        />
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/invite/:token" element={<AcceptInvitationPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/create-workspace" element={<CreateWorkspace />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/deals" element={<DealsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route
            path="/settings"
            element={
              <RoleGuard requiredPermission="canManageSettings">
                <SettingsPage />
              </RoleGuard>
            }
          />
          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="/employees"
            element={
              <RoleGuard requiredPermission="canManageEmployees">
                <EmployeesPage />
              </RoleGuard>
            }
          />
          <Route
            path="/teams"
            element={
              <RoleGuard requiredPermission="canManageTeams">
                <TeamsPage />
              </RoleGuard>
            }
          />
          <Route
            path="/teams/create"
            element={
              <RoleGuard requiredPermission="canManageTeams">
                <TeamsPage />
              </RoleGuard>
            }
          />
          <Route path="/teams/:id" element={<TeamOverviewPage />} />
          <Route path="/teams/:id/members" element={<TeamMembersPage />} />
          <Route path="/teams/:id/settings" element={<TeamSettingsPage />} />
          <Route
            path="/reports"
            element={
              <RoleGuard requiredPermission="canViewAllData">
                <ReportsPage />
              </RoleGuard>
            }
          />
          <Route
            path="/companies"
            element={
              <RoleGuard requiredPermission="canViewAllData">
                <CompaniesPage />
              </RoleGuard>
            }
          />
          <Route
            path="/billing"
            element={
              <RoleGuard requiredPermission="canManageBilling">
                <BillingPage />
              </RoleGuard>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ClerkWithRouter>
        <ToastProvider>
          <ConvexProviderWithClerk client={convex} useAuth={useClerkAuth}>
            <AuthProvider>
              <UserProvider>
                <WorkspaceProvider>
                  <AppRoutes />
                </WorkspaceProvider>
              </UserProvider>
            </AuthProvider>
          </ConvexProviderWithClerk>
        </ToastProvider>
      </ClerkWithRouter>
    </BrowserRouter>
  );
}
