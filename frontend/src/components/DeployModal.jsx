import LoadingSpinner from './LoadingSpinner';

export default function DeployModal({ isOpen, message = 'Deploying changes to Salesforce...' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="card mx-4 w-full max-w-md animate-fade-in p-8 text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Deploying to Salesforce</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <p className="mt-4 text-xs text-gray-400">Please do not close this window.</p>
      </div>
    </div>
  );
}
