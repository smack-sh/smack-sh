import { useState, useEffect } from 'react';
import { useLoaderData } from '@remix-run/react';
import { json, type LoaderFunctionArgs } from '@remix-run/node';

export async function loader({ request }: LoaderFunctionArgs) {
  // Note: Auth should be handled at route level for Electron builds

  // Mock data - in real app, fetch from database
  const teamMembers = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      joinedAt: '2024-01-15',
      lastActive: '2 hours ago',
      projects: 3,
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'developer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
      joinedAt: '2024-02-01',
      lastActive: '1 hour ago',
      projects: 2,
    },
    {
      id: '3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      role: 'designer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
      joinedAt: '2024-02-15',
      lastActive: '30 minutes ago',
      projects: 1,
    },
  ];

  const currentUser = {
    id: userId,
    name: 'Current User',
    role: 'admin',
  };

  return json({ teamMembers, currentUser });
}

export function TeamDashboard() {
  const { teamMembers, currentUser } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<'members' | 'roles' | 'invites'>('members');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Team Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage your team members and permissions</p>
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500"
        >
          Invite Member
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{teamMembers.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Team Members</div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {teamMembers.filter((m) => m.role === 'admin').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Administrators</div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {teamMembers.reduce((acc, m) => acc + m.projects, 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active Projects</div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600">
            {teamMembers.filter((m) => m.lastActive.includes('minutes') || m.lastActive.includes('hour')).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Online Now</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'members', label: 'Team Members', icon: '👥' },
            { id: 'roles', label: 'Roles & Permissions', icon: '🔐' },
            { id: 'invites', label: 'Pending Invites', icon: '📧' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-accent-500 text-accent-600 dark:text-accent-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'members' && <MembersTab teamMembers={teamMembers} currentUser={currentUser} />}
        {activeTab === 'roles' && <RolesTab />}
        {activeTab === 'invites' && <InvitesTab />}
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && <InviteModal onClose={() => setIsInviteModalOpen(false)} />}
    </div>
  );
}

function MembersTab({ teamMembers, currentUser }: { teamMembers: any[]; currentUser: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((member) => (
          <div
            key={member.id}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center space-x-3 mb-3">
              <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">{member.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{member.email}</p>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  member.role === 'admin'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : member.role === 'developer'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                }`}
              >
                {member.role}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Projects:</span>
                <span className="font-medium">{member.projects}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Joined:</span>
                <span className="font-medium">{new Date(member.joinedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Last Active:</span>
                <span
                  className={`font-medium ${member.lastActive.includes('minutes') || member.lastActive.includes('hour') ? 'text-green-600' : 'text-gray-500'}`}
                >
                  {member.lastActive}
                </span>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="flex-1 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                Edit Role
              </button>
              <button className="flex-1 px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RolesTab() {
  const roles = [
    { name: 'Admin', description: 'Full access to all features and settings', permissions: ['All Permissions'] },
    {
      name: 'Developer',
      description: 'Can create and edit projects',
      permissions: ['Create Projects', 'Edit Own Projects', 'Deploy Projects'],
    },
    { name: 'Designer', description: 'Can view and edit designs', permissions: ['View Projects', 'Edit Designs'] },
    { name: 'Viewer', description: 'Read-only access', permissions: ['View Projects'] },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role) => (
          <div
            key={role.name}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">{role.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{role.description}</p>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Permissions:</p>
              {role.permissions.map((permission) => (
                <div key={permission} className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{permission}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button className="w-full px-3 py-2 text-sm bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 rounded hover:bg-accent-200 dark:hover:bg-accent-900/50">
                Edit Permissions
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InvitesTab() {
  const [invites, setInvites] = useState([
    { id: '1', email: 'alice@example.com', role: 'developer', status: 'pending', sentAt: '2024-10-15' },
    { id: '2', email: 'charlie@example.com', role: 'designer', status: 'accepted', sentAt: '2024-10-14' },
  ]);

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white">Pending Invitations</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {invites.map((invite) => (
            <div key={invite.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{invite.email}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Role: {invite.role} • Sent: {invite.sentAt}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    invite.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  }`}
                >
                  {invite.status}
                </span>
                {invite.status === 'pending' && (
                  <button className="px-3 py-1 text-sm text-red-600 hover:text-red-700">Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('developer');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implement invite API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onClose();
    } catch (error) {
      console.error('Failed to send invite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Invite Team Member</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="colleague@example.com"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="admin">Administrator</option>
              <option value="developer">Developer</option>
              <option value="designer">Designer</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-accent-600 text-white text-sm font-medium rounded-md hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
