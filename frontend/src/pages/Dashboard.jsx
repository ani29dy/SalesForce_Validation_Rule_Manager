import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  fetchValidationRules,
  getCachedValidationRules,
  toggleValidationRule,
  toggleAllValidationRules,
  deployChanges,
} from '../services/api';
import Header from '../components/Header';
import ValidationRuleTable from '../components/ValidationRuleTable';
import SearchFilter from '../components/SearchFilter';
import DeployModal from '../components/DeployModal';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Dashboard() {
  const { loading: authLoading } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const hasPendingChanges = useMemo(() => rules.some((r) => r.modified), [rules]);

  const loadCachedRules = useCallback(async () => {
    try {
      const { data } = await getCachedValidationRules();
      if (data.rules?.length > 0) {
        setRules(data.rules);
      }
    } catch {
      // No cached rules yet — expected on first visit
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      loadCachedRules();
    }
  }, [authLoading, loadCachedRules]);

  const handleFetch = async () => {
    setLoading(true);
    try {
      const { data } = await fetchValidationRules();
      setRules(data.rules);
      showSuccess(`Fetched ${data.count} validation rule(s) from Salesforce`);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch validation rules');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id, active) => {
    setTogglingId(id);
    try {
      const { data } = await toggleValidationRule(id, active);
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, active: data.rule.active, modified: data.rule.modified } : r)),
      );
      showInfo(`"${data.rule.name}" marked as ${active ? 'active' : 'inactive'} (pending deploy)`);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to toggle validation rule');
    } finally {
      setTogglingId(null);
    }
  };

  const handleToggleAll = async (active) => {
    setBulkLoading(true);
    try {
      const { data } = await toggleAllValidationRules(active);
      setRules(data.rules);
      showInfo(`All rules marked as ${active ? 'active' : 'inactive'} (pending deploy)`);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to toggle all validation rules');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!hasPendingChanges) {
      showInfo('No pending changes to deploy');
      return;
    }

    setDeploying(true);
    try {
      const { data } = await deployChanges();
      setRules((prev) => prev.map((r) => ({ ...r, modified: false })));
      showSuccess(data.message);
    } catch (err) {
      const message = err.response?.data?.message || 'Deployment failed';
      showError(message);
    } finally {
      setDeploying(false);
    }
  };

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const matchesSearch =
        !search ||
        rule.name.toLowerCase().includes(search.toLowerCase()) ||
        rule.objectName?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && rule.active) ||
        (statusFilter === 'inactive' && !rule.active);

      return matchesSearch && matchesStatus;
    });
  }, [rules, search, statusFilter]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header hasPendingChanges={hasPendingChanges} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Action Bar */}
        <div className="card mb-6 p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Validation Rules</h2>
              <p className="text-sm text-gray-500">
                {rules.length > 0
                  ? `${rules.length} rule(s) loaded${hasPendingChanges ? ' · Changes pending deploy' : ''}`
                  : 'Fetch validation rules from your Salesforce org'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={handleFetch} disabled={loading || deploying} className="btn-primary">
                {loading ? <LoadingSpinner size="sm" /> : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                Fetch Validation Rules
              </button>

              <button
                onClick={() => handleToggleAll(true)}
                disabled={rules.length === 0 || bulkLoading || deploying}
                className="btn-success"
              >
                Enable All
              </button>

              <button
                onClick={() => handleToggleAll(false)}
                disabled={rules.length === 0 || bulkLoading || deploying}
                className="btn-danger"
              >
                Disable All
              </button>

              <button
                onClick={handleDeploy}
                disabled={!hasPendingChanges || deploying}
                className="btn-primary bg-salesforce-dark hover:bg-gray-900"
              >
                Deploy Changes
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        {rules.length > 0 && (
          <div className="card mb-6 p-4 sm:p-6">
            <SearchFilter
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
            {filteredRules.length !== rules.length && (
              <p className="mt-3 text-xs text-gray-500">
                Showing {filteredRules.length} of {rules.length} rules
              </p>
            )}
          </div>
        )}

        {/* Table */}
        <div className="card overflow-hidden">
          <ValidationRuleTable
            rules={filteredRules}
            loading={loading}
            onToggle={handleToggle}
            togglingId={togglingId}
          />
        </div>
      </main>

      <DeployModal isOpen={deploying} />
    </div>
  );
}
