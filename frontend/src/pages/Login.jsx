import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getLoginUrl, getLogoutAllUrl } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Login() {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      showError(decodeURIComponent(error));
    }
  }, [searchParams, showError]);

  // Do not auto-redirect when already authenticated.
  // Instead show current session details and provide logout/relogin options.

  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  const handleLogoutAndRelogin = async () => {
    // Redirect to backend endpoint which will destroy the local session
    // and then redirect the browser to Salesforce logout which returns
    // back to the frontend login page.
    window.location.href = getLogoutAllUrl();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  // If already authenticated, show a session overview with logout option
  if (isAuthenticated && user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-salesforce-light via-white to-blue-50 px-4">
        <div className="card w-full max-w-md animate-fade-in p-8 sm:p-10">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Current session
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              You are logged in with the following Salesforce account:
            </p>
          </div>

          <div className="mb-6 space-y-2 rounded-md border border-gray-100 p-4">
            <div className="text-sm text-gray-700">
              <strong>Username:</strong> {user.username}
            </div>
            <div className="text-sm text-gray-700">
              <strong>Instance:</strong>{" "}
              <a
                className="text-salesforce-blue hover:underline"
                href={user.instanceUrl}
                target="_blank"
                rel="noreferrer"
              >
                {user.instanceUrl?.replace("https://", "")}
              </a>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="btn-primary flex-1"
            >
              Continue to Dashboard
            </button>
            <button
              onClick={handleLogoutAndRelogin}
              className="btn-secondary flex-1"
            >
              Logout & Login as different user
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-salesforce-light via-white to-blue-50 px-4">
      <div className="card w-full max-w-md animate-fade-in p-8 sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-salesforce-blue shadow-lg">
            <svg
              className="h-9 w-9 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Validation Rule Manager
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage Salesforce validation rules from a single dashboard
          </p>
        </div>

        <button
          onClick={handleLogin}
          className="btn-primary w-full py-3 text-base"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
          Login with Salesforce
        </button>

        <div className="mt-8 space-y-3 border-t border-gray-100 pt-6">
          <Feature text="Fetch and view all validation rules" />
          <Feature text="Activate or deactivate rules individually" />
          <Feature text="Bulk enable/disable with one click" />
          <Feature text="Deploy changes back to Salesforce" />
        </div>
      </div>
    </div>
  );
}

function Feature({ text }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <svg
        className="h-4 w-4 flex-shrink-0 text-green-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
      {text}
    </div>
  );
}
