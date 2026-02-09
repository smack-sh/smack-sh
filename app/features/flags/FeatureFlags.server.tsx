import { json } from '@remix-run/node';
import type { LoaderFunction } from '@remix-run/node';
import { requireAuth } from '~/utils/auth.server';

export const loader: LoaderFunction = async ({ request, context, params }) => {
  // Ensure we have the required context
  if (!request) {
    throw new Error('Request is required');
  }

  const userId = await requireAuth({ request, context: context || {}, params: params || {} });

  // Mock data - in real app, fetch from database
  const featureFlags = [
    {
      id: 'ai_code_review',
      name: 'AI Code Review',
      description: 'AI-powered code quality analysis',
      category: 'AI Features',
      enabled: true,
      environment: 'production',
      userSegments: ['all'],
      rolloutPercentage: 100,
      lastModified: '2024-10-15T10:00:00Z',
      modifiedBy: 'admin@example.com',
    },
    {
      id: 'collaborative_coding',
      name: 'Real-time Collaborative Coding',
      description: 'Code together in real-time',
      category: 'Collaboration',
      enabled: false,
      environment: 'staging',
      userSegments: ['beta_testers'],
      rolloutPercentage: 50,
      lastModified: '2024-10-10T14:30:00Z',
      modifiedBy: 'admin@example.com',
    },
    {
      id: 'dark_mode',
      name: 'Dark Mode',
      description: 'Dark theme for the application',
      category: 'UI/UX',
      enabled: true,
      environment: 'production',
      userSegments: ['all'],
      rolloutPercentage: 100,
      lastModified: '2024-09-20T09:15:00Z',
      modifiedBy: 'admin@example.com',
    },
  ];

  const environments = ['production', 'staging', 'development'];
  const userSegments = ['all', 'beta_testers', 'premium_users', 'enterprise'];

  return json({
    featureFlags,
    environments,
    userSegments,
  });
};

// Export the client component as default
import FeatureFlagsComponent from './FeatureFlags';
export default FeatureFlagsComponent;
