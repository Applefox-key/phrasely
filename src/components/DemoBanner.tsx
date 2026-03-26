import { useAuthStore } from '../store/authStore';

export default function DemoBanner() {
  const isDemo = useAuthStore((s) => s.isDemo);

  if (!isDemo) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-1.5 flex items-center justify-between gap-4 text-xs text-amber-700 dark:text-amber-400">
      <span>👋 Demo mode — changes are not saved and will be lost on refresh.</span>
      <div className="flex gap-3">
        <a href="/login" className="font-medium underline hover:text-amber-900 dark:hover:text-amber-200">
          Sign in
        </a>
        <a href="/register" className="font-medium underline hover:text-amber-900 dark:hover:text-amber-200">
          Register
        </a>
      </div>
    </div>
  );
}
