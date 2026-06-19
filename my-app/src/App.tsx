import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConvexProvider } from "convex/react";
import { convex } from "@/lib/convex";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { PublicRoute } from "@/routes/PublicRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { SignInPage } from "@/pages/SignIn";
import { SignUpPage } from "@/pages/SignUp";
import { DashboardPage } from "@/pages/Dashboard";
import { ProfilePage } from "@/pages/Profile";
import { LeadsPage } from "@/pages/Leads";
import { ContactsPage } from "@/pages/Contacts";
import { DealsPage } from "@/pages/Deals";
import { TasksPage } from "@/pages/Tasks";
import { NotificationsPage } from "@/pages/Notifications";
import { SettingsPage } from "@/pages/Settings";

export default function App() {
  return (
    <ConvexProvider client={convex}>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <Routes>
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
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ConvexProvider>
  );
}
