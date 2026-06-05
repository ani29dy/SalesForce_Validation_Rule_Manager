import ToggleSwitch from './ToggleSwitch';
import LoadingSpinner from './LoadingSpinner';

function StatusBadge({ active, modified }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}
      >
        {active ? 'Active' : 'Inactive'}
      </span>
      {modified && (
        <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
          Pending
        </span>
      )}
    </div>
  );
}

export default function ValidationRuleTable({
  rules,
  loading,
  onToggle,
  togglingId,
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-gray-500">Fetching validation rules...</p>
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="mt-4 text-sm font-medium text-gray-500">No validation rules found</p>
        <p className="mt-1 text-xs text-gray-400">Click &quot;Fetch Validation Rules&quot; to load rules from Salesforce</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 sm:px-6">
              Validation Rule Name
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 sm:table-cell sm:px-6">
              Object
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 sm:px-6">
              Status
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 sm:px-6">
              Toggle
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {rules.map((rule) => (
            <tr key={rule.id} className="transition hover:bg-gray-50">
              <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900 sm:px-6">
                {rule.name}
              </td>
              <td className="hidden whitespace-nowrap px-4 py-4 text-sm text-gray-500 sm:table-cell sm:px-6">
                {rule.objectName}
              </td>
              <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                <StatusBadge active={rule.active} modified={rule.modified} />
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-center sm:px-6">
                <div className="flex justify-center">
                  {togglingId === rule.id ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <ToggleSwitch
                      checked={rule.active}
                      onChange={(active) => onToggle(rule.id, active)}
                      label={`Toggle ${rule.name}`}
                    />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
