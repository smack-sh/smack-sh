import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { requireAuth } from '~/utils/auth.server';
import type { Permission, Role, PermissionObject } from './types/rbac';

export type { Role, Permission, PermissionObject };

// Mock data - in a real app, this would come from your database
const mockRoles: Role[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full access to all features and settings',
    permissions: [
      'user_management',
      'project_management',
      'deployment_management',
      'billing_management',
      'system_configuration',
      'audit_logs',
      'api_access',
      'feature_flags',
    ],
    userCount: 2,
    color: 'red',
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Can create and manage projects',
    permissions: ['project_create', 'project_edit', 'deployment_create', 'code_edit', 'api_access'],
    userCount: 8,
    color: 'blue',
  },
  {
    id: 'designer',
    name: 'Designer',
    description: 'Can view and edit designs',
    permissions: ['project_view', 'design_edit', 'asset_upload'],
    userCount: 3,
    color: 'green',
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to projects',
    permissions: ['project_view', 'comment_view'],
    userCount: 15,
    color: 'gray',
  },
];

const permissions: PermissionObject[] = [
  { id: 'user_management', name: 'User Management', description: 'Create, edit, and delete user accounts' },
  { id: 'project_management', name: 'Project Management', description: 'Create and manage projects' },
  { id: 'deployment_management', name: 'Deployment Management', description: 'Deploy and manage deployments' },
  { id: 'billing_management', name: 'Billing Management', description: 'Manage billing and subscriptions' },
  { id: 'system_configuration', name: 'System Configuration', description: 'Configure system settings' },
  { id: 'audit_logs', name: 'Audit Logs', description: 'View audit logs and activity' },
  { id: 'api_access', name: 'API Access', description: 'Access to API endpoints' },
  { id: 'feature_flags', name: 'Feature Flags', description: 'Manage feature flags' },
  { id: 'project_create', name: 'Create Projects', description: 'Create new projects' },
  { id: 'project_edit', name: 'Edit Projects', description: 'Edit existing projects' },
  { id: 'project_view', name: 'View Projects', description: 'View project details' },
  { id: 'deployment_create', name: 'Create Deployments', description: 'Create new deployments' },
  { id: 'code_edit', name: 'Edit Code', description: 'Edit project code' },
  { id: 'design_edit', name: 'Edit Designs', description: 'Edit project designs' },
  { id: 'asset_upload', name: 'Upload Assets', description: 'Upload project assets' },
  { id: 'comment_view', name: 'View Comments', description: 'View project comments' },
];

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth({
    request,
    params: undefined,
    context: undefined,
  });

  return json({ roles: mockRoles, permissions });
}

export { mockRoles, permissions };
