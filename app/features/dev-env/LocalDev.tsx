import { useState, useEffect } from 'react';
import { useLoaderData } from '@remix-run/react';
import { json, type LoaderFunctionArgs } from '@remix-run/node';

export async function loader({ request }: LoaderFunctionArgs) {
  // Note: Auth should be handled at route level for Electron builds

  // Mock data - in real app, fetch from user's dev environments
  const environments = [
    {
      id: '1',
      name: 'React Development',
      status: 'running',
      type: 'nodejs',
      image: 'node:18-alpine',
      ports: [
        { internal: 3000, external: 3001, protocol: 'http' },
        { internal: 8080, external: 8081, protocol: 'http' },
      ],
      volumes: [{ host: '/Users/john/projects/my-app', container: '/app' }],
      createdAt: '2024-10-15T10:00:00Z',
      lastUsed: '2 hours ago',
      cpu: 25,
      memory: 128,
      storage: 2.1,
    },
    {
      id: '2',
      name: 'Python API Server',
      status: 'stopped',
      type: 'python',
      image: 'python:3.11-slim',
      ports: [{ internal: 8000, external: 8001, protocol: 'http' }],
      volumes: [{ host: '/Users/john/projects/api-server', container: '/app' }],
      createdAt: '2024-10-14T15:30:00Z',
      lastUsed: '1 day ago',
      cpu: 15,
      memory: 256,
      storage: 1.5,
    },
    {
      id: '3',
      name: 'Database Container',
      status: 'running',
      type: 'database',
      image: 'postgres:15-alpine',
      ports: [{ internal: 5432, external: 5433, protocol: 'tcp' }],
      volumes: [{ host: '/Users/john/data/postgres', container: '/var/lib/postgresql/data' }],
      createdAt: '2024-10-13T09:15:00Z',
      lastUsed: '30 minutes ago',
      cpu: 40,
      memory: 512,
      storage: 5.2,
    },
  ];

  const availableImages = [
    { name: 'node:18-alpine', description: 'Node.js 18 with Alpine Linux', category: 'nodejs' },
    { name: 'node:20-alpine', description: 'Node.js 20 with Alpine Linux', category: 'nodejs' },
    { name: 'python:3.11-slim', description: 'Python 3.11 slim image', category: 'python' },
    { name: 'python:3.12-slim', description: 'Python 3.12 slim image', category: 'python' },
    { name: 'golang:1.21-alpine', description: 'Go 1.21 with Alpine Linux', category: 'golang' },
    { name: 'rust:1.75-slim', description: 'Rust 1.75 slim image', category: 'rust' },
    { name: 'postgres:15-alpine', description: 'PostgreSQL 15 with Alpine Linux', category: 'database' },
    { name: 'mysql:8.0-debian', description: 'MySQL 8.0 on Debian', category: 'database' },
    { name: 'redis:7-alpine', description: 'Redis 7 with Alpine Linux', category: 'database' },
    { name: 'nginx:alpine', description: 'Nginx with Alpine Linux', category: 'webserver' },
  ];

  return json({ environments, availableImages });
}

export function LocalDev() {
  const { environments, availableImages } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<'environments' | 'create' | 'images'>('environments');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Development Environments</h2>
          <p className="text-gray-600 dark:text-gray-400">Containerized development environments</p>
        </div>
        <button
          onClick={() => setActiveTab('create')}
          className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500"
        >
          Create Environment
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'environments', label: 'My Environments', icon: '🖥️' },
            { id: 'create', label: 'Create New', icon: '➕' },
            { id: 'images', label: 'Available Images', icon: '📦' },
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
      <div className="min-h-[600px]">
        {activeTab === 'environments' && (
          <EnvironmentsTab environments={environments} onSelectEnvironment={setSelectedEnvironment} />
        )}
        {activeTab === 'create' && <CreateEnvironmentTab availableImages={availableImages} />}
        {activeTab === 'images' && <ImagesTab availableImages={availableImages} />}
      </div>

      {/* Environment Details Modal */}
      {selectedEnvironment && (
        <EnvironmentDetailsModal environmentId={selectedEnvironment} onClose={() => setSelectedEnvironment(null)} />
      )}
    </div>
  );
}

function EnvironmentsTab({
  environments,
  onSelectEnvironment,
}: {
  environments: any[];
  onSelectEnvironment: (id: string) => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'stopped':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {environments.map((env) => (
          <div
            key={env.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSelectEnvironment(env.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{env.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{env.image}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(env.status)}`}>{env.status}</span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">CPU:</span>
                <span className="font-medium">{env.cpu}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Memory:</span>
                <span className="font-medium">{env.memory} MB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Storage:</span>
                <span className="font-medium">{env.storage} GB</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-gray-600 dark:text-gray-400">Ports:</div>
              {env.ports.map((port: any, index: number) => (
                <div key={index} className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {port.external}:{port.protocol} → {port.internal}
                </div>
              ))}
            </div>

            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">Last used: {env.lastUsed}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateEnvironmentTab({ availableImages }: { availableImages: any[] }) {
  const [formData, setFormData] = useState({
    name: '',
    image: availableImages[0]?.name || '',
    ports: [{ internal: 3000, external: 3001, protocol: 'http' }],
    volumes: [{ host: '', container: '/app' }],
    environment: {},
    resources: { cpu: 25, memory: 128 },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Implement environment creation
    console.log('Creating environment:', formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Environment Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="My Development Environment"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base Image</label>
          <select
            value={formData.image}
            onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {availableImages.map((image) => (
              <option key={image.name} value={image.name}>
                {image.name} - {image.description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Port Mappings</label>
          <div className="space-y-2">
            {formData.ports.map((port, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="number"
                  placeholder="Internal"
                  value={port.internal}
                  onChange={(e) => {
                    const newPorts = [...formData.ports];
                    newPorts[index].internal = parseInt(e.target.value) || 0;
                    setFormData((prev) => ({ ...prev, ports: newPorts }));
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="External"
                  value={port.external}
                  onChange={(e) => {
                    const newPorts = [...formData.ports];
                    newPorts[index].external = parseInt(e.target.value) || 0;
                    setFormData((prev) => ({ ...prev, ports: newPorts }));
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <select
                  value={port.protocol}
                  onChange={(e) => {
                    const newPorts = [...formData.ports];
                    newPorts[index].protocol = e.target.value;
                    setFormData((prev) => ({ ...prev, ports: newPorts }));
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="http">HTTP</option>
                  <option value="tcp">TCP</option>
                  <option value="udp">UDP</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resource Limits</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">CPU (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.resources.cpu}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    resources: { ...prev.resources, cpu: parseInt(e.target.value) || 25 },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Memory (MB)</label>
              <input
                type="number"
                min="64"
                step="64"
                value={formData.resources.memory}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    resources: { ...prev.resources, memory: parseInt(e.target.value) || 128 },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-accent-600 text-white text-sm font-medium rounded-md hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500"
          >
            Create Environment
          </button>
        </div>
      </form>
    </div>
  );
}

function ImagesTab({ availableImages }: { availableImages: any[] }) {
  const categories = [...new Set(availableImages.map((img) => img.category))];

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category}>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 capitalize">{category} Images</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableImages
              .filter((img) => img.category === category)
              .map((image) => (
                <div
                  key={image.name}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">{image.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{image.description}</p>
                  <button className="w-full px-3 py-2 text-sm bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 rounded hover:bg-accent-200 dark:hover:bg-accent-900/50">
                    Use Image
                  </button>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EnvironmentDetailsModal({ environmentId, onClose }: { environmentId: string; onClose: () => void }) {
  // Mock environment details
  const environment = {
    id: environmentId,
    name: 'React Development',
    status: 'running',
    logs: [
      '2024-10-15T10:00:00Z [INFO] Container started successfully',
      '2024-10-15T10:00:01Z [INFO] Application listening on port 3000',
      '2024-10-15T10:05:23Z [INFO] Hot reload triggered',
    ],
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{environment.name} Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Environment Info</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded text-xs">
                  Running
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Uptime:</span>
                <span>2h 15m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">CPU Usage:</span>
                <span>25%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Memory:</span>
                <span>128 MB / 512 MB</span>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Actions</h4>
              <div className="flex gap-2">
                <button className="px-3 py-2 text-sm bg-accent-600 text-white rounded hover:bg-accent-700">
                  Start
                </button>
                <button className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                  Stop
                </button>
                <button className="px-3 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50">
                  Delete
                </button>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recent Logs</h4>
            <div className="bg-gray-900 rounded p-3 h-64 overflow-y-auto font-mono text-xs">
              {environment.logs.map((log, index) => (
                <div key={index} className="text-gray-300 mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
