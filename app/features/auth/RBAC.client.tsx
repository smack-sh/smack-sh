import { useState } from 'react';
import { useLoaderData } from '@remix-run/react';
import type { Role, PermissionObject } from './types/rbac';

export function RBACClient() {
  const { roles, permissions } = useLoaderData<typeof import('./RBAC.server').loader>();
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions' | 'users'>('roles');
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Role-Based Access Control</h1>
        <button
          onClick={() => setIsCreateRoleModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create Role
        </button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['roles', 'permissions', 'users'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      <div className="pt-4">
        {activeTab === 'roles' && <RolesTab roles={roles} />}
        {activeTab === 'permissions' && <PermissionsTab permissions={permissions} />}
        {activeTab === 'users' && <UsersTab />}
      </div>

      {isCreateRoleModalOpen && (
        <CreateRoleModal permissions={permissions} onClose={() => setIsCreateRoleModalOpen(false)} />
      )}
    </div>
  );
}

function RolesTab({ roles }: { roles: Role[] }) {
  return (
    <div className="space-y-4">
      {roles.map((role) => (
        <div key={role.id} className="p-4 border rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">{role.name}</h3>
              <p className="text-sm text-gray-500">{role.description}</p>
            </div>
            <span className="px-2 py-1 text-xs rounded-full bg-gray-100">{role.permissions.length} permissions</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PermissionsTab({ permissions }: { permissions: PermissionObject[] }) {
  return (
    <div className="space-y-4">
      {permissions.map((permission) => (
        <div key={permission.id} className="p-4 border rounded-lg">
          <h3 className="font-medium">{permission.name}</h3>
          <p className="text-sm text-gray-500">{permission.description}</p>
        </div>
      ))}
    </div>
  );
}

function UsersTab() {
  return (
    <div className="p-4 border rounded-lg">
      <p className="text-gray-500">User management coming soon.</p>
    </div>
  );
}

function CreateRoleModal({ permissions, onClose }: { permissions: PermissionObject[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create New Role</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Role Name</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="e.g., Developer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              rows={3}
              placeholder="What does this role do?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
            <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded">
              {permissions.map((permission) => (
                <div key={permission.id} className="flex items-center">
                  <input type="checkbox" id={`perm-${permission.id}`} className="h-4 w-4 text-blue-600 rounded" />
                  <label htmlFor={`perm-${permission.id}`} className="ml-2 block text-sm text-gray-700">
                    {permission.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Role
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
