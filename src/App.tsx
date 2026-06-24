import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthenticateWithRedirectCallback, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { AuthProvider, useAuthBootState } from "@/features/auth/AuthProvider";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { convex } from "@/lib/convex";
import { ToastProvider } from "@/components/ui/Toast";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { PublicRoute } from "@/routes/PublicRoute";
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
import { BillingPage } from "@/pages/Billing";
import { RoleGuard } from "@/routes/RoleGuard";
import CreateWorkspace from "@/pages/CreateWorkspace";
import OnboardingPage from "@/pages/OnboardingPage";
import { AcceptInvitationPage } from "@/pages/AcceptInvitation";
import LandingPage from "@/pages/LandingPage";


function AppRoutes() {
  const { isConvexAuthLoading } = useAuthBootState();

  if (isConvexAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/sso-callback"
        element={<AuthenticateWithRedirectCallback />}
      />
      <Route
        path="/"
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        }
      />
      <Route
        path="/create-workspace"
        element={
          <ProtectedRoute>
            <CreateWorkspace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/signin"
        element={
          <PublicRoute>
            <SignInPage />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <SignUpPage />
          </PublicRoute>
        }
      />
      <Route
        path="/verify-otp"
        element={
          <PublicRoute>
            <VerifyOtpPage />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={<ResetPasswordPage />}
      />
      <Route
        path="/invite/:token"
        element={<AcceptInvitationPage />}
      />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/deals" element={<DealsPage />} />
        <Route path="/tasks" element={<TasksPage />} />
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
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConvexProviderWithClerk client={convex} useAuth={useClerkAuth}>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ConvexProviderWithClerk>
      </ToastProvider>
    </BrowserRouter>
  );
}
