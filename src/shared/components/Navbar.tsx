import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../features/auth/authStore";
import { useMobileNavStore } from "../mobileNavStore";
import AppSwitcher from "./AppSwitcher";
import DarkModeToggle from "./DarkModeToggle";
import SettingsModal from "./SettingsModal";
import { SpeakButton } from "./SpeakButton";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const filterText = useMobileNavStore((s) => s.filterText);
  const setFilterText = useMobileNavStore((s) => s.setFilterText);
  const trainingPhrase = useMobileNavStore((s) => s.trainingPhrase);

  const isActive = (path: string) => location.pathname === path;
  const isTraining = location.pathname === "/training";
  const isExpressions = location.pathname === "/expressions";

  if (isTraining) {
    return (
      <nav className="sm:hidden bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link
            to="/expressions"
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-teal-600 hover:dark:text-teal-400 transition-colors">
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Home
          </Link>
          <SpeakButton text={trainingPhrase} />
        </div>
      </nav>
    );
  }

  return (
    <>
    <nav className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 gap-4">
          {/* Logo */}
          <Link to="/about" className="flex items-center gap-2 font-bold text-teal-600 dark:text-teal-400 text-lg shrink-0">
            <span>💬</span>
            <span>SayLoop</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            {isAuthenticated && (
              <>
                <NavLink to="/expressions" active={isActive("/expressions")}>
                  Home
                </NavLink>
                <NavLink to="/training" active={isActive("/training")}>
                  Training
                </NavLink>
              </>
            )}
          </div>

          {/* Desktop search — only on expressions page, takes remaining space */}
          <div className="flex-1 hidden sm:flex">
            {isExpressions && (
              <input
                type="search"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Search…"
                className="w-full max-w-xs text-sm border border-gray-200 dark:border-slate-600 rounded-md px-3 py-1.5 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            )}
          </div>

          {/* Mobile search — only on expressions page */}
          {isExpressions && (
            <input
              type="search"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search…"
              className="sm:hidden flex-1 min-w-0 text-sm border border-gray-200 dark:border-slate-600 rounded-md px-3 py-1.5 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          )}

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="hidden sm:flex items-center gap-2">
              <DarkModeToggle />
              <AppSwitcher />
              {isAuthenticated && (
                <button
                  onClick={() => setShowSettings(true)}
                  title="Settings"
                  className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.89 3.31.876 2.42 2.42a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.89 1.543-.876 3.31-2.42 2.42a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.89-3.31-.876-2.42-2.42a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.89-1.543.876-3.31 2.42-2.42.996.575 2.245.09 2.572-1.065z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              )}
            </div>
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/profile" title="Profile">
                  {user?.img ? (
                    <img
                      src={`https://api.learnypie.com/img/avatars?img=${user.img}&userid=${user.id}`}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-slate-600 hover:ring-2 hover:ring-teal-400 transition-all"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-800 text-teal-700 dark:text-teal-300 flex items-center justify-center text-sm font-medium hover:ring-2 hover:ring-teal-400 transition-all cursor-pointer">
                      {user?.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                  )}
                </Link>
                <button
                  onClick={() => logout()}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:dark:text-gray-200 hidden sm:block">
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-teal-600 hover:dark:text-teal-400">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-md transition-colors">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </nav>
    {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}

function NavLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active
          ? "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
          : "text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:dark:text-gray-100 hover:bg-gray-50 hover:dark:bg-slate-700"
      }`}>
      {children}
    </Link>
  );
}
