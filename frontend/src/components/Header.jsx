import { useAuth } from '../context/AuthContext';

export default function Header({ hasPendingChanges }) {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-salesforce-blue">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
              Validation Rule Manager
            </h1>
            {user && (
              <p className="text-xs text-gray-500 sm:text-sm">
                {user.username} &middot; {user.instanceUrl?.replace('https://', '')}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasPendingChanges && (
            <span className="hidden rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 sm:inline-block">
              Unsaved changes
            </span>
          )}
          <button onClick={logout} className="btn-secondary text-xs sm:text-sm">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
