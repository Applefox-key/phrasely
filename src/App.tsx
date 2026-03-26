import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { usersApi } from './api/users';
import { useQuery } from '@tanstack/react-query';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import DemoBanner from './components/DemoBanner';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import TrainingPage from './pages/TrainingPage';
import ExpressionsPage from './pages/ExpressionsPage';
import ProfilePage from './pages/ProfilePage';
import AboutPage from './pages/AboutPage';
import RootRedirect from './pages/RootRedirect';

export default function App() {
  const { setUser, setInitializing, isInitializing, isDemo } = useAuthStore();

  // Skip the session check entirely in demo mode — demo user is already set
  const { data: user, isError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => usersApi.getMe(),
    retry: false,
    enabled: !isDemo,
  });

  useEffect(() => {
    if (isDemo) return; // enterDemo() already set isInitializing: false
    if (user !== undefined || isError) {
      if (user) setUser(user);
      setInitializing(false);
    }
  }, [user, isError, isDemo, setUser, setInitializing]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100">
        <Navbar />
        <DemoBanner />
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
