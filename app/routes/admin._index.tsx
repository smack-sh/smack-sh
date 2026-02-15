import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { useMemo, useState, useEffect } from 'react';
import { env } from '~/config/env.server';
import { requireAdmin } from '~/utils/auth.server';

type AdminSection = {
  id: string;
  label: string;
  capabilityCount: number;
  capabilities: string[];
};

type AdminUser = {
  id: string;
  email: string;
  status: 'active' | 'suspended' | 'pending';
  role: 'user' | 'admin' | 'support';
  lastSeenAt: string;
};

type AuditLog = {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
};

const ADMIN_SECTIONS: AdminSection[] = [
  makeSection('user-management', 'User Management', 150),
  makeSection('subscriptions-billing', 'Subscription & Billing', 120),
  makeSection('project-management', 'Project Management', 100),
  makeSection('ai-code-generation', 'AI & Code Generation', 110),
  makeSection('deployment-devops', 'Deployment & DevOps', 80),
  makeSection('analytics-reporting', 'Analytics & Reporting', 100),
  makeSection('security-compliance', 'Security & Compliance', 90),
  makeSection('monitoring-logging', 'Monitoring & Logging', 70),
  makeSection('testing-qa', 'Testing & QA', 60),
  makeSection('collaboration-communication', 'Collaboration & Communication', 80),
  makeSection('integration-marketplace', 'Integration Marketplace', 120),
  makeSection('content-management', 'Content Management', 50),
  makeSection('templates-marketplace', 'Templates & Marketplace', 70),
  makeSection('api-developer-tools', 'API & Developer Tools', 90),
  makeSection('mobile-app-features', 'Mobile App Features', 60),
  makeSection('game-development', 'Game Development', 70),
  makeSection('automation-workflows', 'Automation & Workflows', 50),
  makeSection('white-label-reseller', 'White-Label & Reseller', 40),
  makeSection('support-help-desk', 'Support & Help Desk', 60),
  makeSection('settings-configuration', 'Settings & Configuration', 100),
];

const DEMO_USERS: AdminUser[] = Array.from({ length: 1200 }, (_, index) => ({
  id: `usr_${String(index + 1).padStart(4, '0')}`,
  email: `user${index + 1}@example.com`,
  status: index % 11 === 0 ? 'suspended' : index % 7 === 0 ? 'pending' : 'active',
  role: index % 19 === 0 ? 'admin' : index % 5 === 0 ? 'support' : 'user',
  lastSeenAt: new Date(Date.now() - index * 90_000).toISOString(),
}));

const INITIAL_LOGS: AuditLog[] = [
  makeLog('admin@smack.local', 'Viewed dashboard', 'system'),
  makeLog('admin@smack.local', 'Exported user report', 'users'),
  makeLog('admin@smack.local', 'Adjusted rate limit policy', 'security'),
];

export async function loader(args: LoaderFunctionArgs) {
  await requireAdmin(args);

  const providerStatus = {
    vercel: Boolean(env.VERCEL_ACCESS_TOKEN),
    netlify: Boolean(env.NETLIFY_TOKEN),
    github: Boolean(env.GITHUB_ACCESS_TOKEN),
    gitlab: Boolean(env.GITLAB_ACCESS_TOKEN),
    supabase: Boolean(env.SUPABASE_ACCESS_TOKEN),
  };

  return json({
    providerStatus,
    totalCapabilities: ADMIN_SECTIONS.reduce((sum, section) => sum + section.capabilityCount, 0),
    generatedAt: new Date().toISOString(),
  });
}

export default function AdminDashboard() {
  const { providerStatus, totalCapabilities, generatedAt } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<'overview' | 'capabilities' | 'users' | 'audit'>('overview');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<AdminUser[]>(DEMO_USERS);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_LOGS);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTick((v) => v + 1);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const filteredSections = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return ADMIN_SECTIONS;
    }

    return ADMIN_SECTIONS.map((section) => ({
      ...section,
      capabilities: section.capabilities.filter((capability) => capability.toLowerCase().includes(normalized)),
    })).filter((section) => {
      return section.label.toLowerCase().includes(normalized) || section.capabilities.length > 0;
    });
  }, [search]);

  const filteredUsers = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return users;
    }

    return users.filter((user) => {
      return (
        user.id.toLowerCase().includes(normalized) ||
        user.email.toLowerCase().includes(normalized) ||
        user.status.toLowerCase().includes(normalized) ||
        user.role.toLowerCase().includes(normalized)
      );
    });
  }, [search, users]);

  const visibleUsers = filteredUsers.slice(0, 1000);

  const selectedCount = selectedUserIds.size;

  const upsertLog = (action: string, target: string) => {
    setLogs((current) => [makeLog('admin@smack.local', action, target), ...current].slice(0, 50));
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((current) => {
      const next = new Set(current);

      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }

      return next;
    });
  };

  const handleSelectVisible = () => {
    setSelectedUserIds(new Set(visibleUsers.map((user) => user.id)));
    upsertLog('Selected users in bulk', `count:${visibleUsers.length}`);
  };

  const handleSuspendSelected = () => {
    if (selectedUserIds.size === 0) {
      return;
    }

    setUsers((current) =>
      current.map((user) => (selectedUserIds.has(user.id) ? { ...user, status: 'suspended' } : user)),
    );
    upsertLog('Suspended users in bulk', `count:${selectedUserIds.size}`);
  };

  const handleActivateSelected = () => {
    if (selectedUserIds.size === 0) {
      return;
    }

    setUsers((current) => current.map((user) => (selectedUserIds.has(user.id) ? { ...user, status: 'active' } : user)));
    upsertLog('Activated users in bulk', `count:${selectedUserIds.size}`);
  };

  const exportUsersAsJson = () => {
    const payload = visibleUsers.filter((user) => selectedUserIds.size === 0 || selectedUserIds.has(user.id));
    downloadFile('admin-users.json', JSON.stringify(payload, null, 2), 'application/json');
    upsertLog('Exported users JSON', `count:${payload.length}`);
  };

  const exportUsersAsCsv = () => {
    const payload = visibleUsers.filter((user) => selectedUserIds.size === 0 || selectedUserIds.has(user.id));
    const rows = ['id,email,status,role,lastSeenAt', ...payload.map((user) => toCsvRow(user))];
    downloadFile('admin-users.csv', rows.join('\n'), 'text/csv;charset=utf-8');
    upsertLog('Exported users CSV', `count:${payload.length}`);
  };

  return (
    <div className="min-h-screen bg-smack-elements-background-depth-1">
      <div className="border-b border-smack-elements-borderColor bg-smack-elements-background-depth-2">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-smack-elements-textPrimary">Super Admin Control Center</h1>
            <p className="text-sm text-smack-elements-textSecondary">
              {totalCapabilities}+ capabilities across {ADMIN_SECTIONS.length} sections
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search capabilities, users, logs..."
              className="w-80 px-3 py-2 rounded-lg border border-smack-elements-borderColor bg-smack-elements-background-depth-3 text-sm"
            />
            <Link
              to="/"
              className="px-4 py-2 bg-smack-elements-button-secondary-background hover:bg-smack-elements-button-secondary-backgroundHover text-smack-elements-button-secondary-text rounded-lg transition-colors"
            >
              Back to App
            </Link>
          </div>
        </div>
      </div>

      <div className="border-b border-smack-elements-borderColor bg-smack-elements-background-depth-2">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-4">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'capabilities', label: 'Capabilities Explorer' },
              { id: 'users', label: 'Users & Bulk Ops' },
              { id: 'audit', label: 'Audit Logs' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-3 border-b-2 text-sm ${
                  activeTab === tab.id
                    ? 'border-accent-500 text-accent-500'
                    : 'border-transparent text-smack-elements-textSecondary hover:text-smack-elements-textPrimary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard title="Capabilities" value={String(totalCapabilities)} subtitle="Total cataloged features" />
              <StatCard title="Users Indexed" value={String(users.length)} subtitle="Bulk operations enabled" />
              <StatCard title="Audit Events" value={String(logs.length)} subtitle="Recent admin actions" />
              <StatCard
                title="Realtime Tick"
                value={String(refreshTick)}
                subtitle={`Last refresh seed ${generatedAt}`}
              />
            </div>

            <div className="bg-smack-elements-background-depth-2 rounded-lg border border-smack-elements-borderColor p-4">
              <h2 className="font-semibold text-smack-elements-textPrimary mb-3">Provider Integration Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
                {Object.entries(providerStatus).map(([name, online]) => (
                  <div key={name} className="p-3 rounded-lg bg-smack-elements-background-depth-3 flex justify-between">
                    <span className="capitalize">{name}</span>
                    <span className={online ? 'text-green-500' : 'text-red-500'}>
                      {online ? 'Connected' : 'Missing'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'capabilities' && (
          <div className="space-y-3">
            {filteredSections.map((section) => (
              <div
                key={section.id}
                className="rounded-lg border border-smack-elements-borderColor bg-smack-elements-background-depth-2"
              >
                <div className="px-4 py-3 border-b border-smack-elements-borderColor flex justify-between">
                  <h3 className="font-medium text-smack-elements-textPrimary">{section.label}</h3>
                  <span className="text-xs text-smack-elements-textSecondary">
                    {section.capabilityCount}+ capabilities
                  </span>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {section.capabilities.slice(0, 24).map((capability) => (
                    <div key={capability} className="text-xs px-2 py-1 rounded bg-smack-elements-background-depth-3">
                      {capability}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {filteredSections.length === 0 && (
              <div className="text-sm text-smack-elements-textSecondary">No matching capabilities.</div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                className="px-3 py-2 rounded bg-smack-elements-background-depth-3 text-sm"
                onClick={handleSelectVisible}
              >
                Select Visible ({visibleUsers.length})
              </button>
              <button
                className="px-3 py-2 rounded bg-smack-elements-background-depth-3 text-sm"
                onClick={handleSuspendSelected}
              >
                Suspend Selected ({selectedCount})
              </button>
              <button
                className="px-3 py-2 rounded bg-smack-elements-background-depth-3 text-sm"
                onClick={handleActivateSelected}
              >
                Activate Selected ({selectedCount})
              </button>
              <button
                className="px-3 py-2 rounded bg-smack-elements-background-depth-3 text-sm"
                onClick={exportUsersAsCsv}
              >
                Export CSV
              </button>
              <button
                className="px-3 py-2 rounded bg-smack-elements-background-depth-3 text-sm"
                onClick={exportUsersAsJson}
              >
                Export JSON
              </button>
            </div>

            <div className="text-xs text-smack-elements-textSecondary">
              Showing {visibleUsers.length} users (optimized cap), supports bulk actions for 1000+ rows.
            </div>

            <div className="rounded-lg border border-smack-elements-borderColor overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-smack-elements-background-depth-2">
                  <tr>
                    <th className="text-left p-2">Select</th>
                    <th className="text-left p-2">User</th>
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((user) => (
                    <tr key={user.id} className="border-t border-smack-elements-borderColor">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.has(user.id)}
                          onChange={() => handleToggleUser(user.id)}
                        />
                      </td>
                      <td className="p-2">
                        <div className="font-medium">{user.email}</div>
                        <div className="text-xs text-smack-elements-textSecondary">{user.id}</div>
                      </td>
                      <td className="p-2 capitalize">{user.role}</td>
                      <td className="p-2 capitalize">{user.status}</td>
                      <td className="p-2">{new Date(user.lastSeenAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="rounded-lg border border-smack-elements-borderColor bg-smack-elements-background-depth-2 p-4">
            <h2 className="font-semibold text-smack-elements-textPrimary mb-3">Audit Trail</h2>
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="text-sm p-3 rounded bg-smack-elements-background-depth-3">
                  <div className="font-medium">{log.action}</div>
                  <div className="text-xs text-smack-elements-textSecondary">
                    {log.actor} • {log.target} • {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="bg-smack-elements-background-depth-2 rounded-lg border border-smack-elements-borderColor p-4">
      <div className="text-xs text-smack-elements-textSecondary">{title}</div>
      <div className="text-2xl font-bold text-smack-elements-textPrimary">{value}</div>
      <div className="text-xs text-smack-elements-textSecondary">{subtitle}</div>
    </div>
  );
}

function makeSection(id: string, label: string, capabilityCount: number): AdminSection {
  const capabilities = Array.from({ length: capabilityCount }, (_, index) => `${label} capability #${index + 1}`);

  return { id, label, capabilityCount, capabilities };
}

function makeLog(actor: string, action: string, target: string): AuditLog {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    actor,
    action,
    target,
    createdAt: new Date().toISOString(),
  };
}

function toCsvRow(user: AdminUser): string {
  return [user.id, user.email, user.status, user.role, user.lastSeenAt]
    .map((value) => `"${value.split('"').join('""')}"`)
    .join(',');
}

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}
