import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  HiOutlineChat, 
  HiOutlineCode, 
  HiOutlineLightningBolt, 
  HiOutlineTrendingUp,
  HiOutlineClock,
  HiOutlineStar,
  HiOutlineSparkles,
  HiOutlineDocumentText,
  HiOutlineUsers,
  HiOutlineCog
} from 'react-icons/hi';
import { classNames } from '~/utils/classNames';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardStats {
  totalChats: number;
  totalMessages: number;
  activeProjects: number;
  codeGenerated: number;
  avgResponseTime: number;
  successRate: number;
}

interface ActivityData {
  date: string;
  chats: number;
  messages: number;
}

const stats = [
  { 
    id: 1, 
    name: 'Total Chats', 
    value: '12,847', 
    change: '+12%', 
    changeType: 'positive',
    icon: HiOutlineChat,
    color: 'bg-blue-500'
  },
  { 
    id: 2, 
    name: 'Messages Sent', 
    value: '84,291', 
    change: '+23%', 
    changeType: 'positive',
    icon: HiOutlineDocumentText,
    color: 'bg-green-500'
  },
  { 
    id: 3, 
    name: 'Code Generated', 
    value: '1.2M', 
    change: '+45%', 
    changeType: 'positive',
    icon: HiOutlineCode,
    color: 'bg-purple-500'
  },
  { 
    id: 4, 
    name: 'Active Projects', 
    value: '384', 
    change: '+8%', 
    changeType: 'positive',
    icon: HiOutlineLightningBolt,
    color: 'bg-orange-500'
  },
];

const recentActivity = [
  { id: 1, type: 'chat', message: 'New chat started: "React Dashboard Component"', time: '2 minutes ago', icon: HiOutlineChat },
  { id: 2, type: 'code', message: 'Code generated: API endpoint with authentication', time: '15 minutes ago', icon: HiOutlineCode },
  { id: 3, type: 'project', message: 'Project "E-commerce Platform" created', time: '1 hour ago', icon: HiOutlineLightningBolt },
  { id: 4, type: 'chat', message: 'Chat completed: "Database Schema Design"', time: '2 hours ago', icon: HiOutlineChat },
  { id: 5, type: 'code', message: 'Code optimized: Performance improvements', time: '3 hours ago', icon: HiOutlineCode },
];

// Dataset generators based on timeRange
const getChartDataForRange = (timeRange: '7d' | '30d' | '90d') => {
  const baseData = {
    '7d': {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      chats: [65, 78, 90, 81, 95, 110, 125],
      messages: [340, 420, 510, 480, 560, 620, 710],
      codeGen: [120, 190, 150, 220, 180, 240, 280],
    },
    '30d': {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      chats: [520, 680, 750, 890],
      messages: [3200, 4100, 4800, 5600],
      codeGen: [1100, 1500, 1800, 2200],
    },
    '90d': {
      labels: ['Month 1', 'Month 2', 'Month 3'],
      chats: [2100, 2800, 3500],
      messages: [14500, 18200, 22000],
      codeGen: [5200, 6800, 8500],
    },
  };
  return baseData[timeRange];
};

const getLanguageDataForRange = (timeRange: '7d' | '30d' | '90d') => {
  const data = {
    '7d': [35, 25, 20, 10, 5, 5],
    '30d': [38, 24, 18, 12, 4, 4],
    '90d': [40, 22, 17, 13, 4, 4],
  };
  return data[timeRange];
};

export function Dashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  const rangeData = useMemo(() => getChartDataForRange(timeRange), [timeRange]);
  const languageDistribution = useMemo(() => getLanguageDataForRange(timeRange), [timeRange]);

  const chartData = useMemo(() => ({
    labels: rangeData.labels,
    datasets: [
      {
        label: 'Chats',
        data: rangeData.chats,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Messages',
        data: rangeData.messages,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }), [rangeData]);

  const languageData = useMemo(() => ({
    labels: ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Other'],
    datasets: [
      {
        data: languageDistribution,
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(99, 102, 241, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(156, 163, 175, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  }), [languageDistribution]);

  const barChartData = useMemo(() => ({
    labels: rangeData.labels,
    datasets: [
      {
        label: 'Code Generated (KB)',
        data: rangeData.codeGen,
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderRadius: 8,
      },
    ],
  }), [rangeData]);

  const handleSettingsClick = () => {
    alert('Settings - Not implemented yet');
  };

  const handleNewProjectClick = () => {
    alert('New Project - Not implemented yet');
  };

  const handleViewAllProjectsClick = () => {
    alert('View All Projects - Not implemented yet');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <HiOutlineSparkles className="w-8 h-8 text-purple-500" />
              Dashboard
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Your AI development assistant analytics and insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button
              onClick={handleSettingsClick}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
            >
              <HiOutlineCog className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className={classNames(
                  'mt-2 text-sm font-medium',
                  stat.changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {stat.change} from last week
                </p>
              </div>
              <div className={classNames('rounded-xl p-3', stat.color)}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Line Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Overview</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <HiOutlineTrendingUp className="w-4 h-4 text-green-500" />
              <span>+24% this week</span>
            </div>
          </div>
          <Line 
            data={chartData} 
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }} 
          />
        </motion.div>

        {/* Doughnut Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Languages Used</h3>
            <HiOutlineCode className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex items-center justify-center">
            <div className="w-64">
              <Doughnut 
                data={languageData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    },
                  },
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2 rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Code Generation</h3>
            <span className="text-sm text-gray-600 dark:text-gray-400">Total: 1.2M lines</span>
          </div>
          <Bar 
            data={barChartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            <HiOutlineClock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-2">
                  <activity.icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mt-8 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 p-8 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">Start Building Something Amazing</h3>
            <p className="mt-2 text-purple-100">Create a new project or continue where you left off</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleNewProjectClick}
              className="rounded-lg bg-white px-6 py-3 font-semibold text-purple-600 hover:bg-purple-50 transition-colors"
            >
              New Project
            </button>
            <button
              onClick={handleViewAllProjectsClick}
              className="rounded-lg border-2 border-white px-6 py-3 font-semibold text-white hover:bg-white/10 transition-colors"
            >
              View All Projects
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
