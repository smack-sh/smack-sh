import { useState } from 'react';
import { useLoaderData, Link } from '@remix-run/react';
import { json, type LoaderFunctionArgs } from '@remix-run/node';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  language: string;
  features: string[];
  difficulty: string;
  stars: number;
  downloads: number;
  preview: string;
  tags: string[];
}

export async function loader({ request }: LoaderFunctionArgs) {
  // Mock data - in real app, fetch from database or file system
  const templates: Template[] = [
    {
      id: 'react-vite',
      name: 'React + Vite',
      description: 'Modern React application with Vite build tool',
      category: 'Frontend',
      language: 'JavaScript/TypeScript',
      features: ['React 18', 'Vite', 'TypeScript', 'ESLint', 'Prettier'],
      difficulty: 'Beginner',
      stars: 4.8,
      downloads: 1250,
      preview: 'https://via.placeholder.com/300x200?text=React+Vite',
      tags: ['react', 'vite', 'typescript', 'frontend'],
    },
    {
      id: 'nextjs-app',
      name: 'Next.js App Router',
      description: 'Full-stack Next.js application with App Router',
      category: 'Full Stack',
      language: 'TypeScript',
      features: ['Next.js 14', 'App Router', 'Tailwind CSS', 'Prisma', 'NextAuth'],
      difficulty: 'Intermediate',
      stars: 4.9,
      downloads: 2100,
      preview: 'https://via.placeholder.com/300x200?text=Next.js',
      tags: ['nextjs', 'react', 'fullstack', 'typescript'],
    },
    {
      id: 'remix-app',
      name: 'Remix Application',
      description: 'Full-stack Remix application with database integration',
      category: 'Full Stack',
      language: 'TypeScript',
      features: ['Remix', 'React', 'Prisma', 'SQLite', 'Tailwind CSS'],
      difficulty: 'Intermediate',
      stars: 4.7,
      downloads: 890,
      preview: 'https://via.placeholder.com/300x200?text=Remix',
      tags: ['remix', 'react', 'fullstack', 'typescript'],
    },
    {
      id: 'vue-nuxt',
      name: 'Vue + Nuxt',
      description: 'Full-stack Vue application with Nuxt framework',
      category: 'Full Stack',
      language: 'JavaScript/TypeScript',
      features: ['Vue 3', 'Nuxt 3', 'TypeScript', 'Tailwind CSS', 'Pinia'],
      difficulty: 'Intermediate',
      stars: 4.6,
      downloads: 670,
      preview: 'https://via.placeholder.com/300x200?text=Vue+Nuxt',
      tags: ['vue', 'nuxt', 'fullstack', 'typescript'],
    },
    {
      id: 'svelte-kit',
      name: 'SvelteKit',
      description: 'Full-stack Svelte application with SvelteKit',
      category: 'Full Stack',
      language: 'TypeScript',
      features: ['Svelte 4', 'SvelteKit', 'TypeScript', 'Tailwind CSS', 'Prisma'],
      difficulty: 'Intermediate',
      stars: 4.5,
      downloads: 450,
      preview: 'https://via.placeholder.com/300x200?text=SvelteKit',
      tags: ['svelte', 'sveltekit', 'fullstack', 'typescript'],
    },
    {
      id: 'express-api',
      name: 'Express API',
      description: 'RESTful API server with Express.js',
      category: 'Backend',
      language: 'JavaScript/TypeScript',
      features: ['Express.js', 'TypeScript', 'MongoDB', 'JWT Auth', 'Swagger'],
      difficulty: 'Intermediate',
      stars: 4.4,
      downloads: 980,
      preview: 'https://via.placeholder.com/300x200?text=Express+API',
      tags: ['express', 'nodejs', 'api', 'mongodb'],
    },
    {
      id: 'fastify-api',
      name: 'Fastify API',
      description: 'High-performance API server with Fastify',
      category: 'Backend',
      language: 'TypeScript',
      features: ['Fastify', 'TypeScript', 'PostgreSQL', 'JWT Auth', 'Swagger'],
      difficulty: 'Advanced',
      stars: 4.3,
      downloads: 320,
      preview: 'https://via.placeholder.com/300x200?text=Fastify+API',
      tags: ['fastify', 'nodejs', 'api', 'postgresql'],
    },
    {
      id: 'example-ai-chatbot',
      name: 'AI Chatbot',
      description: 'A chatbot with AI capabilities',
      category: 'Fullstack',
      language: 'TypeScript',
      features: ['AI', 'Chatbot', 'TypeScript', 'Tailwind CSS', 'Prisma'],
      difficulty: 'Advanced',
      stars: 4.9,
      downloads: 1200,
      preview: 'https://via.placeholder.com/300x200?text=AI+Chatbot',
      tags: ['ai', 'chatbot', 'fullstack', 'typescript', 'gemini'],
    },
    {
      id: 'electron-app',
      name: 'Electron Desktop App',
      description: 'Cross-platform desktop application',
      category: 'Desktop',
      language: 'JavaScript/TypeScript',
      features: ['Electron', 'React', 'Webpack', 'TypeScript', 'SQLite'],
      difficulty: 'Advanced',
      stars: 4.2,
      downloads: 540,
      preview: 'https://via.placeholder.com/300x200?text=Electron+App',
      tags: ['electron', 'desktop', 'react', 'typescript'],
    },
  ];

  return json({ templates });
}

export function ProjectTemplates() {
  const { templates } = useLoaderData<typeof loader>();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['all', ...Array.from(new Set(templates.map((t) => t.category)))];

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Project Templates</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Start your project with pre-built templates</p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div className="md:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No templates found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template }: { template: Template }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <img src={template.preview} alt={template.name} className="w-full h-48 object-cover" />
        <div
          className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Link
            to={`/templates/${template.id}`}
            className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{template.name}</h3>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span className="mr-1">⭐</span>
            <span>{template.stars}</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{template.description}</p>

        <div className="flex items-center justify-between text-sm mb-3">
          <span
            className={`px-2 py-1 rounded-full ${
              template.difficulty === 'Beginner'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : template.difficulty === 'Intermediate'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {template.difficulty}
          </span>
          <span className="text-gray-600 dark:text-gray-400">{template.language}</span>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {template.tags.slice(0, 3).map((tag: string) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
              +{template.tags.length - 3}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {template.downloads.toLocaleString()} downloads
          </span>
          <Link
            to={`/templates/${template.id}/create`}
            className="px-3 py-1 text-sm bg-accent-600 text-white rounded hover:bg-accent-700 transition-colors"
          >
            Use Template
          </Link>
        </div>
      </div>
    </div>
  );
}
