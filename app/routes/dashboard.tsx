import type { MetaFunction } from '@remix-run/cloudflare';
import { Dashboard } from '~/components/dashboard/Dashboard.client';
import { ClientOnly } from 'remix-utils/client-only';

export const meta: MetaFunction = () => {
  return [
    { title: 'Dashboard | Smack AI' },
    { name: 'description', content: 'Your AI development assistant analytics and insights' },
  ];
};

export default function DashboardRoute() {
  return (
    <ClientOnly fallback={<DashboardSkeleton />}>
      {() => <Dashboard />}
    </ClientOnly>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 animate-pulse">
      <div className="mb-8">
        <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2" />
        <div className="h-6 w-96 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-36 bg-white dark:bg-gray-800 rounded-2xl shadow-lg" />
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="h-80 bg-white dark:bg-gray-800 rounded-2xl shadow-lg" />
        <div className="h-80 bg-white dark:bg-gray-800 rounded-2xl shadow-lg" />
      </div>
    </div>
  );
}
