import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { AuthProvider, useAuthBootState } from "@/features/auth/AuthProvider";
import { ConvexProvider } from "convex/react";
import { convex } from "@/lib/convex";
import { ToastProvider } from "@/components/ui/Toast";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { PublicRoute } from "@/routes/PublicRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { SignInPage } from "@/pages/SignIn";
import { SignUpPage } from "@/pages/SignUp";
import { ResetPasswordPage } from "@/pages/ResetPassword";
import { DashboardPage } from "@/pages/Dashboard";
import { ProfilePage } from "@/pages/Profile";
import { LeadsPage } from "@/pages/Leads";
import { ContactsPage } from "@/pages/Contacts";
import { DealsPage } from "@/pages/Deals";
import { TasksPage } from "@/pages/Tasks";
import { NotificationsPage } from "@/pages/Notifications";
import { SettingsPage } from "@/pages/Settings";

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
        path="/reset-password"
        element={<ResetPasswordPage />}
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
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConvexProvider client={convex}>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ConvexProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
