import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { logout as logoutApi } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function SessionPage() {
  const { isAuthenticated, loading, user } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Show error messages if present
  if (!loading) {
    const error = searchParams.get("error");
    if (error) {
      showError(decodeURIComponent(error));
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const handleContinueDashboard = () => {
    navigate("/dashboard");
  };

  const handleLogoutAndRelogin = async () => {
    try {
      // Call logout API to destroy local session
      await logoutApi();
    } catch (err) {
      console.error("Logout error:", err);
    }
    // Clear frontend auth state and redirect to login page
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-salesforce-light via-white to-blue-50 px-4">
      <div className="card w-full max-w-md animate-fade-in p-8 sm:p-10">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Current Session
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
            onClick={handleContinueDashboard}
            className="btn-primary flex-1"
          >
            Continue to Dashboard
          </button>
          <button
            onClick={handleLogoutAndRelogin}
            className="btn-secondary flex-1"
          >
            Logout & Login as Different User
          </button>
        </div>
      </div>
    </div>
  );
}
