import { useState } from "react";
import { useAuthStore } from "../../features/auth/authStore";
import { usersApi } from "../../features/auth/usersApi";
import { setSettings } from "../utils/settings";

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("phrasely_theme") === "dark");
  const [showCounter, setShowCounter] = useState(() => {
    try {
      const s = localStorage.getItem("phrasely_options");
      if (s) return JSON.parse(s).showCountBtns !== false;
    } catch {}
    return true;
  });
  const [queueLimit, setQueueLimit] = useState(() => {
    try {
      const user = useAuthStore.getState().user;
      if (!user?.settings) return 0;
      const s = typeof user.settings === "string" ? JSON.parse(user.settings) : user.settings;
      return s.phrases?.dailyQueueLimit ?? 0;
    } catch {
      return 0;
    }
  });
  const [queueSaving, setQueueSaving] = useState(false);
  const [queueSaved, setQueueSaved] = useState(false);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("phrasely_theme", next ? "dark" : "light");
  };

  const toggleCounter = () => {
    const next = !showCounter;
    setShowCounter(next);
    setSettings("showCountBtns", next);
  };

  const saveQueueLimit = async () => {
    setQueueSaving(true);
    try {
      const updated = await usersApi.updateSettings({ phrases: { dailyQueueLimit: queueLimit } });
      useAuthStore.getState().setUser(updated);
      setQueueSaved(true);
      setTimeout(() => setQueueSaved(false), 2000);
    } catch (_) {
    } finally {
      setQueueSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-gray-700 dark:text-gray-300">Dark mode</span>
            <input type="checkbox" checked={darkMode} onChange={toggleDark} className="rounded border-gray-300 accent-teal-600 dark:accent-teal-400" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-gray-700 dark:text-gray-300">Show read counter</span>
            <input type="checkbox" checked={showCounter} onChange={toggleCounter} className="rounded border-gray-300 accent-teal-600 dark:accent-teal-400" />
          </label>

          <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Learning</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Daily queue limit
              <span className="ml-1 text-xs text-gray-400 font-normal">(auto-activate per day)</span>
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                value={queueLimit}
                onChange={(e) => setQueueLimit(Number(e.target.value))}
                className="w-20 text-sm px-2 py-1.5 border border-gray-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                onClick={saveQueueLimit}
                disabled={queueSaving}
                className="text-sm bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-md transition-colors">
                {queueSaved ? "✓ Saved" : queueSaving ? "…" : "Save"}
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">0 = disabled</p>
          </div>
        </div>
      </div>
    </div>
  );
}
