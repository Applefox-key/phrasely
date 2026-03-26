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

          {/* Nav links */}
          {isAuthenticated && (
            <div className="hidden sm:flex items-center gap-1">
              <NavLink to="/training" active={isActive('/training')}>Training</NavLink>
              <NavLink to="/expressions" active={isActive('/expressions')}>Expressions</NavLink>
              <NavLink to="/profile" active={isActive('/profile')}>Profile</NavLink>
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <AppSwitcher />
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-slate-600"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-800 text-teal-700 dark:text-teal-300 flex items-center justify-center text-sm font-medium">
                    {user?.name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                )}
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
        {isAuthenticated && (
          <div className="sm:hidden flex items-center gap-1 pb-2 overflow-x-auto">
            <NavLink to="/training" active={isActive('/training')}>Training</NavLink>
            <NavLink to="/expressions" active={isActive('/expressions')}>Expressions</NavLink>
            <NavLink to="/profile" active={isActive('/profile')}>Profile</NavLink>
            <NavLink to="/about" active={isActive('/about')}>About</NavLink>
          </div>
        )}
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
