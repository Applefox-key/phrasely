import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./features/auth/authStore";
import { usersApi } from "./features/auth/usersApi";
import { useQuery } from "@tanstack/react-query";
import ProtectedRoute from "./shared/components/ProtectedRoute";
import Navbar from "./shared/components/Navbar";
import MobileBottomNav from "./shared/components/MobileBottomNav";
import DemoBanner from "./shared/components/DemoBanner";
import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import ResetPasswordPage from "./features/auth/ResetPasswordPage";
import TrainingPage from "./features/expressions/TrainingPage";
import ExpressionsPage from "./features/expressions/ExpressionsPage";
import ProfilePage from "./features/profile/ProfilePage";
import AboutPage from "./features/about/AboutPage";
import RootRedirect from "./features/auth/RootRedirect";

export default function App() {
  const { setUser, setInitializing, isInitializing, isDemo, clearAuth } = useAuthStore();

  // Skip the session check entirely in demo mode — demo user is already set
  const { data: user, isError } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => usersApi.getMe(),
    retry: false,
    enabled: !isDemo,
  });

  useEffect(() => {
    if (isDemo) return; // enterDemo() already set isInitializing: false
    if (user !== undefined || isError) {
      if (user?.id && user?.email) {
        setUser(user);
      } else if (user !== undefined) {
        clearAuth();
      }
      setInitializing(false);
    }
  }, [user, isError, isDemo, setUser, setInitializing, clearAuth]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="h-dvh overflow-y-auto max-w-7xl m-auto bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 pb-16 sm:pb-0">
        <Navbar />
        <DemoBanner />
        <MobileBottomNav />
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset/:token" element={<ResetPasswordPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route
            path="/training"
            element={
              <ProtectedRoute>
                <TrainingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expressions"
            element={
              <ProtectedRoute>
                <ExpressionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
