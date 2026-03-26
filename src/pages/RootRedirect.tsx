import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { expressionsApi } from '../api/expressions';

export default function RootRedirect() {
  const { isAuthenticated } = useAuthStore();
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setTarget('/login');
      return;
    }
    const offset = new Date().getTimezoneOffset() * 60 * 1000 * -1;
    expressionsApi
      .getUnread(offset)
      .then((data) => {
        setTarget(data && data.length > 0 ? '/training' : '/expressions');
      })
      .catch(() => setTarget('/expressions'));
  }, [isAuthenticated]);

  if (!target) return null;
  return <Navigate to={target} replace />;
}
