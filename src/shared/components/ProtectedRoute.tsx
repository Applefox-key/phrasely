import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/authStore';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, isInitializing } = useAuthStore();

  if (isInitializing) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
