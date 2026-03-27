import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AppSwitcher from './AppSwitcher';
import DarkModeToggle from './DarkModeToggle';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-teal-600 dark:text-teal-400 text-lg">
            <span>💬</span>
            <span>Phrasely</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-1">
            {isAuthenticated && (
              <>
                <NavLink to="/training" active={isActive('/training')}>Training</NavLink>
                <NavLink to="/expressions" active={isActive('/expressions')}>Expressions</NavLink>
                <NavLink to="/profile" active={isActive('/profile')}>Profile</NavLink>
              </>
            )}
            <NavLink to="/about" active={isActive('/about')}>About</NavLink>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <AppSwitcher />
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/profile" title="Profile">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-slate-600 hover:ring-2 hover:ring-teal-400 transition-all"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-800 text-teal-700 dark:text-teal-300 flex items-center justify-center text-sm font-medium hover:ring-2 hover:ring-teal-400 transition-all cursor-pointer">
                      {user?.name?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                  )}
                </Link>
                <button
                  onClick={() => logout()}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hidden sm:block"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-md transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden flex items-center gap-1 pb-2 overflow-x-auto">
          {isAuthenticated ? (
            <>
              <NavLink to="/training" active={isActive('/training')}>Training</NavLink>
              <NavLink to="/expressions" active={isActive('/expressions')}>Expressions</NavLink>
              <NavLink to="/about" active={isActive('/about')}>About</NavLink>
              <button
                onClick={() => logout()}
                title="Sign out"
                className="ml-auto p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shrink-0"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </>
          ) : (
            <NavLink to="/about" active={isActive('/about')}>About</NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-700'
      }`}
    >
      {children}
    </Link>
  );
}
