import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/authStore";

export default function DemoBanner() {
  const isDemo = useAuthStore((s) => s.isDemo);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  if (!isDemo) return null;

  const exitDemo = (path: string) => {
    clearAuth();
    navigate(path);
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-1.5 flex items-center justify-between gap-4 text-xs text-amber-700 dark:text-amber-400">
      <span>👋 Demo mode — changes are not saved and will be lost on refresh.</span>
      <div className="flex gap-3 shrink-0">
        <button
          onClick={() => exitDemo("/login")}
          className="font-medium underline hover:text-amber-900 hover:dark:text-amber-200">
          Sign in
        </button>
        <button
          onClick={() => exitDemo("/register")}
          className="font-medium underline hover:text-amber-900 hover:dark:text-amber-200">
          Register
        </button>
      </div>
    </div>
  );
}
