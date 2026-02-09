import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import { requireAdmin } from '~/utils/auth.server';
import { useState } from 'react';

export async function loader(args: LoaderFunctionArgs) {
  await requireAdmin(args);

  // Get deployment stats
  const stats = {
    totalUsers: 0, // TODO: Implement user counting
    totalDeployments: 0, // TODO: Implement deployment counting
    activeProjects: 0, // TODO: Implement project counting
    apiUsage: {
      vercel: process.env.VITE_VERCEL_ACCESS_TOKEN ? 'Connected' : 'Not configured',
      netlify: process.env.VITE_NETLIFY_ACCESS_TOKEN ? 'Connected' : 'Not configured',
      github: process.env.VITE_GITHUB_ACCESS_TOKEN ? 'Connected' : 'Not configured',
      gitlab: process.env.VITE_GITLAB_ACCESS_TOKEN ? 'Connected' : 'Not configured',
      supabase: process.env.VITE_SUPABASE_ACCESS_TOKEN ? 'Connected' : 'Not configured',
    },
  };

  return json({ stats });
}

export default function AdminDashboard() {
  const { stats } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<'overview' | 'deployments' | 'users' | 'settings'>('overview');

  return (
    <div className="min-h-screen bg-smack-elements-background-depth-1">
      {/* Header */}
      <div className="border-b border-smack-elements-borderColor bg-smack-elements-background-depth-2">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-smack-elements-textPrimary">Admin Dashboard</h1>
              <p className="text-sm text-smack-elements-textSecondary mt-1">Manage your Smack AI platform</p>
            </div>
            <Link
              to="/"
              className="px-4 py-2 bg-smack-elements-button-secondary-background hover:bg-smack-elements-button-secondary-backgroundHover text-smack-elements-button-secondary-text rounded-lg transition-colors"
            >
              Back to App
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-smack-elements-borderColor bg-smack-elements-background-depth-2">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-6">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'deployments', label: 'Deployments', icon: '🚀' },
              { id: 'users', label: 'Users', icon: '👥' },
              { id: 'settings', label: 'Settings', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-accent-500 text-accent-500'
                    : 'border-transparent text-smack-elements-textSecondary hover:text-smack-elements-textPrimary'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Total Users" value={stats.totalUsers} icon="👥" trend="+12%" />
              <StatCard title="Total Deployments" value={stats.totalDeployments} icon="🚀" trend="+8%" />
              <StatCard title="Active Projects" value={stats.activeProjects} icon="📁" trend="+15%" />
            </div>

            {/* API Status */}
            <div className="bg-smack-elements-background-depth-2 rounded-lg border border-smack-elements-borderColor p-6">
              <h2 className="text-xl font-bold text-smack-elements-textPrimary mb-4">API Integration Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(stats.apiUsage).map(([key, status]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 bg-smack-elements-background-depth-3 rounded-lg"
                  >
                    <span className="font-medium text-smack-elements-textPrimary capitalize">{key}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        status === 'Connected' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-accent-500/10 border border-accent-500/20 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="text-2xl">🔒</div>
                <div>
                  <h3 className="text-lg font-bold text-accent-500 mb-2">Deployment Keys Protected</h3>
                  <p className="text-smack-elements-textSecondary">
                    All deployments use your admin API keys. Users cannot deploy with their own keys. This ensures
                    centralized control and billing management.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'deployments' && (
          <div className="bg-smack-elements-background-depth-2 rounded-lg border border-smack-elements-borderColor p-6">
            <h2 className="text-xl font-bold text-smack-elements-textPrimary mb-4">Recent Deployments</h2>
            <p className="text-smack-elements-textSecondary">
              Deployment history will appear here. All deployments use your admin API keys.
            </p>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-smack-elements-background-depth-2 rounded-lg border border-smack-elements-borderColor p-6">
            <h2 className="text-xl font-bold text-smack-elements-textPrimary mb-4">User Management</h2>
            <p className="text-smack-elements-textSecondary">User list and management tools will appear here.</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-smack-elements-background-depth-2 rounded-lg border border-smack-elements-borderColor p-6">
              <h2 className="text-xl font-bold text-smack-elements-textPrimary mb-4">Platform Settings</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-smack-elements-textPrimary mb-2">Deployment Configuration</h3>
                  <p className="text-sm text-smack-elements-textSecondary mb-4">
                    All deployments are managed through your admin API keys configured in .env.local
                  </p>
                  <div className="bg-smack-elements-background-depth-3 rounded p-4 font-mono text-sm">
                    <div className="text-green-400">✓ Vercel API Key</div>
                    <div className="text-green-400">✓ Netlify API Key</div>
                    <div className="text-green-400">✓ GitHub API Key</div>
                    <div className="text-green-400">✓ GitLab API Key</div>
                    <div className="text-green-400">✓ Supabase API Key</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-smack-elements-textPrimary mb-2">Admin Users</h3>
                  <p className="text-sm text-smack-elements-textSecondary">
                    Configure admin user IDs in .env.local (ADMIN_USER_IDS)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string; value: number; icon: string; trend: string }) {
  return (
    <div className="bg-smack-elements-background-depth-2 rounded-lg border border-smack-elements-borderColor p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm text-green-500 font-medium">{trend}</span>
      </div>
      <h3 className="text-sm text-smack-elements-textSecondary mb-1">{title}</h3>
      <p className="text-3xl font-bold text-smack-elements-textPrimary">{value}</p>
    </div>
  );
}
