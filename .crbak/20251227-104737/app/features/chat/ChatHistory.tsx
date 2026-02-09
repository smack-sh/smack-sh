import { useState, useEffect } from 'react';
import { useLoaderData } from '@remix-run/react';
import { json, type LoaderFunctionArgs } from '@remix-run/node';

export async function loader({ request }: LoaderFunctionArgs) {
  /*
   * Mock data - in real app, fetch from database
   * Note: Auth should be handled at route level for Electron builds
   */
  const chatHistory = [
    {
      id: '1',
      title: 'React Component Structure',
      preview: 'Help me understand how to structure a React component with hooks and state management...',
      messages: 12,
      lastActivity: '2024-10-15T14:30:00Z',
      tags: ['react', 'components', 'hooks'],
      isFavorite: true,
      model: 'gpt-4',
    },
    {
      id: '2',
      title: 'Database Design for E-commerce',
      preview: 'I need help designing a database schema for an e-commerce platform with products, orders, and users...',
      messages: 8,
      lastActivity: '2024-10-14T09:15:00Z',
      tags: ['database', 'schema', 'ecommerce'],
      isFavorite: false,
      model: 'claude-3',
    },
    {
      id: '3',
      title: 'API Rate Limiting Implementation',
      preview: 'How do I implement rate limiting for my REST API using Redis and Express.js?',
      messages: 15,
      lastActivity: '2024-10-13T16:45:00Z',
      tags: ['api', 'redis', 'express', 'rate-limiting'],
      isFavorite: true,
      model: 'gpt-4',
    },
    {
      id: '4',
      title: 'CSS Grid vs Flexbox',
      preview: 'When should I use CSS Grid versus Flexbox for layout design?',
      messages: 6,
      lastActivity: '2024-10-12T11:20:00Z',
      tags: ['css', 'grid', 'flexbox', 'layout'],
      isFavorite: false,
      model: 'gpt-3.5-turbo',
    },
    {
      id: '5',
      title: 'TypeScript Interface Design',
      preview: 'Best practices for designing TypeScript interfaces for a complex application...',
      messages: 10,
      lastActivity: '2024-10-11T13:10:00Z',
      tags: ['typescript', 'interfaces', 'design-patterns'],
      isFavorite: false,
      model: 'gpt-4',
    },
  ];

  return json({ chatHistory });
}

export function ChatHistory() {
  const { chatHistory } = useLoaderData<typeof loader>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'messages' | 'title'>('recent');

  const allTags = ['all', ...Array.from(new Set(chatHistory.flatMap((chat) => chat.tags)))];

  const filteredChats = chatHistory
    .filter((chat) => {
      const matchesSearch =
        chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.preview.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTag = selectedTag === 'all' || chat.tags.includes(selectedTag);

      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
        case 'messages':
          return b.messages - a.messages;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Chat History</h2>
          <p className="text-gray-600 dark:text-gray-400">Your conversations with AI assistants</p>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredChats.length} of {chatHistory.length} conversations
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag === 'all' ? 'All Tags' : `#${tag}`}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="recent">Recent</option>
            <option value="messages">Most Messages</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>
      </div>

      {/* Chat History List */}
      <div className="space-y-3">
        {filteredChats.map((chat) => (
          <ChatItem key={chat.id} chat={chat} formatDate={formatDate} />
        ))}
      </div>

      {filteredChats.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No conversations found matching your criteria.</p>
        </div>
      )}

      {/* Bulk Actions */}
      {filteredChats.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Select all</span>
            </label>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredChats.length} conversations selected
            </span>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
              Export
            </button>
            <button className="px-3 py-1 text-sm text-red-600 hover:text-red-700">Delete Selected</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChatItem({ chat, formatDate }: { chat: any; formatDate: (date: string) => string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium text-gray-900 dark:text-white">{chat.title}</h3>
              {chat.isFavorite && (
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{chat.preview}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {chat.messages} messages
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {chat.model}
              </span>
              <span>{formatDate(chat.lastActivity)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
            <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-3">
          {chat.tags.slice(0, 3).map((tag: string) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 rounded"
            >
              #{tag}
            </span>
          ))}
          {chat.tags.length > 3 && (
            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
              +{chat.tags.length - 3}
            </span>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Started:</span>
                <span className="font-medium">{new Date(chat.lastActivity).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                <span className="font-medium">~{Math.floor(Math.random() * 60) + 15} minutes</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tokens used:</span>
                <span className="font-medium">~{Math.floor(Math.random() * 5000) + 1000}</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="px-3 py-1 text-sm bg-accent-600 text-white rounded hover:bg-accent-700">
                Continue Chat
              </button>
              <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                Export
              </button>
              <button className="px-3 py-1 text-sm text-red-600 hover:text-red-700">Delete</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
